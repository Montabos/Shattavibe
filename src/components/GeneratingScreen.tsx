import { motion } from 'motion/react';
import { Music, Radio, Sparkles, AlertCircle } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { useEffect } from 'react';

interface GeneratingScreenProps {
  onComplete: () => void;
  status: string;
  progress: string;
  error: string | null;
  autoTransitionAfter?: number; // Auto-transition to result screen after X seconds
}

export function GeneratingScreen({ onComplete, status, progress, error, autoTransitionAfter = 20000 }: GeneratingScreenProps) {
  const steps = [
    { icon: Music, text: 'Submitting request...', delay: 0 },
    { icon: Radio, text: 'AI is composing...', delay: 1 },
    { icon: Sparkles, text: 'Almost there! 🔥', delay: 2 },
  ];

  // Auto-transition to result screen after specified delay
  useEffect(() => {
    if (!error && autoTransitionAfter > 0) {
      const timer = setTimeout(() => {
        onComplete();
      }, autoTransitionAfter);

      return () => clearTimeout(timer);
    }
  }, [error, autoTransitionAfter, onComplete]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#00BFFF] via-[#FF69B4] to-[#FFD700]"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Pulsing orbs */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-[#FF69B4]/20 blur-3xl" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 p-6 w-full max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={
              error
                ? {}
                : {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }
            }
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className={`w-24 h-24 mx-auto mb-6 rounded-full ${
              error
                ? 'bg-gradient-to-br from-red-500 to-orange-500'
                : 'bg-gradient-to-br from-[#FF69B4] to-[#00BFFF]'
            } flex items-center justify-center shadow-2xl`}
          >
            {error ? (
              <AlertCircle className="w-12 h-12 text-white" />
            ) : (
              <Music className="w-12 h-12 text-white" />
            )}
          </motion.div>
          <h2 className="text-4xl text-white mb-2">
            {error ? 'Oops!' : 'Creating Magic'}
          </h2>
          <p className="text-white/70">
            {error || progress}
          </p>
        </motion.div>

        {/* Animated steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
            >
              <FloatingCard delay={step.delay} rotation={0}>
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: step.delay,
                    }}
                  >
                    <step.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <p className="text-white/90">{step.text}</p>
                </div>
              </FloatingCard>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        {!error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-xl">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF69B4] to-[#00BFFF]"
                initial={{ width: '0%' }}
                animate={{ width: status === 'completed' ? '100%' : '75%' }}
                transition={{
                  duration: status === 'completed' ? 0.5 : 120,
                  ease: status === 'completed' ? 'easeInOut' : 'linear',
                }}
              />
            </div>
            <p className="text-white/50 text-center text-sm mt-3">
              {status === 'polling' ? 'Checking for your tracks...' : 'Submitting to Suno AI...'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
