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
import type { LanguageCode, VocalGender } from './types/suno';

type Screen = 'home' | 'generator' | 'generating' | 'result' | 'profile' | 'library' | 'auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const generation = useSunoGeneration();

  // Check authentication status and fetch user profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
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

  // Automatically switch to result screen when tracks are available
  useEffect(() => {
    if (generation.status === 'completed' && generation.tracks && generation.tracks.length > 0) {
      setCurrentScreen('result');
    }
  }, [generation.status, generation.tracks]);

  const handleGenerate = async (params: {
    prompt: string;
    instrumental: boolean;
    language?: LanguageCode;
    vocalGender?: VocalGender;
  }) => {
    setCurrentScreen('generating');
    try {
      await generation.generate({
        ...params,
        model: 'V5', // Superior musical expression, faster generation
      });
      // Polling will automatically switch to result screen when tracks are ready
    } catch (error) {
      console.error('Generation failed:', error);
      // Stay on generating screen to show error
    }
  };

  const handleGeneratingComplete = () => {
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

      {currentScreen === 'result' && generation.tracks && (
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
  );
}
