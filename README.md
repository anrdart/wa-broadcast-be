# WhatsApp Broadcast Tool

Alat otomatisasi berbasis web untuk mengirimkan broadcast WhatsApp ke semua kontak, baik yang tersimpan maupun yang tidak tersimpan.

## Fitur

- ✅ Interface web yang mudah digunakan
- ✅ Koneksi WhatsApp Web melalui QR Code
- ✅ Daftar semua kontak (tersimpan dan tidak tersimpan)
- ✅ Filter dan pencarian kontak
- ✅ Pilih kontak secara individual atau semua sekaligus
- ✅ Kirim pesan teks dan media (gambar, video, dokumen)
- ✅ Progress tracking pengiriman pesan
- ✅ Delay otomatis antar pesan untuk menghindari spam

## Persyaratan

- Node.js versi 18.0.0 atau lebih baru
- Browser modern (Chrome, Firefox, Edge)
- Koneksi internet yang stabil

## Instalasi

1. Pastikan semua dependencies sudah terinstall:
   ```bash
   npm install
   ```

2. Jalankan server:
   ```bash
   npm start
   ```
   
   Atau untuk development dengan auto-reload:
   ```bash
   npm run dev
   ```

3. Buka browser dan akses:
   ```
   http://localhost:3000
   ```

## Cara Penggunaan

### 1. Koneksi WhatsApp
- Buka aplikasi di browser
- Scan QR Code yang muncul dengan WhatsApp di ponsel Anda
- Tunggu hingga status berubah menjadi "Connected"

### 2. Memuat Kontak
- Setelah terhubung, klik tombol "Load Contacts"
- Tunggu hingga semua kontak dimuat
- Gunakan filter untuk mencari kontak tertentu

### 3. Memilih Kontak
- Pilih kontak secara individual dengan mencentang checkbox
- Atau gunakan "Select All" untuk memilih semua kontak
- Kontak yang dipilih akan ditampilkan di bagian "Selected Contacts"

### 4. Mengirim Broadcast
- Tulis pesan di area "Message Content"
- (Opsional) Upload file media jika ingin mengirim gambar/video/dokumen
- Klik "Send Broadcast" untuk memulai pengiriman
- Monitor progress pengiriman di bagian "Broadcast Progress"

## Struktur File

```
wa-broadcast/
├── public/
│   ├── index.html      # Interface web utama
│   ├── style.css       # Styling aplikasi
│   └── script.js       # Logic frontend
├── server.js           # Server backend
├── package.json        # Dependencies dan scripts
└── BROADCAST_README.md # Dokumentasi aplikasi broadcast
```

## Konfigurasi

### Delay Pengiriman
Untuk menghindari deteksi spam, aplikasi menggunakan delay 2-5 detik antar pesan. Anda dapat mengubah nilai ini di file `server.js`:

```javascript
const delay = Math.random() * 3000 + 2000; // 2-5 detik
```

### Port Server
Secara default server berjalan di port 3000. Untuk mengubahnya, edit file `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

### Error "Session Terminated"
- Logout dari WhatsApp Web di browser lain
- Hapus folder `.wwebjs_auth` jika ada
- Restart server dan scan ulang QR Code

## Keamanan dan Etika

⚠️ **Penting**: Gunakan tool ini dengan bijak dan bertanggung jawab

- Jangan spam kontak dengan pesan yang tidak relevan
- Hormati privasi dan preferensi penerima
- Gunakan delay yang cukup antar pesan
- Patuhi terms of service WhatsApp
- Jangan gunakan untuk tujuan ilegal atau merugikan

## 🚀 Deployment & Production

### ⚠️ PENTING: Masalah Vercel

**Aplikasi ini TIDAK DAPAT di-deploy ke Vercel** karena:
- Missing Chrome dependencies (`libnss3.so`, dll)
- Serverless limitations untuk persistent connections
- Memory & timeout constraints

### ✅ Platform Deployment yang Didukung

#### 1. **Docker (Recommended)**
```bash
# Quick start
npm run docker:compose:up

# Manual build
npm run docker:build
npm run docker:run
```

#### 2. **VPS/Dedicated Server**
```bash
# Auto setup (Ubuntu/Debian)
npm run setup:prod

# Manual PM2
npm run pm2:start
```

#### 3. **Cloud Platforms**
- DigitalOcean App Platform
- Google Cloud Run
- AWS ECS/Fargate
- Railway
- Render

### Masalah Umum di Production

Jika aplikasi berjalan normal di localhost tetapi gagal terhubung di production server, kemungkinan penyebabnya:

1. **Konfigurasi Puppeteer tidak sesuai untuk server production**
2. **Missing dependencies Chrome/Chromium di server Linux**
3. **Konfigurasi sandbox dan security yang berbeda**

### Solusi Otomatis

Proyek ini sudah dilengkapi dengan konfigurasi otomatis untuk production:

- Deteksi environment production secara otomatis
- Konfigurasi Puppeteer yang dioptimalkan untuk server
- Auto-detect system Chrome/Chromium
- Support untuk custom environment variables

### Quick Setup untuk Production (Linux)

1. **Jalankan script setup otomatis:**
   ```bash
   chmod +x setup-production.sh
   ./setup-production.sh
   ```

2. **Atau setup manual:**
   ```bash
   # Install dependencies
   sudo apt update
   sudo apt install -y nodejs npm google-chrome-stable
   
   # Install project dependencies
   npm install
   
   # Install PM2
   npm install -g pm2
   
   # Start dengan PM2
   npm run pm2:start
   ```

### Environment Variables

Buat file `.env` dari template:
```bash
cp .env.example .env
```

Konfigurasi untuk production:
```env
NODE_ENV=production
PORT=3000
CHROME_PATH=/usr/bin/google-chrome-stable
SESSION_PATH=/app/sessions
```

### Scripts NPM untuk Production

```bash
# Start production mode
npm run prod

# PM2 commands
npm run pm2:start    # Start dengan PM2
npm run pm2:stop     # Stop aplikasi
npm run pm2:restart  # Restart aplikasi
npm run pm2:logs     # Lihat logs
npm run pm2:monit    # Monitor resource
```

## Troubleshooting

### Error "Failed to launch browser process"

**Penyebab:** Missing Chrome dependencies di server Linux

**Solusi:**
```bash
# Install Chrome dependencies
sudo apt install -y libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# Install Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update && sudo apt install -y google-chrome-stable
```

### Error "No usable sandbox"

**Solusi:** Sudah ditangani otomatis dengan flag `--no-sandbox` di production

### Session Issues

**Solusi:**
```bash
# Hapus session yang corrupt
rm -rf .wwebjs_auth

# Restart aplikasi
npm run pm2:restart
```

### Memory Issues

**Solusi:**
- Gunakan server dengan minimal 2GB RAM
- Monitor dengan `npm run pm2:monit`
- Restart otomatis sudah dikonfigurasi di PM2

## Dokumentasi Lengkap

- [Panduan Deployment](./DEPLOYMENT_GUIDE.md) - Panduan lengkap deployment production
- [Konfigurasi PM2](./ecosystem.config.js) - Konfigurasi process manager
- [Setup Script](./setup-production.sh) - Script otomatis setup production

## Bug

- Fitur import kontak dari CSV tidak berfungsi

## Lisensi

Apache-2.0 License

## Kontribusi

Kontribusi dan saran perbaikan sangat diterima. Silakan buat issue atau pull request.

## Disclaimer

Proyek ini menggunakan library unofficial WhatsApp Web.js. Tidak ada jaminan tidak akan di-block oleh WhatsApp. Gunakan dengan bijak dan sesuai Terms of Service WhatsApp.
