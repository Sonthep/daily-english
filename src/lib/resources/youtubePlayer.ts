export interface YouTubePlayerInstance {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  playVideo(): void;
  destroy(): void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayerInstance;
}

interface YouTubePlayerOptions {
  events: {
    onReady: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeIframeApi {
  Player: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeIframeApi> | null = null;

export function loadYouTubeIframeApi(): Promise<YouTubeIframeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube Player API is unavailable'));
    };

    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.addEventListener('error', () => reject(new Error('Unable to load YouTube Player API')), { once: true });
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}