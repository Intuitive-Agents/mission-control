# OpenClaw Mission Control V2 — Build Instructions

## Overview

OpenClaw Mission Control V2 is a single-file AI agent swarm management dashboard. It is a fully self-contained HTML file (~1760 lines) that runs entirely in the browser with no build step, no bundler, and no server required.

**File:** `openclaw-dashboard-v2.html`
**Asset:** `OpenClaw_icon.svg` (must be in the same directory)

---

## Tech Stack

| Technology | Version | Purpose | CDN |
|---|---|---|---|
| **React** | 18 (production UMD) | UI rendering | `unpkg.com/react@18/umd/react.production.min.js` |
| **ReactDOM** | 18 (production UMD) | DOM mounting | `unpkg.com/react-dom@18/umd/react-dom.production.min.js` |
| **Babel Standalone** | latest | In-browser JSX compilation | `unpkg.com/@babel/standalone/babel.min.js` |
| **Tailwind CSS** | v3 (CDN) | Utility-first styling | `cdn.tailwindcss.com` |
| **Lucide Icons** | latest | Icon library (loaded but using HTML entities) | `unpkg.com/lucide@latest` |

All dependencies are loaded via CDN `<script>` tags. **No npm install required.**

---

## Architecture

### Single-File Pattern
Everything lives in one HTML file:
- `<head>`: CDN scripts, Tailwind config, CSS animations/keyframes
- `<body>`: Single `<div id="root">` mount point
- `<script type="text/babel">`: All React components, data, and state

### Rendering
- `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`
- Babel Standalone transpiles JSX in-browser at runtime
- All component code is inside a single `<script type="text/babel">` block

---

## File Structure

```
openclaw-dashboard-v2.html   # The entire dashboard (single file)
OpenClaw_icon.svg             # Logo icon (must be co-located)
```

---

## Data Architecture

All data is defined as top-level `const` declarations inside the script block. In a production version, these would be replaced with API calls.

### Core Data Objects

1. **`COLORS`** — Agent color palette (border, bg, text, dot hex values per agent ID)
   - Keys: `iva`, `ivan`, `arvis_sales`, `arvis_recruit`, `arvis_admin`, `arvis_prod`, `tia`, `joy`
   - Each value: `{ border: '#hex', bg: 'rgba(...)', text: '#hex', dot: '#hex' }`

2. **`agents`** — Array of 8 agent objects with full metadata
   - Fields: `id`, `name`, `role`, `model`, `modelColor`, `status` (online/sleeping/offline), `heart`, `host`, `channels`, `sessions`, `contextUsed`, `contextMax`, `load`, `assignedTo`

3. **`clientGroups`** — Array of 3 client group definitions
   - Intuitive Labs (Iva + IVAN) — color: `#8b5cf6`
   - Arrow Roofing Services (ARVIS Sales/Recruit/Admin/Prod + TIA) — color: `#D3BA36`
   - Gina / GBC (JOY) — color: `#005AA9`
   - Each group: `{ id, name, subtitle, icon, color, agentIds: [...] }`

4. **`initialBoardColumns`** — Kanban task board data (6 columns: INBOX, ASSIGNED, IN PROGRESS, REVIEW, DONE, BLOCKED)
   - Each column: `{ id, title, color, icon, tasks: [...] }`
   - Each task: `{ id, title, desc, agent, priority, tags: [...] }`

5. **`cronJobs`** — Cron schedule per agent (keyed by agent ID)

6. **`activityFeedData`** — Array of recent activity entries

7. **`executionPhases`** — 4-phase durable execution trace data (PLANNING > EXECUTING > ERROR > SELF-CORRECTING)

8. **`canvasArtifacts`** — 5 document artifacts for the Canvas/Cowork panel (lead-report, cost-analysis, deploy-config, inspection-checklist, workflow-diagram)

9. **`agentResponses`** — Simulated chat responses per agent (keyed by agent ID)

10. **`defaultThreads`** — 5 pre-seeded chat conversation threads

---

## Component Hierarchy

```
App
├── Animated Background (CSS orbs + grid overlay)
├── Header (logo, title, badge, clock, auto-refresh toggle)
├── KPI Row (5 compact inline chips: Sessions, Tokens, Cost, Uptime, Messages)
├── Client Groups Grid (3 columns)
│   └── ClientGroup (wallet-style stacked cards)
│       └── AgentCard (collapsible peek bar + expanded details)
├── Task Board Section
│   └── BoardColumn × 6 (drag-and-drop enabled)
│       └── TaskCard (draggable)
├── Command Center
│   ├── Thread Sidebar (search, pin/unpin, delete, new thread)
│   ├── Chat Panel (message history, typing indicator, agent selector)
│   │   └── Quick Action Buttons (message/check/reset per agent)
│   └── Canvas/Cowork Panel (split-pane artifact viewer with tabs)
├── Durable Execution Trace + Network Topology + Activity Feed (3-column grid)
│   ├── DurableExecutionTrace (animated phase stepper + tool chain + log output)
│   ├── Network Topology (Mac mini + DO Droplet clusters with animated connection)
│   └── Activity Feed (live event stream)
└── Cron Jobs (horizontal scroll, per-agent job cards)
```

---

## Key Features & Implementation Details

### 1. Animated Background
- 3 CSS orbs with `blur(80px)`, `opacity: 0.12`, `orbFloat` animation (20s infinite)
- Grid overlay with `linear-gradient` at `0.02` opacity
- All panels use semi-transparent backgrounds (`/90` opacity) with `backdropFilter: blur`

### 2. Wallet-Style Agent Cards
- Cards stack with negative margins (`marginTop: -20px`) to create overlapping effect
- Click to expand — expanded card gets `zIndex: 50`, surrounding cards use `totalCount - idx`
- Expanded card shows full agent details (host, channels, sessions, heartbeat, load, context window progress bar, assigned user)
- Each card has a colored border, avatar circle, status dot, and model badge

### 3. Drag-and-Drop Kanban Board
- `initialBoardColumns` data is loaded into `useState` inside the App component
- `TaskCard` has `draggable` attribute with `onDragStart` (sets `text/plain` JSON with `taskId` + `sourceColId`)
- Columns have `onDragOver`, `onDragLeave`, `onDrop` handlers
- Drop zone shows dashed border + tinted background when dragging over
- Empty columns show "Drop tasks here" placeholder
- `handleDrop` moves task from source to target column via `setBoardColumns`

### 4. Functional Chat (Command Center)
- Full thread management: create, delete, pin/unpin, search, switch
- 220px sidebar with pinned + recent sections
- Agent selector dropdown in header
- Simulated responses with typing indicator (1200-3000ms delay)
- Message bubbles: user (right-aligned, indigo), agent (left-aligned, dark), system (centered, gray)
- Thread title auto-updates from first user message

### 5. Canvas/Cowork Panel
- Opens when agent response includes an artifact reference
- 45% width split-pane alongside chat
- Tabbed interface for multiple artifacts
- Renders different content types: `document` (markdown), `code` (syntax-highlighted pre), `spreadsheet` (table), `design` (diagram)
- Custom markdown renderer handles: headers, tables, checklists, bullet lists, numbered lists, bold text, code blocks

### 6. Durable Execution Trace
- 4 animated phases: PLANNING (purple) > EXECUTING (green) > ERROR (red) > SELF-CORRECTING (blue)
- Auto-plays with 2-second intervals, advancing logs then phases
- Agent Runtime visualization: 2x2 core grid with pulsing animations
- Tool chain nodes with status indicators (idle/queued/active/done/error/blocked/retry)
- Terminal log output with typed entries (system, thought, decision, code, success, error)
- Stats sidebar (tokens, cost, retries, errors, fixed, confidence)

### 7. Network Topology
- Two cluster boxes: "Iva's Mac mini" (Iva + JOY) and "DO Droplet" (IVAN + all ARVIS + TIA)
- Animated connection line with data-flow gradient
- Internet bridge node between clusters
- Status dots match agent online/sleeping state

### 8. Color System
| Agent | Primary Color | Purpose |
|---|---|---|
| Iva | `#8b5cf6` (Purple) | AGI Copilot |
| IVAN | `#692884` (Deep Purple) | Research/Creative |
| ARVIS (all 4) | `#dbad29` (Gold) | Sales/Recruit/Admin/Production |
| TIA | `#f59e0b` (Amber) | Trenton's Assistant |
| JOY | `#60B1CF` (Sky Blue) | Gina's Assistant |

Client group header colors:
- Intuitive Labs: `#8b5cf6`
- Arrow Roofing: `#D3BA36`
- Gina/GBC: `#005AA9`

---

## CSS Animations Reference

| Animation | Duration | Usage |
|---|---|---|
| `orbFloat` | 20s | Background orbs floating |
| `data-flow` | 2.5s | Network topology connection lines |
| `node-pulse` | 3s | Network topology cluster boxes |
| `slide-in` | 0.3s | General element entrance |
| `blink-cursor` | 1s | Terminal cursor blink |
| `trace-pulse` | varies | Durable execution trace glow (green/red/blue/purple variants) |
| `core-spin` | 1.5-2.4s | Agent runtime core grid |
| `signal-flow` | 1.5s | Connection signal dot |
| `error-scan` | 2s | Error phase scanline overlay |
| `log-appear` | 0.3s | Terminal log entry entrance |

---

## Tailwind Config Extensions

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                surface: { 900: '#0a0a0f', 800: '#0e0e16', 700: '#14141e', 600: '#1a1a2a' },
                accent: { blue: '#3b82f6', purple: '#8b5cf6', cyan: '#06b6d4', emerald: '#10b981', orange: '#f97316', pink: '#ec4899', red: '#ef4444', yellow: '#eab308' }
            }
        }
    }
}
```

---

## How to Run

1. Place both files in the same directory:
   ```
   openclaw-dashboard-v2.html
   OpenClaw_icon.svg
   ```

2. Open `openclaw-dashboard-v2.html` in any modern browser (Chrome, Firefox, Safari, Edge)

3. No server required for local development. For production deployment:
   - Upload to **Cloudflare Pages**, **Vercel**, **Netlify**, or any static file host
   - Ensure `OpenClaw_icon.svg` is in the same directory as the HTML file

---

## Production Migration Path

To convert from a prototype to a production application:

1. **Replace static data with API calls** — Each `const` data object (agents, boardColumns, cronJobs, activityFeedData) should be fetched from your backend
2. **Add real WebSocket connections** — Replace `setInterval` polling with WebSocket for live agent heartbeats and activity feed
3. **Implement real chat** — Replace `agentResponses` with actual API calls to your agent orchestrator
4. **Add authentication** — Wrap the app with an auth layer (Clerk, Auth0, or custom)
5. **Move to a proper React build** — Replace Babel Standalone with Vite/Next.js for production performance
6. **Extract components** — Split the single file into proper component files
7. **Add state management** — Replace local `useState` with Zustand or React Query for server state
8. **Persist kanban state** — Save board column changes to a database
9. **Real cron monitoring** — Connect to your actual cron/scheduler service for live job status

---

## Layout Grid Summary (top to bottom)

| Section | Grid | Notes |
|---|---|---|
| KPI Row | `flex flex-wrap` | 5 inline compact chips |
| Client Groups | `grid-cols-3` | 3 wallet-stack columns |
| Task Board | `flex overflow-x-auto` | 6 kanban columns (210px each), horizontally scrollable |
| Command Center | Internal flex layout | Thread sidebar (220px) + Chat (flex) + Canvas (45%) |
| Bottom Row | `grid-cols-[1fr_1fr_280px]` | Durable Execution Trace + Network Topology + Activity Feed |
| Cron Jobs | `flex overflow-x-auto` | Horizontal scroll, 200px per agent |

---

## Notes

- The entire dashboard is ~1760 lines in a single HTML file
- All React hooks used: `useState`, `useEffect`, `useRef`, `useCallback`
- No external state management library — all state is local React state
- The file uses HTML entities (e.g., `&#x1F43E;`) instead of emoji characters for cross-platform consistency
- Scrollbars are custom-styled via `.custom-scrollbar` class (4px width, dark track, slate thumb)
- The OpenClaw SVG icon is 1.8MB (contains embedded base64 PNG data) — consider optimizing for production
