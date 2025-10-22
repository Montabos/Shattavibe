import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { GeneratorScreen } from './components/GeneratorScreen';
import { GeneratingScreen } from './components/GeneratingScreen';
import { ResultScreen } from './components/ResultScreen';
import { ProfileScreen } from './components/ProfileScreen';

type Screen = 'home' | 'generator' | 'generating' | 'result' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const handleGenerate = (prompt: string) => {
    setGeneratedPrompt(prompt);
    setCurrentScreen('generating');
  };

  const handleGeneratingComplete = () => {
    setCurrentScreen('result');
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {currentScreen === 'home' && (
        <HomeScreen
          onGenerateClick={() => setCurrentScreen('generator')}
          onProfileClick={() => setCurrentScreen('profile')}
        />
      )}

      {currentScreen === 'generator' && (
        <GeneratorScreen
          onBack={() => setCurrentScreen('home')}
          onGenerate={handleGenerate}
        />
      )}

      {currentScreen === 'generating' && (
        <GeneratingScreen onComplete={handleGeneratingComplete} />
      )}

      {currentScreen === 'result' && (
        <ResultScreen
          onBack={() => setCurrentScreen('home')}
          onRegenerate={() => setCurrentScreen('generator')}
          onProfileClick={() => setCurrentScreen('profile')}
          prompt={generatedPrompt}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen onBack={() => setCurrentScreen('home')} />
      )}
    </div>
  );
}
