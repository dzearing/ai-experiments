#!/bin/bash

# Start both the frontend and mock server for development

echo "Starting development servers..."
echo ""

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $SERVER_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap to clean up on script exit
trap cleanup EXIT INT TERM

# Start the mock server
echo "Starting mock server on port 3000..."
cd server && npm run mock &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Start the frontend dev server
echo ""
echo "Starting frontend on port 5173..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are running!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Mock API: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait