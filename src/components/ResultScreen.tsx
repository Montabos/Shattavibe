import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Download, Share2, RotateCcw, Music2, Library, MoreVertical, Zap, Loader2 } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { WaveformVisualizer } from './WaveformVisualizer';
import { SessionStorageService } from '@/lib/sessionStorageService';
import { LocalStorageService } from '@/lib/localStorageService';
import { GenerationService } from '@/lib/generationService';
import { getPlaybackUrl, downloadAudioTrack, copyTrackUrl } from '@/lib/audioUtils';
import { toast } from 'sonner';
import type { SunoMusicTrack } from '@/types/suno';

interface ResultScreenProps {
  onBack: () => void;
  onRegenerate: () => void;
  onProfileClick: () => void;
  onLibraryClick?: () => void;
  onAuthClick?: () => void;
  tracks: SunoMusicTrack[] | null;
  username: string | null;
  generationPrompt?: string; // Prompt used for generation (for display while loading)
  isLoading?: boolean; // True if tracks are still being generated
}

export function ResultScreen({ onBack, onRegenerate, onProfileClick, onLibraryClick, onAuthClick, tracks, username, generationPrompt, isLoading = false }: ResultScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionCount = SessionStorageService.getSessionCount();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await GenerationService.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
  }, []);
  
  const hasReachedLimit = !isAuthenticated && LocalStorageService.hasReachedFreeLimit();

  // Always use the first track only
  const currentTrack = tracks && tracks.length > 0 ? tracks[0] : null;
  const tracksReady = tracks && tracks.length > 0;

  // Auto-play when tracks become available
  useEffect(() => {
    if (tracksReady && currentTrack && audioRef.current && !isPlaying) {
      // Try to auto-play when track becomes ready
      audioRef.current.play().catch((error) => {
        console.log('Auto-play prevented by browser:', error);
        // User will need to manually click play
      });
    }
  }, [tracksReady, currentTrack]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentTrack]);

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
    if (!currentTrack || isDownloading) return;
    
    setIsDownloading(true);
    setShowMenu(false);
    
    try {
      await downloadAudioTrack(currentTrack);
      toast.success('Download started!', {
        description: `${currentTrack.title} is downloading`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: 'Unable to download the track. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!currentTrack) return;
    
    const shareUrl = currentTrack.audio_url || currentTrack.stream_audio_url || '';
    const shareText = `Check out my track: ${currentTrack.title}`;
    
    // Try Web Share API first (mobile and modern browsers)
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: currentTrack.title,
          text: shareText,
          url: shareUrl,
        });
        setShowMenu(false);
        return;
      } catch (error) {
        // User cancelled or share failed, fall through to copy URL
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    }
    
    // Fallback: Copy URL to clipboard
    const copied = await copyTrackUrl(currentTrack);
    if (copied) {
      toast.success('Link copied!', {
        description: 'Track URL copied to clipboard',
      });
    } else {
      toast.error('Failed to copy', {
        description: 'Unable to copy the track URL',
      });
    }
    
    setShowMenu(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRegenerate = () => {
    if (hasReachedLimit && onAuthClick) {
      onAuthClick();
      return;
    }
    onRegenerate();
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
        <div className="flex items-center justify-between mb-12">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          
          <div className="flex gap-3">
            {/* Library button */}
            {onLibraryClick && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onLibraryClick}
                className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
              >
                <Library className="w-5 h-5 text-white" />
                {sessionCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] text-white text-xs flex items-center justify-center">
                    {sessionCount}
                  </div>
                )}
              </motion.button>
            )}
            
            {/* Profile button */}
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
        </div>

        {/* Track Title */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-block">
            <div className="text-4xl mb-2">
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-transparent bg-clip-text">
                {currentTrack ? currentTrack.title : (generationPrompt || 'Your Track')}
              </span>
            </div>
            {currentTrack ? (
              <>
                <p className="text-white/80 text-sm">{currentTrack.tags}</p>
                <p className="text-white/60 text-xs mt-1">
                  {formatDuration(currentTrack.duration)} • {currentTrack.model_name}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                <p className="text-white/60 text-sm">Generating your banger...</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Hidden audio element */}
        {currentTrack && (
          <audio
            ref={audioRef}
            src={getPlaybackUrl(currentTrack)}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        {/* Audio player card */}
        <FloatingCard delay={0.4} rotation={0} className="mb-6">
          {/* Player controls */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={tracksReady ? { scale: 1.05 } : {}}
              whileTap={tracksReady ? { scale: 0.95 } : {}}
              onClick={tracksReady ? handlePlayPause : undefined}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center shadow-2xl"
            >
              {!tracksReady ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-7 h-7 text-white" />
                </motion.div>
              ) : isPlaying ? (
                <Pause className="w-7 h-7 text-white" fill="white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              )}
            </motion.button>

            <div className="flex-1 mx-4">
              <p className="text-white/90 text-sm font-medium line-clamp-1">
                {currentTrack ? currentTrack.title : (generationPrompt || 'Your Track')}
              </p>
              <p className="text-white/60 text-xs">
                {currentTrack ? currentTrack.tags.split(',')[0] : 'Generating...'}
              </p>
            </div>

            {/* Menu button - only show when track is ready */}
            {tracksReady && (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <MoreVertical className="w-5 h-5 text-white" />
                </motion.button>

                {/* Dropdown menu */}
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-40 bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-50"
                  >
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full px-4 py-3 text-white text-sm flex items-center gap-3 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-3 text-white text-sm flex items-center gap-3 hover:bg-white/10 transition"
                    >
                      <Share2 className="w-4 h-4" />
                      Share / Copy Link
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!tracksReady}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg disabled:opacity-50"
              style={{
                background: tracksReady 
                  ? `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                  : 'rgba(255,255,255,0.2)'
              }}
            />
            <div className="flex justify-between text-white/60 text-xs mt-1">
              <span>{tracksReady ? formatDuration(currentTime) : '0:00'}</span>
              <span>{tracksReady ? formatDuration(duration) : '--:--'}</span>
            </div>
          </div>

          <WaveformVisualizer isPlaying={tracksReady && isPlaying} />
        </FloatingCard>

        {/* Prompt/Lyrics used */}
        {currentTrack && currentTrack.prompt && (
          <FloatingCard delay={0.7} rotation={0} className="mb-6">
            <h4 className="text-white/90 mb-3 flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Lyrics
            </h4>
            <div className="text-white/70 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {currentTrack.prompt}
            </div>
          </FloatingCard>
        )}

        {/* Regenerate button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRegenerate}
          className="w-full py-5 rounded-3xl shadow-2xl relative overflow-hidden"
          style={{
            background: hasReachedLimit ? 'white' : 'rgba(255,255,255,0.2)',
          }}
        >
          <motion.div
            animate={{
              boxShadow: hasReachedLimit
                ? ['0 0 20px rgba(255,105,180,0.5)', '0 0 40px rgba(0,191,255,0.5)', '0 0 20px rgba(255,105,180,0.5)']
                : '0 0 0px rgba(0,0,0,0)',
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl"
          />
          
          <span className="relative z-10 flex items-center justify-center gap-2">
            {hasReachedLimit ? (
              <>
                <Zap className="w-5 h-5" style={{ color: '#FF69B4' }} />
                <span 
                  className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF69B4] to-[#00BFFF]"
                >
                  Sign in to generate more
                </span>
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5 text-white" />
                <span className="text-white">Make Another Banger</span>
              </>
            )}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
