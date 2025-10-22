import { motion } from 'motion/react';

interface WaveformVisualizerProps {
  isPlaying?: boolean;
}

export function WaveformVisualizer({ isPlaying = false }: WaveformVisualizerProps) {
  const bars = Array.from({ length: 40 });
  
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-[#FF69B4] to-[#00BFFF] rounded-full"
          animate={isPlaying ? {
            height: [
              Math.random() * 40 + 10,
              Math.random() * 50 + 15,
              Math.random() * 40 + 10,
            ],
          } : {
            height: 20,
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.03,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
