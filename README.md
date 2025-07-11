# ✏️ Realtime Whiteboard

> Lightweight (yet snappy) collaborative whiteboard written in **React + Konva** on the front end and **FastAPI + Redis + Websockets** on the back end. Draw, erase, undo/redo—together—in ~<100 ms round-trip.

<p float="left">
  <img src="docs/demo-drawing.gif" width="46%" alt="live drawing demo">
  <img src="docs/demo-multiuser.gif" width="46%" alt="multi-user demo">
</p>

---

## Features

|  |  |
|---|---|
| 🖊️ Smooth strokes | Catmull-Rom spline smoothing @ 60 FPS |
| 🔴 Live multi-user view | WebSocket ⇄ Redis Pub/Sub fan-out (no sticky sessions) |
| ↩️ Undo / Redo | Stroke-level history, per user |
| 🧹 Eraser & hit-testing | Spatial R-tree keeps O(1) responsiveness |
| 🗄️ Auto-snapshot & replay | Redis Streams ➜ Postgres JSONB snapshot every 300 events |
| 🚢 One-command deploy | Docker Compose locally; Render.com starter blueprint |

---

## Tech Stack

| Layer | Choices | Notes |
|-------|---------|-------|
| **Front end** | React 18 · Vite · TypeScript · TailwindCSS | Hot-reload <50 ms |
| **Canvas** | Konva + react-konva | `<Line>` per stroke |
| **State** | Zustand | Tiny, hooks-friendly |
| **Back end** | FastAPI · Uvicorn | Async WebSocket endpoint |
| **Data / RTC** | Redis 7 (Pub/Sub + Streams) | Fan-out + event log |
| **Storage** | Postgres 15 | Snapshot per board |
| **Dev Ops** | Docker Compose · Render (Singapore region) | `docker compose up --build` |

Architecture sketch:
To be added
---

## Getting Started (local)

```bash
git clone https://github.com/<you>/whiteboard.git
cd whiteboard

# build + run API & Redis
docker compose up --build

# in a new terminal – run the React dev server
cd apps/frontend
pnpm install
pnpm dev
Open http://localhost:5173 in two tabs—draw in one, see it appear in the other.

Roadmap
 Selection box + move/scale strokes

 PDF / SVG export

 CRDT merge for true offline-first edits

 PWA install & mobile layout

 Deploy Helm chart for Kubernetes

License
MIT © 2025 Joshua Chua