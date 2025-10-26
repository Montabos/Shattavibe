// useSunoGeneration Hook - Manage music generation workflow

import { useState, useCallback, useEffect, useRef } from 'react';
import { sunoApi } from '@/lib/sunoApi';
import { GenerationService } from '@/lib/generationService';
import { LocalStorageService } from '@/lib/localStorageService';
import { SessionStorageService } from '@/lib/sessionStorageService';
import { supabase } from '@/lib/supabase';
import type { SunoMusicTrack, SunoModel, LanguageCode, VocalGender } from '@/types/suno';

type GenerationStatus = 'idle' | 'generating' | 'polling' | 'completed' | 'error' | 'limit_reached';

interface GenerationState {
  status: GenerationStatus;
  taskId: string | null;
  tracks: SunoMusicTrack[] | null;
  error: string | null;
  progress: string;
  remainingFreeGenerations: number;
}

export interface GenerateParams {
  prompt: string;
  instrumental?: boolean;
  model?: SunoModel;
  language?: LanguageCode;
  vocalGender?: VocalGender;
  negativeTags?: string;
}

export function useSunoGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    taskId: null,
    tracks: null,
    error: null,
    progress: 'Ready to generate',
    remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Generate music
   */
  const generate = useCallback(async (params: GenerateParams) => {
    try {
      // Check if user is authenticated
      const isAuthenticated = await GenerationService.isAuthenticated();

      // If not authenticated, check free limit
      if (!isAuthenticated && LocalStorageService.hasReachedFreeLimit()) {
        setState({
          status: 'limit_reached',
          taskId: null,
          tracks: null,
          error: null,
          progress: 'Free limit reached. Please sign in to continue.',
          remainingFreeGenerations: 0,
        });
        throw new Error('Free generation limit reached');
      }

      setState({
        status: 'generating',
        taskId: null,
        tracks: null,
        error: null,
        progress: 'Submitting generation request...',
        remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
      });

      // Get callback URL (Supabase Edge Function or webhook.site)
      const callBackUrl = sunoApi.getCallbackUrl();
      console.log('🔔 Callback URL configured:', callBackUrl);

      // Call Suno API
      const taskId = await sunoApi.generateMusic({
        ...params,
        callBackUrl,
      });
      
      console.log('✅ Music generation started - Task ID:', taskId);

      setState((prev) => ({
        ...prev,
        taskId,
        progress: 'Music generation started! Your track will be ready in 30-40 seconds...',
      }));

      // Save to Supabase or localStorage
      await GenerationService.createGeneration({
        taskId,
        prompt: params.prompt,
        model: params.model || 'V4_5',
        instrumental: params.instrumental || false,
        language: params.language,
        vocalGender: params.vocalGender,
        negativeTags: params.negativeTags,
      });

      await GenerationService.updateGenerationStatus(taskId, 'processing');

      // Start polling for tracks (status will be updated to 'polling' in useEffect)
      setState({
        status: 'polling',
        taskId,
        tracks: null,
        error: null,
        progress: 'Creating your music... 30-40 seconds remaining!',
        remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
      });

      // Polling will happen in useEffect
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (state.taskId) {
        await GenerationService.updateGenerationStatus(
          state.taskId,
          'failed',
          errorMessage
        );
      }

      const isLimitError = errorMessage.includes('limit reached');
      
      setState((prev) => ({
        ...prev,
        status: isLimitError ? 'limit_reached' : 'error',
        error: errorMessage,
        progress: isLimitError ? 'Free limit reached' : 'Generation failed',
        remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
      }));

      throw error;
    }
  }, [state.taskId]);

  /**
   * Poll Supabase for tracks
   */
  const checkForTracks = useCallback(async (taskId: string) => {
    console.log('🔄 Polling for task:', taskId);
    try {
      // Check if authenticated user
      const isAuthenticated = await GenerationService.isAuthenticated();
      console.log('🔐 Is authenticated:', isAuthenticated);
      
      let shouldCheckAnonymous = false;
      
      if (isAuthenticated) {
        // Authenticated users: check generations + tracks tables
        const { data: generation, error: genError } = await supabase
          .from('generations')
          .select('id, status')
          .eq('task_id', taskId)
          .maybeSingle();

        if (genError) {
          console.error('Error checking generation:', genError);
          return false;
        }

        // If not found in authenticated table, will check anonymous table below
        if (!generation) {
          console.log('⚠️ Not found in generations table, checking anonymous_generations...');
          shouldCheckAnonymous = true;
        } else {

        // Check if generation failed
        if (generation.status === 'failed') {
          setState({
            status: 'error',
            taskId,
            tracks: null,
            error: 'Music generation failed',
            progress: 'Generation failed',
            remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
          });
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          return true;
        }

        // If completed, query for tracks using generation.id
        if (generation.status === 'completed') {
          const { data: tracks, error: tracksError } = await supabase
            .from('tracks')
            .select('*')
            .eq('generation_id', generation.id);

          if (tracksError) {
            console.error('Error checking for tracks:', tracksError);
            return false;
          }

          if (tracks && tracks.length > 0) {
            // Tracks found! Update state
            const trackData = tracks as SunoMusicTrack[];
            
            // Get the prompt from Supabase generation
            const { data: genData } = await supabase
              .from('generations')
              .select('prompt')
              .eq('id', generation.id)
              .maybeSingle();
            
            const prompt = genData?.prompt || 'Generated music';
            
            // Save to session storage
            SessionStorageService.addGeneration({
              id: crypto.randomUUID(),
              taskId,
              prompt,
              tracks: trackData,
              createdAt: new Date().toISOString(),
            });
            
            setState({
              status: 'completed',
              taskId,
              tracks: trackData,
              error: null,
              progress: 'Music generation completed!',
              remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
            });
            
            // Stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            return true;
          }
        }
        }
      }
      
      // Check anonymous_generations table (for non-authenticated users OR authenticated users who started anonymously)
      if (!isAuthenticated || shouldCheckAnonymous) {
        console.log('🔍 Checking anonymous generation for task:', taskId);
        
        const { data: anonGen, error: anonError } = await supabase
          .from('anonymous_generations')
          .select('status')
          .eq('task_id', taskId)
          .maybeSingle();

        if (anonError) {
          console.error('❌ Error checking anonymous generation:', anonError);
          return false;
        }

        if (!anonGen) {
          console.log('⚠️ Anonymous generation not found');
          return false;
        }
        
        console.log('📊 Anonymous generation status:', anonGen.status);

        // Check if generation failed
        if (anonGen.status === 'failed') {
          setState({
            status: 'error',
            taskId,
            tracks: null,
            error: 'Music generation failed',
            progress: 'Generation failed',
            remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
          });
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          return true;
        }

        // If completed, query for anonymous tracks
        if (anonGen.status === 'completed') {
          console.log('✅ Generation completed! Checking for tracks...');
          
          const { data: tracks, error: tracksError } = await supabase
            .from('anonymous_tracks')
            .select('*')
            .eq('task_id', taskId);

          if (tracksError) {
            console.error('❌ Error checking for anonymous tracks:', tracksError);
            return false;
          }

          console.log(`🎵 Found ${tracks?.length || 0} tracks`);
          if (tracks && tracks.length > 0) {
            console.log('📋 Track details:', tracks.map(t => ({ 
              id: t.suno_id, 
              duration: t.duration, 
              stream_url: t.stream_audio_url?.substring(0, 50) 
            })));
          }

          if (tracks && tracks.length > 0) {
            // Tracks found! Update state and localStorage
            const trackData = tracks as SunoMusicTrack[];
            
            console.log('🎉 Tracks loaded! Updating state...');
            
            // Get the prompt from localStorage
            const localGen = LocalStorageService.getGenerationByTaskId(taskId);
            const prompt = localGen?.prompt || 'Generated music';
            
            // Save to session storage for access during this session
            SessionStorageService.addGeneration({
              id: crypto.randomUUID(),
              taskId,
              prompt,
              tracks: trackData,
              createdAt: new Date().toISOString(),
            });
            
            setState({
              status: 'completed',
              taskId,
              tracks: trackData,
              error: null,
              progress: 'Music generation completed!',
              remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
            });

            // Save to localStorage for offline access
            LocalStorageService.saveTracks(taskId, trackData);
            
            // Stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error polling for tracks:', error);
      return false;
    }
  }, []);

  /**
   * Start polling for tracks
   */
  useEffect(() => {
    console.log('📡 useEffect - taskId:', state.taskId, 'status:', state.status);
    if (state.taskId && (state.status === 'generating' || state.status === 'polling')) {
      console.log('✅ Starting polling for task:', state.taskId);
      // Start polling every 5 seconds
      setState((prev) => ({
        ...prev,
        status: 'polling',
        progress: 'Creating your music... 30-40 seconds remaining!',
      }));

      // Check immediately
      console.log('🚀 Calling checkForTracks immediately');
      checkForTracks(state.taskId);

      // Then poll every 5 seconds for faster detection
      pollingIntervalRef.current = setInterval(() => {
        checkForTracks(state.taskId!);
      }, 5000); // 5 seconds

      // Cleanup on unmount or when taskId changes
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [state.taskId, state.status, checkForTracks]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setState({
      status: 'idle',
      taskId: null,
      tracks: null,
      error: null,
      progress: 'Ready to generate',
      remainingFreeGenerations: LocalStorageService.getRemainingFreeGenerations(),
    });
  }, []);

  return {
    // State
    status: state.status,
    taskId: state.taskId,
    tracks: state.tracks,
    error: state.error,
    progress: state.progress,
    remainingFreeGenerations: state.remainingFreeGenerations,
    
    // Actions
    generate,
    reset,
    
    // Computed
    isGenerating: state.status === 'generating',
    isPolling: state.status === 'polling',
    isCompleted: state.status === 'completed',
    hasError: state.status === 'error',
    isLimitReached: state.status === 'limit_reached',
    isLoading: state.status === 'generating' || state.status === 'polling',
  };
}

