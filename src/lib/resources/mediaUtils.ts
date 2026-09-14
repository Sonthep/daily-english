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
