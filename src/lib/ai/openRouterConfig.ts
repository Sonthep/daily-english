const OPENROUTER_REMOTE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function getOpenRouterApiUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/openrouter/chat/completions';
  }
  return OPENROUTER_REMOTE_URL;
}
