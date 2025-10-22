import { motion } from 'motion/react';
import { useState } from 'react';
import { ArrowLeft, Zap, Music2, Sparkles } from 'lucide-react';
import { FloatingCard } from './FloatingCard';

interface GeneratorScreenProps {
  onBack: () => void;
  onGenerate: (prompt: string) => void;
}

export function GeneratorScreen({ onBack, onGenerate }: GeneratorScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<string>('hype');

  const vibes = [
    { id: 'hype', label: 'Hype 🔥', color: 'from-[#FF6B6B] to-[#FF8E53]' },
    { id: 'chill', label: 'Chill 🌴', color: 'from-[#4FACFE] to-[#00F2FE]' },
    { id: 'party', label: 'Party 🎉', color: 'from-[#FA709A] to-[#FEE140]' },
    { id: 'vibes', label: 'Vibes ✨', color: 'from-[#A8EDEA] to-[#FED6E3]' },
  ];

  const suggestions = [
    "Shout out Jamal and Keisha in a hype Bouyon vibe",
    "Birthday track for Sarah with island vibes",
    "Weekend anthem for the crew",
  ];

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
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
        <div className="flex items-center mb-12">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
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
        <FloatingCard delay={0.2} className="mb-6 flex-grow">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your vibe... e.g., 'Shout out my crew in a party Bouyon track'"
            className="w-full bg-transparent text-white placeholder:text-white/50 outline-none resize-none"
            rows={4}
          />
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
          disabled={!prompt.trim()}
          className="w-full py-5 rounded-3xl bg-white text-transparent bg-clip-text bg-gradient-to-r from-[#FF69B4] to-[#00BFFF] shadow-2xl relative overflow-hidden disabled:opacity-50"
          style={{
            background: prompt.trim() ? 'white' : 'rgba(255,255,255,0.3)',
          }}
        >
          <motion.div
            animate={{
              boxShadow: prompt.trim() 
                ? ['0 0 20px rgba(255,105,180,0.5)', '0 0 40px rgba(0,191,255,0.5)', '0 0 20px rgba(255,105,180,0.5)']
                : '0 0 0px rgba(0,0,0,0)',
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl"
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" style={{ color: '#FF69B4' }} />
            <span style={{ color: '#FF69B4' }}>Generate Track</span>
          </span>
        </motion.button>
      </div>
    </div>
  );
}
