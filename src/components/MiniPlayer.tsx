import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, MoreVertical, Download, Share2, X } from 'lucide-react';
import { useState } from 'react';

interface Track {
  title: string;
  vibe: string;
  date: string;
}

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
}

export function MiniPlayer({ track, isPlaying, onPlayPause, onClose }: MiniPlayerProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [progress, setProgress] = useState(45);

  const handleDownload = () => {
    console.log('Downloading track:', track?.title);
    setShowMenu(false);
  };

  const handleShare = () => {
    console.log('Sharing track:', track?.title);
    setShowMenu(false);
  };

  return (
    <AnimatePresence>
      {track && (
        <>
          {/* Menu overlay */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMenu(false)}
            />
          )}

          {/* Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-32 right-6 z-50 bg-white/20 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20"
              >
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-white/10 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleShare}
                  className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-white/10 transition-colors border-t border-white/10"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mini Player */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-30 p-4"
          >
            <div className="bg-gradient-to-r from-[#FF69B4]/90 to-[#00BFFF]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
              {/* Progress bar */}
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/60"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Player content */}
              <div className="px-4 py-3 flex items-center justify-between">
                {/* Track info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onPlayPause}
                    className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white fill-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </motion.button>

                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{track.title}</p>
                    <p className="text-white/70 text-sm">{track.vibe}</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
