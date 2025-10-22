import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface FloatingCardProps {
  children: ReactNode;
  delay?: number;
  rotation?: number;
  className?: string;
}

export function FloatingCard({ children, delay = 0, rotation = 0, className = '' }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 0 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        rotate: rotation 
      }}
      transition={{ 
        duration: 0.8, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      className={`backdrop-blur-xl bg-white/20 rounded-3xl p-6 shadow-2xl ${className}`}
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
    >
      {children}
    </motion.div>
  );
}
