import { useState, useEffect } from 'react';
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
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    };

    // Check session on mount
    checkSession();

    // Listen for auth state changes (including from other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setIsAuthenticated(!!session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUsername(null);
      }
    });

    // Listen for storage events (when session changes in another tab)
    const handleStorageChange = async (e: StorageEvent) => {
      // Supabase stores session in localStorage with key like 'sb-<project-ref>-auth-token'
      if (e.key && e.key.includes('auth-token')) {
        console.log('Session changed in another tab, refreshing...');
        await checkSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to get username from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
        return;
      }

      // Otherwise, try to fetch from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', userId)
        .single();

      if (!error && data?.username) {
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
    if (isAuthenticated) {
      setCurrentScreen('profile');
    } else {
      setCurrentScreen('auth');
    }
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
          onLibraryClick={handleProfileClick}
          onAuthClick={() => setCurrentScreen('auth')}
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
          onLibraryClick={handleProfileClick}
          onAuthClick={() => setCurrentScreen('auth')}
          tracks={generation.tracks}
          username={username}
          generationPrompt={lastGenerationPrompt}
          isLoading={generation.isLoading}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'library' && (
        <LibraryScreen onBack={() => setCurrentScreen('home')} />
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
