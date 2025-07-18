#!/usr/bin/env node

/**
 * Replit Deployment Script
 * This script helps setup and deploy the WhatsApp Broadcast API on Replit
 */

const fs = require('fs');
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
    
    const { execSync } = require('child_process');
    
    // Try to find Chromium in Nix store first (Replit)
    try {
        const nixChromium = execSync('find /nix/store -name "chromium" -type f -executable 2>/dev/null | head -1', { encoding: 'utf8' }).trim();
        if (nixChromium && fs.existsSync(nixChromium)) {
            log(`✅ Chromium found in Nix store: ${nixChromium}`, 'green');
            
            // Set environment variables for current process
            process.env.PUPPETEER_EXECUTABLE_PATH = nixChromium;
            process.env.CHROME_PATH = nixChromium;
            
            // Update .env file with the found path
            const envFile = '.env';
            if (fs.existsSync(envFile)) {
                let envContent = fs.readFileSync(envFile, 'utf8');
                
                // Update or add PUPPETEER_EXECUTABLE_PATH
                if (envContent.includes('PUPPETEER_EXECUTABLE_PATH=')) {
                    envContent = envContent.replace(
                        /PUPPETEER_EXECUTABLE_PATH=.*/,
                        `PUPPETEER_EXECUTABLE_PATH=${nixChromium}`
                    );
                } else {
                    envContent += `\nPUPPETEER_EXECUTABLE_PATH=${nixChromium}`;
                }
                
                // Update or add CHROME_PATH
                if (envContent.includes('CHROME_PATH=')) {
                    envContent = envContent.replace(
                        /CHROME_PATH=.*/,
                        `CHROME_PATH=${nixChromium}`
                    );
                } else {
                    envContent += `\nCHROME_PATH=${nixChromium}`;
                }
                
                fs.writeFileSync(envFile, envContent);
                log('📝 Updated .env file with Chromium path', 'cyan');
            }
            return;
        }
    } catch (error) {
        log('🔍 Searching for Chromium in standard paths...', 'yellow');
    }
    
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
        log('   You may need to restart the Repl after adding Chromium', 'yellow');
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
        log('\n🌐 Your API will be available at:', 'green');
        log(`   ${replitUrl}`, 'cyan');
        
        log('\n📋 API Endpoints:', 'green');
        log(`   GET  ${replitUrl}/health - Health check`, 'cyan');
        log(`   POST ${replitUrl}/send-message - Send message`, 'cyan');
        log(`   POST ${replitUrl}/send-bulk - Send bulk messages`, 'cyan');
        log(`   WS   ${replitUrl.replace('https:', 'wss:')} - WebSocket`, 'cyan');
    }
    
    log('\n📖 Next steps:', 'green');
    log('   1. Click the \'Run\' button in Replit', 'cyan');
    log('   2. Wait for QR code to appear in console', 'cyan');
    log('   3. Scan QR code with WhatsApp', 'cyan');
    log('   4. Your API will be ready to use!', 'cyan');
    
    log('\n🔗 Frontend Integration:', 'green');
    log('   Update your frontend to use the Replit URL above', 'cyan');
    
    log('\n' + '='.repeat(50), 'bright');
}

function verifySetup() {
    log('🔍 Verifying setup...', 'blue');
    
    const checks = [
        {
            name: 'Environment variables',
            check: () => process.env.NODE_ENV && process.env.PORT,
            fix: 'Check .env file configuration'
        },
        {
            name: 'Chromium executable',
            check: () => process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH,
            fix: 'Run chromium detection again'
        },
        {
            name: 'Required directories',
            check: () => ['sessions', 'cache', 'logs'].every(dir => fs.existsSync(dir)),
            fix: 'Create missing directories'
        },
        {
            name: 'Node modules',
            check: () => fs.existsSync('node_modules'),
            fix: 'Run npm install'
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(({ name, check, fix }) => {
        if (check()) {
            log(`  ✅ ${name}`, 'green');
        } else {
            log(`  ❌ ${name} - ${fix}`, 'red');
            allPassed = false;
        }
    });
    
    if (allPassed) {
        log('✅ All verification checks passed!', 'green');
    } else {
        log('⚠️  Some checks failed. Please review the issues above.', 'yellow');
    }
    
    return allPassed;
}

function main() {
    log('🚀 Starting Replit deployment setup...', 'bright');
    
    try {
        checkEnvironment();
        setupEnvironment();
        checkDependencies();
        checkChromium();
        createDirectories();
        
        // Verify everything is set up correctly
        const setupValid = verifySetup();
        
        displayInfo();
        
        if (setupValid) {
            log('\n✅ Deployment setup complete!', 'green');
            log('🎯 Ready to run the application', 'bright');
        } else {
            log('\n⚠️  Setup completed with warnings', 'yellow');
            log('🔧 Please check the verification results above', 'yellow');
        }
        
    } catch (error) {
        log(`\n❌ Deployment setup failed: ${error.message}`, 'red');
        log('💡 Try running: npm run replit:setup', 'cyan');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main, checkEnvironment, setupEnvironment, verifySetup };