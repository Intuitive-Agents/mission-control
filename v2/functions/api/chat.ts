interface Env {
  CHAT_DB: D1Database;
  SWARM_STATE: KVNamespace;
  MC_AUTH_TOKEN: string;
}

// Auth middleware helper
function checkAuth(request: Request, env: Env): Response | null {
  const token = request.headers.get('X-MC-Token') || new URL(request.url).searchParams.get('token');
  if (!token || token !== env.MC_AUTH_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// CORS headers
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-MC-Token',
};

// OPTIONS - CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: CORS });
};

// GET /api/chat?agentId=xxx — list threads for an agent, or all threads
// GET /api/chat?threadId=xxx — get messages for a thread
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  const url = new URL(context.request.url);
  const threadId = url.searchParams.get('threadId');
  const agentId = url.searchParams.get('agentId');

  if (threadId) {
    // Get messages for thread
    const messages = await context.env.CHAT_DB.prepare(
      'SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC'
    ).bind(threadId).all();
    
    const thread = await context.env.CHAT_DB.prepare(
      'SELECT * FROM threads WHERE id = ?'
    ).bind(threadId).first();

    return Response.json({ thread, messages: messages.results }, { headers: CORS });
  }

  // List threads
  let query = 'SELECT * FROM threads ORDER BY updated_at DESC LIMIT 50';
  let stmt = context.env.CHAT_DB.prepare(query);
  
  if (agentId) {
    query = 'SELECT * FROM threads WHERE agent_id = ? ORDER BY updated_at DESC LIMIT 50';
    stmt = context.env.CHAT_DB.prepare(query).bind(agentId);
  }

  const threads = await stmt.all();
  return Response.json({ threads: threads.results }, { headers: CORS });
};

// POST /api/chat — send a message (from user via MC UI)
// Body: { threadId?, agentId, content }
// If no threadId, creates a new thread
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  const body: any = await context.request.json();
  const { agentId, content } = body;
  let { threadId } = body;

  if (!agentId || !content) {
    return Response.json({ error: 'Need agentId and content' }, { status: 400, headers: CORS });
  }

  // Create thread if needed
  if (!threadId) {
    threadId = crypto.randomUUID();
    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    await context.env.CHAT_DB.prepare(
      'INSERT INTO threads (id, agent_id, title) VALUES (?, ?, ?)'
    ).bind(threadId, agentId, title).run();
  }

  // Insert user message
  await context.env.CHAT_DB.prepare(
    'INSERT INTO messages (thread_id, role, agent_id, content, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(threadId, 'user', agentId, content, 'delivered').run();

  // Insert pending agent message placeholder
  const pendingId = await context.env.CHAT_DB.prepare(
    'INSERT INTO messages (thread_id, role, agent_id, content, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(threadId, 'agent', agentId, '', 'pending').run();

  // Update thread timestamp
  await context.env.CHAT_DB.prepare(
    'UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(threadId).run();

  return Response.json({ 
    ok: true, 
    threadId, 
    pendingMessageId: pendingId.meta.last_row_id 
  }, { headers: CORS });
};

// PUT /api/chat — relay daemon pushes agent response
// Body: { messageId, content, status } OR { threadId, agentId, content, role }
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  const body: any = await context.request.json();

  if (body.messageId) {
    // Update existing pending message with response
    await context.env.CHAT_DB.prepare(
      'UPDATE messages SET content = ?, status = ? WHERE id = ?'
    ).bind(body.content, body.status || 'delivered', body.messageId).run();

    // Update thread timestamp
    if (body.threadId) {
      await context.env.CHAT_DB.prepare(
        'UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(body.threadId).run();
    }
  } else if (body.threadId && body.content) {
    // Insert a new message (agent push)
    await context.env.CHAT_DB.prepare(
      'INSERT INTO messages (thread_id, role, agent_id, content, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(body.threadId, body.role || 'agent', body.agentId, body.content, 'delivered').run();

    await context.env.CHAT_DB.prepare(
      'UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(body.threadId).run();
  }

  return Response.json({ ok: true }, { headers: CORS });
};
