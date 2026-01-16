/**
 * Main Entry Point
 *
 * Initializes React app with GameProvider and AnimationProvider.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { GameProvider, AnimationProvider } from './context/index.js';
import { FlyingGems } from './components/game/index.js';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <GameProvider>
      <AnimationProvider>
        <App />
        <FlyingGems />
      </AnimationProvider>
    </GameProvider>
  </StrictMode>
);
