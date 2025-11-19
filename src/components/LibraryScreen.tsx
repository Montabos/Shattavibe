import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Download, Music2, Library, LogIn } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import { WaveformVisualizer } from './WaveformVisualizer';
import { AppHeader } from './AppHeader';
import { GenerationService } from '@/lib/generationService';
import { supabase } from '@/lib/supabase';
import { getPlaybackUrl, getDownloadUrl, isTrackPlayable } from '@/lib/audioUtils';
import type { SunoMusicTrack } from '@/types/suno';

interface LibraryScreenProps {
  onBack: () => void;
  onAuthClick?: () => void;
  onProfileClick?: () => void;
  username?: string | null;
}

interface LibraryGeneration {
  id: string;
  taskId?: string;
  prompt: string;
  model: string;
  status: string;
  createdAt: string;
  tracks: SunoMusicTrack[];
}

export function LibraryScreen({ onBack, onAuthClick, onProfileClick, username }: LibraryScreenProps) {
  console.log('🔵 LibraryScreen: Component rendering');
  
  const [generations, setGenerations] = useState<LibraryGeneration[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<LibraryGeneration | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isChangingTrackRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  const currentTrack = selectedGeneration?.tracks[currentTrackIndex];
  
  console.log('🔵 LibraryScreen: State - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'generations:', generations.length);

  // Load generations from Supabase
  const loadGenerations = async () => {
    console.log('🔵 LibraryScreen: loadGenerations called, isLoadingRef.current:', isLoadingRef.current);
    if (isLoadingRef.current) {
      console.log('⚠️ LibraryScreen: Already loading, skipping...');
      return;
    }
    console.log('🔵 LibraryScreen: Starting load, setting isLoadingRef to true');
    isLoadingRef.current = true;
    setIsLoading(true);
    
    // Safety timeout - always set loading to false after 5 seconds
    const timeoutId = setTimeout(() => {
      console.warn('LibraryScreen: Load timeout, forcing loading to false');
      // Try to get auth state one more time before giving up
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session?.user);
      }).catch((err) => {
        console.error('LibraryScreen: Error checking auth in timeout:', err);
        // Default to not authenticated if we can't check
        setIsAuthenticated(false);
      });
      setIsLoading(false);
      isLoadingRef.current = false;
    }, 5000);
    
    try {
      console.log('LibraryScreen: Starting to load generations...');
      // Use getSession() instead of getUser() to get the real current session state
      // getUser() can return cached data even after logout
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('LibraryScreen: Auth error:', authError);
      }
      
      const user = session?.user || null;
      setIsAuthenticated(!!user);
      console.log('LibraryScreen: User authenticated:', !!user, 'User ID:', user?.id);
      
      let loadedGenerations: LibraryGeneration[] = [];
      
      if (user) {
        // Authenticated: load from generations table
        console.log('LibraryScreen: Loading authenticated generations...');
        const userGenerations = await GenerationService.getUserGenerations(50);
        console.log('LibraryScreen: Found', userGenerations.length, 'generations');
        
        const generationsWithTracks = await Promise.all(
          userGenerations.map(async (gen) => {
            const tracks = await GenerationService.getGenerationTracks(gen.id);
            return {
              id: gen.id,
              taskId: gen.task_id,
              prompt: gen.prompt,
              model: gen.model,
              status: gen.status,
              createdAt: gen.created_at,
              tracks: tracks.map(track => ({
                id: track.suno_id,
                title: track.title,
                tags: track.tags,
                prompt: track.prompt,
                model_name: track.model_name,
                audio_url: track.audio_url,
                source_audio_url: track.source_audio_url,
                stream_audio_url: track.stream_audio_url,
                image_url: track.image_url,
                duration: track.duration,
              })),
            };
          })
        );
        
        loadedGenerations = generationsWithTracks;
      } else {
        // Anonymous: load from anonymous_generations table
        console.log('LibraryScreen: Loading anonymous generations...');
        const anonymousGens = await GenerationService.getAnonymousGenerations(50);
        console.log('LibraryScreen: Found', anonymousGens.length, 'anonymous generations');
        
        loadedGenerations = anonymousGens.map(gen => ({
          id: gen.task_id,
          taskId: gen.task_id,
          prompt: gen.prompt,
          model: gen.model,
          status: gen.status,
          createdAt: gen.created_at,
          tracks: gen.tracks,
        }));
      }
      
      console.log('LibraryScreen: Setting', loadedGenerations.length, 'generations');
      setGenerations(loadedGenerations);
      
      // Set first generation as selected if available
      if (loadedGenerations.length > 0 && !selectedGeneration) {
        setSelectedGeneration(loadedGenerations[0]);
        setCurrentTrackIndex(0);
      } else if (loadedGenerations.length === 0) {
        setSelectedGeneration(null);
        setCurrentTrackIndex(0);
      }
    } catch (error) {
      console.error('LibraryScreen: Error loading generations:', error);
      setGenerations([]);
      setSelectedGeneration(null);
    } finally {
      clearTimeout(timeoutId);
      console.log('LibraryScreen: Setting loading to false');
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('🔵 LibraryScreen: useEffect running');
    let isMounted = true;
    let storageTimeout: NodeJS.Timeout | null = null;
    let fallbackTimeout: NodeJS.Timeout | null = null;

    // Fallback: Force loading to false after 3 seconds if still loading
    // This is a safety net in case loadGenerations doesn't complete
    fallbackTimeout = setTimeout(() => {
      console.log('🔵 LibraryScreen: Fallback timeout triggered, isLoadingRef.current:', isLoadingRef.current);
      if (isMounted && isLoadingRef.current) {
        console.warn('⚠️ LibraryScreen: Fallback timeout - forcing loading to false');
        setIsLoading(false);
        isLoadingRef.current = false;
        // Ensure we check auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('🔵 LibraryScreen: Fallback auth check - user:', !!session?.user);
          if (isMounted) {
            setIsAuthenticated(!!session?.user);
          }
        }).catch((err) => {
          console.error('🔵 LibraryScreen: Fallback auth error:', err);
          if (isMounted) {
            setIsAuthenticated(false);
          }
        });
      } else {
        console.log('🔵 LibraryScreen: Fallback timeout skipped - not mounted or not loading');
      }
    }, 3000);

    // Initial load - always load on mount
    console.log('🔵 LibraryScreen: Calling loadGenerations');
    loadGenerations();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('LibraryScreen: Auth state changed:', event, 'User ID:', session?.user?.id);
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const currentUserId = session?.user?.id || null;
        const wasAuthenticated = lastUserIdRef.current !== null;
        const isNowAuthenticated = currentUserId !== null;
        
        // Update authentication state immediately
        setIsAuthenticated(isNowAuthenticated);
        
        if (currentUserId !== lastUserIdRef.current || wasAuthenticated !== isNowAuthenticated) {
          console.log('LibraryScreen: ✅ Reloading data');
          lastUserIdRef.current = currentUserId;
          await loadGenerations();
        }
      }
    });

    // Listen for storage events (when session changes in another tab)
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key && e.key.includes('auth-token')) {
        console.log('LibraryScreen: Session changed in another tab, reloading...');
        if (storageTimeout) clearTimeout(storageTimeout);
        storageTimeout = setTimeout(async () => {
          if (isMounted) {
            // Check auth state and reload
            const { data: { session } } = await supabase.auth.getSession();
            if (isMounted) {
              const user = session?.user || null;
              setIsAuthenticated(!!user);
              const currentUserId = user?.id || null;
              if (currentUserId !== lastUserIdRef.current) {
                lastUserIdRef.current = currentUserId;
                await loadGenerations();
              }
            }
          }
        }, 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      if (storageTimeout) clearTimeout(storageTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    isChangingTrackRef.current = true;

    // Cancel any pending play() promise
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {
        // Ignore errors when canceling
      });
      playPromiseRef.current = null;
    }

    // Stop current playback gracefully
    const stopPlayback = async () => {
      try {
        if (!audio.paused) {
          audio.pause();
        }
        audio.currentTime = 0;
        setIsPlaying(false);
      } catch (error) {
        // Ignore errors when stopping
      }
    };

    stopPlayback();

    // Load new source with validation
    const playbackUrl = getPlaybackUrl(currentTrack);
    if (playbackUrl && playbackUrl.trim() !== '' && isTrackPlayable(currentTrack)) {
      // Only update if URL is different
      if (audio.src !== playbackUrl) {
        audio.src = playbackUrl;
        audio.load(); // Force reload of the audio element
      }
    } else {
      console.warn('Track not playable or invalid URL:', {
        track: currentTrack.title,
        streamUrl: currentTrack.stream_audio_url,
        audioUrl: currentTrack.audio_url,
        playbackUrl
      });
      // Clear src if invalid
      audio.src = '';
    }

    // Reset flag after a short delay
    setTimeout(() => {
      isChangingTrackRef.current = false;
    }, 100);
  }, [currentTrack]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || isChangingTrackRef.current) return;

    // Check if track is playable
    if (!isTrackPlayable(currentTrack)) {
      console.error('Track is not playable - missing audio URL');
      return;
    }

    try {
      if (isPlaying) {
        // Cancel any pending play() promise
        if (playPromiseRef.current) {
          playPromiseRef.current.catch(() => {
            // Ignore AbortError when canceling
          });
          playPromiseRef.current = null;
        }
        audio.pause();
        // setIsPlaying will be set by onPause event
      } else {
        // Get and validate playback URL
        const playbackUrl = getPlaybackUrl(currentTrack);
        if (!playbackUrl || playbackUrl.trim() === '') {
          console.error('No valid playback URL available');
          return;
        }

        // Ensure audio source is set and loaded
        if (!audio.src || audio.src !== playbackUrl || audio.readyState === 0) {
          audio.src = playbackUrl;
          try {
            await audio.load();
          } catch (loadError) {
            console.error('Error loading audio:', loadError);
            return;
          }
        }

        // Verify audio has a valid source before playing
        if (!audio.src || audio.src === '' || audio.src === window.location.href) {
          console.error('Audio element has no valid source');
          return;
        }
        
        // Play with proper promise handling
        playPromiseRef.current = audio.play();
        if (playPromiseRef.current !== undefined) {
          await playPromiseRef.current;
          playPromiseRef.current = null;
          // setIsPlaying will be set by onPlay event
        }
      }
    } catch (error) {
      playPromiseRef.current = null;
      
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
          audioSrc: audio.src
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
          {onProfileClick && (
            <AppHeader
              onProfileClick={onProfileClick}
              username={username || null}
            />
          )}
        </div>

        {(() => {
          console.log('🔵 LibraryScreen: Rendering - isLoading:', isLoading, 'generations.length:', generations.length, 'isAuthenticated:', isAuthenticated);
          return null;
        })()}
        {isLoading ? (
          // Loading state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-2xl text-white/80 mb-2">Chargement...</h2>
            <p className="text-white/60">
              Récupération de votre bibliothèque
            </p>
          </motion.div>
        ) : generations.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Music2 className="w-20 h-20 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl text-white/80 mb-2">Aucune musique</h2>
            <p className="text-white/60 mb-6">
              Générez votre première track pour la voir ici !
            </p>
            {/* Always show login button if not authenticated, even if onAuthClick is not provided */}
            {!isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAuthClick || (() => console.warn('onAuthClick not provided'))}
                className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center gap-2 hover:bg-white/30 transition-all mx-auto"
              >
                <LogIn className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Se connecter</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Library List */}
            <div>
              <h3 className="text-white/90 mb-4 text-lg font-medium">
                {generations.length} musique{generations.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {generations.map((gen, index) => (
                  <motion.button
                    key={gen.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={async () => {
                      const audio = audioRef.current;
                      if (audio) {
                        // Cancel any pending play() promise
                        if (playPromiseRef.current) {
                          playPromiseRef.current.catch(() => {
                            // Ignore errors when canceling
                          });
                          playPromiseRef.current = null;
                        }
                        // Stop playback gracefully
                        try {
                          audio.pause();
                          audio.currentTime = 0;
                        } catch (error) {
                          // Ignore errors
                        }
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
                          {gen.tracks[0]?.title || `Track ${generations.length - index}`}
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
                {!isAuthenticated && onAuthClick && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t border-white/20"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onAuthClick}
                      className="w-full px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
                    >
                      <LogIn className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">Se connecter pour sauvegarder vos tracks</span>
                    </motion.button>
                  </motion.div>
                )}
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
                  {currentTrack && isTrackPlayable(currentTrack) && (() => {
                    const playbackUrl = getPlaybackUrl(currentTrack);
                    if (!playbackUrl || playbackUrl.trim() === '') {
                      return null;
                    }
                    return (
                      <audio
                        ref={audioRef}
                        key={currentTrack.id} // Force re-render when track changes
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
                            errorMessage: audio.error?.message
                          });
                          setIsPlaying(false);
                          
                          // Try to reload with fallback URL if stream URL fails
                          if (currentTrack) {
                            const currentUrl = getPlaybackUrl(currentTrack);
                            const fallbackUrl = currentTrack.audio_url || currentTrack.stream_audio_url;
                            
                            if (fallbackUrl && fallbackUrl !== currentUrl && audio.src !== fallbackUrl) {
                              console.log('Trying fallback URL:', fallbackUrl);
                              audio.src = fallbackUrl;
                              audio.load();
                            }
                          }
                        }}
                      />
                    );
                  })()}

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
                          onClick={async () => {
                            const audio = audioRef.current;
                            if (audio) {
                              // Cancel any pending play() promise
                              if (playPromiseRef.current) {
                                playPromiseRef.current.catch(() => {
                                  // Ignore errors when canceling
                                });
                                playPromiseRef.current = null;
                              }
                              // Stop playback gracefully
                              try {
                                audio.pause();
                                audio.currentTime = 0;
                              } catch (error) {
                                // Ignore errors
                              }
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

