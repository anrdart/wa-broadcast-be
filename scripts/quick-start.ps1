# WhatsApp Broadcast Backend - Quick Start Script
# This script automates the entire deployment process

param(
    [string]$FrontendUrl = "",
    [switch]$SkipTests = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "WhatsApp Broadcast Backend - Quick Start" -ForegroundColor Blue
    Write-Host "Usage: .\quick-start.ps1 [-FrontendUrl <url>] [-SkipTests] [-Help]" -ForegroundColor White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  -FrontendUrl    Your Vercel frontend URL (e.g., https://your-app.vercel.app)" -ForegroundColor White
    Write-Host "  -SkipTests      Skip API testing after deployment" -ForegroundColor White
    Write-Host "  -Help           Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\quick-start.ps1" -ForegroundColor White
    Write-Host "  .\quick-start.ps1 -FrontendUrl https://my-app.vercel.app" -ForegroundColor White
    Write-Host "  .\quick-start.ps1 -SkipTests" -ForegroundColor White
    exit 0
}

Write-Host "WhatsApp Broadcast Backend - Quick Start" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
Write-Host ""

# Function to print colored output
function Write-Step {
    param([string]$Message, [int]$Step)
    Write-Host "[$Step] $Message" -ForegroundColor Cyan
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

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Step 1: Check Prerequisites
Write-Step "Checking Prerequisites..." 1

try {
    docker --version | Out-Null
    Write-Success "Docker is installed"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    Write-Info "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Success "Docker Compose is installed"
} catch {
    Write-Error "Docker Compose is not installed."
    exit 1
}

try {
    node --version | Out-Null
    Write-Success "Node.js is installed"
} catch {
    Write-Warning "Node.js not found. Some testing features may not work."
}

# Step 2: Setup Environment
Write-Step "Setting up Environment..." 2

# Create necessary directories
if (!(Test-Path "sessions")) { 
    New-Item -ItemType Directory -Path "sessions" | Out-Null
    Write-Success "Created sessions directory"
}
if (!(Test-Path "logs")) { 
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Success "Created logs directory"
}
if (!(Test-Path "ssl")) { 
    New-Item -ItemType Directory -Path "ssl" | Out-Null
    Write-Success "Created ssl directory"
}

# Setup environment file
if (!(Test-Path ".env")) {
    Copy-Item ".env.production" ".env"
    Write-Success "Created .env file from template"
    
    if ($FrontendUrl) {
        Write-Info "Updating .env with frontend URL: $FrontendUrl"
        $envContent = Get-Content ".env" -Raw
        $envContent = $envContent -replace "https://your-frontend.vercel.app", $FrontendUrl
        $envContent = $envContent -replace "http://your-server-ip:3000", "http://localhost:3000"
        Set-Content ".env" $envContent
        Write-Success "Updated .env with your frontend URL"
    } else {
        Write-Warning "No frontend URL provided. Please edit .env file manually."
    }
} else {
    Write-Info ".env file already exists"
}

# Step 3: Check Environment Variables
Write-Step "Checking Environment Variables..." 3

if (Test-Path "check-environment.js") {
    try {
        $envCheck = node check-environment.js 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Environment variables check passed"
        } else {
            Write-Warning "Some environment variables may need attention"
            Write-Info "Run 'node check-environment.js' for detailed analysis"
        }
    } catch {
        Write-Warning "Could not run environment check (Node.js required)"
    }
} else {
    Write-Info "Environment checker not found, skipping..."
}

# Step 4: Stop existing containers
Write-Step "Stopping existing containers..." 4

try {
    docker-compose -f docker-compose.production.yml down --remove-orphans 2>$null
    Write-Success "Stopped existing containers"
} catch {
    Write-Info "No existing containers to stop"
}

# Step 5: Build and Deploy
Write-Step "Building and deploying containers..." 5

Write-Info "This may take a few minutes on first run..."

try {
    # Build containers
    Write-Info "Building Docker images..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
    
    Write-Success "Docker images built successfully"
    
    # Start containers
    Write-Info "Starting containers..."
    docker-compose -f docker-compose.production.yml up -d
    
    if ($LASTEXITCODE -ne 0) {
        throw "Container startup failed"
    }
    
    Write-Success "Containers started successfully"
    
} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    Write-Info "Check logs with: docker-compose -f docker-compose.production.yml logs"
    exit 1
}

# Step 6: Wait for services
Write-Step "Waiting for services to be ready..." 6

Write-Info "Waiting 15 seconds for services to initialize..."
Start-Sleep -Seconds 15

# Check if containers are running
$runningContainers = docker-compose -f docker-compose.production.yml ps --services --filter "status=running"
if ($runningContainers) {
    Write-Success "Services are running"
} else {
    Write-Error "Some services failed to start"
    docker-compose -f docker-compose.production.yml ps
    exit 1
}

# Step 7: Test deployment
if (!$SkipTests) {
    Write-Step "Testing deployment..." 7
    
    # Test health endpoint
    try {
        Write-Info "Testing health endpoint..."
        $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 10
        if ($response.status -eq "ok") {
            Write-Success "Health check passed"
        } else {
            Write-Warning "Health check returned unexpected status: $($response.status)"
        }
    } catch {
        Write-Warning "Health check failed: $($_.Exception.Message)"
        Write-Info "Service might still be starting up"
    }
    
    # Run API tests if available
    if (Test-Path "test-api.js") {
        try {
            Write-Info "Running comprehensive API tests..."
            node test-api.js
            Write-Success "API tests completed"
        } catch {
            Write-Warning "API tests failed or Node.js not available"
        }
    }
} else {
    Write-Info "Skipping tests as requested"
}

# Step 8: Display results
Write-Step "Deployment Summary" 8

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml ps

Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   Health Check: http://localhost:3000/health" -ForegroundColor White
Write-Host "   API Status: http://localhost:3000/api/status" -ForegroundColor White
Write-Host "   Nginx Proxy: http://localhost:80" -ForegroundColor White

Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "   View logs: docker-compose -f docker-compose.production.yml logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose -f docker-compose.production.yml down" -ForegroundColor White
Write-Host "   Restart services: docker-compose -f docker-compose.production.yml restart" -ForegroundColor White
Write-Host "   Test API: node test-api.js" -ForegroundColor White
Write-Host "   Test frontend connection: node test-backend-connection.js" -ForegroundColor White

Write-Host ""
Write-Host "Next Steps for Frontend Integration:" -ForegroundColor Yellow
Write-Host "   1. Deploy your frontend to Vercel" -ForegroundColor White
Write-Host "   2. Set environment variables in Vercel dashboard:" -ForegroundColor White
Write-Host "      - NEXT_PUBLIC_API_URL=http://your-server-ip:3000" -ForegroundColor Gray
Write-Host "      - NEXT_PUBLIC_WS_URL=ws://your-server-ip:3000" -ForegroundColor Gray
Write-Host "   3. Update CORS settings in nginx.production.conf with your Vercel domain" -ForegroundColor White
Write-Host "   4. Test the integration" -ForegroundColor White

if ($FrontendUrl) {
    Write-Host ""
    Write-Host "Your Frontend URL: $FrontendUrl" -ForegroundColor Cyan
    Write-Host "   Make sure to update your Vercel environment variables!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Important Security Notes:" -ForegroundColor Red
Write-Host "   - This setup is for development/testing" -ForegroundColor White
Write-Host "   - For production, configure SSL/HTTPS" -ForegroundColor White
Write-Host "   - Update firewall rules as needed" -ForegroundColor White
Write-Host "   - Change default passwords and secrets" -ForegroundColor White

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   - Full guide: DEPLOYMENT_GUIDE_VERCEL.md" -ForegroundColor White
Write-Host "   - Troubleshooting: Check the logs and documentation" -ForegroundColor White

Write-Host ""
Write-Success "Quick start completed! Your WhatsApp Broadcast backend is ready!"

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')