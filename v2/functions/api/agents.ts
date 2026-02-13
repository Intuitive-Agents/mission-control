// /api/agents — Returns live agent status
// Phase 1: reads from KV (agents push heartbeats here)
// Fallback: returns last-known static data

interface Env {
  SWARM_STATE: KVNamespace;
  MC_AUTH_TOKEN: string;
}

// Auth check — allow GET without auth (public dashboard read), require auth for POST (heartbeat push)
function checkAuth(request: Request, env: Env): Response | null {
  const token = request.headers.get('X-MC-Token') || new URL(request.url).searchParams.get('token');
  if (!token || token !== env.MC_AUTH_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

const AGENT_DEFAULTS: Record<string, any> = {
  iva: { name: 'Iva', role: 'AGI Copilot', model: 'Claude Opus 4.6', modelColor: '#8b5cf6', host: "Iva's Mac mini", channels: ['Telegram', 'iMessage'], assignedTo: 'Nick — Intuitive Labs CEO' },
  ivan: { name: 'IVAN', role: 'Research / Creative / Content / SMM', model: 'Kimi K2.5', modelColor: '#692884', host: 'DO Droplet', channels: ['Telegram'], assignedTo: 'Nick — Intuitive Labs' },
  arvis_sales: { name: 'ARVIS (Sales)', role: 'Sales', model: 'MiniMax M2.1', modelColor: '#dbad29', host: 'DO Droplet', channels: ['Telegram'], assignedTo: 'Trenton — Arrow Roofing' },
  arvis_recruit: { name: 'ARVIS (Recruiter)', role: 'Recruiting', model: 'MiniMax M2.1', modelColor: '#dbad29', host: 'DO Droplet', channels: ['Telegram'], assignedTo: 'Trenton — Arrow Roofing' },
  arvis_admin: { name: 'ARVIS (Admin)', role: 'Operations', model: 'MiniMax M2.1', modelColor: '#dbad29', host: 'DO Droplet', channels: ['Telegram'], assignedTo: 'Trenton — Arrow Roofing' },
  arvis_prod: { name: 'ARVIS (Production)', role: 'Production', model: 'MiniMax M2.1', modelColor: '#dbad29', host: 'DO Droplet', channels: ['Telegram'], assignedTo: 'Trenton — Arrow Roofing' },
  scout: { name: 'SCOUT', role: 'LinkedIn Sourcing', model: 'MiniMax M2.1', modelColor: '#22c55e', host: 'DO Droplet', channels: ['Telegram'], assignedTo: 'Arrow Roofing' },
  tia: { name: 'TIA', role: "Trenton's Assistant", model: 'Kimi K2.5', modelColor: '#f59e0b', host: 'DO Droplet', channels: ['Telegram'], assignedTo: 'Trenton — Arrow Roofing' },
  joy: { name: 'JOY', role: "Gina's Assistant", model: 'Kimi K2.5', modelColor: '#60B1CF', host: "Iva's Mac mini", channels: ['iMessage'], assignedTo: 'Gina Cordas' },
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const agents: any[] = [];

  for (const [id, defaults] of Object.entries(AGENT_DEFAULTS)) {
    let live: any = {};

    // Try KV for live heartbeat data
    if (context.env.SWARM_STATE) {
      try {
        const raw = await context.env.SWARM_STATE.get(`agent:${id}`);
        if (raw) live = JSON.parse(raw);
      } catch {}
    }

    const lastHeartbeat = live.lastHeartbeat ? new Date(live.lastHeartbeat) : null;
    const now = Date.now();
    let status = 'offline';
    let heart = 'unknown';

    if (lastHeartbeat) {
      const diffMs = now - lastHeartbeat.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 2) { status = 'online'; heart = `${Math.floor(diffMs / 1000)}s ago`; }
      else if (diffMin < 60) { status = 'online'; heart = `${diffMin}m ago`; }
      else if (diffMin < 360) { status = 'sleeping'; heart = `${Math.floor(diffMin / 60)}h ago`; }
      else { status = 'offline'; heart = `${Math.floor(diffMin / 60)}h ago`; }
    }

    agents.push({
      id,
      ...defaults,
      status: live.status || status,
      heart: live.heart || heart,
      sessions: live.sessions ?? 0,
      contextUsed: live.contextUsed ?? 0,
      contextMax: live.contextMax ?? (id === 'iva' ? 1000 : 128),
      load: live.load ?? 0,
    });
  }

  return Response.json({ agents }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=30',
    },
  });
};

// POST /api/agents — Agent heartbeat push endpoint (requires auth)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  if (!context.env.SWARM_STATE) {
    return Response.json({ error: 'KV not bound' }, { status: 500 });
  }

  try {
    const body: any = await context.request.json();
    const { agentId, status, sessions, contextUsed, contextMax, load } = body;

    if (!agentId || !AGENT_DEFAULTS[agentId]) {
      return Response.json({ error: 'Invalid agentId' }, { status: 400 });
    }

    const data = {
      lastHeartbeat: new Date().toISOString(),
      status: status || 'online',
      sessions: sessions ?? 0,
      contextUsed: contextUsed ?? 0,
      contextMax: contextMax ?? 128,
      load: load ?? 0,
    };

    await context.env.SWARM_STATE.put(`agent:${agentId}`, JSON.stringify(data), {
      expirationTtl: 86400, // 24h TTL
    });

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
};
