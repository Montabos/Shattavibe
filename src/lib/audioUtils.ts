import { SunoMusicTrack } from '../types/suno';

/**
 * Gets the best audio URL for playback.
 *
 * IMPORTANT:
 * - Some browsers fail to play `stream_audio_url` directly (container/codec/headers issues),
 *   even though the URL works in a separate tab.
 * - `audio_url` is the finalized MP3 and is the most reliable for the HTMLAudioElement.
 *
 * Strategy:
 * - Prefer `audio_url` (usually ends with .mp3) for stable playback.
 * - Fallback to `stream_audio_url` only if `audio_url` is not available.
 */
export function getPlaybackUrl(track: SunoMusicTrack): string {
  // Prefer full audio URL (most reliable for <audio>)
  if (track.audio_url) {
    return track.audio_url;
  }

  // Fallback to stream URL if no audio_url is available
  if (track.stream_audio_url) {
    return track.stream_audio_url;
  }

  return '';
}

/**
 * Gets the download URL for a track
 * Always uses audio_url for the full quality downloadable file
 */
export function getDownloadUrl(track: SunoMusicTrack): string {
  return track.audio_url || track.stream_audio_url || '';
}

/**
 * Downloads an audio track as a file
 * Fetches the audio as a blob to ensure proper download instead of opening in new tab
 */
export async function downloadAudioTrack(track: SunoMusicTrack): Promise<void> {
  const url = getDownloadUrl(track);
  if (!url) {
    throw new Error('No download URL available for this track');
  }

  try {
    // Fetch the audio file as a blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${track.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
    link.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw error;
  }
}

/**
 * Copies the track URL to clipboard
 */
export async function copyTrackUrl(track: SunoMusicTrack): Promise<boolean> {
  const url = getDownloadUrl(track);
  if (!url) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Error copying URL:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
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

