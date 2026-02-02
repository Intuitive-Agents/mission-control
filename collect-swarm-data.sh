#!/bin/bash
# ============================================
# MISSION CONTROL — Swarm Data Collector
# Queries each bot's gateway and writes state
# to swarm-state.json for the dashboard.
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/swarm-state.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🎯 Mission Control — Collecting swarm data..."
echo "   Timestamp: $TIMESTAMP"

# ---- Helper: check gateway ----
check_gateway() {
    local name="$1"
    local host="$2"
    local port="$3"
    local is_remote="$4"
    local ssh_host="${5:-}"
    
    local url="http://localhost:${port}/"
    local result=""
    local status="offline"
    
    if [ "$is_remote" = "true" ]; then
        # Remote: SSH + curl
        result=$(ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "root@${ssh_host}" \
            "curl -sf --max-time 5 http://localhost:${port}/ 2>/dev/null" 2>/dev/null || echo "")
    else
        # Local: direct curl
        result=$(curl -sf --max-time 5 "http://localhost:${port}/" 2>/dev/null || echo "")
    fi
    
    if [ -n "$result" ]; then
        status="online"
    fi
    
    echo "$status"
}

# ---- Helper: get openclaw status (local only) ----
get_local_status() {
    local port="$1"
    # Try openclaw status if available
    if command -v openclaw &>/dev/null; then
        openclaw status 2>/dev/null || echo ""
    fi
}

echo ""
echo "--- Checking gateways ---"

# Check each bot
IVA_STATUS=$(check_gateway "Iva" "localhost" "18789" "false")
echo "  Iva (localhost:18789):        $IVA_STATUS"

IVAN_STATUS=$(check_gateway "IVAN" "137.184.6.184" "18789" "true" "137.184.6.184")
echo "  IVAN (137.184.6.184:18789):   $IVAN_STATUS"

TIA_STATUS=$(check_gateway "T.I.A." "137.184.6.184" "18790" "true" "137.184.6.184")
echo "  T.I.A. (137.184.6.184:18790): $TIA_STATUS"

JOY_STATUS=$(check_gateway "JOY" "localhost" "18795" "false")
echo "  JOY (localhost:18795):         $JOY_STATUS"

# ---- Build JSON ----
# Using a heredoc for clean JSON generation
cat > "$OUTPUT" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "collectedBy": "collect-swarm-data.sh",
    "agents": {
        "iva": {
            "status": "${IVA_STATUS}",
            "sessions": 0,
            "tokensToday": 0,
            "contextUsed": 0,
            "contextMax": 200000,
            "lastHeartbeat": "${TIMESTAMP}",
            "currentTask": null,
            "costToday": 0,
            "messagesToday": 0,
            "uptime": $([ "$IVA_STATUS" = "online" ] && echo "100" || echo "0")
        },
        "ivan": {
            "status": "${IVAN_STATUS}",
            "sessions": 0,
            "tokensToday": 0,
            "contextUsed": 0,
            "contextMax": 128000,
            "lastHeartbeat": "${TIMESTAMP}",
            "currentTask": null,
            "costToday": 0,
            "messagesToday": 0,
            "uptime": $([ "$IVAN_STATUS" = "online" ] && echo "100" || echo "0")
        },
        "tia": {
            "status": "${TIA_STATUS}",
            "sessions": 0,
            "tokensToday": 0,
            "contextUsed": 0,
            "contextMax": 128000,
            "lastHeartbeat": "${TIMESTAMP}",
            "currentTask": null,
            "costToday": 0,
            "messagesToday": 0,
            "uptime": $([ "$TIA_STATUS" = "online" ] && echo "100" || echo "0")
        },
        "joy": {
            "status": "${JOY_STATUS}",
            "sessions": 0,
            "tokensToday": 0,
            "contextUsed": 0,
            "contextMax": 128000,
            "lastHeartbeat": "${TIMESTAMP}",
            "currentTask": null,
            "costToday": 0,
            "messagesToday": 0,
            "uptime": $([ "$JOY_STATUS" = "online" ] && echo "100" || echo "0")
        }
    }
}
EOF

echo ""
echo "✅ Swarm state written to: $OUTPUT"
echo ""
cat "$OUTPUT" | head -5
echo "   ..."
echo ""
echo "Done! Dashboard will pick this up on next refresh."
