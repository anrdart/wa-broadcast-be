# Docker Rebuild Script for WhatsApp Broadcast (PowerShell)
# This script rebuilds and restarts the Docker container with latest changes

Write-Host "🔄 Rebuilding WhatsApp Broadcast Docker Container..." -ForegroundColor Cyan

# Stop and remove existing container
Write-Host "📦 Stopping existing container..." -ForegroundColor Yellow
docker-compose down

# Remove old images (optional - uncomment if you want to force rebuild)
# Write-Host "🗑️  Removing old images..." -ForegroundColor Yellow
# docker rmi wa-broadcast_wa-broadcast 2>$null

# Rebuild and start
Write-Host "🏗️  Building new container..." -ForegroundColor Green
docker-compose build --no-cache

Write-Host "🚀 Starting container..." -ForegroundColor Green
docker-compose up -d

# Show logs
Write-Host "📋 Container logs:" -ForegroundColor Cyan
docker-compose logs -f wa-broadcast

Write-Host "✅ Rebuild complete! Container is running." -ForegroundColor Green
Write-Host "🌐 Access the application at: http://localhost:3000" -ForegroundColor White
Write-Host "📊 Health check: http://localhost:3000/health" -ForegroundColor White
Write-Host "📋 To view logs: docker-compose logs -f wa-broadcast" -ForegroundColor White
Write-Host "🛑 To stop: docker-compose down" -ForegroundColor White