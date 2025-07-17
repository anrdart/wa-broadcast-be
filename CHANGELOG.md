# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2024-12-19

### Fixed
- **Critical**: Fixed Chrome session closure issue in Docker environments
- Added comprehensive Chrome launch arguments for Docker stability
- Increased shared memory size (2GB) in docker-compose.yml
- Added memory limits (2GB) to prevent container crashes
- Enabled software rendering (swiftshader) for better compatibility
- Removed duplicate Chrome arguments to prevent conflicts
- Updated Dockerfile to use direct node execution with memory limits

### Added
- Docker-specific Chrome flags for enhanced stability
- Memory and swap limits in docker-compose.yml
- Troubleshooting section for Chrome session closure errors
- Comprehensive documentation for Docker-related issues

### Changed
- Improved Chrome launch configuration for containerized environments
- Enhanced Docker container resource allocation
- Updated troubleshooting documentation with new error scenarios

## [1.2.0] - 2024-12-18

### Added
- **Docker Support**: Complete Docker configuration with Dockerfile and docker-compose.yml
- **Health Check Endpoint**: Added `/health` endpoint for monitoring
- **Nginx Configuration**: Reverse proxy setup with rate limiting and security headers
- **Multi-platform Scripts**: Docker rebuild scripts for Windows (Batch/PowerShell) and Linux/Mac (Bash)
- **Comprehensive Documentation**: Detailed deployment guides and troubleshooting

### Fixed
- **Vercel Deployment Issues**: Documented why Vercel deployment fails and provided alternatives
- **ESLint Configuration**: Fixed indentation rules and code formatting
- **Dependency Management**: Moved `dotenv` from devDependencies to dependencies
- **Security Improvements**: Enhanced container security and best practices

### Changed
- **Package Scripts**: Added Docker management and linting scripts
- **Documentation**: Updated README.md with deployment alternatives
- **Performance**: Optimized Docker build process with .dockerignore

### Deployment
- **Recommended Platforms**: Docker (primary), VPS/Dedicated Server, Cloud platforms with container support
- **Not Supported**: Vercel (due to Chrome dependencies and serverless limitations)

## [1.1.0] - 2024-12-17

### Added
- WhatsApp Web.js integration for broadcast messaging
- Real-time WebSocket communication
- Contact management and filtering
- Broadcast progress tracking
- Session management with LocalAuth
- Express.js web server with static file serving

### Features
- QR code authentication
- Contact loading and validation
- Message broadcasting with delays
- Media message support
- WebSocket real-time updates
- Session persistence

## [1.0.0] - 2024-12-16

### Added
- Initial project setup
- Basic WhatsApp broadcast functionality
- Web interface for message sending
- Contact management system
- Authentication handling