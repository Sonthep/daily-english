/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createCaptionsApiResult } from './api/youtube/captionsService';

function youtubeCaptionsApi() {
  return {
    name: 'youtube-captions-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/youtube/captions', (req, res, next) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.end(JSON.stringify({ error: { message: 'Method not allowed' } }));
          return;
        }

        const videoId = new URL(req.url || '/', 'http://localhost').searchParams.get('videoId') || '';
        void createCaptionsApiResult(videoId).then((result) => {
          res.statusCode = result.status;
          res.setHeader('Cache-Control', 'private, no-store');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result.body));
        }).catch(next);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), youtubeCaptionsApi()],
  build: {
    // The service worker reads this file to precache every generated route chunk.
    manifest: 'asset-manifest.json',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
});
