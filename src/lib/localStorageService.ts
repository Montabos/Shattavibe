// Local Storage Service for Anonymous Users

import type { SunoMusicTrack, LanguageCode, VocalGender } from '@/types/suno';

export interface LocalGeneration {
  id: string;
  taskId: string;
  prompt: string;
  model: string;
  instrumental: boolean;
  language?: LanguageCode;
  vocalGender?: VocalGender;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tracks?: SunoMusicTrack[];
  error?: string;
  createdAt: string;
}

const STORAGE_KEY = 'shattavibe_generations';
const MAX_FREE_GENERATIONS = 2;

export class LocalStorageService {
  /**
   * Get all local generations
   */
  static getGenerations(): LocalGeneration[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading local storage:', error);
      return [];
    }
  }

  /**
   * Save a generation
   */
  static saveGeneration(generation: LocalGeneration): void {
    try {
      const generations = this.getGenerations();
      const existingIndex = generations.findIndex(g => g.taskId === generation.taskId);
      
      if (existingIndex >= 0) {
        generations[existingIndex] = generation;
      } else {
        generations.push(generation);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generations));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  /**
   * Update generation status
   */
  static updateGeneration(taskId: string, updates: Partial<LocalGeneration>): void {
    try {
      const generations = this.getGenerations();
      const index = generations.findIndex(g => g.taskId === taskId);
      
      if (index >= 0) {
        generations[index] = { ...generations[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(generations));
      }
    } catch (error) {
      console.error('Error updating local storage:', error);
    }
  }

  /**
   * Get generation by task ID
   */
  static getGenerationByTaskId(taskId: string): LocalGeneration | null {
    const generations = this.getGenerations();
    return generations.find(g => g.taskId === taskId) || null;
  }

  /**
   * Get completed generations count
   */
  static getCompletedCount(): number {
    const generations = this.getGenerations();
    return generations.filter(g => g.status === 'completed').length;
  }

  /**
   * Check if user has reached free limit
   */
  static hasReachedFreeLimit(): boolean {
    return this.getCompletedCount() >= MAX_FREE_GENERATIONS;
  }

  /**
   * Get remaining free generations
   */
  static getRemainingFreeGenerations(): number {
    const count = this.getCompletedCount();
    return Math.max(0, MAX_FREE_GENERATIONS - count);
  }

  /**
   * Clear all generations (for authenticated users migrating to Supabase)
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }

  /**
   * Get latest generation
   */
  static getLatestGeneration(): LocalGeneration | null {
    const generations = this.getGenerations();
    if (generations.length === 0) return null;
    return generations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  /**
   * Get tracks for a specific task ID
   */
  static getTracks(taskId: string): SunoMusicTrack[] | null {
    const generation = this.getGenerationByTaskId(taskId);
    return generation?.tracks || null;
  }

  /**
   * Save tracks for a specific task ID
   */
  static saveTracks(taskId: string, tracks: SunoMusicTrack[]): void {
    this.updateGeneration(taskId, { 
      tracks, 
      status: 'completed' 
    });
  }
}

