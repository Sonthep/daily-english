type RequestWithBody = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
  end: () => void;
};

export default async function handler(req: RequestWithBody, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const authorizationHeader = req.headers.authorization;
  const authorization = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    res.status(401).json({ error: { message: 'Missing OpenRouter authorization' } });
    return;
  }

  const requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  if (new TextEncoder().encode(requestBody).byteLength > 1_000_000) {
    res.status(413).json({ error: { message: 'Request body is too large' } });
    return;
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        'X-Free-Fallback': 'false',
        'X-Title': 'Daily English',
      },
      body: requestBody,
    });

    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.status(upstream.status).json(await upstream.json());
  } catch {
    res.status(502).json({ error: { message: 'Unable to reach OpenRouter' } });
  }
}
