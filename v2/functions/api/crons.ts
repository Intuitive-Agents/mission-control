// /api/crons — Returns cron job status per agent
// Phase 1: Iva pushes cron data from gateway; others are semi-static

interface Env {
  SWARM_STATE: KVNamespace;
  MC_AUTH_TOKEN: string;
}

const AGENT_IDS = ['iva', 'ivan', 'arvis_sales', 'arvis_recruit', 'arvis_admin', 'arvis_prod', 'scout', 'tia', 'joy'];

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

  const cronJobs: Record<string, any[]> = {};

  for (const id of AGENT_IDS) {
    if (context.env.SWARM_STATE) {
      try {
        const raw = await context.env.SWARM_STATE.get(`crons:${id}`);
        if (raw) {
          cronJobs[id] = JSON.parse(raw);
          continue;
        }
      } catch {}
    }
    cronJobs[id] = []; // Empty until agents push data
  }

  return Response.json({ cronJobs }, {
    headers: {
      ...CORS,
      'Cache-Control': 'public, max-age=120',
    },
  });
};

// POST /api/crons — Push cron data for an agent
export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Auth required
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  if (!context.env.SWARM_STATE) {
    return Response.json({ error: 'KV not bound' }, { status: 500, headers: CORS });
  }

  try {
    const body: any = await context.request.json();
    const { agentId, jobs } = body;
    if (!agentId || !Array.isArray(jobs)) {
      return Response.json({ error: 'Need agentId and jobs[]' }, { status: 400, headers: CORS });
    }

    await context.env.SWARM_STATE.put(`crons:${agentId}`, JSON.stringify(jobs), {
      expirationTtl: 86400,
    });

    return Response.json({ ok: true }, { headers: CORS });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400, headers: CORS });
  }
};
