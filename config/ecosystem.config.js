module.exports = {
    apps: [{
        name: 'wa-broadcast',
        script: 'server.js',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        // Restart delay in case of crash
        restart_delay: 4000,
        // Maximum number of restart attempts
        max_restarts: 10,
        // Minimum uptime before considering restart successful
        min_uptime: '10s',
        // Kill timeout
        kill_timeout: 5000,
        // Environment variables for production
        env_vars: {
            // Uncomment and modify these as needed
            // CHROME_PATH: '/usr/bin/google-chrome-stable',
            // SESSION_PATH: '/app/sessions',
            // PUPPETEER_CACHE_DIR: '/app/.cache/puppeteer'
        }
    }]
};