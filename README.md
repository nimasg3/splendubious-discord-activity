# Splendubious

A Discord Activity implementation of the classic board game Splendor. Play with 2-4 players directly within Discord!

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/nimasg3/splendubious-discord-activity.git
cd splendubious-discord-activity
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for all packages (rules-engine, backend, and frontend).

### 3. Start the development servers

Run both backend and frontend simultaneously:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend (runs on http://localhost:3001)
npm run dev:backend

# Terminal 2 - Frontend (runs on http://localhost:5173)
npm run dev:frontend
```

### 4. Open the app

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Project Structure

```
splendubious-discord-activity/
├── packages/
│   ├── rules-engine/    # Game logic and validation
│   ├── backend/         # Express + Socket.IO server
│   └── frontend/        # React + Vite client
├── package.json         # Root workspace configuration
└── RULES.md            # Game rules documentation
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the frontend dev server |
| `npm run dev:backend` | Start only the backend dev server |
| `npm run build` | Build all packages for production |
| `npm run test` | Run tests across all packages |

## 🧪 Running Tests

```bash
# Run all tests
npm run test

# Run tests for a specific package
npm run test --workspace=@splendubious/rules-engine
npm run test --workspace=@splendubious/backend
```

## 🎮 Game Rules

See [RULES.md](./RULES.md) for complete game rules and mechanics.

## 🏗️ Building for Production

```bash
npm run build
```

This builds:
- `rules-engine` → TypeScript compiled to `dist/`
- `backend` → TypeScript compiled to `dist/`
- `frontend` → Vite build to `dist/`

## 🌐 Deployment

The application is deployed on AWS:
- **Frontend**: S3 + CloudFront (CDN)
- **Backend**: App Runner (containerized)

Pushing to `main` triggers automatic deployment via GitHub Actions.

## 📝 Environment Variables

### Frontend (`.env` in `packages/frontend/`)

```env
VITE_SOCKET_URL=http://localhost:3001
VITE_DISCORD_CLIENT_ID=your_discord_client_id
```

### Backend (`.env` in `packages/backend/`)

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## 📄 License

This project is for educational purposes. Splendor is a trademark of Space Cowboys / Asmodee.
