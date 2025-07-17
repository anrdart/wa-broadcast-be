# Panduan Deployment WhatsApp Broadcast ke Production

## ⚠️ PENTING: Masalah Deployment Vercel

**Aplikasi ini TIDAK DAPAT di-deploy ke Vercel** karena:

1. **Missing Chrome Dependencies**: Vercel serverless environment tidak memiliki dependencies yang diperlukan untuk Chrome/Puppeteer (`libnss3.so`, `libatk-bridge2.0-0`, dll)
2. **Serverless Limitations**: WhatsApp Web.js membutuhkan persistent connection dan session storage yang tidak cocok dengan serverless functions
3. **Memory & Timeout Limits**: Puppeteer membutuhkan resource yang lebih besar dari yang disediakan Vercel

### Error yang Muncul di Vercel:
```
Error: Failed to launch the browser process!
/vercel/path0/node_modules/whatsapp-web.js/node_modules/puppeteer-core/.local-chromium/linux-1045629/chrome-linux/chrome: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

## ✅ Solusi Deployment yang Direkomendasikan

### 1. **Docker Deployment (Recommended)**

#### Quick Start dengan Docker Compose:
```bash
# Clone repository
git clone <your-repo-url>
cd wa-broadcast

# Build dan jalankan
npm run docker:compose:up

# Monitor logs
npm run docker:compose:logs

# Jika ada masalah, rebuild container
# Windows (Batch)
npm run docker:rebuild

# Windows (PowerShell)
npm run docker:rebuild:ps1

# Linux/Mac (Bash)
npm run docker:rebuild:bash
```

#### Manual Docker Build:
```bash
# Build image
docker build -t wa-broadcast .

# Run container
docker run -d \
  --name wa-broadcast \
  -p 3000:3000 \
  -v $(pwd)/sessions:/app/sessions \
  -v $(pwd)/logs:/app/logs \
  --security-opt seccomp:unconfined \
  --cap-add SYS_ADMIN \
  wa-broadcast
```

### 2. **VPS/Dedicated Server**

Untuk deployment di VPS (Ubuntu/Debian), gunakan script setup otomatis:
```bash
chmod +x setup-production.sh
./setup-production.sh
```

### 3. **Cloud Platforms dengan Container Support**

- **DigitalOcean App Platform** (dengan Dockerfile)
- **Google Cloud Run** (dengan custom container)
- **AWS ECS/Fargate**
- **Azure Container Instances**
- **Railway** (dengan Dockerfile)
- **Render** (dengan Dockerfile)

## Masalah yang Sering Terjadi

Ketika aplikasi WhatsApp Broadcast berjalan normal di localhost tetapi gagal terhubung di production server, masalahnya biasanya terkait dengan:

1. **Konfigurasi Puppeteer yang tidak sesuai untuk server production**
2. **Missing dependencies Chrome/Chromium di server Linux**
3. **Konfigurasi sandbox dan security yang berbeda**

## Solusi yang Telah Diterapkan

### 1. Konfigurasi Puppeteer yang Dinamis

Kode telah dimodifikasi untuk mendeteksi environment production dan menggunakan konfigurasi yang sesuai:

```javascript
// Deteksi environment production
const isProduction = process.env.NODE_ENV === 'production' || 
                   process.env.PORT || 
                   !process.env.DISPLAY;
```

### 2. Arguments Puppeteer untuk Production

Ditambahkan arguments khusus untuk production:
- `--single-process`: Menggunakan single process untuk mengurangi resource usage
- `--disable-web-security`: Menonaktifkan web security untuk headless mode
- `--enable-automation`: Mengaktifkan mode automation
- Dan berbagai optimasi lainnya

### 3. Auto-detect System Chrome

Sistem akan mencoba menggunakan Chrome yang terinstall di sistem:
- `/usr/bin/google-chrome-stable`
- `/usr/bin/google-chrome`
- `/usr/bin/chromium-browser`
- `/usr/bin/chromium`

## Langkah-langkah Deployment

### 1. Persiapan Server Linux (Ubuntu/Debian)

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js (versi 18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies Chrome
sudo apt install -y \
    dconf-service \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc-s1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libayatana-appindicator3-1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    libgbm1

# Install Google Chrome (opsional, tapi direkomendasikan)
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
```

### 2. Deploy Aplikasi

```bash
# Clone atau upload project
git clone <your-repo-url>
cd wa-broadcast

# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Jalankan aplikasi
npm start
```

### 3. Menggunakan PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Buat file ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'wa-broadcast',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

# Start dengan PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Setup Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### 1. Error: "WSL ERROR: execvpe(/bin/bash) failed" (Windows)

**Penyebab**: Script bash tidak dapat dijalankan di Windows PowerShell.

**Solusi**:
```bash
# Gunakan script Windows (Batch)
npm run docker:rebuild

# Atau PowerShell
npm run docker:rebuild:ps1

# Atau manual
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Penjelasan**: Tersedia 3 versi script rebuild untuk berbagai environment.

### 2. Error: "Cannot find module 'dotenv'"

**Penyebab**: Module dotenv tidak terinstall di production container.

**Solusi**:
```bash
# Rebuild container dengan dependencies yang benar
npm run docker:rebuild

# Atau manual rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Penjelasan**: Dotenv telah dipindahkan dari devDependencies ke dependencies di package.json.

### 3. Error: "Protocol error (Network.setUserAgentOverride): Session closed"

**Penyebab**: Chrome browser session ditutup secara prematur di lingkungan Docker karena konfigurasi yang tidak memadai.

**Solusi**:
```bash
# Rebuild container dengan konfigurasi Chrome yang diperbaiki
npm run docker:rebuild

# Atau manual rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Penjelasan**: 
- Ditambahkan Chrome flags khusus Docker untuk stabilitas
- Ditingkatkan shared memory size (2GB) di docker-compose.yml
- Ditambahkan memory limits untuk mencegah crash
- Menggunakan software rendering (swiftshader) untuk kompatibilitas

### 4. Error "Failed to launch browser process"

**Solusi:**
- Pastikan semua dependencies Chrome sudah terinstall
- Cek apakah Chrome/Chromium tersedia di sistem
- Verifikasi permissions untuk user yang menjalankan aplikasi

```bash
# Install missing dependencies
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
```

### 5. Error "No usable sandbox"

**Solusi:**
- Argument `--no-sandbox` sudah ditambahkan
- Jika masih error, coba jalankan dengan user yang memiliki privileges

### 6. Memory Issues

**Solusi:**
- Gunakan instance dengan minimal 2GB RAM
- Set `max_memory_restart` di PM2
- Monitor penggunaan memory dengan `htop` atau `pm2 monit`

### 7. Session Issues

**Solusi:**
- Pastikan folder `.wwebjs_auth` memiliki permissions yang benar
- Backup session folder secara berkala
- Jika session corrupt, hapus folder session dan scan QR ulang

## Environment Variables

```bash
# .env file
NODE_ENV=production
PORT=3000

# Optional: Custom Chrome path
CHROME_PATH=/usr/bin/google-chrome-stable

# Optional: Custom session path
SESSION_PATH=/app/sessions
```

## Monitoring dan Maintenance

1. **Log Monitoring:**
   ```bash
   pm2 logs wa-broadcast
   ```

2. **Resource Monitoring:**
   ```bash
   pm2 monit
   ```

3. **Restart Aplikasi:**
   ```bash
   pm2 restart wa-broadcast
   ```

4. **Update Aplikasi:**
   ```bash
   git pull
   npm install
   pm2 restart wa-broadcast
   ```

## Tips Keamanan

1. Gunakan firewall untuk membatasi akses
2. Setup SSL/HTTPS dengan Let's Encrypt
3. Backup session data secara berkala
4. Monitor logs untuk aktivitas mencurigakan
5. Update dependencies secara berkala

## Catatan Penting

- WhatsApp Web.js adalah unofficial library
- Tidak ada jaminan tidak akan di-block oleh WhatsApp
- Gunakan dengan bijak dan sesuai ToS WhatsApp
- Untuk production critical, pertimbangkan menggunakan WhatsApp Business API resmi