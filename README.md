# Sahabat Berbulu - Toko Online Kebutuhan Hewan Peliharaan 🐾

Aplikasi web toko online statis berbasis **HTML, CSS, dan JavaScript Vanilla** murni tanpa framework, backend, atau database server. Seluruh data aplikasi dikelola secara dinamis di browser menggunakan `localStorage` dengan penanganan error aman (`try-catch`), proteksi XSS, dan hashing kata sandi SHA-256 via Web Crypto API.

---

## 🎯 Fitur Utama

### 1. Peran Pelanggan (Customer)
- **Katalog & Pencarian:** Lihat produk dengan filter kategori dan pencarian kata kunci real-time.
- **Keranjang Belanja:** Tambahkan produk ke keranjang, atur jumlah, dan hitung total subtotal secara otomatis.
- **Validasi Stok & Checkout:** Memproses pesanan dengan simulasi metode pembayaran (Transfer Bank, QRIS, COD) dan pengurangan stok otomatis.
- **Riwayat Pesanan:** Memantau status pesanan (menunggu, diproses, selesai, dibatal).

### 2. Peran Admin
- **CRUD Produk:** Tambah produk baru, edit nama/harga/stok/deskripsi/ikon, dan hapus produk.
- **CRUD Kategori:** Tambah dan hapus kategori hewan peliharaan.
- **Kelola Status Pesanan:** Mengubah status pesanan pelanggan dan mengembalikan stok secara otomatis jika pesanan dibatalkan.
- **Reset Data Demo:** Mengembalikan seluruh data ke kondisi awal dari file `data/products.json`.

---

## 🔑 Akun Demo Pengujian

Aplikasi telah dilengkapi dengan akun bawaan yang kata sandinya di-hash dengan **SHA-256**:

| Peran | Alamat Email | Kata Sandi |
| :--- | :--- | :--- |
| **Admin** | `admin@sahabatberbulu.com` | `Admin123!` |
| **Pelanggan** | `budi@gmail.com` | `Budi123!` |

---

## 💻 Cara Menjalankan Secara Lokal

Karena browser memblokir fungsi `fetch()` ke file JSON lokal (`file:///...`), gunakan server lokal sederhana:

### Cara A: Menggunakan VS Code Live Server
1. Buka folder proyek di VS Code.
2. Klik kanan pada `index.html` -> **Open with Live Server**.

### Cara B: Menggunakan Node.js / NPX
```bash
npx serve .
```
Aplikasi akan berjalan di `http://localhost:3000`.

### Cara C: Menggunakan Python
```bash
python3 -m http.server 8000
```
Buka `http://localhost:8000` di browser.

---

## 🌐 Cara Hosting Gratis di Vercel

1. Push repository ini ke GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/) -> **Add New Project**.
3. Hubungkan repository GitHub ini.
4. Pada bagian **Build & Output Settings**, biarkan kosong (tanpa Build Command karena ini situs statis).
5. Klik **Deploy**! Aplikasi akan langsung aktif dalam hitungan detik.

---

## 📁 Struktur Berkas

```text
Sahabat Berbulu/
├── index.html              # Template utama SPA & kontainer halaman
├── css/
│   └── style.css           # Desain visual hangat, responsif & modern
├── data/
│   └── products.json       # Data awal produk, kategori & akun demo
├── js/
│   ├── storage.js          # Pembungkus localStorage, fallback & sanitasi XSS
│   ├── auth.js             # Logika registrasi, login & Web Crypto SHA-256
│   ├── products.js         # Logika katalog, filter kategori & format Rp
│   ├── cart.js             # Logika keranjang belanja per pengguna
│   ├── orders.js           # Logika checkout, pengurangan stok & riwayat
│   ├── admin.js            # Logika CRUD admin & reset data demo
│   └── app.js              # Router SPA hash (#/) & pengontrol event UI
└── package.json            # Konfigurasi proyek
```
