#!/usr/bin/env node

/**
 * Replit Monitoring Script
 * Simple monitoring and health check for WhatsApp Broadcast API on Replit
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class ReplitMonitor {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.baseUrl = process.env.API_BASE_URL || `http://localhost:${this.port}`;
        this.logFile = path.join(__dirname, 'logs', 'monitor.log');
        this.healthCheckInterval = 30000; // 30 seconds
        this.maxLogSize = 1024 * 1024; // 1MB
        
        this.ensureLogDirectory();
    }
    
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}\n`;
        
        // Console output
        console.log(logMessage.trim());
        
        // File output
        try {
            // Rotate log if too large
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.maxLogSize) {
                    const backupFile = this.logFile + '.old';
                    fs.renameSync(this.logFile, backupFile);
                }
            }
            
            fs.appendFileSync(this.logFile, logMessage);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }
    
    async healthCheck() {
        return new Promise((resolve) => {
            const url = `${this.baseUrl}/health`;
            const startTime = Date.now();
            
            const req = http.get(url, (res) => {
                const responseTime = Date.now() - startTime;
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve({
                            success: true,
                            status: res.statusCode,
                            responseTime,
                            data: result
                        });
                    } catch (error) {
                        resolve({
                            success: false,
                            status: res.statusCode,
                            responseTime,
                            error: 'Invalid JSON response'
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    success: false,
                    responseTime,
                    error: error.message
                });
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                resolve({
                    success: false,
                    responseTime,
                    error: 'Request timeout'
                });
            });
        });
    }
    
    async checkWhatsAppStatus() {
        return new Promise((resolve) => {
            const url = `${this.baseUrl}/status`;
            
            const req = http.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve({
                            success: true,
                            status: res.statusCode,
                            data: result
                        });
                    } catch (error) {
                        resolve({
                            success: false,
                            status: res.statusCode,
                            error: 'Invalid JSON response'
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout'
                });
            });
        });
    }
    
    getSystemInfo() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        return {
            uptime: process.uptime(),
            memory: {
                rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
                external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        };
    }
    
    async runHealthCheck() {
        this.log('Running health check...');
        
        // API Health Check
        const healthResult = await this.healthCheck();
        if (healthResult.success) {
            this.log(`API Health: OK (${healthResult.responseTime}ms)`);
        } else {
            this.log(`API Health: FAILED - ${healthResult.error}`, 'ERROR');
        }
        
        // WhatsApp Status Check
        const waStatus = await this.checkWhatsAppStatus();
        if (waStatus.success) {
            const status = waStatus.data.whatsapp?.status || 'unknown';
            this.log(`WhatsApp Status: ${status}`);
        } else {
            this.log(`WhatsApp Status: FAILED - ${waStatus.error}`, 'WARN');
        }
        
        // System Info
        const sysInfo = this.getSystemInfo();
        this.log(`System: Uptime ${Math.round(sysInfo.uptime)}s, Memory ${sysInfo.memory.heapUsed}/${sysInfo.memory.heapTotal}`);
        
        return {
            health: healthResult,
            whatsapp: waStatus,
            system: sysInfo,
            timestamp: new Date().toISOString()
        };
    }
    
    start() {
        this.log('Starting Replit Monitor...');
        this.log(`Monitoring API at: ${this.baseUrl}`);
        this.log(`Health check interval: ${this.healthCheckInterval}ms`);
        
        // Initial health check
        this.runHealthCheck();
        
        // Periodic health checks
        setInterval(() => {
            this.runHealthCheck();
        }, this.healthCheckInterval);
        
        // Handle process signals
        process.on('SIGINT', () => {
            this.log('Received SIGINT, shutting down monitor...');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.log('Received SIGTERM, shutting down monitor...');
            process.exit(0);
        });
        
        this.log('Monitor started successfully');
    }
    
    // Static method for one-time health check
    static async quickCheck() {
        const monitor = new ReplitMonitor();
        const result = await monitor.runHealthCheck();
        return result;
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        // Quick health check
        ReplitMonitor.quickCheck()
            .then(result => {
                console.log('\n=== Quick Health Check ===');
                console.log(JSON.stringify(result, null, 2));
                process.exit(result.health.success ? 0 : 1);
            })
            .catch(error => {
                console.error('Health check failed:', error);
                process.exit(1);
            });
    } else {
        // Start continuous monitoring
        const monitor = new ReplitMonitor();
        monitor.start();
    }
}

module.exports = ReplitMonitor;