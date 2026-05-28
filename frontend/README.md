# Frontend - VedaAI Assessment Creator

This is the frontend UI for the VedaAI assessment tool.

## Running locally

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Project notes

- The frontend uses the `pages` directory for routing.
- API calls are proxied to `http://localhost:5002/api/*` via `frontend/next.config.js`.
- WebSocket events are sent to `ws://localhost:5002` from `frontend/hooks/UseWebSocket.ts`.

## Repository setup

For full backend setup, environment variables, and port configuration, see the root `README.md`.
