#!/usr/bin/env node
/**
 * Mission Control Relay Daemon
 * Bridges MC Dashboard (Cloudflare) ↔ OpenClaw Agent Gateways (WebSocket)
 * 
 * Polls MC API for pending messages, routes them to the correct agent's
 * OpenClaw gateway via WebSocket, captures responses, pushes back to MC.
 */

import { createRequire } from 'module';
import { randomUUID } from 'crypto';

const require = createRequire('/opt/homebrew/lib/node_modules/openclaw/');
const WebSocket = require('ws');

// === CONFIG ===
const MC_API = 'https://mission-control-5sz.pages.dev/api/chat';
const MC_TOKEN = 'mc-live-2026-intuitive';
const POLL_INTERVAL_MS = 3000;

// Agent → Gateway mapping
const AGENTS = {
  iva:           { host: 'localhost', port: 18789, token: '4d4474598afc110562288d96225a335369ed0ecc68416b26' },
  joy:           { host: 'localhost', port: 18795, token: '' },  // TODO: get JOY's token
  // Droplet agents (bound to 0.0.0.0)
  arvis_sales:   { host: '137.184.6.184', port: 18794, token: 'c614714665d23dfbc535e4db994c834caf46c6f8c1816d0f2bb7154304e02b32' },
  arvis_recruit: { host: '137.184.6.184', port: 18795, token: 'recruiting-arvis-2026' },
  arvis_admin:   { host: '137.184.6.184', port: 18800, token: 'admin-arvis-2026' },
  arvis_prod:    { host: '137.184.6.184', port: 18796, token: 'production-arvis-2026' },
  scout:         { host: '137.184.6.184', port: 18801, token: 'scout-linkedin-2026' },  // TODO: verify port/token
  // These are bound to 127.0.0.1 on droplet - need SSH tunnel or droplet relay
  // ivan:       { host: '137.184.6.184', port: 18789, token: 'e666fef9b12f...' },
  // tia:        { host: '137.184.6.184', port: 18790, token: '683abb241845...' },
};

// === GATEWAY WS CLIENT ===
class GatewayClient {
  constructor(agentId, config) {
    this.agentId = agentId;
    this.config = config;
    this.ws = null;
    this.connected = false;
    this.pendingRequests = new Map();
    this.messageBuffer = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const url = `ws://${this.config.host}:${this.config.port}/`;
      this.ws = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new Error(`Connection timeout for ${this.agentId}`));
      }, 10000);

      this.ws.on('open', () => {
        log(`[${this.agentId}] WS connected to ${url}`);
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this._handleMessage(msg, resolve, reject, timeout);
        } catch (e) {
          log(`[${this.agentId}] Parse error: ${e.message}`);
        }
      });

      this.ws.on('error', (err) => {
        log(`[${this.agentId}] WS error: ${err.message}`);
        clearTimeout(timeout);
        reject(err);
      });

      this.ws.on('close', (code, reason) => {
        log(`[${this.agentId}] WS closed: ${code} ${reason}`);
        this.connected = false;
      });
    });
  }

  _handleMessage(msg, resolve, reject, timeout) {
    // Handle challenge
    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      const connectParams = {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'webchat',
          version: '1.0.0',
          platform: 'mc-relay',
          mode: 'backend'
        }
      };
      
      // Always provide auth token for the gateway
      connectParams.auth = { token: this.config.token || '' };

      this.ws.send(JSON.stringify({
        type: 'req',
        id: randomUUID(),
        method: 'connect',
        params: connectParams
      }));
      return;
    }

    // Handle connect response
    if (msg.type === 'res' && !this.connected) {
      if (msg.ok !== false) {
        this.connected = true;
        log(`[${this.agentId}] Authenticated!`);
        clearTimeout(timeout);
        resolve();
      } else {
        log(`[${this.agentId}] Auth failed: ${msg.error?.message || JSON.stringify(msg.error)}`);
        clearTimeout(timeout);
        reject(new Error(msg.error?.message || 'auth failed'));
      }
      return;
    }

    // Handle response to our requests
    if (msg.type === 'res' && msg.id) {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        this.pendingRequests.delete(msg.id);
        if (msg.ok === false) {
          pending.reject(new Error(msg.error?.message || 'request failed'));
        } else {
          pending.resolve(msg.result || msg.payload || msg);
        }
      }
      return;
    }

    // Handle all events
    if (msg.type === 'event') {
      if (msg.event === 'chat') {
        const p = msg.payload;
        log(`[${this.agentId}] Chat event: state=${p.state} msgLen=${p.message?.content?.length || 0}`);
        this.messageBuffer.push(p);
      }
    }
  }

  async request(method, params) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Not connected to ${this.agentId}`);
    }

    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 120000); // 2 min timeout for chat.send

      this.pendingRequests.set(id, {
        resolve: (result) => { clearTimeout(timeout); resolve(result); },
        reject: (err) => { clearTimeout(timeout); reject(err); }
      });

      this.ws.send(JSON.stringify({ type: 'req', id, method, params }));
    });
  }

  async sendChat(message, sessionKey = 'main') {
    this.messageBuffer = [];
    
    // Send the message
    const result = await this.request('chat.send', {
      sessionKey,
      message,
      idempotencyKey: randomUUID(),
    });
    
    log(`[${this.agentId}] chat.send result: ${JSON.stringify(result).slice(0, 200)}`);
    
    // Wait for the agent to finish processing
    // chat.send is non-blocking - it returns immediately with runId
    if (result?.runId || result?.status === 'started') {
      // Poll for completion by waiting for chat events
      const response = await this._waitForResponse(result.runId, 120000);
      return response;
    }
    
    return result;
  }

  async _waitForResponse(runId, timeoutMs) {
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
      // Check for completed state
      const doneEvent = this.messageBuffer.find(e => 
        e.state === 'done' || e.state === 'complete' || e.state === 'final'
      );
      
      if (doneEvent) {
        // Get the final message content
        const content = doneEvent.message?.content;
        if (content) {
          // Content can be a string or array of content blocks
          if (typeof content === 'string') return content;
          if (Array.isArray(content)) {
            return content
              .filter(b => b.type === 'text')
              .map(b => b.text)
              .join('\n');
          }
        }
        // Fallback: find the last chat event with message content
        for (let i = this.messageBuffer.length - 1; i >= 0; i--) {
          const m = this.messageBuffer[i].message;
          if (m?.content) {
            const c = m.content;
            if (typeof c === 'string') return c;
            if (Array.isArray(c)) return c.filter(b => b.type === 'text').map(b => b.text).join('\n');
          }
        }
        return '[Done but no content found]';
      }

      await sleep(500);
    }

    // Timeout - log what we have and return last known content
    log(`[${this.agentId}] Timeout waiting for response. Buffer has ${this.messageBuffer.length} events`);
    for (const e of this.messageBuffer) {
      if (e.message?.content) {
        const c = e.message.content;
        if (typeof c === 'string') return c;
        if (Array.isArray(c)) return c.filter(b => b.type === 'text').map(b => b.text).join('\n');
      }
    }
    
    return '[Response timeout]';
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}

// === MC API HELPERS ===
async function mcFetch(path, options = {}) {
  const url = `${MC_API}${path}${path.includes('?') ? '&' : '?'}token=${MC_TOKEN}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-MC-Token': MC_TOKEN,
      ...(options.headers || {})
    }
  });
  return res.json();
}

async function getPendingMessages() {
  // Get all threads and check for pending messages
  const data = await mcFetch('');
  const threads = data.threads || [];
  
  const pending = [];
  for (const thread of threads) {
    const threadData = await mcFetch(`?threadId=${thread.id}`);
    const messages = threadData.messages || [];
    
    // Find pending agent messages (these need responses)
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'agent' && msg.status === 'pending') {
        // Find the user message that triggered this
        const userMsg = messages.slice(0, i).reverse().find(m => m.role === 'user');
        if (userMsg) {
          pending.push({
            threadId: thread.id,
            agentId: thread.agent_id,
            messageId: msg.id,
            userContent: userMsg.content,
          });
        }
      }
    }
  }
  
  return pending;
}

async function pushResponse(threadId, messageId, content, status = 'delivered') {
  return mcFetch('', {
    method: 'PUT',
    body: JSON.stringify({ threadId, messageId, content, status })
  });
}

// === UTILS ===
function log(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// === MAIN LOOP ===
const clients = {};

async function getOrConnectClient(agentId) {
  if (clients[agentId]?.connected) return clients[agentId];
  
  const config = AGENTS[agentId];
  if (!config) {
    log(`No gateway config for agent: ${agentId}`);
    return null;
  }

  const client = new GatewayClient(agentId, config);
  try {
    await client.connect();
    clients[agentId] = client;
    return client;
  } catch (e) {
    log(`Failed to connect to ${agentId}: ${e.message}`);
    return null;
  }
}

async function processPending() {
  try {
    const pending = await getPendingMessages();
    
    if (pending.length === 0) return;
    
    log(`Found ${pending.length} pending message(s)`);
    
    for (const msg of pending) {
      log(`Processing: ${msg.agentId} <- "${msg.userContent.slice(0, 50)}..."`);
      
      const client = await getOrConnectClient(msg.agentId);
      if (!client) {
        await pushResponse(msg.threadId, msg.messageId, 
          `[Relay error: Cannot connect to ${msg.agentId} gateway]`, 'error');
        continue;
      }

      try {
        const response = await client.sendChat(msg.userContent);
        log(`Response from ${msg.agentId}: "${(response || '').slice(0, 80)}..."`);
        await pushResponse(msg.threadId, msg.messageId, response || '[Empty response]');
      } catch (e) {
        log(`Error from ${msg.agentId}: ${e.message}`);
        await pushResponse(msg.threadId, msg.messageId, 
          `[Agent error: ${e.message}]`, 'error');
      }
    }
  } catch (e) {
    log(`Poll error: ${e.message}`);
  }
}

async function main() {
  log('=== MC Relay Daemon Starting ===');
  log(`MC API: ${MC_API}`);
  log(`Agents: ${Object.keys(AGENTS).join(', ')}`);
  log(`Poll interval: ${POLL_INTERVAL_MS}ms`);
  log('');

  // Main polling loop
  while (true) {
    await processPending();
    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
