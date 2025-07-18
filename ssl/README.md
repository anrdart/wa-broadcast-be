# SSL Certificate Setup

Untuk menggunakan domain `https://wa-broadcast.ekalliptus.my.id/`, Anda perlu menyediakan SSL certificates.

## File yang Diperlukan

1. `cert.pem` - SSL certificate file
2. `key.pem` - Private key file

## Cara Mendapatkan SSL Certificate

### Option 1: Let's Encrypt (Gratis)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d wa-broadcast.ekalliptus.my.id

# Copy certificates
sudo cp /etc/letsencrypt/live/wa-broadcast.ekalliptus.my.id/fullchain.pem ./cert.pem
sudo cp /etc/letsencrypt/live/wa-broadcast.ekalliptus.my.id/privkey.pem ./key.pem
```

### Option 2: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Option 3: Cloudflare SSL

Jika menggunakan Cloudflare:
1. Login ke Cloudflare Dashboard
2. Pilih domain Anda
3. Go to SSL/TLS > Origin Server
4. Create Certificate
5. Download dan simpan sebagai `cert.pem` dan `key.pem`

## Struktur File

```
ssl/
├── cert.pem    # SSL certificate
├── key.pem     # Private key
└── README.md   # This file
```

## Catatan Penting

- Pastikan file certificates memiliki permission yang benar (600)
- Jangan commit private key ke repository
- Renew certificate secara berkala (Let's Encrypt: 90 hari)
- Untuk production, gunakan certificate dari CA yang terpercaya

## Testing SSL

Setelah setup:

```bash
# Test SSL configuration
openssl s_client -connect wa-broadcast.ekalliptus.my.id:443

# Check certificate expiry
openssl x509 -in cert.pem -text -noout | grep "Not After"
```