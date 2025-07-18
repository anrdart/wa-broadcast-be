#!/bin/bash

# Start Xvfb (X Virtual Framebuffer) for headless browser
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
XVFB_PID=$!

# Wait a moment for Xvfb to start
sleep 2

# Set display environment variable
export DISPLAY=:99

# Function to cleanup on exit
cleanup() {
    echo "Cleaning up..."
    kill $XVFB_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start the Node.js application
echo "Starting WhatsApp Broadcast API..."
node server.js