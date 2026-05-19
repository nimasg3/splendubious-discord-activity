/**
 * App Component
 *
 * Root application component with screen routing.
 */

import { useEffect } from 'react';
import { useGame } from './context';
import { MenuScreen, LobbyScreen, GameScreen, LoadingScreen } from './components';
import { playSound, startBackgroundMusic } from './sound/manager.js';

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

  // Render appropriate screen based on app state
  switch (state.screen) {
    case 'loading':
      return <LoadingScreen message="Connecting to Discord..." error={state.error} />;
    case 'menu':
      return <MenuScreen />;
    case 'lobby':
      return <LobbyScreen />;
    case 'game':
      return <GameScreen />;
    default:
      return <LoadingScreen message="Connecting to Discord..." error={state.error} />;
  }
}
