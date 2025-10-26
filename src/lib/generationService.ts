// Generation Service - Manages music generation with Supabase

import { supabase } from './supabase';
import { LocalStorageService } from './localStorageService';
import type { SunoMusicTrack, LanguageCode, VocalGender } from '@/types/suno';
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
   * Create a new generation record (Supabase AND localStorage for anonymous users)
   */
  static async createGeneration(data: {
    taskId: string;
    prompt: string;
    model: string;
    instrumental: boolean;
    language?: LanguageCode;
    vocalGender?: VocalGender;
    negativeTags?: string;
  }): Promise<Generation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // For anonymous users, save to anonymous_generations table + localStorage
    if (!user) {
      LocalStorageService.saveGeneration({
        id: crypto.randomUUID(),
        taskId: data.taskId,
        prompt: data.prompt,
        model: data.model,
        instrumental: data.instrumental,
        language: data.language,
        vocalGender: data.vocalGender,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Save to anonymous_generations table (public access for callbacks)
      const { error } = await supabase
        .from('anonymous_generations')
        .insert({
          task_id: data.taskId,
          prompt: data.prompt,
          model: data.model,
          instrumental: data.instrumental,
          language: data.language || null,
          vocal_gender: data.vocalGender || null,
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
      language: data.language || null,
      vocal_gender: data.vocalGender || null,
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
   * Update generation status (Supabase or localStorage)
   */
  static async updateGenerationStatus(
    taskId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const isAuth = await this.isAuthenticated();

    // Update localStorage
    LocalStorageService.updateGeneration(taskId, {
      status,
      ...(errorMessage && { error: errorMessage }),
    });

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
   * Save generated tracks (Supabase or localStorage)
   */
  static async saveTracks(
    taskId: string,
    tracks: SunoMusicTrack[]
  ): Promise<Track[] | null> {
    const isAuth = await this.isAuthenticated();

    // If not authenticated, use localStorage
    if (!isAuth) {
      LocalStorageService.updateGeneration(taskId, {
        tracks,
        status: 'completed',
      });
      return null;
    }

    // Get generation ID
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
}

