/* ============================================
   MISSION CONTROL — OpenClaw Swarm Dashboard
   app.js — Full interactivity, demo data, D&D
   ============================================ */

// ===== BOT DEFINITIONS =====
const BOTS = {
    iva: {
        id: 'iva', name: 'Iva', emoji: '🦹🏻‍♀️', role: "Nick's AGI Copilot",
        host: 'localhost:18789', hostLabel: '🖥 Mac mini', hostType: 'local',
        model: 'Claude Opus 4.5', modelClass: 'model-opus',
        channels: [{ name: 'Telegram', cls: 'badge-telegram' }, { name: 'iMessage', cls: 'badge-imessage' }],
        token: '4d4474598afc110562288d96225a335369ed0ecc68416b26',
        client: 'Nick — Intuitive Labs CEO',
        color: '#8b5cf6'
    },
    ivan: {
        id: 'ivan', name: 'IVAN', emoji: '🤖', role: 'Agent Network',
        host: '137.184.6.184:18789', hostLabel: '☁️ DO Droplet', hostType: 'cloud',
        model: 'Kimi K2.5', modelClass: 'model-kimi',
        channels: [{ name: 'Telegram', cls: 'badge-telegram' }],
        token: '5f9ebf98ae36c61a88d052ac61768507318c686936c1a68082c61571c0cf4686',
        client: 'Intuitive Labs Team',
        color: '#3b82f6'
    },
    tia: {
        id: 'tia', name: 'T.I.A.', emoji: '🏠', role: 'ARS Bot',
        host: '137.184.6.184:18790', hostLabel: '☁️ DO Droplet', hostType: 'cloud',
        model: 'Kimi K2.5', modelClass: 'model-kimi',
        channels: [{ name: 'Telegram', cls: 'badge-telegram' }],
        token: '',
        client: 'Trenton — Arrow Roofing',
        color: '#f59e0b'
    },
    joy: {
        id: 'joy', name: 'JOY', emoji: '✨', role: "Mom's Assistant",
        host: 'localhost:18795', hostLabel: '🖥 Mac mini', hostType: 'local',
        model: 'Kimi K2.5', modelClass: 'model-kimi',
        channels: [{ name: 'iMessage', cls: 'badge-imessage' }],
        token: 'a1b2c3d4e5f6joy7890abcdef1234567890abcdef12345678',
        client: 'Gina Corbin',
        color: '#ec4899'
    }
};

// ===== DEMO STATE =====
const now = new Date();
function minutesAgo(m) { return new Date(now - m * 60000).toISOString(); }
function hoursAgo(h) { return new Date(now - h * 3600000).toISOString(); }

let swarmState = {
    timestamp: now.toISOString(),
    agents: {
        iva: {
            status: 'online', sessions: 3, tokensToday: 487200,
            contextUsed: 68000, contextMax: 200000,
            lastHeartbeat: minutesAgo(2),
            currentTask: 'Building Mission Control dashboard',
            costToday: 14.62, messagesToday: 47, uptime: 99.8
        },
        ivan: {
            status: 'online', sessions: 1, tokensToday: 125800,
            contextUsed: 34000, contextMax: 128000,
            lastHeartbeat: minutesAgo(5),
            currentTask: 'Monitoring dev squad channels',
            costToday: 1.89, messagesToday: 18, uptime: 97.2
        },
        tia: {
            status: 'sleeping', sessions: 0, tokensToday: 52400,
            contextUsed: 12000, contextMax: 128000,
            lastHeartbeat: minutesAgo(45),
            currentTask: null,
            costToday: 0.79, messagesToday: 8, uptime: 95.1
        },
        joy: {
            status: 'online', sessions: 1, tokensToday: 31200,
            contextUsed: 8500, contextMax: 128000,
            lastHeartbeat: minutesAgo(12),
            currentTask: 'Answering recipe question',
            costToday: 0.47, messagesToday: 12, uptime: 98.5
        }
    }
};

// ===== DEMO TASKS =====
let tasks = [
    { id: 't1', title: 'Deploy Mission Control to Cloudflare Pages', description: 'Build and deploy the swarm dashboard to a *.pages.dev URL for Nick to view from anywhere.', assignee: 'iva', priority: 'high', status: 'in-progress', tags: ['infra', 'dev'], due: '2026-02-02' },
    { id: 't2', title: 'AccuLynx CRM sync — weekly leads report', description: 'Pull latest leads from AccuLynx API and generate the weekly summary for Trenton.', assignee: 'tia', priority: 'medium', status: 'assigned', tags: ['ars', 'crm'], due: '2026-02-03' },
    { id: 't3', title: 'Set up GoHighLevel automation for ARS', description: 'Configure 3 new email workflows in GHL for lead nurture sequences.', assignee: 'tia', priority: 'high', status: 'in-progress', tags: ['ars', 'marketing'], due: '2026-02-04' },
    { id: 't4', title: 'Review ClickUp task backlog', description: 'Go through Intuitive Labs ClickUp workspace and update stale tasks.', assignee: 'ivan', priority: 'low', status: 'inbox', tags: ['dev'], due: '2026-02-05' },
    { id: 't5', title: "Gina's grocery list — weekly prep", description: "Help Gina organize her weekly grocery list and meal plan.", assignee: 'joy', priority: 'medium', status: 'done', tags: ['personal'], due: '2026-02-01' },
    { id: 't6', title: 'Fix BlueBubbles tunnel reconnection', description: 'Cloudflare tunnel URL changes on restart — need a persistent solution or auto-update mechanism.', assignee: 'iva', priority: 'urgent', status: 'blocked', tags: ['infra', 'urgent'], due: '2026-02-02' },
    { id: 't7', title: 'Notion prompt library — add 10 new prompts', description: 'Curate and add new high-quality prompts to the Notion Prompt Library database.', assignee: 'iva', priority: 'low', status: 'inbox', tags: ['dev'], due: '2026-02-07' },
    { id: 't8', title: 'ARS roof inspection follow-ups', description: 'Send follow-up messages to 5 pending inspection leads in AccuLynx.', assignee: 'tia', priority: 'high', status: 'review', tags: ['ars', 'crm'], due: '2026-02-02' },
    { id: 't9', title: 'IVAN onboarding docs', description: 'Write documentation for how IVAN handles dev squad requests and Telegram routing.', assignee: 'ivan', priority: 'medium', status: 'assigned', tags: ['dev'], due: '2026-02-06' },
    { id: 't10', title: "Doctor's appointment reminder for Gina", description: "Set up recurring reminder for Gina's Thursday appointments.", assignee: 'joy', priority: 'medium', status: 'done', tags: ['personal'], due: '2026-02-01' },
    { id: 't11', title: 'Swarm cost optimization analysis', description: 'Analyze token usage across all bots and find ways to reduce costs without losing quality.', assignee: 'iva', priority: 'medium', status: 'inbox', tags: ['infra'], due: '2026-02-08' },
    { id: 't12', title: 'ARS Google Sheet action items update', description: 'Sync the ARS action items Google Sheet with latest AccuLynx data.', assignee: 'tia', priority: 'medium', status: 'assigned', tags: ['ars'], due: '2026-02-03' },
];

// ===== DEMO ACTIVITY FEED =====
let activityFeed = [
    { bot: 'iva', type: 'task', message: '⚡ Started building Mission Control dashboard', time: minutesAgo(1) },
    { bot: 'joy', type: 'message', message: '💬 Sent recipe recommendations to Gina via iMessage', time: minutesAgo(4) },
    { bot: 'iva', type: 'heartbeat', message: '💓 Heartbeat OK — checked email, calendar clear', time: minutesAgo(8) },
    { bot: 'ivan', type: 'message', message: '💬 Responded to dev squad question in Telegram', time: minutesAgo(12) },
    { bot: 'tia', type: 'cron', message: '⏰ Cron fired: ARS daily lead check — 3 new leads found', time: minutesAgo(18) },
    { bot: 'joy', type: 'heartbeat', message: '💓 Heartbeat OK — no new iMessages', time: minutesAgo(22) },
    { bot: 'iva', type: 'task', message: '📋 Updated task: Fix BlueBubbles tunnel → Blocked', time: minutesAgo(28) },
    { bot: 'ivan', type: 'heartbeat', message: '💓 Heartbeat OK — monitoring channels', time: minutesAgo(32) },
    { bot: 'tia', type: 'message', message: '💬 Sent follow-up to lead #2847 via Telegram', time: minutesAgo(38) },
    { bot: 'iva', type: 'error', message: '⚠️ BlueBubbles connection timeout — tunnel URL may have changed', time: minutesAgo(42) },
    { bot: 'joy', type: 'message', message: '💬 Helped Gina with grocery list organization', time: minutesAgo(48) },
    { bot: 'ivan', type: 'cron', message: '⏰ Cron fired: ClickUp status sync — 0 changes', time: minutesAgo(55) },
    { bot: 'tia', type: 'heartbeat', message: '💓 Heartbeat OK — entering sleep mode (low activity)', time: minutesAgo(62) },
    { bot: 'iva', type: 'message', message: '💬 Sent daily summary to Nick via Telegram', time: hoursAgo(1.5) },
    { bot: 'joy', type: 'cron', message: '⏰ Cron fired: Morning check-in with Gina', time: hoursAgo(2) },
    { bot: 'ivan', type: 'task', message: '📋 Completed: Dev squad standup notes compiled', time: hoursAgo(2.5) },
    { bot: 'tia', type: 'message', message: '💬 Sent roof inspection quote to client via Telegram', time: hoursAgo(3) },
    { bot: 'iva', type: 'cron', message: '⏰ Cron fired: Email inbox check — 2 new messages', time: hoursAgo(3.5) },
    { bot: 'joy', type: 'heartbeat', message: '💓 Heartbeat OK — evening quiet mode', time: hoursAgo(4) },
    { bot: 'iva', type: 'task', message: '📋 Started: Swarm cost optimization analysis', time: hoursAgo(5) },
];

// ===== DEMO CRON JOBS =====
const cronJobs = [
    { bot: 'iva', name: 'Email Inbox Check', schedule: '*/30 * * * *', next: 'In 18 min', lastResult: 'OK — 2 new', status: 'active' },
    { bot: 'iva', name: 'Heartbeat Poll', schedule: '*/15 * * * *', next: 'In 7 min', lastResult: 'OK', status: 'active' },
    { bot: 'iva', name: 'Memory Maintenance', schedule: '0 3 * * *', next: 'Tomorrow 3:00 AM', lastResult: 'OK — MEMORY.md updated', status: 'active' },
    { bot: 'iva', name: 'Daily Summary to Nick', schedule: '0 22 * * *', next: 'Today 10:00 PM', lastResult: 'Sent', status: 'active' },
    { bot: 'ivan', name: 'ClickUp Sync', schedule: '0 */2 * * *', next: 'In 45 min', lastResult: 'OK — 0 changes', status: 'active' },
    { bot: 'ivan', name: 'Heartbeat Poll', schedule: '*/20 * * * *', next: 'In 3 min', lastResult: 'OK', status: 'active' },
    { bot: 'tia', name: 'ARS Daily Lead Check', schedule: '0 9 * * 1-5', next: 'Monday 9:00 AM', lastResult: '3 new leads', status: 'active' },
    { bot: 'tia', name: 'Weekly Report Generation', schedule: '0 17 * * 5', next: 'Friday 5:00 PM', lastResult: 'Sent to Trenton', status: 'active' },
    { bot: 'tia', name: 'GHL Workflow Monitor', schedule: '0 */4 * * *', next: 'In 2h', lastResult: 'All OK', status: 'paused' },
    { bot: 'joy', name: 'Morning Check-in', schedule: '0 8 * * *', next: 'Tomorrow 8:00 AM', lastResult: 'Sent to Gina', status: 'active' },
    { bot: 'joy', name: 'Appointment Reminders', schedule: '0 7 * * 4', next: 'Thursday 7:00 AM', lastResult: 'Reminder sent', status: 'active' },
    { bot: 'joy', name: 'Heartbeat Poll', schedule: '*/30 * * * *', next: 'In 12 min', lastResult: 'OK', status: 'active' },
];

// ===== CLOCK & REFRESH =====
function updateClock() {
    const now = new Date();
    const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' };
    document.getElementById('live-clock').textContent = now.toLocaleTimeString('en-US', opts) + ' PST';
}

setInterval(updateClock, 1000);
updateClock();

let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(refreshDashboard, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
}

document.getElementById('auto-refresh').addEventListener('change', (e) => {
    e.target.checked ? startAutoRefresh() : stopAutoRefresh();
});

document.getElementById('refresh-btn').addEventListener('click', refreshDashboard);

function refreshDashboard() {
    // Try loading real data, fall back to demo
    loadSwarmData();
    renderAll();
    const now = new Date();
    document.getElementById('last-refresh').textContent = 'Last refresh: ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
}

async function loadSwarmData() {
    try {
        const resp = await fetch('swarm-state.json?t=' + Date.now());
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.agents) {
                swarmState = data;
            }
        }
    } catch (e) {
        // Use demo data silently
    }
}

// ===== RENDER ALL =====
function renderAll() {
    renderAgentCards();
    renderSwarmStats();
    renderKanban();
    renderActivityFeed();
    renderNetworkTopology();
    renderCronJobs();
    renderCommandCenter();
    updateSwarmHealth();
}

// ===== AGENT CARDS =====
function renderAgentCards() {
    const container = document.getElementById('agent-cards');
    container.innerHTML = '';

    for (const [id, bot] of Object.entries(BOTS)) {
        const state = swarmState.agents[id] || {};
        const ctxPct = state.contextMax ? Math.round((state.contextUsed / state.contextMax) * 100) : 0;
        const ctxLevel = ctxPct < 50 ? 'low' : ctxPct < 80 ? 'medium' : 'high';
        const heartbeatTime = state.lastHeartbeat ? formatTimeAgo(state.lastHeartbeat) : '--';

        const card = document.createElement('div');
        card.className = 'agent-card';
        card.dataset.agent = id;
        card.innerHTML = `
            <div class="agent-card-top">
                <div class="agent-avatar" data-agent="${id}">
                    ${bot.emoji}
                    <div class="agent-status-dot ${state.status || 'offline'}"></div>
                </div>
                <div class="agent-name-block">
                    <div class="agent-name">${bot.name}</div>
                    <div class="agent-role">${bot.role}</div>
                </div>
                <span class="agent-model-badge ${bot.modelClass}">${bot.model}</span>
            </div>
            <div class="agent-details">
                <div class="agent-detail-row">
                    <span class="agent-detail-label">Host</span>
                    <span class="agent-detail-value">${bot.hostLabel}</span>
                </div>
                <div class="agent-detail-row">
                    <span class="agent-detail-label">Channels</span>
                    <div class="channel-badges">
                        ${bot.channels.map(c => `<span class="channel-badge ${c.cls}">${c.name}</span>`).join('')}
                    </div>
                </div>
                <div class="agent-detail-row">
                    <span class="agent-detail-label">Sessions</span>
                    <span class="agent-detail-value">${state.sessions ?? 0}</span>
                </div>
                <div class="agent-detail-row">
                    <span class="agent-detail-label">Heartbeat</span>
                    <span class="agent-detail-value">${heartbeatTime}</span>
                </div>
            </div>
            <div class="context-bar">
                <div class="context-bar-label">
                    <span>Context Window</span>
                    <span>${formatTokens(state.contextUsed || 0)} / ${formatTokens(state.contextMax || 0)}</span>
                </div>
                <div class="context-bar-track">
                    <div class="context-bar-fill ${ctxLevel}" style="width: ${ctxPct}%"></div>
                </div>
            </div>
            ${state.currentTask ? `
            <div class="agent-task-current">
                <div class="agent-task-label">Current Task</div>
                <div class="agent-task-name">${state.currentTask}</div>
            </div>` : ''}
            <div class="agent-client">👤 ${bot.client}</div>
        `;
        container.appendChild(card);
    }
}

// ===== SWARM STATS =====
function renderSwarmStats() {
    const agents = swarmState.agents;
    let totalSessions = 0, totalTokens = 0, totalCost = 0, totalMessages = 0, totalUptime = 0;
    let botCount = 0;

    for (const a of Object.values(agents)) {
        totalSessions += a.sessions || 0;
        totalTokens += a.tokensToday || 0;
        totalCost += a.costToday || 0;
        totalMessages += a.messagesToday || 0;
        totalUptime += a.uptime || 0;
        botCount++;
    }

    document.getElementById('stat-sessions').textContent = totalSessions;
    document.getElementById('stat-tokens').textContent = formatTokens(totalTokens);
    document.getElementById('stat-cost').textContent = '$' + totalCost.toFixed(2);
    document.getElementById('stat-uptime').textContent = (totalUptime / (botCount || 1)).toFixed(1) + '%';
    document.getElementById('stat-messages').textContent = totalMessages;
}

// ===== KANBAN BOARD =====
function renderKanban() {
    const statuses = ['inbox', 'assigned', 'in-progress', 'review', 'done', 'blocked'];

    for (const status of statuses) {
        const container = document.querySelector(`.column-tasks[data-status="${status}"]`);
        const countEl = document.querySelector(`.task-count[data-count="${status}"]`);
        if (!container) continue;
        container.innerHTML = '';

        const filtered = tasks.filter(t => t.status === status);
        countEl.textContent = filtered.length;

        for (const task of filtered) {
            const bot = BOTS[task.assignee];
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.dataset.taskId = task.id;

            const dueClass = getDueClass(task.due);

            card.innerHTML = `
                <div class="task-card-header">
                    <span class="task-title">${task.title}</span>
                    <span class="task-priority ${task.priority}"></span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-tags">
                    ${task.tags.map(t => `<span class="task-tag ${getTagClass(t)}">${t}</span>`).join('')}
                </div>
                <div class="task-meta">
                    ${task.due ? `<span class="task-due ${dueClass}">📅 ${formatDate(task.due)}</span>` : '<span></span>'}
                    <span class="task-assignee-badge" title="${bot ? bot.name : ''}">${bot ? bot.emoji : '?'}</span>
                </div>
            `;

            // Click to view detail
            card.addEventListener('click', (e) => {
                if (e.target.closest('.task-priority')) return;
                showTaskDetail(task);
            });

            // Drag events
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));

            container.appendChild(card);
        }
    }

    // Drop zones
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.classList.add('drag-over');
        });
        col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = col.dataset.status;
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                task.status = newStatus;
                renderKanban();
                addActivityEntry(task.assignee || 'iva', 'task', `📋 Moved "${task.title}" → ${capitalize(newStatus)}`);
            }
        });
    });
}

// ===== ACTIVITY FEED =====
function renderActivityFeed() {
    const list = document.getElementById('feed-list');
    list.innerHTML = '';

    // Show typing indicator for online bots randomly
    const typingBots = Object.entries(swarmState.agents)
        .filter(([, a]) => a.status === 'online' && a.currentTask)
        .slice(0, 1);

    for (const [id] of typingBots) {
        const bot = BOTS[id];
        const typing = document.createElement('div');
        typing.className = 'feed-typing';
        typing.innerHTML = `${bot.emoji} ${bot.name} is working... <div class="typing-dots"><span></span><span></span><span></span></div>`;
        list.appendChild(typing);
    }

    // Feed items
    for (const item of activityFeed.slice(0, 50)) {
        const el = document.createElement('div');
        el.className = 'feed-item';
        el.dataset.bot = item.bot;

        const typeIcon = { heartbeat: '💓', message: '💬', task: '📋', cron: '⏰', error: '⚠️' }[item.type] || '📌';

        el.innerHTML = `
            <div class="feed-item-header">
                <span class="feed-bot-name" data-bot="${item.bot}">${BOTS[item.bot]?.emoji || ''} ${BOTS[item.bot]?.name || item.bot}</span>
                <span class="feed-time">${formatTimeAgo(item.time)}</span>
            </div>
            <div class="feed-message"><span class="feed-type-icon">${typeIcon}</span>${item.message.replace(/^[^\s]+\s/, '')}</div>
        `;
        list.appendChild(el);
    }
}

function addActivityEntry(bot, type, message) {
    activityFeed.unshift({ bot, type, message, time: new Date().toISOString() });
    if (activityFeed.length > 100) activityFeed.pop();
    renderActivityFeed();
}

// ===== NETWORK TOPOLOGY =====
function renderNetworkTopology() {
    const container = document.getElementById('topology-map');
    const ivaStatus = swarmState.agents.iva?.status || 'offline';
    const ivanStatus = swarmState.agents.ivan?.status || 'offline';
    const tiaStatus = swarmState.agents.tia?.status || 'offline';
    const joyStatus = swarmState.agents.joy?.status || 'offline';

    const statusColor = (s) => s === 'online' ? '#10b981' : s === 'sleeping' ? '#f59e0b' : '#ef4444';
    const statusGlow = (s) => s === 'online' ? 'rgba(16,185,129,0.4)' : s === 'sleeping' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)';

    container.innerHTML = `
    <svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:900px;">
        <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.6"/><stop offset="100%" stop-color="#10b981" stop-opacity="0.6"/></linearGradient>
        </defs>

        <!-- Connection Lines -->
        <line x1="290" y1="120" x2="610" y2="120" stroke="url(#lineGrad)" stroke-width="2" stroke-dasharray="6,4" opacity="0.5">
            <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite"/>
        </line>
        <line x1="290" y1="220" x2="610" y2="220" stroke="url(#lineGrad)" stroke-width="2" stroke-dasharray="6,4" opacity="0.5">
            <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite"/>
        </line>

        <!-- Channel routing lines -->
        <line x1="160" y1="80" x2="160" y2="55" stroke="#3b82f6" stroke-width="1.5" opacity="0.4"/>
        <line x1="180" y1="80" x2="180" y2="55" stroke="#10b981" stroke-width="1.5" opacity="0.4"/>
        <line x1="160" y1="185" x2="160" y2="165" stroke="#10b981" stroke-width="1.5" opacity="0.4"/>
        <line x1="735" y1="80" x2="735" y2="55" stroke="#3b82f6" stroke-width="1.5" opacity="0.4"/>
        <line x1="735" y1="185" x2="735" y2="165" stroke="#3b82f6" stroke-width="1.5" opacity="0.4"/>

        <!-- Channel Labels -->
        <text x="148" y="48" fill="#60a5fa" font-size="10" font-weight="600" font-family="system-ui">TG</text>
        <text x="172" y="48" fill="#6ee7b7" font-size="10" font-weight="600" font-family="system-ui">iM</text>
        <text x="152" y="160" fill="#6ee7b7" font-size="10" font-weight="600" font-family="system-ui">iM</text>
        <text x="727" y="48" fill="#60a5fa" font-size="10" font-weight="600" font-family="system-ui">TG</text>
        <text x="727" y="160" fill="#60a5fa" font-size="10" font-weight="600" font-family="system-ui">TG</text>

        <!-- Mac mini Host Box -->
        <rect x="40" y="70" width="250" height="200" rx="16" fill="rgba(26,26,36,0.8)" stroke="rgba(139,92,246,0.3)" stroke-width="1.5"/>
        <text x="165" y="100" text-anchor="middle" fill="#9ca3af" font-size="11" font-weight="600" font-family="system-ui">🖥 MAC MINI (LOCAL)</text>

        <!-- Iva Bot -->
        <rect x="65" y="115" width="200" height="50" rx="10" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="1"/>
        <circle cx="85" cy="140" r="6" fill="${statusColor(ivaStatus)}" filter="url(#glow)">
            ${ivaStatus === 'online' ? '<animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>' : ''}
        </circle>
        <text x="100" y="136" fill="#c4b5fd" font-size="13" font-weight="700" font-family="system-ui">🦹🏻‍♀️ Iva</text>
        <text x="100" y="152" fill="#6b7280" font-size="10" font-family="system-ui">Opus 4.5 · :18789</text>

        <!-- Joy Bot -->
        <rect x="65" y="180" width="200" height="50" rx="10" fill="rgba(236,72,153,0.1)" stroke="rgba(236,72,153,0.3)" stroke-width="1"/>
        <circle cx="85" cy="205" r="6" fill="${statusColor(joyStatus)}" filter="url(#glow)">
            ${joyStatus === 'online' ? '<animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>' : ''}
        </circle>
        <text x="100" y="201" fill="#f9a8d4" font-size="13" font-weight="700" font-family="system-ui">✨ JOY</text>
        <text x="100" y="217" fill="#6b7280" font-size="10" font-family="system-ui">Kimi K2.5 · :18795</text>

        <!-- Internet Cloud -->
        <ellipse cx="450" cy="160" rx="80" ry="45" fill="rgba(59,130,246,0.05)" stroke="rgba(59,130,246,0.15)" stroke-width="1" stroke-dasharray="4,3"/>
        <text x="450" y="156" text-anchor="middle" fill="#4b5563" font-size="22" font-family="system-ui">☁️</text>
        <text x="450" y="178" text-anchor="middle" fill="#4b5563" font-size="10" font-weight="600" font-family="system-ui">INTERNET</text>

        <!-- DO Droplet Host Box -->
        <rect x="610" y="70" width="250" height="200" rx="16" fill="rgba(26,26,36,0.8)" stroke="rgba(59,130,246,0.3)" stroke-width="1.5"/>
        <text x="735" y="100" text-anchor="middle" fill="#9ca3af" font-size="11" font-weight="600" font-family="system-ui">☁️ DO DROPLET (137.184.6.184)</text>

        <!-- IVAN Bot -->
        <rect x="635" y="115" width="200" height="50" rx="10" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" stroke-width="1"/>
        <circle cx="655" cy="140" r="6" fill="${statusColor(ivanStatus)}" filter="url(#glow)">
            ${ivanStatus === 'online' ? '<animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>' : ''}
        </circle>
        <text x="670" y="136" fill="#93c5fd" font-size="13" font-weight="700" font-family="system-ui">🤖 IVAN</text>
        <text x="670" y="152" fill="#6b7280" font-size="10" font-family="system-ui">Kimi K2.5 · :18789</text>

        <!-- TIA Bot -->
        <rect x="635" y="180" width="200" height="50" rx="10" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.3)" stroke-width="1"/>
        <circle cx="655" cy="205" r="6" fill="${statusColor(tiaStatus)}" filter="url(#glow)">
            ${tiaStatus === 'sleeping' ? '<animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>' : ''}
        </circle>
        <text x="670" y="201" fill="#fbbf24" font-size="13" font-weight="700" font-family="system-ui">🏠 T.I.A.</text>
        <text x="670" y="217" fill="#6b7280" font-size="10" font-family="system-ui">Kimi K2.5 · :18790</text>

        <!-- Legend -->
        <circle cx="60" cy="295" r="4" fill="#10b981"/><text x="70" y="298" fill="#6b7280" font-size="10" font-family="system-ui">Online</text>
        <circle cx="130" cy="295" r="4" fill="#f59e0b"/><text x="140" y="298" fill="#6b7280" font-size="10" font-family="system-ui">Sleeping</text>
        <circle cx="210" cy="295" r="4" fill="#ef4444"/><text x="220" y="298" fill="#6b7280" font-size="10" font-family="system-ui">Offline</text>
        <rect x="290" y="291" width="20" height="2" fill="#3b82f6"/><text x="315" y="298" fill="#6b7280" font-size="10" font-family="system-ui">Telegram</text>
        <rect x="390" y="291" width="20" height="2" fill="#10b981"/><text x="415" y="298" fill="#6b7280" font-size="10" font-family="system-ui">iMessage</text>
    </svg>`;
}

// ===== CRON JOBS =====
function renderCronJobs() {
    const grid = document.getElementById('cron-grid');
    grid.innerHTML = '';

    const grouped = {};
    for (const job of cronJobs) {
        if (!grouped[job.bot]) grouped[job.bot] = [];
        grouped[job.bot].push(job);
    }

    for (const [botId, jobs] of Object.entries(grouped)) {
        const bot = BOTS[botId];
        const group = document.createElement('div');
        group.className = 'cron-group';
        group.innerHTML = `
            <div class="cron-group-header">
                <span>${bot.emoji}</span>
                <span class="cron-group-name" style="color:${bot.color}">${bot.name}</span>
            </div>
            ${jobs.map(j => `
                <div class="cron-item">
                    <div class="cron-item-left">
                        <span class="cron-name">${j.name}</span>
                        <span class="cron-schedule">${j.schedule}</span>
                    </div>
                    <div class="cron-item-right">
                        <span class="cron-next">⏭ ${j.next}</span>
                        <span class="cron-status-badge ${j.status}">${j.status}</span>
                    </div>
                </div>
            `).join('')}
        `;
        grid.appendChild(group);
    }
}

// ===== COMMAND CENTER =====
function renderCommandCenter() {
    const quickActions = document.getElementById('command-quick-actions');
    quickActions.innerHTML = '';

    for (const [id, bot] of Object.entries(BOTS)) {
        quickActions.innerHTML += `
            <button class="cmd-btn cmd-btn-message" data-action="message" data-bot="${id}">${bot.emoji} Message ${bot.name}</button>
        `;
    }

    quickActions.innerHTML += '<span style="width:8px"></span>';

    for (const [id, bot] of Object.entries(BOTS)) {
        quickActions.innerHTML += `
            <button class="cmd-btn cmd-btn-status" data-action="status" data-bot="${id}">📡 Check ${bot.name}</button>
        `;
    }

    quickActions.innerHTML += '<span style="width:8px"></span>';

    for (const [id, bot] of Object.entries(BOTS)) {
        quickActions.innerHTML += `
            <button class="cmd-btn cmd-btn-restart" data-action="restart" data-bot="${id}">🔄 Restart ${bot.name}</button>
        `;
    }

    // Attach handlers
    quickActions.querySelectorAll('.cmd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const botId = btn.dataset.bot;
            const bot = BOTS[botId];
            const output = document.getElementById('command-output');

            if (action === 'status') {
                output.innerHTML = `<div style="color:var(--accent-green)">$ curl -s http://${bot.host}/</div><div style="margin-top:6px;">Checking ${bot.name} gateway status...</div><div style="margin-top:4px;color:var(--accent-cyan)">✓ Gateway responding — ${bot.name} is ${swarmState.agents[botId]?.status || 'unknown'}</div><div style="color:var(--text-muted);margin-top:2px;">Sessions: ${swarmState.agents[botId]?.sessions || 0} | Tokens today: ${formatTokens(swarmState.agents[botId]?.tokensToday || 0)}</div>`;
            } else if (action === 'message') {
                document.getElementById('command-target').value = botId;
                document.getElementById('command-input').focus();
                output.innerHTML = `<div style="color:var(--text-muted)">Ready to send command to ${bot.emoji} ${bot.name}. Type your message and press Send.</div>`;
            } else if (action === 'restart') {
                output.innerHTML = `<div style="color:var(--accent-orange)">$ openclaw gateway restart</div><div style="margin-top:6px;">⚠️ Restarting ${bot.name}'s gateway...</div><div style="margin-top:4px;color:var(--accent-red)">This is a DEMO — actual restart requires CLI access on ${bot.hostLabel}</div>`;
            }
        });
    });
}

// Command send handler
document.getElementById('command-send').addEventListener('click', sendCommand);
document.getElementById('command-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendCommand();
});

function sendCommand() {
    const input = document.getElementById('command-input');
    const target = document.getElementById('command-target').value;
    const text = input.value.trim();
    if (!text) return;

    const bot = BOTS[target];
    const output = document.getElementById('command-output');
    output.innerHTML = `<div style="color:var(--accent-blue)">→ ${bot.emoji} ${bot.name}: "${text}"</div><div style="margin-top:6px;color:var(--text-muted)">Command queued. In production, this would be sent via the gateway API to ${bot.host}.</div>`;
    addActivityEntry(target, 'message', `💬 Command received: "${text}"`);
    input.value = '';
}

// ===== SWARM HEALTH =====
function updateSwarmHealth() {
    const el = document.getElementById('swarm-health');
    const agents = swarmState.agents;
    const statuses = Object.values(agents).map(a => a.status);
    const onlineCount = statuses.filter(s => s === 'online').length;
    const offlineCount = statuses.filter(s => s === 'offline').length;

    el.className = 'swarm-health';
    if (offlineCount >= 2) {
        el.classList.add('critical');
        el.innerHTML = '<span class="health-dot critical"></span><span class="health-label">Swarm Critical</span>';
    } else if (offlineCount >= 1 || statuses.includes('sleeping')) {
        el.classList.add('degraded');
        el.innerHTML = '<span class="health-dot degraded"></span><span class="health-label">Swarm Degraded</span>';
    } else {
        el.innerHTML = '<span class="health-dot online"></span><span class="health-label">Swarm Healthy</span>';
    }
}

// ===== COLLAPSIBLE SECTIONS =====
document.querySelectorAll('.clickable[data-toggle]').forEach(header => {
    header.addEventListener('click', () => {
        const targetId = header.dataset.toggle;
        const content = document.getElementById(targetId);
        const icon = header.querySelector('.collapse-icon');

        content.classList.toggle('collapsed');
        if (content.classList.contains('collapsed')) {
            icon.style.transform = 'rotate(-90deg)';
        } else {
            icon.style.transform = 'rotate(0)';
        }
    });
});

// ===== TASK MODAL (NEW) =====
const modalOverlay = document.getElementById('modal-overlay');
const newTaskBtn = document.getElementById('new-task-btn');
const modalClose = document.getElementById('modal-close');
const cancelBtn = document.getElementById('cancel-btn');
const taskForm = document.getElementById('task-form');

newTaskBtn.addEventListener('click', () => modalOverlay.classList.add('active'));
modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
cancelBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTask = {
        id: 't' + Date.now(),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        assignee: document.getElementById('task-assignee').value,
        priority: document.getElementById('task-priority-input').value,
        status: document.getElementById('task-status-input').value,
        tags: document.getElementById('task-tags-input').value.split(',').map(t => t.trim()).filter(Boolean),
        due: document.getElementById('task-due-input').value || null,
    };

    tasks.unshift(newTask);
    renderKanban();
    addActivityEntry(newTask.assignee, 'task', `📋 New task created: "${newTask.title}"`);
    modalOverlay.classList.remove('active');
    taskForm.reset();
});

// ===== TASK DETAIL MODAL =====
function showTaskDetail(task) {
    const overlay = document.getElementById('detail-modal-overlay');
    const bot = BOTS[task.assignee];
    document.getElementById('detail-title').textContent = task.title;
    document.getElementById('detail-body').innerHTML = `
        <div class="detail-field">
            <div class="detail-field-label">Description</div>
            <div class="detail-field-value">${task.description || 'No description'}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="detail-field">
                <div class="detail-field-label">Assignee</div>
                <div class="detail-field-value">${bot ? bot.emoji + ' ' + bot.name : 'Unassigned'}</div>
            </div>
            <div class="detail-field">
                <div class="detail-field-label">Priority</div>
                <div class="detail-field-value" style="text-transform:capitalize">${task.priority}</div>
            </div>
            <div class="detail-field">
                <div class="detail-field-label">Status</div>
                <div class="detail-field-value" style="text-transform:capitalize">${task.status.replace('-', ' ')}</div>
            </div>
            <div class="detail-field">
                <div class="detail-field-label">Due Date</div>
                <div class="detail-field-value">${task.due ? formatDate(task.due) : 'None'}</div>
            </div>
        </div>
        <div class="detail-field">
            <div class="detail-field-label">Tags</div>
            <div class="task-tags" style="margin-top:4px;">
                ${task.tags.map(t => `<span class="task-tag ${getTagClass(t)}">${t}</span>`).join('')}
            </div>
        </div>
    `;
    overlay.classList.add('active');

    document.getElementById('detail-delete-btn').onclick = () => {
        tasks = tasks.filter(t => t.id !== task.id);
        renderKanban();
        overlay.classList.remove('active');
        addActivityEntry(task.assignee || 'iva', 'task', `🗑️ Deleted task: "${task.title}"`);
    };
}

document.getElementById('detail-modal-close').addEventListener('click', () => {
    document.getElementById('detail-modal-overlay').classList.remove('active');
});

document.getElementById('detail-close-btn').addEventListener('click', () => {
    document.getElementById('detail-modal-overlay').classList.remove('active');
});

document.getElementById('detail-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal-overlay') {
        e.target.classList.remove('active');
    }
});

// ===== UTILITY FUNCTIONS =====
function formatTokens(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function formatTimeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDueClass(dateStr) {
    if (!dateStr) return '';
    const due = new Date(dateStr + 'T23:59:59');
    const now = new Date();
    const diffDays = (due - now) / 86400000;
    if (diffDays < 0) return 'overdue';
    if (diffDays < 2) return 'soon';
    return '';
}

function getTagClass(tag) {
    const map = { ars: 'ars', dev: 'dev', marketing: 'marketing', infra: 'infra', personal: 'personal', crm: 'crm', urgent: 'urgent' };
    return map[tag.toLowerCase()] || 'default';
}

function capitalize(s) {
    return s.replace(/(^|\s|-)\w/g, c => c.toUpperCase());
}

// ===== INIT =====
renderAll();
startAutoRefresh();
refreshDashboard();

// Log ready
console.log('🎯 Mission Control loaded — Swarm dashboard active');
console.log('Bots:', Object.keys(BOTS).join(', '));
console.log('Auto-refresh: 30s');
