// /api/crons — Returns cron job status per agent
// Phase 1: Iva pushes cron data from gateway; others are semi-static

interface Env {
  SWARM_STATE: KVNamespace;
}

const AGENT_IDS = ['iva', 'ivan', 'arvis_sales', 'arvis_recruit', 'arvis_admin', 'arvis_prod', 'tia', 'joy'];

export const onRequestGet: PagesFunction<Env> = async (context) => {
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
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=120',
    },
  });
};

// POST /api/crons — Push cron data for an agent
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.SWARM_STATE) {
    return Response.json({ error: 'KV not bound' }, { status: 500 });
  }

  try {
    const body: any = await context.request.json();
    const { agentId, jobs } = body;
    if (!agentId || !Array.isArray(jobs)) {
      return Response.json({ error: 'Need agentId and jobs[]' }, { status: 400 });
    }

    await context.env.SWARM_STATE.put(`crons:${agentId}`, JSON.stringify(jobs), {
      expirationTtl: 86400,
    });

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
};
