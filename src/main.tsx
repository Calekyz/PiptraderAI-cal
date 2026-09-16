import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party cross-origin iframe contentWindow and postMessage errors in sandboxes
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      typeof msg === 'string' &&
      (msg.includes('contentWindow is not available') ||
       msg.includes('Cannot listen to the event from the provided iframe') ||
       msg.includes('postMessage') ||
       msg.includes('cross-origin'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || String(event?.reason || '');
    if (
      reason.includes('contentWindow is not available') ||
      reason.includes('Cannot listen to the event from the provided iframe')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
