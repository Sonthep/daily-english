import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { registerServiceWorker } from './lib/pwa/registerSW';

try {
  localStorage.removeItem('daily_english_openrouter_key');
} catch {
  // Storage may be unavailable in restricted browser contexts.
}

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
