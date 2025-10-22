// Suno API Configuration

export const SUNO_CONFIG = {
  apiUrl: 'https://api.sunoapi.org',
  apiKey: import.meta.env.VITE_SUNO_API_KEY || '',
  
  // Polling configuration
  pollingInterval: 30000, // 30 seconds (recommended)
  maxPollingAttempts: 40, // 20 minutes max (40 * 30s)
  
  // Default generation settings
  defaults: {
    model: 'V5' as const, // Superior musical expression, faster generation
    instrumental: false,
    customMode: false,
  },
  
  // Validation limits
  limits: {
    simpleModePrompt: 500,
    customModePrompt: 5000,
    title: 80,
    style: 1000,
  },
} as const;

// Validate configuration
export function validateSunoConfig() {
  if (!SUNO_CONFIG.apiKey) {
    console.warn('⚠️ VITE_SUNO_API_KEY is not set in environment variables');
    return false;
  }
  return true;
}

