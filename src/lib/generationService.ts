// Generation Service - Manages music generation with Supabase

import { supabase } from './supabase';
import { getAnonymousSessionId } from './anonymousSessionService';
import type { SunoMusicTrack } from '@/types/suno';
import type { Database } from '@/types/database';

type Generation = Database['public']['Tables']['generations']['Row'];
type GenerationInsert = Database['public']['Tables']['generations']['Insert'];
type GenerationUpdate = Database['public']['Tables']['generations']['Update'];
type Track = Database['public']['Tables']['tracks']['Row'];
type TrackInsert = Database['public']['Tables']['tracks']['Insert'];

export class GenerationService {
  /**
   * Check if user is authenticated
   * Use getSession() instead of getUser() to avoid cached data after logout
   */
  static async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  }

  /**
   * Create a new generation record (Supabase only - anonymous_generations or generations)
   */
  static async createGeneration(data: {
    taskId: string;
    prompt: string;
    model: string;
    instrumental: boolean;
    negativeTags?: string;
  }): Promise<Generation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // For anonymous users, save to anonymous_generations table
    if (!user) {
      const sessionId = getAnonymousSessionId();
      const { error } = await supabase
        .from('anonymous_generations')
        .insert({
          task_id: data.taskId,
          prompt: data.prompt,
          model: data.model,
          instrumental: data.instrumental,
          status: 'pending',
          session_id: sessionId,
        });

      if (error) {
        console.error('Failed to save anonymous generation to Supabase:', error);
        throw new Error('Failed to create anonymous generation');
      }

      return null;
    }

    const insert: GenerationInsert = {
      user_id: user.id,
      task_id: data.taskId,
      prompt: data.prompt,
      model: data.model,
      instrumental: data.instrumental,
      negative_tags: data.negativeTags || null,
      status: 'pending',
    };

    const { data: generation, error } = await supabase
      .from('generations')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return generation;
  }

  /**
   * Update generation status (Supabase only - anonymous_generations or generations)
   */
  static async updateGenerationStatus(
    taskId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const isAuth = await this.isAuthenticated();

    // If not authenticated, update anonymous_generations table
    if (!isAuth) {
      const sessionId = getAnonymousSessionId();
      const { error } = await supabase
        .from('anonymous_generations')
        .update({
          status,
          ...(errorMessage && { error_message: errorMessage }),
        })
        .eq('task_id', taskId)
        .eq('session_id', sessionId); // Only update generations from this session

      if (error) {
        console.error('Failed to update anonymous generation status:', error);
      }
      return;
    }

    // If authenticated, update generations table
    const update: GenerationUpdate = {
      status,
      ...(errorMessage && { error_message: errorMessage }),
    };

    const { error } = await supabase
      .from('generations')
      .update(update)
      .eq('task_id', taskId);

    if (error) throw error;
  }

  /**
   * Save generated tracks (Supabase only - anonymous_tracks or tracks)
   */
  static async saveTracks(
    taskId: string,
    tracks: SunoMusicTrack[]
  ): Promise<Track[] | null> {
    const isAuth = await this.isAuthenticated();

    // If not authenticated, save to anonymous_tracks
    if (!isAuth) {
      const sessionId = getAnonymousSessionId();
      
      // Update anonymous_generation status to completed
      const { error: updateError } = await supabase
        .from('anonymous_generations')
        .update({ status: 'completed' })
        .eq('task_id', taskId)
        .eq('session_id', sessionId); // Only update generations from this session

      if (updateError) {
        console.error('Failed to update anonymous generation status:', updateError);
      }

      // Insert tracks into anonymous_tracks
      const anonymousTrackInserts = tracks.map((track) => ({
        task_id: taskId,
        suno_id: track.id,
        title: track.title,
        tags: track.tags,
        prompt: track.prompt,
        model_name: track.model_name,
        audio_url: track.audio_url,
        source_audio_url: track.source_audio_url,
        stream_audio_url: track.stream_audio_url,
        image_url: track.image_url,
        duration: track.duration,
        session_id: sessionId, // Include session_id for filtering
      }));

      const { data: savedTracks, error: tracksError } = await supabase
        .from('anonymous_tracks')
        .insert(anonymousTrackInserts)
        .select();

      if (tracksError) {
        console.error('Failed to save anonymous tracks:', tracksError);
        throw tracksError;
      }

      return null; // Return null for anonymous users (no Track type)
    }

    // Get generation ID for authenticated users
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select('id')
      .eq('task_id', taskId)
      .maybeSingle();

    if (genError) throw genError;
    if (!generation) throw new Error('Generation not found');

    // Insert tracks
    const trackInserts: TrackInsert[] = tracks.map((track) => ({
      generation_id: generation.id,
      suno_id: track.id,
      title: track.title,
      tags: track.tags,
      prompt: track.prompt,
      model_name: track.model_name,
      audio_url: track.audio_url,
      source_audio_url: track.source_audio_url,
      stream_audio_url: track.stream_audio_url,
      image_url: track.image_url,
      duration: track.duration,
    }));

    const { data: savedTracks, error: tracksError } = await supabase
      .from('tracks')
      .insert(trackInserts)
      .select();

    if (tracksError) throw tracksError;
    return savedTracks;
  }

  /**
   * Get user's generations
   */
  static async getUserGenerations(limit = 20): Promise<Generation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching generations:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get tracks for a generation
   */
  static async getGenerationTracks(generationId: string): Promise<Track[]> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('generation_id', generationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get generation by task ID
   */
  static async getGenerationByTaskId(taskId: string): Promise<Generation | null> {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a generation and its tracks
   */
  static async deleteGeneration(generationId: string): Promise<void> {
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', generationId);

    if (error) throw error;
  }

  /**
   * Get anonymous generations (for non-authenticated users)
   * Returns generations with their tracks grouped by task_id
   * Only returns generations from the current session
   */
  static async getAnonymousGenerations(limit = 50): Promise<Array<{
    task_id: string;
    prompt: string;
    model: string;
    status: string;
    created_at: string;
    tracks: SunoMusicTrack[];
  }>> {
    try {
      const sessionId = getAnonymousSessionId();
      
      // Get anonymous generations for this session only
      const { data: generations, error: genError } = await supabase
        .from('anonymous_generations')
        .select('*')
        .eq('session_id', sessionId) // Filter by session_id
        .order('created_at', { ascending: false })
        .limit(limit);

      if (genError) {
        console.error('Error fetching anonymous generations:', genError);
        return [];
      }

      if (!generations || generations.length === 0) {
        return [];
      }

      // Get all tracks for these generations (also filtered by session_id)
      const taskIds = generations.map(g => g.task_id);
      const { data: tracks, error: tracksError } = await supabase
        .from('anonymous_tracks')
        .select('*')
        .in('task_id', taskIds)
        .eq('session_id', sessionId) // Filter by session_id
        .order('created_at', { ascending: true });

      if (tracksError) {
        console.error('Error fetching anonymous tracks:', tracksError);
        return generations.map(gen => ({
          task_id: gen.task_id,
          prompt: gen.prompt,
          model: gen.model,
          status: gen.status,
          created_at: gen.created_at,
          tracks: [],
        }));
      }

      // Group tracks by task_id
      const tracksByTaskId = new Map<string, SunoMusicTrack[]>();
      if (tracks) {
        tracks.forEach(track => {
          const sunoTrack: SunoMusicTrack = {
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
          };
          
          if (!tracksByTaskId.has(track.task_id)) {
            tracksByTaskId.set(track.task_id, []);
          }
          tracksByTaskId.get(track.task_id)!.push(sunoTrack);
        });
      }

      // Combine generations with their tracks
      return generations.map(gen => ({
        task_id: gen.task_id,
        prompt: gen.prompt,
        model: gen.model,
        status: gen.status,
        created_at: gen.created_at,
        tracks: tracksByTaskId.get(gen.task_id) || [],
      }));
    } catch (error) {
      console.error('Error in getAnonymousGenerations:', error);
      return [];
    }
  }

  /**
   * Get anonymous tracks for a specific task ID
   * Only returns tracks from the current session
   */
  static async getAnonymousTracks(taskId: string): Promise<SunoMusicTrack[]> {
    try {
      const sessionId = getAnonymousSessionId();
      const { data: tracks, error } = await supabase
        .from('anonymous_tracks')
        .select('*')
        .eq('task_id', taskId)
        .eq('session_id', sessionId) // Filter by session_id
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching anonymous tracks:', error);
        return [];
      }

      if (!tracks || tracks.length === 0) {
        return [];
      }

      return tracks.map(track => ({
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
      }));
    } catch (error) {
      console.error('Error in getAnonymousTracks:', error);
      return [];
    }
  }

  /**
   * Get count of completed anonymous generations for the current device
   * This persists across browser sessions, page refreshes, and even after days/weeks
   * The session_id is stored in localStorage, so it's tied to the device, not the session
   * This is used to track free generation credits per device (max 2)
   * 
   * Example: If a user generates 1 song, then comes back 5 days later on the same device,
   * they will still have 1 credit remaining (2 - 1 = 1)
   */
  static async getAnonymousCompletedCount(): Promise<number> {
    try {
      const sessionId = getAnonymousSessionId(); // This is actually a device ID that persists
      const { count, error } = await supabase
        .from('anonymous_generations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId) // Filter by device ID
        .eq('status', 'completed');

      if (error) {
        console.error('Error counting anonymous generations:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getAnonymousCompletedCount:', error);
      return 0;
    }
  }

  /**
   * Check if anonymous user has reached the free generation limit (2)
   */
  static async hasReachedAnonymousFreeLimit(): Promise<boolean> {
    const count = await this.getAnonymousCompletedCount();
    return count >= 2;
  }

  /**
   * Get remaining free generations for anonymous users (max 2)
   */
  static async getRemainingAnonymousFreeGenerations(): Promise<number> {
    const count = await this.getAnonymousCompletedCount();
    return Math.max(0, 2 - count);
  }
}

