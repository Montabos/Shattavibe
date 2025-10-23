// Session Storage Service - Track all music generations in current session
import type { SunoMusicTrack } from '@/types/suno';

export interface SessionGeneration {
  id: string;
  taskId: string;
  prompt: string;
  tracks: SunoMusicTrack[];
  createdAt: string;
}

const SESSION_KEY = 'shattavibe_session_generations';
const LANGUAGE_KEY = 'shattavibe_preferred_language';

export class SessionStorageService {
  /**
   * Get all generations from current session
   */
  static getSessionGenerations(): SessionGeneration[] {
    try {
      const data = sessionStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading session storage:', error);
      return [];
    }
  }

  /**
   * Add a new generation to the session
   */
  static addGeneration(generation: SessionGeneration): void {
    try {
      const generations = this.getSessionGenerations();
      
      // Check if generation already exists
      const existingIndex = generations.findIndex(g => g.taskId === generation.taskId);
      
      if (existingIndex >= 0) {
        // Update existing
        generations[existingIndex] = generation;
      } else {
        // Add new at the beginning (most recent first)
        generations.unshift(generation);
      }
      
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(generations));
    } catch (error) {
      console.error('Error saving to session storage:', error);
    }
  }

  /**
   * Get a specific generation by task ID
   */
  static getGenerationByTaskId(taskId: string): SessionGeneration | null {
    const generations = this.getSessionGenerations();
    return generations.find(g => g.taskId === taskId) || null;
  }

  /**
   * Clear all session generations
   */
  static clearSession(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session storage:', error);
    }
  }

  /**
   * Get total number of generations in session
   */
  static getSessionCount(): number {
    return this.getSessionGenerations().length;
  }

  /**
   * Get the most recent generation
   */
  static getLatestGeneration(): SessionGeneration | null {
    const generations = this.getSessionGenerations();
    return generations.length > 0 ? generations[0] : null;
  }

  /**
   * Save preferred language for the session
   */
  static setPreferredLanguage(languageCode: string): void {
    try {
      sessionStorage.setItem(LANGUAGE_KEY, languageCode);
    } catch (error) {
      console.error('Error saving preferred language:', error);
    }
  }

  /**
   * Get preferred language from session
   */
  static getPreferredLanguage(): string | null {
    try {
      return sessionStorage.getItem(LANGUAGE_KEY);
    } catch (error) {
      console.error('Error reading preferred language:', error);
      return null;
    }
  }
}

