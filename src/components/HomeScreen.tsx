import { motion } from "motion/react";
import { FloatingCard } from "./FloatingCard";
import { Music, Sparkles, Calendar } from "lucide-react";

interface HomeScreenProps {
  onGenerateClick: () => void;
  onProfileClick: () => void;
  username: string | null;
}

export function HomeScreen({
  onGenerateClick,
  onProfileClick,
  username,
}: HomeScreenProps) {
  const today = new Date();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#00BFFF] via-[#FF69B4] to-[#DDA0DD]"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-[#FFB6C1]/20 blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 pt-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white/70 text-sm"
          >
            {today.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center text-white/60 font-bold text-sm">
              {username ? username.charAt(0).toUpperCase() : ''}
            </div>
          </motion.button>
        </div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl text-white/60 tracking-tight">
            Make
          </h1>
          <h1 className="text-6xl text-white mb-2 tracking-tight">
            your tracks
          </h1>
        </motion.div>

        {/* Floating cards */}
        <div className="space-y-4 mb-8">
          <FloatingCard delay={0.2} rotation={-2}>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-white/70 mt-1" />
              <div>
                <p className="text-white/90 mb-2">
                  Your bestie can’t dance?
                </p>
                <p className="text-white/50 text-sm">
                Turn it into a roast track 💀
                </p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            delay={0.4}
            rotation={2}
            className="ml-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 mb-1">
                  Keisha's birthday?
                </p>
                <p className="text-white/60 text-sm">
                  Make her a track! 🎉
                </p>
              </div>
              <Calendar className="w-5 h-5 text-white/70" />
            </div>
          </FloatingCard>

          <FloatingCard delay={0.6} rotation={-1}>
            <div>
              <p className="text-white/90 mb-2">Hitting the club tonight?</p>
              <p className="text-white/50 text-sm">
              Drop a team anthem 🎧
              </p>
            </div>
          </FloatingCard>
        </div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGenerateClick}
          className="w-full py-5 rounded-3xl bg-gradient-to-r from-[#FF69B4] to-[#00BFFF] text-white shadow-2xl relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Music className="w-5 h-5" />
            Generate My Banger
          </span>
        </motion.button>
      </div>
    </div>
  );
}