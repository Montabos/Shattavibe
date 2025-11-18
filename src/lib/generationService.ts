// Generation Service - Manages music generation with Supabase

import { supabase } from './supabase';
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
   */
  static async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
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
      const { error } = await supabase
        .from('anonymous_generations')
        .insert({
          task_id: data.taskId,
          prompt: data.prompt,
          model: data.model,
          instrumental: data.instrumental,
          status: 'pending',
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
      const { error } = await supabase
        .from('anonymous_generations')
        .update({
          status,
          ...(errorMessage && { error_message: errorMessage }),
        })
        .eq('task_id', taskId);

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
      // Update anonymous_generation status to completed
      const { error: updateError } = await supabase
        .from('anonymous_generations')
        .update({ status: 'completed' })
        .eq('task_id', taskId);

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
      // Get all anonymous generations
      const { data: generations, error: genError } = await supabase
        .from('anonymous_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (genError) {
        console.error('Error fetching anonymous generations:', genError);
        return [];
      }

      if (!generations || generations.length === 0) {
        return [];
      }

      // Get all tracks for these generations
      const taskIds = generations.map(g => g.task_id);
      const { data: tracks, error: tracksError } = await supabase
        .from('anonymous_tracks')
        .select('*')
        .in('task_id', taskIds)
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
   */
  static async getAnonymousTracks(taskId: string): Promise<SunoMusicTrack[]> {
    try {
      const { data: tracks, error } = await supabase
        .from('anonymous_tracks')
        .select('*')
        .eq('task_id', taskId)
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
}

