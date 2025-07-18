#!/bin/bash

# Docker Rebuild Script for WhatsApp Broadcast
# This script rebuilds and restarts the Docker container with latest changes

echo "🔄 Rebuilding WhatsApp Broadcast Docker Container..."

# Stop and remove existing container
echo "📦 Stopping existing container..."
docker-compose down

# Remove old images (optional - uncomment if you want to force rebuild)
# echo "🗑️  Removing old images..."
# docker rmi wa-broadcast_wa-broadcast 2>/dev/null || true

# Rebuild and start
echo "🏗️  Building new container..."
docker-compose build --no-cache

echo "🚀 Starting container..."
docker-compose up -d

# Show logs
echo "📋 Container logs:"
docker-compose logs -f wa-broadcast

echo "✅ Rebuild complete! Container is running."
echo "🌐 Access the application at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/health"
echo "📋 To view logs: docker-compose logs -f wa-broadcast"
echo "🛑 To stop: docker-compose down"