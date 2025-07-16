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

## Bug

- Fitur import kontak dari CSV tidak berfungsi

## Lisensi

Apache-2.0 License

## Kontribusi

Kontribusi dan saran perbaikan sangat diterima. Silakan buat issue atau pull request.
