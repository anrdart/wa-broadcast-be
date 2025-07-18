#!/usr/bin/env node

/**
 * Replit Deployment Script
 * This script helps setup and deploy the WhatsApp Broadcast API on Replit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironment() {
    log('🔍 Checking Replit environment...', 'blue');
    
    const isReplit = process.env.REPL_ID || process.env.REPL_SLUG;
    if (!isReplit) {
        log('⚠️  Warning: Not running in Replit environment', 'yellow');
        return false;
    }
    
    log('✅ Replit environment detected', 'green');
    return true;
}

function setupEnvironment() {
    log('🔧 Setting up environment variables...', 'blue');
    
    const envFile = '.env';
    const envReplitFile = '.env.replit';
    
    if (!fs.existsSync(envFile) && fs.existsSync(envReplitFile)) {
        log('📋 Copying .env.replit to .env', 'cyan');
        fs.copyFileSync(envReplitFile, envFile);
    }
    
    // Update API_BASE_URL with Replit URL
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        const replitUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        log(`🌐 Setting API_BASE_URL to: ${replitUrl}`, 'cyan');
        
        if (fs.existsSync(envFile)) {
            let envContent = fs.readFileSync(envFile, 'utf8');
            envContent = envContent.replace(
                /API_BASE_URL=.*/,
                `API_BASE_URL=${replitUrl}`
            );
            fs.writeFileSync(envFile, envContent);
        }
    }
    
    log('✅ Environment setup complete', 'green');
}

function checkDependencies() {
    log('📦 Checking dependencies...', 'blue');
    
    try {
        // Check if node_modules exists
        if (!fs.existsSync('node_modules')) {
            log('📥 Installing dependencies...', 'cyan');
            execSync('npm install', { stdio: 'inherit' });
        } else {
            log('✅ Dependencies already installed', 'green');
        }
    } catch (error) {
        log(`❌ Error installing dependencies: ${error.message}`, 'red');
        process.exit(1);
    }
}

function checkChromium() {
    log('🌐 Checking Chromium installation...', 'blue');
    
    const chromiumPaths = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable'
    ];
    
    let chromiumFound = false;
    for (const chromiumPath of chromiumPaths) {
        if (fs.existsSync(chromiumPath)) {
            log(`✅ Chromium found at: ${chromiumPath}`, 'green');
            process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
            process.env.CHROME_PATH = chromiumPath;
            chromiumFound = true;
            break;
        }
    }
    
    if (!chromiumFound) {
        log('⚠️  Chromium not found in standard locations', 'yellow');
        log('   Make sure Chromium is installed via replit.nix', 'yellow');
    }
}

function createDirectories() {
    log('📁 Creating necessary directories...', 'blue');
    
    const dirs = ['sessions', 'cache', 'logs', 'puppeteer-cache'];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`📂 Created directory: ${dir}`, 'cyan');
        }
    });
    
    log('✅ Directories setup complete', 'green');
}

function displayInfo() {
    log('\n' + '='.repeat(50), 'bright');
    log('🚀 WhatsApp Broadcast API - Replit Deployment', 'bright');
    log('='.repeat(50), 'bright');
    
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        const replitUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        log(`\n🌐 Your API will be available at:`, 'green');
        log(`   ${replitUrl}`, 'cyan');
        
        log(`\n📋 API Endpoints:`, 'green');
        log(`   GET  ${replitUrl}/health - Health check`, 'cyan');
        log(`   POST ${replitUrl}/send-message - Send message`, 'cyan');
        log(`   POST ${replitUrl}/send-bulk - Send bulk messages`, 'cyan');
        log(`   WS   ${replitUrl.replace('https:', 'wss:')} - WebSocket`, 'cyan');
    }
    
    log(`\n📖 Next steps:`, 'green');
    log(`   1. Click the 'Run' button in Replit`, 'cyan');
    log(`   2. Wait for QR code to appear in console`, 'cyan');
    log(`   3. Scan QR code with WhatsApp`, 'cyan');
    log(`   4. Your API will be ready to use!`, 'cyan');
    
    log(`\n🔗 Frontend Integration:`, 'green');
    log(`   Update your frontend to use the Replit URL above`, 'cyan');
    
    log('\n' + '='.repeat(50), 'bright');
}

function main() {
    log('🚀 Starting Replit deployment setup...', 'bright');
    
    try {
        checkEnvironment();
        setupEnvironment();
        checkDependencies();
        checkChromium();
        createDirectories();
        displayInfo();
        
        log('\n✅ Deployment setup complete!', 'green');
        log('🎯 Ready to run the application', 'bright');
        
    } catch (error) {
        log(`\n❌ Deployment setup failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main, checkEnvironment, setupEnvironment };