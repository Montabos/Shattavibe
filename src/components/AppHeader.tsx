import { motion } from 'motion/react';
import { User } from 'lucide-react';

interface AppHeaderProps {
  onProfileClick: () => void;
  username: string | null;
}

export function AppHeader({ 
  onProfileClick, 
  username
}: AppHeaderProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onProfileClick}
      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-all"
      title={username || "Profil"}
    >
      {username ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center text-white font-bold text-sm">
          {username.charAt(0).toUpperCase()}
        </div>
      ) : (
        <User className="w-5 h-5 text-white" />
      )}
    </motion.button>
  );
}

