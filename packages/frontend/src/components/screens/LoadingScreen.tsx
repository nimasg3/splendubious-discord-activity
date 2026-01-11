/**
 * Loading Screen Component
 *
 * Displayed while Discord SDK and socket are initializing.
 */

interface LoadingScreenProps {
  message?: string;
  error?: string | null;
}

export function LoadingScreen({ 
  message = 'Connecting to game server...', 
  error = null 
}: LoadingScreenProps): JSX.Element {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Game title */}
        <h1 className="game-title">Splendubious</h1>
        
        {error ? (
          <div className="loading-error">
            <span className="error-icon">⚠️</span>
            <p className="error-message">{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="loading-indicator">
            {/* Simple loading spinner */}
            <div className="spinner">
              <div className="spinner-gem gem-emerald" />
              <div className="spinner-gem gem-ruby" />
              <div className="spinner-gem gem-sapphire" />
              <div className="spinner-gem gem-diamond" />
              <div className="spinner-gem gem-onyx" />
            </div>
            <p className="loading-message">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
