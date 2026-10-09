import { createCaptionsApiResult } from './captionsService';

interface CaptionsRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
}

interface CaptionsResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => CaptionsResponse;
  json: (body: unknown) => void;
}

export default async function handler(req: CaptionsRequest, res: CaptionsResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const queryValue = req.query?.videoId;
  const videoId = Array.isArray(queryValue)
    ? queryValue[0] || ''
    : queryValue || new URL(req.url || '/', 'http://localhost').searchParams.get('videoId') || '';
  const result = await createCaptionsApiResult(videoId);
  res.status(result.status).json(result.body);
}