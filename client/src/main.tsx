import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// COMPLETE CONSOLE SILENCE - Override all console methods
console.log = () => {};
console.warn = () => {};
console.error = () => {};
console.info = () => {};
console.debug = () => {};
console.trace = () => {};
console.table = () => {};
console.group = () => {};
console.groupEnd = () => {};
console.time = () => {};
console.timeEnd = () => {};

// Force enable interactions on load
window.addEventListener('load', () => {
  document.body.style.pointerEvents = 'auto';
  document.body.style.userSelect = 'auto';
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
