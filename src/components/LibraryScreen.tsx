import { motion } from 'motion/react';
import { useState, useRef } from 'react';
import { ArrowLeft, Play, Pause, Download, Music2, Library } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { WaveformVisualizer } from './WaveformVisualizer';
import { SessionStorageService, type SessionGeneration } from '@/lib/sessionStorageService';
import { getPlaybackUrl, getDownloadUrl } from '@/lib/audioUtils';

interface LibraryScreenProps {
  onBack: () => void;
}

export function LibraryScreen({ onBack }: LibraryScreenProps) {
  const [sessionGenerations] = useState<SessionGeneration[]>(
    SessionStorageService.getSessionGenerations()
  );
  const [selectedGeneration, setSelectedGeneration] = useState<SessionGeneration | null>(
    sessionGenerations.length > 0 ? sessionGenerations[0] : null
  );
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = selectedGeneration?.tracks[currentTrackIndex];

  const handlePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleDownload = async () => {
    if (currentTrack) {
      const link = document.createElement('a');
      link.href = getDownloadUrl(currentTrack);
      link.download = `${currentTrack.title}.mp3`;
      link.click();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Library className="w-6 h-6 text-white" />
            <h1 className="text-2xl text-white font-bold">Ma Bibliothèque</h1>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {sessionGenerations.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Music2 className="w-20 h-20 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl text-white/80 mb-2">Aucune musique</h2>
            <p className="text-white/60">
              Générez votre première track pour la voir ici !
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Library List */}
            <div>
              <h3 className="text-white/90 mb-4 text-lg font-medium">
                {sessionGenerations.length} musique{sessionGenerations.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {sessionGenerations.map((gen, index) => (
                  <motion.button
                    key={gen.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.pause();
                      }
                      setSelectedGeneration(gen);
                      setCurrentTrackIndex(0);
                      setIsPlaying(false);
                    }}
                    className={`w-full p-4 rounded-2xl transition-all ${
                      selectedGeneration?.id === gen.id
                        ? 'bg-white/30 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-left flex-1">
                        <p className="text-white font-medium mb-1">
                          {gen.tracks[0]?.title || `Track ${sessionGenerations.length - index}`}
                        </p>
                        <p className="text-white/70 text-sm mb-1 line-clamp-2">
                          {gen.tracks[0]?.tags || gen.prompt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span>{gen.tracks.length} track{gen.tracks.length > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{new Date(gen.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      {selectedGeneration?.id === gen.id && (
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] ml-3 mt-1" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Player */}
            {selectedGeneration && currentTrack && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:sticky lg:top-6"
              >
                <FloatingCard delay={0} rotation={0}>
                  {/* Track info */}
                  <div className="mb-6">
                    <h3 className="text-white text-xl font-bold mb-1">
                      {currentTrack.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">{currentTrack.tags}</p>
                    <p className="text-white/50 text-xs">
                      {formatDuration(currentTrack.duration)} • {currentTrack.model_name}
                    </p>
                  </div>

                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    src={getPlaybackUrl(currentTrack)}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Waveform */}
                  <WaveformVisualizer isPlaying={isPlaying} />

                  {/* Play button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center shadow-2xl mx-auto my-6"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" fill="white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" fill="white" />
                    )}
                  </motion.button>

                  {/* Track selector if multiple tracks */}
                  {selectedGeneration.tracks.length > 1 && (
                    <div className="flex gap-2 justify-center mb-6">
                      {selectedGeneration.tracks.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.pause();
                            }
                            setCurrentTrackIndex(index);
                            setIsPlaying(false);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentTrackIndex
                              ? 'bg-white w-6'
                              : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Download button */}
                  <button
                    onClick={handleDownload}
                    className="w-full py-4 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
                  >
                    <Download className="w-5 h-5 text-white" />
                    <span className="text-white">Télécharger</span>
                  </button>

                  {/* Lyrics */}
                  {currentTrack.prompt && (
                    <div className="mt-4 p-4 rounded-xl bg-white/10">
                      <h4 className="text-white/90 mb-2 flex items-center gap-2 text-sm">
                        <Music2 className="w-4 h-4" />
                        Paroles
                      </h4>
                      <div className="text-white/70 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {currentTrack.prompt}
                      </div>
                    </div>
                  )}
                </FloatingCard>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

