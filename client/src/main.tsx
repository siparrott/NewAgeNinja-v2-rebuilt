import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Add event listeners for debugging
window.addEventListener('load', () => {
  console.log('React app loaded');
  
  // Force enable interactions
  document.body.style.pointerEvents = 'auto';
  document.body.style.userSelect = 'auto';
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
  
  // Add click listener for debugging
  document.addEventListener('click', (e) => {
    console.log('Click detected in React app:', e.target);
  });
  
  document.addEventListener('scroll', (e) => {
    console.log('Scroll detected in React app:', window.scrollY);
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
