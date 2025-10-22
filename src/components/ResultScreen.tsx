import { motion } from 'motion/react';
import { useState } from 'react';
import { ArrowLeft, Play, Pause, Download, Share2, RotateCcw } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { WaveformVisualizer } from './WaveformVisualizer';

interface ResultScreenProps {
  onBack: () => void;
  onRegenerate: () => void;
  onProfileClick: () => void;
  prompt: string;
}

export function ResultScreen({ onBack, onRegenerate, onProfileClick, prompt }: ResultScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock generated content
  const lyrics = [
    "Yo Jamal, Keisha in the place",
    "Caribbean vibes, feel the bass",
    "Dancing all night, we embrace",
    "Shatta sound, pick up the pace"
  ];

  // Generate track title from prompt
  const trackTitle = "Island Party Anthem";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#667EEA] via-[#764BA2] to-[#F093FB]"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-20 right-10 w-40 h-40 rounded-full bg-[#FF69B4]/30 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 20, 0],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-[#00BFFF]/30 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          y: [0, -20, 0],
        }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 pt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF]" />
          </motion.button>
        </div>

        {/* Track Title */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-block">
            <div className="text-5xl mb-2">
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-transparent bg-clip-text">
                {trackTitle}
              </span>
            </div>
            <p className="text-white/80 text-lg">Party Ready! 🔥</p>
          </div>
        </motion.div>

        {/* Audio player card */}
        <FloatingCard delay={0.3} rotation={0} className="mb-6">
          <div className="text-center mb-4">
            <h3 className="text-white/90 mb-2">Your Banger</h3>
            <p className="text-white/60 text-sm">{prompt.substring(0, 50)}...</p>
          </div>
          
          <WaveformVisualizer isPlaying={isPlaying} />
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FF69B4] to-[#00BFFF] flex items-center justify-center shadow-xl"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </motion.button>
          </div>
        </FloatingCard>

        {/* Lyrics card */}
        <FloatingCard delay={0.5} rotation={2} className="mb-6">
          <h4 className="text-white/70 mb-3 text-sm">Lyrics</h4>
          <div className="space-y-2">
            {lyrics.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-white/90"
              >
                {line.split(' ').map((word, j) => (
                  <span
                    key={j}
                    className={
                      word.includes('Jamal') || word.includes('Keisha')
                        ? 'text-[#FF69B4]'
                        : ''
                    }
                  >
                    {word}{' '}
                  </span>
                ))}
              </motion.p>
            ))}
          </div>
        </FloatingCard>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="py-4 rounded-2xl bg-white/20 backdrop-blur-xl text-white flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="py-4 rounded-2xl bg-gradient-to-r from-[#FF69B4] to-[#00BFFF] text-white flex items-center justify-center gap-2 shadow-xl"
          >
            <Share2 className="w-5 h-5" />
            Share
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
