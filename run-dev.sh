#!/bin/bash

# Development Start Script
echo "🔥 Starting Development Servers..."

# Function to handle cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    # Kill all background processes started by this script
    kill $BACKEND_PID $QUEUE_PID $REVERB_PID $FRONTEND_PID $DESKTA_PID 2>/dev/null || true
    kill $(jobs -p) 2>/dev/null || true
    exit
}

trap cleanup SIGINT SIGTERM

# Port Cleaning (Ensure fresh start)
echo "🧹 Cleaning up ports and processes..."
# Kill all php processes to be safe in dev
killall php 2>/dev/null || true

for port in 8000 8080 3050 5173 5174; do
    if command -v fuser &> /dev/null; then
        fuser -k $port/tcp 2>/dev/null || true
    fi
    # Fallback to lsof if fuser fails/missing
    if command -v lsof &> /dev/null; then
        pid=$(lsof -t -i:$port)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
        fi
    fi
done

sleep 1 # Wait a bit for system to release ports

# Start Backend
echo "📡 Starting Backend (Port 8000)..."
cd backend
php artisan serve --port=8000 &
BACKEND_PID=$!
php artisan queue:work &
QUEUE_PID=$!
# Force host to 0.0.0.0 to avoid localhost binding issues
php artisan reverb:start --host=0.0.0.0 --port=8080 &
REVERB_PID=$!
cd ..

# Start Frontend
echo "💻 Starting Frontend..."
cd frontend
if command -v bun &> /dev/null; then
    bun run dev &
elif command -v npm &> /dev/null; then
    npm run dev &
fi
FRONTEND_PID=$!
cd ..

# Start Deskta (Desktop Version)
echo "🖥️ Starting Desktop Version (Port 5174)..."
cd deskta
if command -v bun &> /dev/null; then
    bun run dev &
elif command -v npm &> /dev/null; then
    npm run dev &
fi
DESKTA_PID=$!
cd ..

# Start Whatekster (Foreground for QR Visibility)
echo "📱 Starting Whatekster (WhatsApp Gateway) (Port 3050)..."
echo "👉 Scan the QR Code below if it appears!"
./whatekster/setup-fix.sh
cd whatekster
node server.js
# When node server.js exits (manual stop), cleanup will trigger
cd ..
