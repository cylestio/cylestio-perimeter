# Live Trace Frontend

React + Vite frontend for the Live Trace dashboard.

## Quick Start

```bash
# Install dependencies (first time only)
cd src/interceptors/live_trace/frontend
npm install

# Development mode with hot reload
npm run dev
# Visit http://localhost:5173
```

Your Python backend must be running on port 8080 for API calls to work.

## Build Commands

- `npm run dev` - Start dev server with hot reload (port 5173)
- `npm run build` - Build for production → `../static/dist/`
- `npm run preview` - Preview production build

## Production Build

```bash
npm run build
```

Then start your Python app - it will serve the built React app from port 8080.

## Tech Stack

- React 18
- Vite (build tool)
- React Router (routing)
- Cylestio color palette (`#6366f1` primary, `#4f46e5` accent)

## Components

- `Dashboard.jsx` - Main dashboard
- `SessionPage.jsx` - Session details (3-column layout)
- `AgentPage.jsx` - Agent details
- `Timeline.jsx` - Event timeline

## API Endpoints

The React app calls:
- `GET /api/dashboard`
- `GET /api/session/{id}`
- `GET /api/agent/{id}`

Vite dev server proxies these to `http://localhost:8080`.
