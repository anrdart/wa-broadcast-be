/* eslint-disable linebreak-style */
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

class WhatsAppBroadcastServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.whatsappClient = null;
        this.wsClients = new Set();
        this.contacts = [];
        this.isReady = false;
        this.qrSent = false;
        this.lastQR = null;
        
        this.setupExpress();
        this.setupWebSocket();
        this.initializeWhatsApp();
    }

    setupExpress() {
        this.app.use(express.json({ limit: '50mb' }));
        
        // Serve static files from wa-broadcast directory
        this.app.use(express.static(path.join(__dirname, 'wa-broadcast')));
        
        // Health check endpoint for Docker
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                whatsapp: {
                    ready: this.isReady,
                    qrSent: this.qrSent,
                    contactsCount: this.contacts.length
                }
            });
        });
        
        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json({
                ready: this.isReady,
                qrSent: this.qrSent,
                contactsCount: this.contacts.length
            });
        });
        
        // Fallback route for SPA - serve index.html for all non-API routes
        this.app.get('*', (req, res) => {
            // Skip API routes and static files
            if (req.path.startsWith('/api/') || req.path.startsWith('/ws') || req.path.startsWith('/health')) {
                return res.status(404).json({ error: 'Not found' });
            }
            res.sendFile(path.join(__dirname, 'wa-broadcast', 'index.html'));
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected to WebSocket');
            this.wsClients.add(ws);
            
            // Send current status to new client
            if (this.isReady) {
                ws.send(JSON.stringify({ type: 'ready' }));
                if (this.contacts.length > 0) {
                    ws.send(JSON.stringify({ type: 'contacts', contacts: this.contacts }));
                }
            } else if (this.lastQR) {
                ws.send(JSON.stringify({ type: 'qr', qr: this.lastQR }));
            }
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({ type: 'error', message: error.message }));
                }
            });
            
            ws.on('close', () => {
                console.log('Client disconnected from WebSocket');
                this.wsClients.delete(ws);
            });
        });
    }

    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
        case 'connect':
            if (!this.whatsappClient) {
                this.initializeWhatsApp();
            }
            break;
            
        case 'get_contacts':
            await this.loadContacts();
            break;
            
        case 'send_broadcast':
            await this.sendBroadcast(data);
            break;
            
        case 'logout':
            await this.logout();
            break;
            
        default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
    }

    async initializeWhatsApp(retries = 3) {
        if (this.whatsappClient) {
            return;
        }
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Initializing WhatsApp client (attempt ${attempt})...`);
                
                // Load environment variables
                require('dotenv').config();
                
                // Detect environment
                const isReplit = process.env.REPL_ID || process.env.REPL_SLUG;
                const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT;
                
                // Replit-optimized Puppeteer configuration
                const puppeteerConfig = {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--disable-extensions',
                        '--disable-component-extensions-with-background-pages',
                        '--disable-default-apps',
                        '--mute-audio',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-features=TranslateUI',
                        '--disable-ipc-flooding-protection',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-breakpad',
                        '--disable-canvas-aa',
                        '--disable-2d-canvas-clip-aa',
                        '--disable-gl-drawing-for-tests',
                        '--use-gl=swiftshader',
                        '--enable-webgl',
                        '--hide-scrollbars',
                        '--disable-infobars',
                        '--disable-logging',
                        '--disable-login-animations',
                        '--disable-notifications',
                        '--disable-gpu-sandbox',
                        '--disable-software-rasterizer',
                        '--disable-field-trial-config',
                        '--disable-back-forward-cache',
                        '--disable-hang-monitor',
                        '--disable-prompt-on-repost',
                        '--disable-sync',
                        '--disable-translate',
                        '--metrics-recording-only',
                        '--no-crash-upload',
                        '--no-default-browser-check',
                        '--no-pings',
                        '--password-store=basic',
                        '--use-mock-keychain',
                        '--disable-component-update',
                        '--disable-domain-reliability',
                        '--disable-features=AudioServiceOutOfProcess,VizDisplayCompositor',
                        '--enable-automation',
                        '--disable-client-side-phishing-detection'
                    ]
                };
                
                // Replit-specific optimizations
                if (isReplit) {
                    puppeteerConfig.args.push(
                        '--single-process',
                        '--disable-background-networking',
                        '--disable-popup-blocking',
                        '--disable-background-timer-throttling',
                        '--disable-renderer-backgrounding',
                        '--disable-backgrounding-occluded-windows',
                        '--memory-pressure-off'
                    );
                    
                    // Use system Chromium in Replit
                    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                        puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
                    } else if (process.env.CHROME_PATH) {
                        puppeteerConfig.executablePath = process.env.CHROME_PATH;
                    }
                }
                
                // Add production-specific configurations
                if (isProduction) {
                    puppeteerConfig.args.push(
                        '--single-process', // Use single process in production
                        '--disable-background-networking',
                        '--disable-popup-blocking',
                        '--safebrowsing-disable-auto-update'
                    );
                    
                    // Try to use system Chrome if available
                    const possibleChromePaths = [
                        process.env.CHROME_PATH, // Custom path from environment
                        '/usr/bin/google-chrome-stable',
                        '/usr/bin/google-chrome',
                        '/usr/bin/chromium-browser',
                        '/usr/bin/chromium'
                    ].filter(Boolean); // Remove undefined values
                    
                    for (const chromePath of possibleChromePaths) {
                        try {
                            const fs = require('fs');
                            if (fs.existsSync(chromePath)) {
                                puppeteerConfig.executablePath = chromePath;
                                console.log(`Using system Chrome at: ${chromePath}`);
                                break;
                            }
                        } catch (error) {
                            // Continue to next path
                        }
                    }
                }
                
                // Configure auth strategy with custom session path if provided
                const authConfig = {
                    clientId: 'broadcast-client'
                };
                
                if (process.env.SESSION_PATH) {
                    authConfig.dataPath = process.env.SESSION_PATH;
                }
                
                this.whatsappClient = new Client({
                    authStrategy: new LocalAuth(authConfig),
                    puppeteer: puppeteerConfig
                });
                
                this.whatsappClient.on('qr', (qr) => {
                    console.log('QR Code received');
                    this.lastQR = qr;
                    if (!this.qrSent) {
                        this.broadcast({ type: 'qr', qr });
                        this.qrSent = true;
                    }
                });
                
                this.whatsappClient.on('authenticated', () => {
                    console.log('WhatsApp authenticated');
                    this.broadcast({ type: 'authenticated' });
                });
                
                this.whatsappClient.on('auth_failure', (msg) => {
                    console.error('Authentication failure:', msg);
                    this.broadcast({ type: 'error', message: 'Authentication failed: ' + msg });
                });
                
                this.whatsappClient.on('ready', async () => {
                    console.log('WhatsApp client is ready');
                    this.isReady = true;
                    this.qrSent = false; // Reset for next time
                    this.broadcast({ type: 'ready' });
                    await this.loadContacts();
                });
                
                this.whatsappClient.on('disconnected', (reason) => {
                    console.log('WhatsApp disconnected:', reason);
                    this.isReady = false;
                    this.whatsappClient = null;
                    this.qrSent = false;
                    this.lastQR = null;
                    this.broadcast({ type: 'disconnected', message: 'WhatsApp disconnected: ' + reason });
                    this.initializeWhatsApp(); // Reinitialize on disconnect
                });
                
                await this.whatsappClient.initialize();
                return; // Success, exit function
            } catch (error) {
                console.error(`Initialization failed (attempt ${attempt}):`, error);
                if (attempt === retries) {
                    this.broadcast({ type: 'error', message: 'Failed to initialize WhatsApp after multiple attempts' });
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
            }
        }
    }

    async logout() {
        if (this.whatsappClient) {
            await this.whatsappClient.logout();
            await this.whatsappClient.destroy();
        }
        const fs = require('fs');
        const path = require('path');
        const sessionPath = path.join(process.cwd(), '.wwebjs_auth', 'session-broadcast-client');
        if (fs.existsSync(sessionPath)) {
            await this.deleteFolderWithRetry(sessionPath);
            console.log('Session folder deleted');
        }
        this.whatsappClient = null;
        this.isReady = false;
        this.qrSent = false;
        this.lastQR = null;
        this.broadcast({ type: 'disconnected', message: 'Logged out successfully' });
        this.initializeWhatsApp();
    }

    async deleteFolderWithRetry(folderPath, maxRetries = 5, delayMs = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                require('fs').rmSync(folderPath, { recursive: true, force: true });
                return;
            } catch (err) {
                if (err.code !== 'EBUSY') throw err;
                console.warn(`EBUSY error, retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        throw new Error('Failed to delete session folder after retries');
    }

    async loadContacts() {
        if (!this.isReady || !this.whatsappClient) {
            return;
        }
        
        try {
            console.log('Loading contacts...');
            const contacts = await this.whatsappClient.getContacts();
            
            // Filter and format contacts
            this.contacts = Array.from(new Map(contacts
                .filter(contact => {
                    const formattedNumber = this.formatNumber(contact.number || contact.id.user);
                    const isValidNumber = /^08\d{8,11}$/.test(formattedNumber);
                    return contact.id.user &&
                        !contact.id.server.includes('g.us') &&
                        !contact.id.server.includes('broadcast') &&
                        contact.id.user !== 'status' &&
                        contact.isMyContact &&
                        isValidNumber;
                })
                .map(contact => ({
                    id: contact.id._serialized,
                    name: contact.name || contact.pushname || null,
                    number: this.formatNumber(contact.number || contact.id.user),
                    isMyContact: contact.isMyContact || false,
                    profilePicUrl: contact.profilePicUrl || null
                }))
                .map(contact => [contact.id, contact])
            ).values())
                .sort((a, b) => {
                    // Sort by name, then by number
                    const nameA = a.name || a.number;
                    const nameB = b.name || b.number;
                    return nameA.localeCompare(nameB);
                });
            
            console.log(`Loaded ${this.contacts.length} contacts`);
            this.broadcast({ type: 'contacts', contacts: this.contacts });
            
        } catch (error) {
            console.error('Error loading contacts:', error);
            this.broadcast({ type: 'error', message: 'Failed to load contacts: ' + error.message });
        }
    }

    async sendBroadcast(data) {
        if (!this.isReady || !this.whatsappClient) {
            this.broadcast({ type: 'error', message: 'WhatsApp not ready' });
            return;
        }
        
        const { message, contacts: contactIds, media } = data;
        
        if (!message || !contactIds || contactIds.length === 0) {
            this.broadcast({ type: 'error', message: 'Message and contacts are required' });
            return;
        }
        
        console.log(`Starting broadcast to ${contactIds.length} contacts`);
        
        let successful = 0;
        let failed = 0;
        const total = contactIds.length;
        
        for (let i = 0; i < contactIds.length; i++) {
            const contactId = contactIds[i];
            const contact = this.contacts.find(c => c.id === contactId);
            
            try {
                // Add delay between messages to avoid being blocked
                if (i > 0) {
                    await this.delay(2000 + Math.random() * 3000); // 2-5 seconds delay
                }
                
                if (media) {
                    const mediaMessage = new MessageMedia(media.mimetype, media.data, media.filename);
                    await this.whatsappClient.sendMessage(contactId, mediaMessage, { caption: message });
                } else {
                    await this.whatsappClient.sendMessage(contactId, message);
                }
                successful++;
                
                console.log(`Message sent to ${contact?.name || contact?.number || contactId}`);
                
                this.broadcast({
                    type: 'broadcast_progress',
                    current: i + 1,
                    total,
                    contact: contact || { id: contactId, name: null, number: contactId },
                    success: true
                });
            } catch (error) {
                failed++;
                console.error(`Failed to send to ${contact?.name || contact?.number || contactId}:`, error);
                this.broadcast({
                    type: 'broadcast_progress',
                    current: i + 1,
                    total,
                    contact: contact || { id: contactId, name: null, number: contactId },
                    success: false,
                    error: error.message
                });
            }
        }
        
        console.log(`Broadcast complete: ${successful} successful, ${failed} failed`);
        this.broadcast({
            type: 'broadcast_complete',
            successful,
            failed,
            total
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatNumber(number) {
        if (number.startsWith('62')) {
            return '0' + number.substring(2);
        }
        return number;
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            // Use API_BASE_URL if available, otherwise fallback to localhost
            const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
            console.log(`WhatsApp Broadcast Server running on ${baseUrl}`);
            console.log('Open your browser and navigate to the URL above to use the application.');
        });
    }

    async stop() {
        console.log('Stopping server...');
        
        if (this.whatsappClient) {
            await this.whatsappClient.destroy();
        }
        
        this.wss.close();
        this.server.close();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    if (global.broadcastServer) {
        await global.broadcastServer.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    if (global.broadcastServer) {
        await global.broadcastServer.stop();
    }
    process.exit(0);
});

// Start the server
if (require.main === module) {
    const server = new WhatsAppBroadcastServer();
    global.broadcastServer = server;
    server.start(process.env.PORT || 3000);
}

module.exports = WhatsAppBroadcastServer;