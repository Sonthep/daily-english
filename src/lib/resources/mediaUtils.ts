import { ResourceType } from '../../types';

/**
 * Extracts a YouTube Video ID from various standard YouTube URL formats:
 * - https://www.youtube.com/watch?v=Ii4EeIIJrIY
 * - https://youtu.be/Ii4EeIIJrIY
 * - https://www.youtube.com/embed/Ii4EeIIJrIY
 * - https://www.youtube.com/shorts/Ii4EeIIJrIY
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Handle youtu.be shortlinks
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Handle watch?v= parameter
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Handle embed or shorts paths
  const pathMatch = trimmed.match(/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];

  return null;
}

/**
 * Builds a privacy-friendly YouTube embed URL.
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

export function timestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.trim().split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

export function secondsToTimestamp(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(remainder).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Returns human-readable Thai label for resource types.
 */
export function getResourceTypeLabel(type: ResourceType): string {
  switch (type) {
    case 'youtube':
      return 'วิดีโอ YouTube';
    case 'podcast':
      return 'พอดแคสต์ (Podcast)';
    case 'song':
      return 'เพลง (Song / Lyrics)';
    case 'movie':
      return 'ซีนหนัง / ซีรีส์ (Movie)';
    case 'article':
      return 'บทความ / สุนทรพจน์ (Article)';
    default:
      return type;
  }
}
