import { useState, useEffect, useRef } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { GeneratorScreen } from './components/GeneratorScreen';
import { GeneratingScreen } from './components/GeneratingScreen';
import { ResultScreen } from './components/ResultScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { AuthScreen } from './components/AuthScreen';
import { useSunoGeneration } from './hooks/useSunoGeneration';
import { supabase } from './lib/supabase';
import { Toaster } from './components/ui/sonner';

type Screen = 'home' | 'generator' | 'generating' | 'result' | 'profile' | 'library' | 'auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [lastGenerationPrompt, setLastGenerationPrompt] = useState<string>('');
  const generation = useSunoGeneration();

  // Check authentication status and fetch user profile
  const lastUserIdRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);
  
  // We need to access currentScreen in the auth state change handler
  // So we'll use a ref to track it
  const currentScreenRef = useRef<Screen>('home');
  
  // Update ref when screen changes
  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    let isMounted = true;
    let storageTimeout: NodeJS.Timeout | null = null;

    const checkSession = async () => {
      if (isCheckingRef.current) return; // Prevent concurrent checks
      isCheckingRef.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        const currentUserId = session?.user?.id || null;
        const wasAuthenticated = lastUserIdRef.current !== null;
        const isAuthenticated = currentUserId !== null;
        
        // Update if user changed OR authentication state changed
        if (currentUserId !== lastUserIdRef.current || wasAuthenticated !== isAuthenticated) {
          lastUserIdRef.current = currentUserId;
          setIsAuthenticated(!!session);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUsername(null);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Check session on mount
    checkSession();

    // Listen for auth state changes (including from other tabs)
    // Only react to SIGNED_IN and SIGNED_OUT, not TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      console.log('Current lastUserIdRef:', lastUserIdRef.current);
      if (!isMounted) return;
      
      // Only update on actual sign in/out events
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const currentUserId = session?.user?.id || null;
        const wasAuthenticated = lastUserIdRef.current !== null;
        const isNowAuthenticated = currentUserId !== null;
        
        console.log('Auth check - currentUserId:', currentUserId, 'lastUserId:', lastUserIdRef.current, 'wasAuth:', wasAuthenticated, 'isNowAuth:', isNowAuthenticated);
        
        // Update if user changed OR authentication state changed (logged in/out)
        if (currentUserId !== lastUserIdRef.current || wasAuthenticated !== isNowAuthenticated) {
          console.log('✅ Updating auth state');
          lastUserIdRef.current = currentUserId;
          setIsAuthenticated(!!session);
          
          // Redirect to home if user logged out and is on a protected screen
          if (event === 'SIGNED_OUT') {
            // Redirect to home if on profile or other protected screens
            if (currentScreenRef.current === 'profile' || currentScreenRef.current === 'library') {
              setCurrentScreen('home');
            }
          }
          
          // Redirect to home if user logged in and is on auth screen
          if (event === 'SIGNED_IN' && currentScreenRef.current === 'auth') {
            console.log('✅ User signed in, redirecting to home');
            setCurrentScreen('home');
          }
          
          if (session?.user) {
            console.log('Fetching user profile for:', session.user.id);
            await fetchUserProfile(session.user.id);
          } else {
            setUsername(null);
          }
        } else {
          console.log('⚠️ Skipping update - user ID and auth state unchanged');
        }
      }
    });

    // Listen for storage events (when session changes in another tab)
    // Use debounce to prevent multiple rapid checks
    const handleStorageChange = async (e: StorageEvent) => {
      // Supabase stores session in localStorage with key like 'sb-<project-ref>-auth-token'
      if (e.key && e.key.includes('auth-token')) {
        console.log('Session changed in another tab, refreshing...');
        // Debounce to prevent multiple rapid checks and avoid race with onAuthStateChange
        if (storageTimeout) clearTimeout(storageTimeout);
        storageTimeout = setTimeout(() => {
          if (isMounted) {
            checkSession();
          }
        }, 500); // 500ms debounce to let onAuthStateChange handle it first if it fires
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      if (storageTimeout) clearTimeout(storageTimeout);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for userId:', userId);
      // First try to get username from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User data:', user?.user_metadata);
      
      if (user?.user_metadata?.username) {
        console.log('✅ Found username in metadata:', user.user_metadata.username);
        setUsername(user.user_metadata.username);
        return;
      }

      // Otherwise, try to fetch from user_profiles table
      console.log('🔍 Fetching from user_profiles table...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching from user_profiles:', error);
      }

      if (!error && data?.username) {
        console.log('✅ Found username in user_profiles:', data.username);
        setUsername(data.username);
      } else {
        console.log('⚠️ No username found, using email fallback');
        // Fallback to email if no username
        if (user?.email) {
          const emailUsername = user.email.split('@')[0];
          setUsername(emailUsername);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  const handleGenerate = async (params: {
    prompt: string;
    instrumental: boolean;
  }) => {
    setLastGenerationPrompt(params.prompt);
    setCurrentScreen('generating');
    try {
      await generation.generate({
        ...params,
        model: 'V5', // Superior musical expression, faster generation
      });
      // GeneratingScreen will auto-transition to result after 13 seconds
    } catch (error) {
      console.error('Generation failed:', error);
      // Stay on generating screen to show error
    }
  };

  const handleGeneratingComplete = () => {
    // Transition to result screen (even if tracks aren't ready yet)
    setCurrentScreen('result');
  };

  const handleProfileClick = () => {
    setCurrentScreen('profile');
  };


  return (
    <>
      <Toaster />
      <div className="min-h-screen overflow-x-hidden">
        {currentScreen === 'home' && (
        <HomeScreen
          onGenerateClick={() => setCurrentScreen('generator')}
          onProfileClick={handleProfileClick}
          username={username}
        />
      )}

      {currentScreen === 'generator' && (
        <GeneratorScreen
          onBack={() => setCurrentScreen('home')}
          onGenerate={handleGenerate}
          onProfileClick={handleProfileClick}
          onAuthClick={() => setCurrentScreen('auth')}
          username={username}
        />
      )}

      {currentScreen === 'generating' && (
        <GeneratingScreen 
          onComplete={handleGeneratingComplete}
          status={generation.status}
          progress={generation.progress}
          error={generation.error}
        />
      )}

      {currentScreen === 'result' && (
        <ResultScreen
          onBack={() => {
            generation.reset();
            setCurrentScreen('home');
          }}
          onRegenerate={() => {
            generation.reset();
            setCurrentScreen('generator');
          }}
          onProfileClick={handleProfileClick}
          onAuthClick={() => setCurrentScreen('auth')}
          tracks={generation.tracks}
          username={username}
          generationPrompt={lastGenerationPrompt}
          isLoading={generation.isLoading}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen 
          onBack={() => setCurrentScreen('home')} 
          onAuthClick={() => setCurrentScreen('auth')}
          username={username}
        />
      )}

      {currentScreen === 'library' && (
        <>
          {console.log('🔴 App.tsx: Rendering LibraryScreen, currentScreen:', currentScreen)}
          <LibraryScreen 
            onBack={() => setCurrentScreen('home')} 
            onAuthClick={() => setCurrentScreen('auth')}
            onProfileClick={handleProfileClick}
            username={username}
          />
        </>
      )}

      {currentScreen === 'auth' && (
        <AuthScreen
          onBack={() => setCurrentScreen('home')}
          onAuthSuccess={() => setCurrentScreen('home')}
        />
      )}
      </div>
    </>
  );
}
