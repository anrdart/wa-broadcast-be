#!/usr/bin/env node

/**
 * Backend Connection Tester for Frontend
 * This script tests the connection from frontend to backend
 */

const http = require('http');
const https = require('https');

class BackendConnectionTester {
    constructor() {
        this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 
                     process.env.REACT_APP_API_URL || 
                     process.env.VUE_APP_API_URL || 
                     'http://localhost:3000';
        
        this.wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                    process.env.REACT_APP_WS_URL || 
                    process.env.VUE_APP_WS_URL || 
                    'ws://localhost:3000';
    }

    async testHttpConnection() {
        console.log('🌐 Testing HTTP API Connection...');
        console.log(`   API URL: ${this.apiUrl}`);
        
        try {
            const response = await this.makeRequest('/health');
            if (response.status === 200) {
                console.log('   ✅ HTTP connection successful');
                console.log(`   📊 Backend status: ${response.data.status}`);
                console.log(`   ⏱️  Uptime: ${Math.floor(response.data.uptime)}s`);
                return true;
            } else {
                console.log(`   ❌ HTTP connection failed: Status ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ HTTP connection error: ${error.message}`);
            return false;
        }
    }

    async testCorsHeaders() {
        console.log('\n🔒 Testing CORS Configuration...');
        
        try {
            const response = await this.makeRequest('/api/status', 'OPTIONS');
            const corsHeaders = {
                'access-control-allow-origin': response.headers['access-control-allow-origin'],
                'access-control-allow-methods': response.headers['access-control-allow-methods'],
                'access-control-allow-headers': response.headers['access-control-allow-headers'],
                'access-control-allow-credentials': response.headers['access-control-allow-credentials']
            };
            
            console.log('   CORS Headers:');
            Object.entries(corsHeaders).forEach(([key, value]) => {
                if (value) {
                    console.log(`   ✅ ${key}: ${value}`);
                } else {
                    console.log(`   ❌ ${key}: Not set`);
                }
            });
            
            return corsHeaders['access-control-allow-origin'] !== undefined;
        } catch (error) {
            console.log(`   ❌ CORS test error: ${error.message}`);
            return false;
        }
    }

    async testApiEndpoints() {
        console.log('\n🔌 Testing API Endpoints...');
        
        const endpoints = [
            { path: '/health', name: 'Health Check' },
            { path: '/api/status', name: 'API Status' },
            { path: '/', name: 'Root Endpoint' }
        ];
        
        let successCount = 0;
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint.path);
                if (response.status >= 200 && response.status < 300) {
                    console.log(`   ✅ ${endpoint.name}: OK (${response.status})`);
                    successCount++;
                } else {
                    console.log(`   ❌ ${endpoint.name}: Failed (${response.status})`);
                }
            } catch (error) {
                console.log(`   ❌ ${endpoint.name}: Error - ${error.message}`);
            }
        }
        
        return successCount === endpoints.length;
    }

    async testWebSocketConnection() {
        console.log('\n🔌 Testing WebSocket Connection...');
        console.log(`   WebSocket URL: ${this.wsUrl}`);
        
        // Since we're in Node.js environment, we'll simulate WebSocket test
        // In actual frontend, you would use native WebSocket API
        try {
            const WebSocket = require('ws');
            
            return new Promise((resolve) => {
                const ws = new WebSocket(this.wsUrl);
                let connected = false;
                
                const timeout = setTimeout(() => {
                    if (!connected) {
                        console.log('   ❌ WebSocket connection timeout');
                        ws.close();
                        resolve(false);
                    }
                }, 5000);
                
                ws.on('open', () => {
                    connected = true;
                    clearTimeout(timeout);
                    console.log('   ✅ WebSocket connected successfully');
                    ws.close();
                    resolve(true);
                });
                
                ws.on('error', (error) => {
                    console.log(`   ❌ WebSocket error: ${error.message}`);
                    clearTimeout(timeout);
                    resolve(false);
                });
            });
        } catch (error) {
            console.log(`   ❌ WebSocket test error: ${error.message}`);
            console.log('   💡 Note: Install ws package for WebSocket testing: npm install ws');
            return false;
        }
    }

    async makeRequest(path, method = 'GET') {
        return new Promise((resolve, reject) => {
            const url = new URL(this.apiUrl + path);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://your-frontend.vercel.app',
                    'User-Agent': 'Frontend-Connection-Tester/1.0'
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const jsonBody = JSON.parse(body);
                        resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body, headers: res.headers });
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.end();
        });
    }

    async runAllTests() {
        console.log('🚀 Frontend to Backend Connection Test');
        console.log('=' .repeat(50));
        
        const results = {
            http: await this.testHttpConnection(),
            cors: await this.testCorsHeaders(),
            endpoints: await this.testApiEndpoints(),
            websocket: await this.testWebSocketConnection()
        };
        
        this.printSummary(results);
        return results;
    }

    printSummary(results) {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 CONNECTION TEST SUMMARY');
        console.log('=' .repeat(50));
        
        const tests = [
            { name: 'HTTP Connection', result: results.http },
            { name: 'CORS Configuration', result: results.cors },
            { name: 'API Endpoints', result: results.endpoints },
            { name: 'WebSocket Connection', result: results.websocket }
        ];
        
        tests.forEach(test => {
            console.log(`${test.result ? '✅' : '❌'} ${test.name}`);
        });
        
        const passedTests = tests.filter(t => t.result).length;
        const totalTests = tests.length;
        
        console.log(`\n📈 Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
        
        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! Your frontend can connect to the backend.');
            console.log('\n📝 Next steps:');
            console.log('   1. Update your frontend code to use these URLs');
            console.log('   2. Test the actual frontend application');
            console.log('   3. Deploy to Vercel with the correct environment variables');
        } else {
            console.log('\n⚠️  Some tests failed. Please check:');
            if (!results.http) {
                console.log('   - Backend server is running and accessible');
                console.log('   - Firewall allows connections to the backend port');
                console.log('   - API URL is correct in environment variables');
            }
            if (!results.cors) {
                console.log('   - CORS is properly configured in nginx.production.conf');
                console.log('   - Frontend domain is added to allowed origins');
            }
            if (!results.websocket) {
                console.log('   - WebSocket endpoint is accessible');
                console.log('   - No proxy blocking WebSocket connections');
            }
        }
        
        console.log('\n🔧 Environment Variables Used:');
        console.log(`   API_URL: ${this.apiUrl}`);
        console.log(`   WS_URL: ${this.wsUrl}`);
    }
}

// CLI usage
if (require.main === module) {
    console.log('WhatsApp Broadcast Frontend Connection Tester');
    console.log('This script tests the connection from frontend to backend\n');
    
    const tester = new BackendConnectionTester();
    tester.runAllTests().catch(console.error);
}

module.exports = BackendConnectionTester;