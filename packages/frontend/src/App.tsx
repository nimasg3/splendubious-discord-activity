/**
 * App Component
 *
 * Root application component with screen routing.
 * 
 * TEMPORARY: Bypassing Discord SDK for local development
 */

import { useEffect } from 'react';
import { useGame } from './context';
import { MenuScreen, LobbyScreen, GameScreen } from './components';
import { playSound, startBackgroundMusic } from './sound/manager.js';

// Temporary landing page for local development
function LandingPage(): JSX.Element {
  const { setScreen } = useGame();

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1>💎 test</h1>
        <p className="subtitle">A Discord Activity based on Splendor</p>
        
        <div className="landing-info">
          <p>✅ Frontend is running!</p>
          <p>📍 Local development mode (Discord SDK bypassed)</p>
        </div>

        <div className="landing-actions">
          <button className="btn" onClick={() => setScreen('menu')}>
            Go to Menu
          </button>
        </div>

        <div className="landing-status">
          <h3>Project Status</h3>
          <ul>
            <li>✅ React frontend running</li>
            <li>⏳ Backend: Start with <code>npm run dev:backend</code></li>
            <li>⏳ Game logic: TODO</li>
            <li>⏳ Discord SDK: Bypassed for local dev</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function App(): JSX.Element {
  const { state } = useGame();

  // Start background music on the first user interaction (satisfies browser autoplay policy)
  useEffect(() => {
    const handleFirstInteraction = () => {
      startBackgroundMusic();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Global click sound — fires for buttons and interactive card/token elements
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(
        'button, [role="button"], .development-card, .gem-token, .noble-tile'
      );
      if (interactive) {
        playSound('select-click');
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // TEMPORARY: Show landing page instead of loading screen for local dev
  if (state.screen === 'loading') {
    return <LandingPage />;
  }

  // Render appropriate screen based on app state
  switch (state.screen) {
    case 'menu':
      return <MenuScreen />;
    case 'lobby':
      return <LobbyScreen />;
    case 'game':
      return <GameScreen />;
    default:
      return <LandingPage />;
  }
}
