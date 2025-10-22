import { SunoMusicTrack } from '../types/suno';

/**
 * Gets the best audio URL for playback
 * Prioritizes stream_audio_url (available in 30-40s) over audio_url (available in 2-3 min)
 * Falls back to audio_url if stream is not available
 */
export function getPlaybackUrl(track: SunoMusicTrack): string {
  // Prefer stream URL for faster playback
  if (track.stream_audio_url) {
    return track.stream_audio_url;
  }
  
  // Fallback to regular audio URL
  return track.audio_url || '';
}

/**
 * Gets the download URL for a track
 * Always uses audio_url for the full quality downloadable file
 */
export function getDownloadUrl(track: SunoMusicTrack): string {
  return track.audio_url || track.stream_audio_url || '';
}

/**
 * Checks if a track is ready for playback (has stream or audio URL)
 */
export function isTrackPlayable(track: SunoMusicTrack): boolean {
  return !!(track.stream_audio_url || track.audio_url);
}

/**
 * Checks if a track is ready for download (has audio URL)
 */
export function isTrackDownloadable(track: SunoMusicTrack): boolean {
  return !!track.audio_url;
}

