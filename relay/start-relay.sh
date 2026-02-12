#!/bin/bash
# Start MC Relay Daemon
cd "$(dirname "$0")"
exec node mc-relay.mjs >> /tmp/mc-relay.log 2>&1
