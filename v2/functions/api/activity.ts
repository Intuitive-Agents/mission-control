// /api/activity — Live activity feed
// Agents POST events; GET returns latest 30

interface Env {
  SWARM_STATE: KVNamespace;
}

const MAX_EVENTS = 30;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  let events: any[] = [];

  if (context.env.SWARM_STATE) {
    try {
      const raw = await context.env.SWARM_STATE.get('activity_feed');
      if (raw) events = JSON.parse(raw);
    } catch {}
  }

  return Response.json({ events }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=15',
    },
  });
};

// POST /api/activity — Push a new activity event
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.SWARM_STATE) {
    return Response.json({ error: 'KV not bound' }, { status: 500 });
  }

  try {
    const body: any = await context.request.json();
    const { agentId, text } = body;
    if (!agentId || !text) {
      return Response.json({ error: 'Need agentId and text' }, { status: 400 });
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

    return Response.json({ ok: true, count: events.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
};
