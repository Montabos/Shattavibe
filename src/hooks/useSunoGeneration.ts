// useSunoGeneration Hook - Manage music generation workflow

import { useState, useCallback, useEffect, useRef } from 'react';
import { sunoApi } from '@/lib/sunoApi';
import { GenerationService } from '@/lib/generationService';
import { supabase } from '@/lib/supabase';
import type { SunoMusicTrack, SunoModel } from '@/types/suno';

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
  negativeTags?: string;
}

export function useSunoGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    taskId: null,
    tracks: null,
    error: null,
    progress: 'Ready to generate',
    remainingFreeGenerations: 2, // Will be updated on mount
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to update remaining free generations
  const updateRemainingFree = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const remaining = await GenerationService.getRemainingAnonymousFreeGenerations();
      setState(prev => ({ ...prev, remainingFreeGenerations: remaining }));
    } else {
      // Authenticated users have unlimited
      setState(prev => ({ ...prev, remainingFreeGenerations: Infinity }));
    }
  }, []);

  // Load remaining free generations on mount and when auth state changes
  useEffect(() => {
    updateRemainingFree();
  }, [updateRemainingFree]);

  /**
   * Generate music
   */
  const generate = useCallback(async (params: GenerateParams) => {
    try {
      // Always check authentication fresh (don't rely on cached state)
      // This ensures we get the latest auth state even if user logged in from another tab
      const { data: { user } } = await supabase.auth.getUser();
      const isAuthenticated = !!user;

      // If not authenticated, check free limit
      if (!isAuthenticated) {
        const hasReachedLimit = await GenerationService.hasReachedAnonymousFreeLimit();
        if (hasReachedLimit) {
          const remaining = await GenerationService.getRemainingAnonymousFreeGenerations();
          setState({
            status: 'limit_reached',
            taskId: null,
            tracks: null,
            error: null,
            progress: 'Free limit reached. Please sign in to continue.',
            remainingFreeGenerations: remaining,
          });
          throw new Error('Free generation limit reached');
        }
      }

      let remaining = isAuthenticated 
        ? Infinity 
        : await GenerationService.getRemainingAnonymousFreeGenerations();

      setState({
        status: 'generating',
        taskId: null,
        tracks: null,
        error: null,
        progress: 'Submitting generation request...',
        remainingFreeGenerations: remaining,
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
        negativeTags: params.negativeTags,
      });

      await GenerationService.updateGenerationStatus(taskId, 'processing');

      // Update remaining free generations after creating generation
      await updateRemainingFree();

      // Start polling for tracks (status will be updated to 'polling' in useEffect)
      // Recalculate remaining after updateRemainingFree (user state might have changed)
      remaining = isAuthenticated 
        ? Infinity 
        : await GenerationService.getRemainingAnonymousFreeGenerations();
      
      setState({
        status: 'polling',
        taskId,
        tracks: null,
        error: null,
        progress: 'Creating your music... 30-40 seconds remaining!',
        remainingFreeGenerations: remaining,
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
      
      // Update remaining free generations
      const { data: { user } } = await supabase.auth.getUser();
      const remaining = user 
        ? Infinity 
        : await GenerationService.getRemainingAnonymousFreeGenerations();
      
      setState((prev) => ({
        ...prev,
        status: isLimitError ? 'limit_reached' : 'error',
        error: errorMessage,
        progress: isLimitError ? 'Free limit reached' : 'Generation failed',
        remainingFreeGenerations: remaining,
      }));

      throw error;
    }
  }, [state.taskId, updateRemainingFree]);

  /**
   * Poll Supabase for tracks
   */
  const checkForTracks = useCallback(async (taskId: string) => {
    console.log('🔄 Polling for task:', taskId);
    try {
      // Always check authentication fresh (don't rely on cached state)
      // This ensures we get the latest auth state even if user logged in from another tab
      const { data: { user } } = await supabase.auth.getUser();
      const isAuthenticated = !!user;
      console.log('🔐 Is authenticated:', isAuthenticated, 'User ID:', user?.id);
      
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
          const { data: { user } } = await supabase.auth.getUser();
          const remaining = user 
            ? Infinity 
            : await GenerationService.getRemainingAnonymousFreeGenerations();
          
          setState({
            status: 'error',
            taskId,
            tracks: null,
            error: 'Music generation failed',
            progress: 'Generation failed',
            remainingFreeGenerations: remaining,
          });
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          return true;
        }

        // Check for tracks even if status is not completed yet (stream_audio_url might be available)
        // This allows playback to start as soon as stream_audio_url is available (~20-30s)
        if (generation.status === 'completed' || generation.status === 'processing') {
          console.log(`✅ Generation status: ${generation.status}. Checking for tracks...`);
          
          const { data: tracks, error: tracksError } = await supabase
            .from('tracks')
            .select('*')
            .eq('generation_id', generation.id);

          if (tracksError) {
            console.error('Error checking for tracks:', tracksError);
            return false;
          }

          console.log(`🎵 Found ${tracks?.length || 0} tracks`);
          if (tracks && tracks.length > 0) {
            console.log('📋 Track details:', tracks.map(t => ({ 
              id: t.suno_id, 
              duration: t.duration, 
              stream_url: t.stream_audio_url?.substring(0, 50),
              has_stream: !!t.stream_audio_url
            })));
          }

          // If tracks exist with stream_audio_url, we can play them even if status is still 'processing'
          if (tracks && tracks.length > 0 && tracks.some(t => t.stream_audio_url)) {
            // Tracks found! Update state
            const trackData = tracks as SunoMusicTrack[];
            
            // Get the prompt from Supabase generation
            const { data: genData } = await supabase
              .from('generations')
              .select('prompt')
              .eq('id', generation.id)
              .maybeSingle();
            
            const prompt = genData?.prompt || 'Generated music';
            
            // Tracks are already saved in Supabase via webhook callback
            // No need to save to sessionStorage anymore
            
            // Update remaining free generations after completion
            const { data: { user } } = await supabase.auth.getUser();
            const remaining = user 
              ? Infinity 
              : await GenerationService.getRemainingAnonymousFreeGenerations();
            
            setState({
              status: 'completed',
              taskId,
              tracks: trackData,
              error: null,
              progress: 'Music generation completed!',
              remainingFreeGenerations: remaining,
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
          const remaining = await GenerationService.getRemainingAnonymousFreeGenerations();
          
          setState({
            status: 'error',
            taskId,
            tracks: null,
            error: 'Music generation failed',
            progress: 'Generation failed',
            remainingFreeGenerations: remaining,
          });
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          return true;
        }

        // Check for tracks even if status is not completed yet (stream_audio_url might be available)
        // This allows playback to start as soon as stream_audio_url is available (~20-30s)
        if (anonGen.status === 'completed' || anonGen.status === 'processing') {
          console.log(`✅ Generation status: ${anonGen.status}. Checking for tracks...`);
          
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
              stream_url: t.stream_audio_url?.substring(0, 50),
              has_stream: !!t.stream_audio_url
            })));
          }

          // If tracks exist with stream_audio_url, we can play them even if status is still 'processing'
          if (tracks && tracks.length > 0 && tracks.some(t => t.stream_audio_url)) {
            // Tracks found! Update state and localStorage
            const trackData = tracks as SunoMusicTrack[];
            
            console.log('🎉 Tracks loaded! Updating state...');
            
            // Get the prompt from anonymous_generations table
            const { data: anonGen } = await supabase
              .from('anonymous_generations')
              .select('prompt')
              .eq('task_id', taskId)
              .maybeSingle();
            
            const prompt = anonGen?.prompt || 'Generated music';
            
            // Tracks are already saved in Supabase via webhook callback
            // No need to save to sessionStorage or localStorage anymore
            
            // Update remaining free generations after completion
            const remaining = await GenerationService.getRemainingAnonymousFreeGenerations();
            
            setState({
              status: 'completed',
              taskId,
              tracks: trackData,
              error: null,
              progress: 'Music generation completed!',
              remainingFreeGenerations: remaining,
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
    // Only log when actually starting polling to reduce noise
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

      // Then poll every 2 seconds for faster detection of stream_audio_url
      // This allows playback to start as soon as stream_audio_url is available (~20-30s)
      pollingIntervalRef.current = setInterval(() => {
        checkForTracks(state.taskId!);
      }, 2000); // 2 seconds - faster polling to catch stream_audio_url sooner

      // Cleanup on unmount or when taskId changes
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
    // Remove checkForTracks from dependencies - it's stable (no dependencies in useCallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.taskId, state.status]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Update remaining free generations on reset
    updateRemainingFree().then(() => {
      setState(prev => ({
        ...prev,
        status: 'idle',
        taskId: null,
        tracks: null,
        error: null,
        progress: 'Ready to generate',
      }));
    });
  }, [updateRemainingFree]);

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

