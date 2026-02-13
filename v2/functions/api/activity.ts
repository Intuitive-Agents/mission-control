// /api/activity — Live activity feed
// Agents POST events; GET returns latest 30

interface Env {
  SWARM_STATE: KVNamespace;
  MC_AUTH_TOKEN: string;
}

const MAX_EVENTS = 30;

// CORS headers
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-MC-Token',
};

// Auth check helper
function checkAuth(request: Request, env: Env): Response | null {
  const token = request.headers.get('X-MC-Token') || new URL(request.url).searchParams.get('token');
  if (!token || token !== env.MC_AUTH_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }
  return null;
}

// OPTIONS - CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: CORS });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  // Auth required for consistency
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  let events: any[] = [];

  if (context.env.SWARM_STATE) {
    try {
      const raw = await context.env.SWARM_STATE.get('activity_feed');
      if (raw) events = JSON.parse(raw);
    } catch {}
  }

  return Response.json({ events }, {
    headers: {
      ...CORS,
      'Cache-Control': 'public, max-age=15',
    },
  });
};

// POST /api/activity — Push a new activity event
export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Auth required
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  if (!context.env.SWARM_STATE) {
    return Response.json({ error: 'KV not bound' }, { status: 500, headers: CORS });
  }

  try {
    const body: any = await context.request.json();
    const { agentId, text } = body;
    if (!agentId || !text) {
      return Response.json({ error: 'Need agentId and text' }, { status: 400, headers: CORS });
    }

    let events: any[] = [];
    try {
      const raw = await context.env.SWARM_STATE.get('activity_feed');
      if (raw) events = JSON.parse(raw);
    } catch {}

    events.unshift({
      time: new Date().toISOString(),
      agent: agentId,
      text,
    });

    // Keep only latest
    events = events.slice(0, MAX_EVENTS);

    await context.env.SWARM_STATE.put('activity_feed', JSON.stringify(events), {
      expirationTtl: 86400,
    });

    return Response.json({ ok: true, count: events.length }, { headers: CORS });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400, headers: CORS });
  }
};
