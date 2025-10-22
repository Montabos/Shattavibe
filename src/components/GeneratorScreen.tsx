import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Music2, Sparkles, Mic, MicOff, Gift, Library } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { LocalStorageService } from '@/lib/localStorageService';
import { SessionStorageService } from '@/lib/sessionStorageService';
import { GenerationService } from '@/lib/generationService';
import type { VocalGender } from '@/types/suno';

interface GeneratorScreenProps {
  onBack: () => void;
  onGenerate: (params: {
    prompt: string;
    instrumental: boolean;
    vocalGender?: VocalGender;
  }) => void;
  onLibraryClick?: () => void;
  onAuthClick?: () => void;
}

export function GeneratorScreen({ onBack, onGenerate, onLibraryClick, onAuthClick }: GeneratorScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<string>('hype');
  const [instrumental, setInstrumental] = useState(false);
  const [vocalGender, setVocalGender] = useState<VocalGender | undefined>(undefined);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await GenerationService.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
  }, []);
  
  const remainingFree = LocalStorageService.getRemainingFreeGenerations();
  const hasReachedLimit = !isAuthenticated && LocalStorageService.hasReachedFreeLimit();
  const sessionCount = SessionStorageService.getSessionCount();

  const vibes = [
    { id: 'hype', label: 'Hype 🔥', color: 'from-[#FF6B6B] to-[#FF8E53]', style: 'energetic dancehall' },
    { id: 'chill', label: 'Chill 🌴', color: 'from-[#4FACFE] to-[#00F2FE]', style: 'relaxed reggae' },
    { id: 'party', label: 'Party 🎉', color: 'from-[#FA709A] to-[#FEE140]', style: 'upbeat bouyon' },
    { id: 'vibes', label: 'Vibes ✨', color: 'from-[#A8EDEA] to-[#FED6E3]', style: 'smooth afrobeat' },
  ];

  const suggestions = [
    "Shout out Jamal and Keisha in a hype Bouyon vibe",
    "Birthday track for Sarah with island vibes",
    "Weekend anthem for the crew",
  ];

  const handleGenerate = () => {
    if (hasReachedLimit && onAuthClick) {
      onAuthClick();
      return;
    }
    
    if (prompt.trim()) {
      onGenerate({
        prompt: `${prompt} ${vibes.find(v => v.id === selectedVibe)?.style || ''}`,
        instrumental,
        vocalGender: instrumental ? undefined : vocalGender,
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#667EEA] via-[#FF69B4] to-[#FFC837]" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-40 right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 pt-16 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>

          <div className="flex items-center gap-3">
            {/* Free generations counter or unlimited badge */}
            {isAuthenticated ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF69B4] to-[#00BFFF] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">
                  Unlimited ∞
                </span>
              </motion.div>
            ) : remainingFree > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-xl flex items-center gap-2"
              >
                <Gift className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">
                  {remainingFree} free left
                </span>
              </motion.div>
            )}

            {/* Library button */}
            {onLibraryClick && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onLibraryClick}
                className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
              >
                <Library className="w-5 h-5 text-white" />
                {sessionCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] text-white text-xs flex items-center justify-center">
                    {sessionCount}
                  </div>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl text-white mb-3">
            Drop the Bass!
          </h1>
          <p className="text-white/70">What's your vibe today?</p>
        </motion.div>

        {/* Vibe selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 gap-3 mb-8">
            {vibes.map((vibe) => (
              <motion.button
                key={vibe.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedVibe(vibe.id)}
                className={`py-4 px-6 rounded-2xl backdrop-blur-xl transition-all ${
                  selectedVibe === vibe.id
                    ? 'bg-white/30 shadow-xl'
                    : 'bg-white/10'
                }`}
              >
                <span className="text-white">{vibe.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Input area */}
        <FloatingCard delay={0.2} className="mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your vibe... e.g., 'Shout out my crew in a party Bouyon track'"
            className="w-full bg-transparent text-white placeholder:text-white/50 outline-none resize-none mb-4"
            rows={4}
          />
          
          {/* Voice options */}
          <div className="flex gap-3 items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setInstrumental(!instrumental)}
              className={`flex-1 py-3 px-4 rounded-xl backdrop-blur-xl transition-all ${
                instrumental ? 'bg-white/30' : 'bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {instrumental ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                <span className="text-white text-sm">
                  {instrumental ? 'Instrumental' : 'With Vocals'}
                </span>
              </div>
            </motion.button>

            {!instrumental && (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVocalGender(vocalGender === 'm' ? undefined : 'm')}
                  className={`py-3 px-6 rounded-xl backdrop-blur-xl transition-all ${
                    vocalGender === 'm' ? 'bg-white/30' : 'bg-white/10'
                  }`}
                >
                  <span className="text-white text-sm">♂ Male</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVocalGender(vocalGender === 'f' ? undefined : 'f')}
                  className={`py-3 px-6 rounded-xl backdrop-blur-xl transition-all ${
                    vocalGender === 'f' ? 'bg-white/30' : 'bg-white/10'
                  }`}
                >
                  <span className="text-white text-sm">♀ Female</span>
                </motion.button>
              </div>
            )}
          </div>
        </FloatingCard>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-white/60 text-sm mb-3">Try these:</p>
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPrompt(suggestion)}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl text-white/80 text-sm"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Generate button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={!hasReachedLimit && !prompt.trim()}
          className="w-full py-5 rounded-3xl shadow-2xl relative overflow-hidden"
          style={{
            background: (hasReachedLimit || prompt.trim()) ? 'white' : 'rgba(255,255,255,0.3)',
          }}
        >
          <motion.div
            animate={{
              boxShadow: (hasReachedLimit || prompt.trim())
                ? ['0 0 20px rgba(255,105,180,0.5)', '0 0 40px rgba(0,191,255,0.5)', '0 0 20px rgba(255,105,180,0.5)']
                : '0 0 0px rgba(0,0,0,0)',
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl"
          />
          
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" style={{ color: '#FF69B4' }} />
            <span 
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF69B4] to-[#00BFFF]"
            >
              {hasReachedLimit ? 'Sign in to generate more' : 'Generate Track'}
            </span>
          </span>
        </motion.button>
      </div>
    </div>
  );
}
