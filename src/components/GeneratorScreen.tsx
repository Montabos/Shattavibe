import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Sparkles, Gift, Library } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { LocalStorageService } from '@/lib/localStorageService';
import { SessionStorageService } from '@/lib/sessionStorageService';
import { GenerationService } from '@/lib/generationService';

interface GeneratorScreenProps {
  onBack: () => void;
  onGenerate: (params: {
    prompt: string;
    instrumental: boolean;
  }) => void;
  onLibraryClick?: () => void;
  onAuthClick?: () => void;
}

export function GeneratorScreen({ onBack, onGenerate, onLibraryClick, onAuthClick }: GeneratorScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [musicStyle, setMusicStyle] = useState<string>('');
  
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

  const stylePresets = [
    "Gospel afro-house drill and bass",
    "Choral afro-jazz",
    "Afrobeat",
    "Drill",
    "Trap",
    "Dancehall",
    "Hip-hop",
    "R&B",
  ];

  const handleGenerate = () => {
    if (hasReachedLimit && onAuthClick) {
      onAuthClick();
      return;
    }
    
    if (prompt.trim()) {
      const fullPrompt = musicStyle ? `${prompt} in ${musicStyle} style` : prompt;
      onGenerate({
        prompt: fullPrompt,
        instrumental: false,
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
            What's the vibe?
          </h1>
          <p className="text-white/70">Tell us about your friends, what you wanna say</p>
        </motion.div>

        {/* Input area - Main prompt */}
        <FloatingCard delay={0.2} className="mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Birthday track for Alex - he's turning 30, loves gaming, terrible dancer but amazing cook, and his energy is unmatched'"
            className="w-full bg-transparent text-white placeholder:text-white/50 outline-none resize-none"
            rows={5}
          />
        </FloatingCard>

        {/* Music Style selector */}
        <FloatingCard delay={0.3} className="mb-6">
          <h3 className="text-white/90 mb-3 text-sm font-medium">Music Style</h3>
          <input
            type="text"
            value={musicStyle}
            onChange={(e) => setMusicStyle(e.target.value)}
            placeholder="Enter a music style..."
            className="w-full bg-white/10 text-white placeholder:text-white/40 outline-none px-4 py-3 rounded-xl mb-3"
          />
          <div className="flex flex-wrap gap-2">
            {stylePresets.map((style) => (
              <motion.button
                key={style}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMusicStyle(style)}
                className={`px-4 py-2 rounded-full text-sm backdrop-blur-xl transition-all ${
                  musicStyle === style
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {style}
              </motion.button>
            ))}
          </div>
        </FloatingCard>

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
