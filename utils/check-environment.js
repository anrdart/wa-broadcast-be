#!/usr/bin/env node

/**
 * Environment Variables Checker
 * This script checks if all required environment variables are properly set
 */

class EnvironmentChecker {
    constructor() {
        this.requiredVars = {
            backend: [
                'NODE_ENV',
                'PORT',
                'PUPPETEER_EXECUTABLE_PATH',
                'CHROME_PATH'
            ],
            frontend: {
                nextjs: [
                    'NEXT_PUBLIC_API_URL',
                    'NEXT_PUBLIC_WS_URL'
                ],
                react: [
                    'REACT_APP_API_URL',
                    'REACT_APP_WS_URL'
                ],
                vue: [
                    'VUE_APP_API_URL',
                    'VUE_APP_WS_URL'
                ]
            },
            optional: [
                'FRONTEND_URL',
                'ALLOWED_ORIGINS',
                'API_BASE_URL',
                'LOG_LEVEL',
                'HEALTH_CHECK_ENABLED'
            ]
        };
    }

    checkBackendEnvironment() {
        console.log('🔧 Checking Backend Environment Variables...');
        console.log('=' .repeat(50));
        
        let allPresent = true;
        
        this.requiredVars.backend.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                console.log(`✅ ${varName}: ${this.maskSensitiveValue(varName, value)}`);
            } else {
                console.log(`❌ ${varName}: Not set`);
                allPresent = false;
            }
        });
        
        console.log('\n📋 Optional Variables:');
        this.requiredVars.optional.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                console.log(`✅ ${varName}: ${this.maskSensitiveValue(varName, value)}`);
            } else {
                console.log(`⚪ ${varName}: Not set (optional)`);
            }
        });
        
        return allPresent;
    }

    checkFrontendEnvironment() {
        console.log('\n🌐 Checking Frontend Environment Variables...');
        console.log('=' .repeat(50));
        
        const frameworks = Object.keys(this.requiredVars.frontend);
        let detectedFramework = null;
        let frameworkVarsPresent = false;
        
        // Detect which framework is being used
        frameworks.forEach(framework => {
            const vars = this.requiredVars.frontend[framework];
            const presentVars = vars.filter(varName => process.env[varName]);
            
            if (presentVars.length > 0) {
                detectedFramework = framework;
                frameworkVarsPresent = presentVars.length === vars.length;
                
                console.log(`\n🎯 Detected Framework: ${framework.toUpperCase()}`);
                vars.forEach(varName => {
                    const value = process.env[varName];
                    if (value) {
                        console.log(`✅ ${varName}: ${value}`);
                    } else {
                        console.log(`❌ ${varName}: Not set`);
                    }
                });
            }
        });
        
        if (!detectedFramework) {
            console.log('\n⚠️  No frontend framework environment variables detected.');
            console.log('\n📝 Available frameworks:');
            frameworks.forEach(framework => {
                console.log(`\n${framework.toUpperCase()}:`);
                this.requiredVars.frontend[framework].forEach(varName => {
                    console.log(`   - ${varName}`);
                });
            });
        }
        
        return { detectedFramework, frameworkVarsPresent };
    }

    validateUrls() {
        console.log('\n🔗 Validating URLs...');
        console.log('=' .repeat(50));
        
        const urlVars = [
            'NEXT_PUBLIC_API_URL',
            'REACT_APP_API_URL', 
            'VUE_APP_API_URL',
            'FRONTEND_URL',
            'API_BASE_URL'
        ];
        
        let validUrls = true;
        
        urlVars.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                if (this.isValidUrl(value)) {
                    console.log(`✅ ${varName}: ${value} (Valid)`);
                } else {
                    console.log(`❌ ${varName}: ${value} (Invalid URL format)`);
                    validUrls = false;
                }
            }
        });
        
        // Check WebSocket URLs
        const wsVars = [
            'NEXT_PUBLIC_WS_URL',
            'REACT_APP_WS_URL',
            'VUE_APP_WS_URL'
        ];
        
        wsVars.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                if (this.isValidWebSocketUrl(value)) {
                    console.log(`✅ ${varName}: ${value} (Valid WebSocket URL)`);
                } else {
                    console.log(`❌ ${varName}: ${value} (Invalid WebSocket URL format)`);
                    validUrls = false;
                }
            }
        });
        
        return validUrls;
    }

    checkDockerEnvironment() {
        console.log('\n🐳 Checking Docker Environment...');
        console.log('=' .repeat(50));
        
        const dockerVars = [
            'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD',
            'PUPPETEER_EXECUTABLE_PATH',
            'CHROME_PATH'
        ];
        
        let dockerReady = true;
        
        dockerVars.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                console.log(`✅ ${varName}: ${value}`);
            } else {
                console.log(`❌ ${varName}: Not set`);
                dockerReady = false;
            }
        });
        
        // Check if running in Docker
        const isDocker = process.env.DOCKER_ENV === 'true' || 
                        process.env.NODE_ENV === 'production';
        
        console.log(`\n🏃 Running in Docker: ${isDocker ? 'Yes' : 'No'}`);
        
        return dockerReady;
    }

    generateEnvTemplate() {
        console.log('\n📄 Environment Template Generator...');
        console.log('=' .repeat(50));
        
        const template = `# Backend Environment Variables
NODE_ENV=production
PORT=3000
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
CHROME_PATH=/usr/bin/google-chrome-stable

# Frontend Integration
FRONTEND_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
API_BASE_URL=http://your-server-ip:3000

# Optional Configuration
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true
DOCKER_ENV=true

# Frontend Environment Variables (choose based on your framework)
# Next.js
NEXT_PUBLIC_API_URL=http://your-server-ip:3000
NEXT_PUBLIC_WS_URL=ws://your-server-ip:3000

# React
REACT_APP_API_URL=http://your-server-ip:3000
REACT_APP_WS_URL=ws://your-server-ip:3000

# Vue.js
VUE_APP_API_URL=http://your-server-ip:3000
VUE_APP_WS_URL=ws://your-server-ip:3000`;
        
        console.log(template);
        
        return template;
    }

    maskSensitiveValue(varName, value) {
        const sensitiveVars = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
        const isSensitive = sensitiveVars.some(sensitive => 
            varName.toUpperCase().includes(sensitive)
        );
        
        if (isSensitive && value.length > 4) {
            return value.substring(0, 4) + '*'.repeat(value.length - 4);
        }
        
        return value;
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    isValidWebSocketUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'ws:' || url.protocol === 'wss:';
        } catch (_) {
            return false;
        }
    }

    runAllChecks() {
        console.log('🔍 Environment Variables Checker');
        console.log('This script validates your environment configuration\n');
        
        const backendOk = this.checkBackendEnvironment();
        const frontendResult = this.checkFrontendEnvironment();
        const urlsOk = this.validateUrls();
        const dockerOk = this.checkDockerEnvironment();
        
        this.printSummary({
            backend: backendOk,
            frontend: frontendResult.frameworkVarsPresent,
            urls: urlsOk,
            docker: dockerOk,
            detectedFramework: frontendResult.detectedFramework
        });
    }

    printSummary(results) {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 ENVIRONMENT CHECK SUMMARY');
        console.log('=' .repeat(50));
        
        const checks = [
            { name: 'Backend Variables', result: results.backend },
            { name: 'Frontend Variables', result: results.frontend },
            { name: 'URL Validation', result: results.urls },
            { name: 'Docker Configuration', result: results.docker }
        ];
        
        checks.forEach(check => {
            console.log(`${check.result ? '✅' : '❌'} ${check.name}`);
        });
        
        if (results.detectedFramework) {
            console.log(`🎯 Detected Framework: ${results.detectedFramework.toUpperCase()}`);
        }
        
        const allPassed = checks.every(check => check.result);
        
        if (allPassed) {
            console.log('\n🎉 All environment checks passed!');
            console.log('\n📝 Next steps:');
            console.log('   1. Run deployment script: ./deploy-production.ps1');
            console.log('   2. Test API connection: node test-api.js');
            console.log('   3. Test frontend connection: node test-backend-connection.js');
        } else {
            console.log('\n⚠️  Some environment checks failed.');
            console.log('\n🔧 Recommendations:');
            
            if (!results.backend) {
                console.log('   - Copy .env.production to .env and configure it');
                console.log('   - Set required backend environment variables');
            }
            
            if (!results.frontend) {
                console.log('   - Set frontend environment variables for your framework');
                console.log('   - Use the correct prefix (NEXT_PUBLIC_, REACT_APP_, VUE_APP_)');
            }
            
            if (!results.urls) {
                console.log('   - Check URL formats (must include protocol)');
                console.log('   - Ensure WebSocket URLs use ws:// or wss://');
            }
            
            if (!results.docker) {
                console.log('   - Set Docker-specific environment variables');
                console.log('   - Configure Puppeteer for containerized environment');
            }
            
            console.log('\n📄 Generate template: node check-environment.js --template');
        }
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const checker = new EnvironmentChecker();
    
    if (args.includes('--template')) {
        checker.generateEnvTemplate();
    } else {
        checker.runAllChecks();
    }
}

module.exports = EnvironmentChecker;