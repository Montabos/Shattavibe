// Suno API Client

import { SUNO_CONFIG } from '@/config/suno';
import type {
  SunoApiResponse,
  SunoGenerateResponse,
  SunoSimpleModeRequest,
} from '@/types/suno';

class SunoApiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<SunoApiResponse<T>> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok || data.code !== 200) {
      throw new Error(data.msg || 'API request failed');
    }

    return data;
  }

  /**
   * Generate music (Simple Mode)
   */
  async generateMusic(params: {
    prompt: string;
    instrumental?: boolean;
    model?: SunoSimpleModeRequest['model'];
    negativeTags?: string;
    callBackUrl: string;
  }): Promise<string> {
    const request: SunoSimpleModeRequest = {
      customMode: false,
      instrumental: params.instrumental ?? SUNO_CONFIG.defaults.instrumental,
      model: params.model ?? SUNO_CONFIG.defaults.model,
      prompt: params.prompt,
      callBackUrl: params.callBackUrl,
      ...(params.negativeTags && { negativeTags: params.negativeTags }),
    };

    const response = await this.request<SunoGenerateResponse>('/api/v1/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.data.taskId;
  }

  /**
   * Get callback URL for music generation
   * Uses Supabase Edge Function if configured, otherwise returns a placeholder
   */
  getCallbackUrl(): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (supabaseUrl) {
      // Use Supabase Edge Function
      return `${supabaseUrl}/functions/v1/suno-callback`;
    }
    
    // Fallback - user needs to configure this
    return 'https://webhook.site/unique-id-here';
  }
}

// Export singleton instance
export const sunoApi = new SunoApiClient(
  SUNO_CONFIG.apiUrl,
  SUNO_CONFIG.apiKey
);

// Export class for testing
export { SunoApiClient };

