// /api/tasks — Proxies ClickUp tasks into kanban board format + bi-directional sync
interface Env {
  CLICKUP_TOKEN: string;
  MC_AUTH_TOKEN: string;
}

// Auth check helper
function checkAuth(request: Request, env: Env): Response | null {
  const token = request.headers.get('X-MC-Token') || new URL(request.url).searchParams.get('token');
  if (!token || token !== env.MC_AUTH_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

const TEAM_ID = '9017674776';
const ARS_FOLDER = '90175662586';

// Map ClickUp statuses to board columns
const STATUS_MAP: Record<string, string> = {
  'open': 'inbox',
  'to do': 'inbox',
  'assigned': 'assigned',
  'in progress': 'in_progress',
  'review': 'review',
  'complete': 'done',
  'closed': 'done',
  'blocked': 'blocked',
};

// Reverse mapping: board column → ClickUp status
const REVERSE_STATUS_MAP: Record<string, string> = {
  'inbox': 'open',
  'assigned': 'assigned',
  'in_progress': 'in progress',
  'review': 'review',
  'done': 'complete',
  'blocked': 'blocked',
};

// Reverse priority mapping: dashboard priority → ClickUp priority ID
const REVERSE_PRIORITY_MAP: Record<string, number> = {
  'high': 1,
  'med': 3,
  'low': 4,
};

const COLUMN_DEFS = [
  { id: 'inbox', title: 'INBOX', color: '#94a3b8', icon: 'inbox' },
  { id: 'assigned', title: 'ASSIGNED', color: '#8b5cf6', icon: 'user-check' },
  { id: 'in_progress', title: 'IN PROGRESS', color: '#3b82f6', icon: 'loader' },
  { id: 'review', title: 'REVIEW', color: '#eab308', icon: 'eye' },
  { id: 'done', title: 'DONE', color: '#10b981', icon: 'check-circle' },
  { id: 'blocked', title: 'BLOCKED', color: '#ef4444', icon: 'alert-triangle' },
];

// ClickUp member ID/username → agent ID mapping
// Add ClickUp member IDs here as they're discovered
const CLICKUP_MEMBER_MAP: Record<string, string> = {
  // Usernames (lowercase)
  'iva': 'iva',
  'ivaanne': 'iva',
  'ivan': 'ivan',
  'tia': 'tia',
  'trenton': 'tia',
  'arvis': 'arvis_sales',
  'scout': 'scout',
  'joy': 'joy',
  'gina': 'joy',
  // Add ClickUp member IDs as they're discovered
  // '12345678': 'iva',
};

// Map assignee names to agent IDs
function guessAgent(task: any): string {
  const name = (task.name || '').toLowerCase();
  const desc = (task.description || '').toLowerCase();
  const assignees = task.assignees || [];
  
  // First try direct assignee mapping
  for (const assignee of assignees) {
    const username = (assignee.username || '').toLowerCase();
    const email = (assignee.email || '').toLowerCase();
    const id = assignee.id?.toString();
    
    // Check direct ID mapping
    if (id && CLICKUP_MEMBER_MAP[id]) return CLICKUP_MEMBER_MAP[id];
    
    // Check username patterns
    for (const [pattern, agentId] of Object.entries(CLICKUP_MEMBER_MAP)) {
      if (username.includes(pattern) || email.includes(pattern)) {
        return agentId;
      }
    }
  }
  
  // Fallback: guess from task name or description
  if (name.includes('tia') || name.includes('trenton') || desc.includes('tia')) return 'tia';
  if (name.includes('arvis') || desc.includes('arvis')) return 'arvis_sales';
  if (name.includes('scout') || name.includes('linkedin') || desc.includes('scout')) return 'scout';
  if (name.includes('joy') || name.includes('gina') || desc.includes('joy')) return 'joy';
  if (name.includes('ivan') || desc.includes('ivan')) return 'ivan';
  if (name.includes('iva') || desc.includes('iva')) return 'iva';
  
  // Last resort: check for ARS-related keywords → assign to tia
  if (name.includes('ars') || name.includes('arrow') || name.includes('roofing') || 
      name.includes('acculynx') || name.includes('ghl') || name.includes('lead')) {
    return 'tia';
  }
  
  // Default to unassigned indicator (still shows as iva for now, but could be 'unassigned')
  return 'iva';
}

function mapPriority(p: number | null): string {
  if (p === 1) return 'high';
  if (p === 2) return 'high';
  if (p === 3) return 'med';
  return 'low';
}

// GET /api/tasks — fetch tasks from ClickUp
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  const token = context.env.CLICKUP_TOKEN;
  if (!token) {
    return Response.json({ error: 'Missing CLICKUP_TOKEN' }, { status: 500 });
  }

  try {
    const url = `https://api.clickup.com/api/v2/team/${TEAM_ID}/task?subtasks=true&include_closed=true&order_by=updated&reverse=true&page=0`;
    const resp = await fetch(url, {
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return Response.json({ error: `ClickUp API ${resp.status}`, detail: text }, { status: 502 });
    }

    const data: any = await resp.json();
    const tasks = data.tasks || [];

    const columns = COLUMN_DEFS.map(col => ({ ...col, tasks: [] as any[] }));
    const colMap = Object.fromEntries(columns.map(c => [c.id, c]));

    for (const task of tasks) {
      const statusName = (task.status?.status || 'open').toLowerCase();
      const colId = STATUS_MAP[statusName] || 'inbox';
      const col = colMap[colId];
      if (!col) continue;

      const tags = (task.tags || []).map((t: any) => t.name);
      const folderName = task.folder?.name || '';
      if (folderName) tags.unshift(folderName.slice(0, 20));

      col.tasks.push({
        id: task.id,
        title: task.name,
        desc: (task.description || '').slice(0, 120) + ((task.description || '').length > 120 ? '...' : ''),
        fullDesc: task.description || '',
        agent: guessAgent(task),
        priority: mapPriority(task.priority?.id ? parseInt(task.priority.id) : null),
        tags,
        url: task.url,
        dateUpdated: task.date_updated,
        status: statusName,
        assignees: (task.assignees || []).map((a: any) => ({ id: a.id, username: a.username, email: a.email })),
      });
    }

    return Response.json({ columns }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

// PUT /api/tasks — update a task in ClickUp (bi-directional sync)
// Body: { taskId: string, status?: string, priority?: string, agent?: string }
// status is the column ID (inbox, assigned, in_progress, review, done, blocked)
// priority is the dashboard priority (high, med, low)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const authErr = checkAuth(context.request, context.env);
  if (authErr) return authErr;

  const token = context.env.CLICKUP_TOKEN;
  if (!token) {
    return Response.json({ error: 'Missing CLICKUP_TOKEN' }, { status: 500 });
  }

  try {
    const body: any = await context.request.json();
    const { taskId, status, priority } = body;

    if (!taskId) {
      return Response.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Build ClickUp update payload
    const updateBody: any = {};

    if (status) {
      const clickUpStatus = REVERSE_STATUS_MAP[status];
      if (clickUpStatus) {
        updateBody.status = clickUpStatus;
      }
    }

    if (priority) {
      const clickUpPriority = REVERSE_PRIORITY_MAP[priority];
      if (clickUpPriority !== undefined) {
        updateBody.priority = clickUpPriority;
      }
    }

    if (Object.keys(updateBody).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const resp = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return Response.json({ error: `ClickUp API ${resp.status}`, detail: text }, { status: 502 });
    }

    const result = await resp.json();
    return Response.json({ ok: true, task: result }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

// OPTIONS /api/tasks — CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-MC-Token',
      'Access-Control-Max-Age': '86400',
    },
  });
};
