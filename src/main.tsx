// Safely define writable property for window.fetch to prevent polyfill TypeError crashes inside iframe environments
try {
  let customFetch = window.fetch;
  
  function tryDefine(obj: any, prop: string) {
    try {
      Object.defineProperty(obj, prop, {
        configurable: true,
        enumerable: true,
        get() { return customFetch; },
        set(val) { customFetch = val; }
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  // In standard browser environments, fetch is inherited from Window.prototype.
  // Defining a setter on Window.prototype intercepts any assignments (like window.fetch = ...) gracefully.
  tryDefine(Window.prototype, 'fetch');
  tryDefine(window, 'fetch');
  tryDefine(globalThis, 'fetch');
  if (typeof self !== 'undefined') {
    tryDefine(self, 'fetch');
  }
} catch (e) {
  // ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
