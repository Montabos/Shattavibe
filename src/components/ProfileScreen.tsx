import { motion } from 'motion/react';
import { ArrowLeft, Music, LogOut } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { MiniPlayer } from './MiniPlayer';
import { useState } from 'react';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const savedTracks = [
    { title: 'Island Party Anthem', vibe: 'Party', date: 'Today' },
    { title: 'Birthday Bash', vibe: 'Party', date: 'Yesterday' },
    { title: 'Weekend Vibes', vibe: 'Chill', date: '2 days ago' },
    { title: 'Crew Anthem', vibe: 'Hype', date: '3 days ago' },
    { title: 'Sunset Groove', vibe: 'Romantic', date: '1 week ago' },
  ];

  const [currentTrack, setCurrentTrack] = useState<typeof savedTracks[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTrackClick = (track: typeof savedTracks[0]) => {
    if (currentTrack?.title === track.title) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClosePlayer = () => {
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const handleLogout = () => {
    // Logout logic here
    console.log('Logging out...');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C471ED] via-[#F64F59] to-[#12C2E9]" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-40 left-10 w-40 h-40 rounded-full bg-white/10 blur-3xl"
        animate={{
          y: [0, 30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 pt-16 pb-24">
        {/* Header */}
        <div className="flex items-center mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 30px rgba(255,105,180,0.4)',
                '0 0 50px rgba(0,191,255,0.4)',
                '0 0 30px rgba(255,105,180,0.4)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-28 h-28 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] p-1"
          >
            <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
              <span className="text-3xl">🎵</span>
            </div>
          </motion.div>
          <h2 className="text-3xl text-white mb-2">Island Creator</h2>
          <p className="text-white/70 mb-4">Making waves in the Caribbean</p>
          
          {/* Stats */}
          <div className="flex justify-center mb-6">
            <div>
              <p className="text-2xl text-white">{savedTracks.length}</p>
              <p className="text-white/60 text-sm">Tracks</p>
            </div>
          </div>
        </motion.div>

        {/* Track History Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h3 className="text-white/90 text-xl">Your Bangers</h3>
          <p className="text-white/60 text-sm">Your track history</p>
        </motion.div>

        {/* Track History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-6"
        >
          {savedTracks.map((track, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTrackClick(track)}
              className="cursor-pointer"
            >
              <FloatingCard delay={0.4 + i * 0.1} rotation={i % 2 === 0 ? 1 : -1}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center ${
                      currentTrack?.title === track.title && isPlaying ? 'animate-pulse' : ''
                    }`}>
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white/90">{track.title}</p>
                      <p className="text-white/60 text-sm">{track.vibe}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm">{track.date}</p>
                  </div>
                </div>
              </FloatingCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl bg-white/10 backdrop-blur-xl text-white flex items-center justify-center gap-2 border border-white/20"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </motion.button>
        </motion.div>
      </div>

      {/* Mini Player */}
      <MiniPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onClose={handleClosePlayer}
      />
    </div>
  );
}
