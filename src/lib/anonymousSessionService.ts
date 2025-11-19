// Anonymous Session Service - Manages unique device IDs for anonymous users
// This ID persists across browser sessions, page refreshes, and even after days/weeks
// It's stored in localStorage, so it's tied to the browser/device, not the session

const SESSION_ID_KEY = 'shattavibe_anonymous_session_id';

/**
 * Get or create a unique device ID for anonymous users
 * This ID persists permanently in localStorage:
 * - Survives page refreshes
 * - Survives browser restarts
 * - Survives days/weeks of inactivity
 * - Unique per browser/device
 * 
 * This ensures that:
 * - Users see their own generations even after returning days later
 * - Free generation credits (2 max) are tracked per device
 * - Each device has its own isolated library
 */
export function getAnonymousSessionId(): string {
  // Try to get existing device ID from localStorage
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  
  // If no device ID exists, generate a new one (first time on this device)
  if (!sessionId) {
    // Generate a UUID v4 that will persist forever for this device
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Clear the anonymous device ID (useful for testing)
 * Note: This will reset the user's anonymous session and they'll lose access to their previous generations
 */
export function clearAnonymousSessionId(): void {
  localStorage.removeItem(SESSION_ID_KEY);
}

