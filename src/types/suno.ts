// Suno API Types

export type SunoModel = 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
export type VocalGender = 'm' | 'f';
export type CallbackType = 'text' | 'first' | 'complete' | 'error';
export type LanguageCode = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'ja' | 'zh' | 'ko' | 'ar' | 'hi' | 'ru';

// Request Types
export interface SunoGenerateRequest {
  // Required fields
  customMode: boolean;
  instrumental: boolean;
  model: SunoModel;
  callBackUrl: string;

  // Conditional fields
  prompt?: string;
  style?: string;
  title?: string;

  // Optional fields
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number; // 0.00 - 1.00
  weirdnessConstraint?: number; // 0.00 - 1.00
  audioWeight?: number; // 0.00 - 1.00
}

// Simple mode request (what we'll use)
export interface SunoSimpleModeRequest {
  customMode: false;
  instrumental: boolean;
  model: SunoModel;
  prompt: string;
  callBackUrl: string;
  negativeTags?: string;
  vocalGender?: VocalGender;
}

// Custom mode request
export interface SunoCustomModeRequest {
  customMode: true;
  instrumental: boolean;
  model: SunoModel;
  style: string;
  title: string;
  prompt?: string; // Required if instrumental is false
  callBackUrl: string;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

// Response Types
export interface SunoApiResponse<T = unknown> {
  code: 200 | 400 | 401 | 404 | 405 | 413 | 429 | 430 | 455 | 500;
  msg: string;
  data: T;
}

export interface SunoGenerateResponse {
  taskId: string;
}

// Music Result
export interface SunoMusicTrack {
  id: string;
  audio_url: string;
  source_audio_url: string;
  stream_audio_url: string;
  source_stream_audio_url: string;
  image_url: string;
  source_image_url: string;
  prompt: string;
  model_name: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number; // in seconds
}

// Callback payload
export interface SunoCallbackPayload {
  code: 200 | 400 | 451 | 500;
  msg: string;
  data: {
    callbackType: CallbackType;
    task_id: string;
    data: SunoMusicTrack[] | null;
  };
}

// Task Status (for polling)
export interface SunoTaskStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tracks?: SunoMusicTrack[];
  error?: string;
}

// Error codes mapping
export const SUNO_ERROR_CODES = {
  200: 'Request successful',
  400: 'Invalid parameters',
  401: 'Unauthorized access',
  404: 'Invalid request method or path',
  405: 'Rate limit exceeded',
  413: 'Theme or prompt too long',
  429: 'Insufficient credits',
  430: 'Call frequency too high',
  455: 'System maintenance',
  500: 'Server error',
} as const;

// Model descriptions
export const SUNO_MODELS = {
  V5: {
    name: 'V5',
    description: 'Superior musical expression, faster generation',
    maxDuration: null,
    maxPromptLength: 5000,
  },
  V4_5PLUS: {
    name: 'V4.5+',
    description: 'Richer sound, new ways to create',
    maxDuration: 480, // 8 minutes
    maxPromptLength: 5000,
  },
  V4_5: {
    name: 'V4.5',
    description: 'Superior genre blending, faster output',
    maxDuration: 480, // 8 minutes
    maxPromptLength: 5000,
  },
  V4: {
    name: 'V4',
    description: 'Best audio quality, refined structure',
    maxDuration: 240, // 4 minutes
    maxPromptLength: 3000,
  },
  V3_5: {
    name: 'V3.5',
    description: 'Solid arrangements, creative diversity',
    maxDuration: 240, // 4 minutes
    maxPromptLength: 3000,
  },
} as const;

