# 🚀 Rover-Drone API

[![CI](https://github.com/marcceljanara/rover-drone-api/actions/workflows/ci.yml/badge.svg)](https://github.com/marcceljanara/rover-drone-api/actions/workflows/ci.yml)
[![Build Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com/marcceljanara/rover-drone-api)  
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

Backend API untuk mendukung sistem **Rover Drone** dengan penyewaan perangkat IoT, kontrol MQTT, manajemen rental, pengiriman, dan pelaporan.

## 🧩 Fitur Utama

### Autentikasi & Otorisasi
- Login / logout dengan refresh token.  
- Pembaruan access token via refresh token.

### Pengguna
- Registrasi pengguna baru.  
- Verifikasi OTP.  
- Kirim ulang kode OTP.  
- Manajemen alamat pengguna (CRUD + default).

### Admin
- Buat user baru oleh admin.  
- Daftar semua pengguna.  
- Detail, ubah password, dan hapus pengguna.

### Perangkat (Devices)
- Tambah, lihat, dan ubah detail perangkat (admin).  
- Kontrol perangkat (user/admin) via endpoint control.  
- Konfigurasi topik MQTT untuk control/sensor.  
- Mendapatkan data sensor (interval / limit / download).  
- Monitoring penggunaan harian (total jam).

### Rental & Ekstensi
- Pengajuan rental oleh user.  
- Pengelolaan status rental oleh admin.  
- Pembatalan rental oleh user.  
- Pengajuan dan pengelolaan perpanjangan sewa.

### Pembayaran
- Daftar dan detail pembayaran.  
- Verifikasi pembayaran.  
- Soft delete pembayaran.

### Laporan
- Buat laporan transaksi per rentang tanggal.  
- Daftar dan detail laporan.  
- Download laporan PDF.  
- Hapus laporan.

### Pengiriman (Shipments) & Pengembalian (Returns)
- Detail dan daftar pengiriman.  
- Update info/status pengiriman.  
- Konfirmasi actual shipping / delivery.  
- Upload & ambil bukti pengiriman.  
- Manajemen return: alamat, status, catatan.

### Sensor & Shipping
- Daftar sensor tersedia.  
- Hitung biaya pengiriman ke tujuan (integrasi dengan Komerce).

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL  
- **Authentication:** JWT (access + refresh token)  
- **Message Broker:** RabbitMQ  
- **Device Control:** MQTT  
- **Reporting:** PDFKit, json2csv  
- **Linting:** ESLint (Airbnb)  
- **Testing:** Jest, Supertest  
- **API Docs:** Swagger (swagger-jsdoc + swagger-ui-express)

## ⚙️ Prasyarat

- Node.js (>=18)  
- PostgreSQL  
- RabbitMQ  
- MQTT broker  
- (Opsional) SMTP server untuk email  
- `git` untuk clone repository

## 📥 Instalasi

1. Clone repository  
   ```bash
   git clone https://github.com/marcceljanara/rover-drone-api.git
   cd rover-drone-api
2. Install dependencies
   ```bash
   npm install
3. Buat file .env dengan menyalin .env.example (atau isi manual) dan isi variabelnya. Contoh minimal:
   ```bash
   PORT=5000
   HOST=localhost
  
   PGUSER=postgres
   PGPASSWORD=your_db_password
   PGDATABASE=roverdrone
   PGHOST=localhost
   PGPORT=5432
  
   SMTP_HOST=smtp.hostinger.com
   SMTP_EMAIL=no-reply@xsmartagrichain.com
   SMTP_PASSWORD=your_smtp_password
   SMTP_USER=no-reply
   TEST_EMAIL=youremail@gmail.com
  
   REFRESH_TOKEN_KEY=some_random_secret
   ACCESS_TOKEN_KEY=another_random_secret
   ACCESS_TOKEN_AGE=1800
  
   RABBITMQ_SERVER=amqp://localhost
  
   MQTT_URL=mqtt://your-broker
   MQTT_USERNAME=your_user
   MQTT_PASSWORD=your_pass
  
   ENABLE_SWAGGER=true
   BASE_URL=http://localhost:5000
  
   KOMERCE_BASE_URL=https://api-sandbox.collaborator.komerce.id/tariff/api/v1
   KOMERCE_API_KEY=your_komerce_key
4. Jalankan migrasi database
   ```bash
   npm run migrate
5. (Opsional) Buat admin default
   ```bash
   npm run generate-admin
6. Jalankan server
   ```bash
   npm run start:dev
   
## ▶️ Skrip yang Tersedia

| Script              | Deskripsi                                         |
|---------------------|---------------------------------------------------|
| `npm run start`     | Jalankan server production                        |
| `npm run start:dev` | Jalankan server development dengan nodemon        |
| `npm run test`      | Jalankan semua test sekali                        |
| `npm run test:watch`| Jalankan test dalam mode watch + coverage         |
| `npm run test:export` | Jalankan test dan export hasil ke JSON          |
| `npm run lint`      | Cek style dengan ESLint                           |
| `npm run lint-fix`  | Perbaiki otomatis style                           |
| `npm run migrate`   | Migrasi database (default environment)            |
| `npm run migrate:test` | Migrasi database untuk environment test        |
| `npm run clean-table` | Utility untuk membersihkan tabel tertentu       |

## 📦 Contoh Penggunaan API

### Login
```bash
curl -X POST http://localhost:5000/v1/authentications \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

### Registrasi User
```bash
curl -X POST http://localhost:5000/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"secret", "username":"newuser", "fullname": "New User"}'
```

## 📚 Dokumentasi API

Swagger UI tersedia (jika ENABLE_SWAGGER=true) di:
```bash
http://localhost:5000/v1/api-docs/#/
```
(Atau path sesuai konfigurasi di src — cek implementasi swagger setup.)

## 🤝 Kontribusi
Kontribusi disambut.

1. Fork repository

2. Buat branch fitur: `git checkout -b feature/your-feature`

3. Commit perubahan: `git commit -m "Deskripsi"`

4. Push: `git push origin feature/your-feature`

5. Buka Pull Request

## 📫 Kontak
Dibuat oleh: I Nengah Marccel JBC
- Repo: https://github.com/marcceljanara/rover-drone-api
- Issues: https://github.com/marcceljanara/rover-drone-api/issues
