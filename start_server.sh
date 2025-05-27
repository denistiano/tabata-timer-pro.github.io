#!/bin/bash

# Kill any existing servers
pkill -f "python3 -m http.server" 2>/dev/null

# Start the HTTP server
echo "Starting Tabata Timer server..."
echo "Open your browser and go to: http://localhost:8080"
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000 --bind 127.0.0.1 