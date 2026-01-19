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
import { ScalingWrapper } from './components/ScalingWrapper.js';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <GameProvider>
      <AnimationProvider>
        <ScalingWrapper baseWidth={1920} baseHeight={1080}>
          <App />
        </ScalingWrapper>
        <FlyingGems />
      </AnimationProvider>
    </GameProvider>
  </StrictMode>
);
