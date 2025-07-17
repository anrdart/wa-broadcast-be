#!/usr/bin/env node

/**
 * API Testing Script for WhatsApp Broadcast Backend
 * This script tests the API endpoints to ensure they're working correctly
 */

const http = require('http');
const https = require('https');
const WebSocket = require('ws');

class APITester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.results = [];
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + path);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'API-Tester/1.0'
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

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async testEndpoint(name, path, method = 'GET', data = null, expectedStatus = 200) {
        console.log(`\n🧪 Testing ${name}...`);
        try {
            const result = await this.makeRequest(path, method, data);
            const success = result.status === expectedStatus;
            
            console.log(`   Method: ${method} ${path}`);
            console.log(`   Status: ${result.status} ${success ? '✅' : '❌'}`);
            
            if (result.data && typeof result.data === 'object') {
                console.log(`   Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
            } else {
                console.log(`   Response: ${result.data.toString().substring(0, 200)}...`);
            }

            this.results.push({
                name,
                path,
                method,
                status: result.status,
                success,
                data: result.data
            });

            return result;
        } catch (error) {
            console.log(`   Error: ${error.message} ❌`);
            this.results.push({
                name,
                path,
                method,
                status: 0,
                success: false,
                error: error.message
            });
            return null;
        }
    }

    async testWebSocket() {
        console.log(`\n🔌 Testing WebSocket connection...`);
        return new Promise((resolve) => {
            try {
                const wsUrl = this.baseUrl.replace('http', 'ws');
                const ws = new WebSocket(wsUrl);
                let connected = false;

                const timeout = setTimeout(() => {
                    if (!connected) {
                        console.log('   WebSocket: Connection timeout ❌');
                        ws.close();
                        resolve(false);
                    }
                }, 5000);

                ws.on('open', () => {
                    connected = true;
                    clearTimeout(timeout);
                    console.log('   WebSocket: Connected successfully ✅');
                    
                    // Test sending a message
                    ws.send(JSON.stringify({ type: 'ping' }));
                });

                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        console.log(`   WebSocket: Received message: ${JSON.stringify(message)}`);
                    } catch (e) {
                        console.log(`   WebSocket: Received: ${data}`);
                    }
                });

                ws.on('error', (error) => {
                    console.log(`   WebSocket: Error - ${error.message} ❌`);
                    clearTimeout(timeout);
                    resolve(false);
                });

                ws.on('close', () => {
                    console.log('   WebSocket: Connection closed');
                    if (connected) {
                        resolve(true);
                    }
                });

                // Close connection after 3 seconds
                setTimeout(() => {
                    if (connected) {
                        ws.close();
                    }
                }, 3000);

            } catch (error) {
                console.log(`   WebSocket: Error - ${error.message} ❌`);
                resolve(false);
            }
        });
    }

    async runAllTests() {
        console.log(`🚀 Starting API tests for: ${this.baseUrl}`);
        console.log('=' .repeat(50));

        // Test basic endpoints
        await this.testEndpoint('Health Check', '/health');
        await this.testEndpoint('API Status', '/api/status');
        await this.testEndpoint('Root Endpoint', '/');
        
        // Test CORS preflight
        await this.testEndpoint('CORS Preflight', '/api/status', 'OPTIONS', null, 204);
        
        // Test WebSocket
        await this.testWebSocket();

        // Print summary
        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('=' .repeat(50));
        
        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${total - passed} ❌`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (total - passed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`   - ${result.name}: ${result.error || `Status ${result.status}`}`);
            });
        }
        
        console.log('\n🔧 Troubleshooting Tips:');
        console.log('   - Make sure Docker containers are running');
        console.log('   - Check if ports 3000 and 80 are accessible');
        console.log('   - Verify firewall settings');
        console.log('   - Check Docker logs: docker-compose logs -f');
        
        console.log('\n✅ If all tests pass, your API is ready for frontend integration!');
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const baseUrl = args[0] || 'http://localhost:3000';
    
    console.log('WhatsApp Broadcast API Tester');
    console.log('Usage: node test-api.js [base_url]');
    console.log(`Testing URL: ${baseUrl}\n`);
    
    const tester = new APITester(baseUrl);
    tester.runAllTests().catch(console.error);
}

module.exports = APITester;