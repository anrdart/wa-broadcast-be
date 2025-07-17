#!/bin/bash

# WhatsApp Broadcast Backend - Production Deployment Script
# This script helps deploy the backend to Docker for production use

set -e

echo "🚀 Starting WhatsApp Broadcast Backend Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p sessions logs ssl

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from .env.production..."
    cp .env.production .env
    print_warning "Please edit .env file with your specific configuration before running the application."
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Remove old images (optional)
read -p "Do you want to remove old Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing old Docker images..."
    docker image prune -f
    docker rmi wa-broadcast-be_wa-broadcast 2>/dev/null || true
fi

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    print_success "Services are running successfully!"
    
    # Display service status
    echo ""
    print_status "Service Status:"
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    print_status "Service URLs:"
    echo "  - Backend API: http://localhost:3000"
    echo "  - Health Check: http://localhost:3000/health"
    echo "  - Nginx Proxy: http://localhost:80"
    
    echo ""
    print_status "Useful Commands:"
    echo "  - View logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "  - Stop services: docker-compose -f docker-compose.production.yml down"
    echo "  - Restart services: docker-compose -f docker-compose.production.yml restart"
    
    echo ""
    print_success "Deployment completed successfully! 🎉"
    print_warning "Don't forget to:"
    echo "  1. Update FRONTEND_URL in .env with your Vercel domain"
    echo "  2. Update CORS origins in nginx.production.conf"
    echo "  3. Configure SSL certificates for HTTPS (if needed)"
    
else
    print_error "Some services failed to start. Check logs with:"
    echo "docker-compose -f docker-compose.production.yml logs"
    exit 1
fi