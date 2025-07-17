# Panduan Deployment WhatsApp Broadcast ke Production

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

### 1. Error "Failed to launch browser process"

**Solusi:**
- Pastikan semua dependencies Chrome sudah terinstall
- Cek apakah Chrome/Chromium tersedia di sistem
- Verifikasi permissions untuk user yang menjalankan aplikasi

### 2. Error "No usable sandbox"

**Solusi:**
- Argument `--no-sandbox` sudah ditambahkan
- Jika masih error, coba jalankan dengan user yang memiliki privileges

### 3. Memory Issues

**Solusi:**
- Gunakan instance dengan minimal 2GB RAM
- Set `max_memory_restart` di PM2
- Monitor penggunaan memory dengan `htop` atau `pm2 monit`

### 4. Session Issues

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