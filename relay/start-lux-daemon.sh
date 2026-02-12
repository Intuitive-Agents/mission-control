#!/bin/bash
# Start Lux Browser Daemon
cd "$(dirname "$0")"
exec python3 lux-daemon.py >> /tmp/lux-daemon.log 2>&1
