import { motion } from 'motion/react';
import { ArrowLeft, Music, LogOut, User, Play, ChevronDown, ChevronUp, Pause, X, Download, Share2 } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { GenerationService } from '@/lib/generationService';
import { getPlaybackUrl, getDownloadUrl, isTrackPlayable } from '@/lib/audioUtils';
import type { SunoMusicTrack } from '@/types/suno';

interface ProfileScreenProps {
  onBack: () => void;
}

interface UserProfile {
  username: string;
  email: string;
  createdAt: string;
}

interface Generation {
  id: string;
  prompt: string;
  model: string;
  status: string;
  created_at: string;
  trackCount?: number;
  tracks?: SunoMusicTrack[];
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGenId, setExpandedGenId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SunoMusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadUserProfile();
    loadGenerations();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          createdAt: user.created_at || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGenerations = async () => {
    try {
      const userGenerations = await GenerationService.getUserGenerations(10);
      
      // Get tracks for each generation
      const generationsWithTracks = await Promise.all(
        userGenerations.map(async (gen) => {
          const tracks = await GenerationService.getGenerationTracks(gen.id);
          return {
            id: gen.id,
            prompt: gen.prompt,
            model: gen.model,
            status: gen.status,
            created_at: gen.created_at,
            trackCount: tracks.length,
            tracks: tracks,
          };
        })
      );
      
      setGenerations(generationsWithTracks);
    } catch (error) {
      console.error('Error loading generations:', error);
    }
  };

  // Update audio source and reset player when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Stop current playback and reset
    try {
      if (!audio.paused) {
        audio.pause();
      }
      audio.currentTime = 0;
      setIsPlaying(false);
    } catch {
      // Ignore errors
    }

    // Load new source with validation
    const playbackUrl = getPlaybackUrl(currentTrack);
    if (playbackUrl && playbackUrl.trim() !== '' && isTrackPlayable(currentTrack)) {
      // Only update if URL is different
      if (audio.src !== playbackUrl) {
        audio.src = playbackUrl;
        try {
          audio.load();
        } catch {
          // Some browsers don't need explicit load; ignore errors here
        }
        // Auto-play the newly selected track so a single click on the list starts playback
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error('Error auto-playing track in ProfileScreen:', error);
            }
          });
        }
      }
    } else {
      console.warn('Track not playable or invalid URL:', {
        track: currentTrack.title,
        streamUrl: currentTrack.stream_audio_url,
        audioUrl: currentTrack.audio_url,
        playbackUrl,
      });
      // Clear src if invalid
      audio.src = '';
    }
  }, [currentTrack]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      // Use audio.duration if valid, otherwise fallback to track.duration from API
      const audioDuration = audio.duration;
      if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      } else if (currentTrack?.duration && currentTrack.duration > 0) {
        // Fallback to track duration from Suno API
        setDuration(currentTrack.duration);
      }
    };

    // Set initial duration from track if available
    if (currentTrack?.duration && currentTrack.duration > 0) {
      setDuration(currentTrack.duration);
    }

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, [currentTrack]);

  const toggleExpand = (genId: string) => {
    setExpandedGenId(expandedGenId === genId ? null : genId);
  };

  const handlePlayTrack = async (track: SunoMusicTrack) => {
    if (currentTrack?.id === track.id) {
      // Toggle play/pause for current track
      handlePlayPause();
      return;
    }

    // Check if track is playable
    if (!isTrackPlayable(track)) {
      console.error('Track is not playable - missing audio URL');
      return;
    }

    const audio = audioRef.current;
    // Stop current playback and reset if an audio element already exists
    if (audio) {
      try {
        if (!audio.paused) {
          audio.pause();
        }
        audio.currentTime = 0;
        setIsPlaying(false);
      } catch {
        // Ignore errors
      }
    }

    // Set the current track; useEffect will update the audio source
    // and the fixed bottom player will appear
    setCurrentTrack(track);
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Check if track is playable
    if (!isTrackPlayable(currentTrack)) {
      console.error('Track is not playable - missing audio URL');
      return;
    }

    // Verify audio has a valid source
    const playbackUrl = getPlaybackUrl(currentTrack);
    if (!playbackUrl || playbackUrl.trim() === '') {
      console.error('No valid playback URL available');
      return;
    }

    // Ensure source is set
    if (!audio.src || audio.src !== playbackUrl) {
      audio.src = playbackUrl;
      try {
        await audio.load();
      } catch (loadError) {
        console.error('Error loading audio:', loadError);
        return;
      }
    }

    try {
      if (isPlaying) {
        audio.pause();
        // setIsPlaying will be set by onPause event
      } else {
        // Verify audio has a valid source before playing
        if (!audio.src || audio.src === '' || audio.src === window.location.href) {
          console.error('Audio element has no valid source');
          return;
        }

        // Play with proper promise handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          // setIsPlaying will be set by onPlay event
        }
      }
    } catch (error) {
      // AbortError is normal when play() is interrupted - ignore it
      if (error instanceof Error && error.name === 'AbortError') {
        // This is expected behavior, do nothing
        return;
      }

      // NotSupportedError means no valid source - handle gracefully
      if (error instanceof Error && error.name === 'NotSupportedError') {
        console.error('Audio format not supported or no valid source:', {
          track: currentTrack.title,
          streamUrl: currentTrack.stream_audio_url,
          audioUrl: currentTrack.audio_url,
          audioSrc: audio.src,
        });
        setIsPlaying(false);
        return;
      }

      // Log other errors
      if (error instanceof Error) {
        console.error('Error playing audio:', error.name, error.message);
      } else {
        console.error('Error playing audio:', error);
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const handleDownload = async () => {
    if (currentTrack) {
      try {
        const { downloadAudioTrack } = await import('@/lib/audioUtils');
        await downloadAudioTrack(currentTrack);
      } catch (error) {
        console.error('Download error:', error);
      }
    }
  };

  const handleShare = async () => {
    if (currentTrack) {
      const shareUrl = currentTrack.audio_url || currentTrack.stream_audio_url || '';
      const shareText = `Check out my track: ${currentTrack.title}`;
      
      // Try Web Share API first
      if (navigator.share && shareUrl) {
        try {
          await navigator.share({
            title: currentTrack.title,
            text: shareText,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Share error:', error);
          }
        }
      }
      
      // Fallback: Copy URL to clipboard
      const { copyTrackUrl } = await import('@/lib/audioUtils');
      await copyTrackUrl(currentTrack);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onBack(); // Return to home
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
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
          {loading ? (
            <>
              <h2 className="text-3xl text-white mb-2">Loading...</h2>
              <p className="text-white/70 mb-4">Please wait</p>
            </>
          ) : userProfile ? (
            <>
              <h2 className="text-3xl text-white mb-2">{userProfile.username}</h2>
              <p className="text-white/70 mb-2">{userProfile.email}</p>
              <p className="text-white/50 text-sm mb-4">
                Member since {formatDate(userProfile.createdAt)}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl text-white mb-2">
                <User className="w-8 h-8 inline mr-2" />
                Guest
              </h2>
              <p className="text-white/70 mb-4">Sign in to save your tracks</p>
            </>
          )}
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mb-6">
            <div>
              <p className="text-2xl text-white">{generations.length}</p>
              <p className="text-white/60 text-sm">Generations</p>
            </div>
            <div>
              <p className="text-2xl text-white">∞</p>
              <p className="text-white/60 text-sm">Unlimited</p>
            </div>
          </div>
        </motion.div>

        {/* Generation History Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h3 className="text-white/90 text-xl">Your Music</h3>
          <p className="text-white/60 text-sm">Your generation history</p>
        </motion.div>

        {/* Generation History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-6"
        >
          {generations.length === 0 ? (
            <FloatingCard delay={0.4} rotation={0}>
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/70">No generations yet</p>
                <p className="text-white/50 text-sm">Start creating your first track!</p>
              </div>
            </FloatingCard>
          ) : (
            generations.map((gen, i) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <FloatingCard delay={0} rotation={i % 2 === 0 ? 1 : -1}>
                  <button
                    onClick={() => toggleExpand(gen.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center ${
                          gen.status === 'processing' ? 'animate-pulse' : ''
                        }`}>
                          <Music className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/90 line-clamp-1">{gen.prompt}</p>
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <span>{gen.model}</span>
                            {gen.trackCount && gen.trackCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{gen.trackCount} track{gen.trackCount > 1 ? 's' : ''}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm ${
                            gen.status === 'completed' ? 'text-green-400' : 
                            gen.status === 'processing' ? 'text-yellow-400' : 
                            gen.status === 'failed' ? 'text-red-400' : 
                            'text-white/60'
                          }`}>
                            {gen.status}
                          </p>
                          <p className="text-white/60 text-xs">{formatDate(gen.created_at)}</p>
                        </div>
                        {gen.trackCount && gen.trackCount > 0 && (
                          <div className="text-white/60">
                            {expandedGenId === gen.id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded tracks */}
                  {expandedGenId === gen.id && gen.tracks && gen.tracks.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10 space-y-2"
                    >
                      {gen.tracks.map((track, trackIndex) => (
                        <button
                          key={track.id}
                          onClick={() => handlePlayTrack(track)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                            currentTrack?.id === track.id
                              ? 'bg-gradient-to-br from-[#FF69B4]/20 to-[#00BFFF]/20 border border-white/20'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center ${
                            currentTrack?.id === track.id && isPlaying ? 'animate-pulse' : ''
                          }`}>
                            {currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="w-5 h-5 text-white" fill="white" />
                            ) : (
                              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white/90 text-sm line-clamp-1">{track.title}</p>
                            <p className="text-white/60 text-xs">{formatDuration(track.duration)}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </FloatingCard>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={currentTrack ? 'mb-32' : ''}
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

      {/* Hidden audio element */}
      {currentTrack && isTrackPlayable(currentTrack) && (() => {
        const playbackUrl = getPlaybackUrl(currentTrack);
        if (!playbackUrl || playbackUrl.trim() === '') {
          return null;
        }
        return (
          <audio
            ref={audioRef}
            key={currentTrack.id}
            src={playbackUrl}
            preload="metadata"
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              const audio = e.currentTarget;
              console.error('Audio error:', {
                error: e,
                src: audio.src,
                networkState: audio.networkState,
                readyState: audio.readyState,
                errorCode: audio.error?.code,
                errorMessage: audio.error?.message,
              });
              setIsPlaying(false);
            }}
          />
        );
      })()}

      {/* Fixed bottom music player */}
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-[#667EEA]/95 via-[#764BA2]/95 to-[#F093FB]/95 backdrop-blur-xl border-t border-white/20 shadow-2xl"
        >
          <div className="p-4">
            {/* Progress bar */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <div className="flex justify-between text-white/60 text-xs mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Player controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF69B4] to-[#00BFFF] flex items-center justify-center shadow-2xl"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" fill="white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  )}
                </motion.button>

                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-medium line-clamp-1">{currentTrack.title}</p>
                  <p className="text-white/60 text-xs line-clamp-1">{currentTrack.tags.split(',')[0]}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Download className="w-4 h-4 text-white" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClosePlayer}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
