# WhatsApp Broadcast Backend - Production Deployment Script (PowerShell)
# This script helps deploy the backend to Docker for production use on Windows

Write-Host "🚀 Starting WhatsApp Broadcast Backend Production Deployment..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Status "Docker is installed"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Status "Docker Compose is installed"
} catch {
    Write-Error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

# Create necessary directories
Write-Status "Creating necessary directories..."
if (!(Test-Path "sessions")) { New-Item -ItemType Directory -Path "sessions" }
if (!(Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" }
if (!(Test-Path "ssl")) { New-Item -ItemType Directory -Path "ssl" }

# Copy environment file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Status "Creating .env file from .env.production..."
    Copy-Item ".env.production" ".env"
    Write-Warning "Please edit .env file with your specific configuration before running the application."
}

# Stop existing containers
Write-Status "Stopping existing containers..."
try {
    docker-compose -f docker-compose.production.yml down --remove-orphans
} catch {
    Write-Status "No existing containers to stop"
}

# Remove old images (optional)
$removeImages = Read-Host "Do you want to remove old Docker images? (y/N)"
if ($removeImages -eq "y" -or $removeImages -eq "Y") {
    Write-Status "Removing old Docker images..."
    docker image prune -f
    try {
        docker rmi wa-broadcast-be_wa-broadcast
    } catch {
        Write-Status "No old images to remove"
    }
}

# Build and start containers
Write-Status "Building and starting containers..."
try {
    docker-compose -f docker-compose.production.yml build --no-cache
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    Write-Status "Waiting for services to be ready..."
    Start-Sleep -Seconds 10
    
    # Check if services are running
    $runningServices = docker-compose -f docker-compose.production.yml ps
    if ($runningServices -match "Up") {
        Write-Success "Services are running successfully!"
        
        # Display service status
        Write-Host ""
        Write-Status "Service Status:"
        docker-compose -f docker-compose.production.yml ps
        
        Write-Host ""
        Write-Status "Service URLs:"
        Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor White
        Write-Host "  - Health Check: http://localhost:3000/health" -ForegroundColor White
        Write-Host "  - Nginx Proxy: http://localhost:80" -ForegroundColor White
        Write-Host "  - Production Domain: https://wa-broadcast.ekalliptus.my.id" -ForegroundColor Green
        
        Write-Host ""
        Write-Status "Useful Commands:"
        Write-Host "  - View logs: docker-compose -f docker-compose.production.yml logs -f" -ForegroundColor White
        Write-Host "  - Stop services: docker-compose -f docker-compose.production.yml down" -ForegroundColor White
        Write-Host "  - Restart services: docker-compose -f docker-compose.production.yml restart" -ForegroundColor White
        
        Write-Host ""
        Write-Success "Deployment completed successfully! 🎉"
        Write-Warning "Don't forget to:"
        Write-Host "  1. Configure SSL certificates in ssl/ directory for HTTPS" -ForegroundColor Yellow
        Write-Host "  2. Point domain wa-broadcast.ekalliptus.my.id to this server" -ForegroundColor Yellow
        Write-Host "  3. Test HTTPS access after SSL setup" -ForegroundColor Yellow
        
        # Test health endpoint
        Write-Status "Testing health endpoint..."
        try {
            Start-Sleep -Seconds 5
            $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 10
            Write-Success "Health check passed: $($response.status)"
        } catch {
            Write-Warning "Health check failed. Service might still be starting up."
        }
        
    } else {
        Write-Error "Some services failed to start. Check logs with:"
        Write-Host "docker-compose -f docker-compose.production.yml logs" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Error "Failed to build or start containers: $($_.Exception.Message)"
    Write-Host "Check logs with: docker-compose -f docker-compose.production.yml logs" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Success "Deployment script completed!"
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")