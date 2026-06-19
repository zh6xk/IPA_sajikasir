# 🍔 SajiKasir (v1.0.0)

**SajiKasir** adalah aplikasi Point of Sale (Kasir) modern yang dibangun menggunakan kerangka kerja **React Native (Expo)**. Aplikasi ini dirancang untuk mempermudah pengelolaan menu, pemesanan, dan pencatatan transaksi secara efisien.

## ✨ Fitur Utama
1. **Manajemen Menu (Produk):** Tambah, ubah, dan hapus data produk makanan/minuman dengan mudah.
2. **Katalog Pesanan:** Antarmuka kasir yang intuitif untuk memproses pesanan pelanggan dengan cepat.
3. **Riwayat Transaksi:** Pencatatan dan pelacakan seluruh riwayat transaksi yang pernah dilakukan.
4. **Pengaturan Profil:** Konfigurasi profil pengguna dan preferensi aplikasi.
5. **Database Lokal:** Penyimpanan data offline yang aman dan ringan menggunakan SQLite.

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi

### 1. Menjalankan di Komputer Lokal (Development)
Pastikan komputer Anda sudah terinstal **Node.js** dan **Git**.

```bash
# Clone repository ini
git clone https://github.com/zh6xk/IPA_sajikasir.git
cd IPA_sajikasir

# Instal semua dependensi
npm install

# Jalankan server Expo
npx expo start
```
Gunakan aplikasi **Expo Go** di HP Anda untuk memindai barcode yang muncul di terminal.

### 2. Cara Install File `.apk` (Untuk Android)
Jika Anda menggunakan perangkat Android, silakan unduh file **`sajikasir-android.apk`** dari halaman **[Releases](https://github.com/zh6xk/IPA_sajikasir/releases)**.

**Langkah Instalasi:**
1. Unduh file `sajikasir-android.apk` langsung dari browser di HP Android Anda.
2. Buka file tersebut, jika muncul peringatan "Install unknown apps", izinkan browser/file manager Anda untuk menginstal aplikasi.
3. Tunggu proses instalasi selesai, dan aplikasi SajiKasir siap digunakan!

### 3. Cara Install File `.ipa` (Untuk iPhone/iOS)
Jika Anda hanya ingin langsung mencoba aplikasi SajiKasir di iPhone Anda tanpa repot melakukan *build*, silakan unduh file **`sajikasir-unsigned.ipa`** dari halaman **[Releases](https://github.com/zh6xk/IPA_sajikasir/releases)** repository ini.

**Langkah Instalasi:**
1. Unduh aplikasi [Sideloadly](https://sideloadly.io/) di PC/Laptop Anda.
2. Sambungkan iPhone ke PC menggunakan kabel data.
3. Buka Sideloadly, tarik (drag & drop) file `sajikasir-unsigned.ipa` ke dalam Sideloadly.
4. Masukkan Apple ID Anda, lalu klik **Start**.
5. Di iPhone Anda, masuk ke **Settings > General > VPN & Device Management**, lalu *Trust* Apple ID Anda.

---

## 🌟 Tutorial Spesial: Cara Membangun (Build) IPA iOS & APK Android Secara Gratis via GitHub Actions

Bagian terpenting dari repository ini! Jika Anda adalah seorang developer React Native / Expo dan ingin menghasilkan file `.ipa` (iOS) atau `.apk` (Android) secara **gratis** tanpa harus memiliki mesin berat, Anda bisa menggunakan trik GitHub Actions.

GitHub menyediakan server virtual yang bisa kita manfaatkan untuk mengompilasi kode React Native menjadi aplikasi iOS dan Android asli.

### Langkah-langkah:
1. Di dalam proyek React Native/Expo Anda, buat folder bersarang persis seperti ini: `.github/workflows/`.
2. Di dalam folder `workflows` tersebut, buat file baru bernama `build-ios.yml` (untuk iOS) dan `build-android.yml` (untuk Android).
3. Salin (copy) dan tempel (paste) kode YAML sakti di bawah ini ke dalam file `build-ios.yml`:

```yaml
name: Build iOS IPA (Unsigned)

on:
  workflow_dispatch: # Memunculkan tombol "Run workflow" di tab Actions GitHub

jobs:
  build:
    name: Build iOS App
    runs-on: macos-latest
    permissions:
      contents: write # Izin untuk membuat rilis otomatis

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Prebuild iOS project (Expo)
        run: npx expo prebuild --platform ios
        
      # CocoaPods biasanya otomatis ada di image macos-latest GitHub
      - name: Install CocoaPods
        run: |
          cd ios
          pod install

      - name: Build unsigned IPA
        run: |
          cd ios
          
          # Mencari nama workspace dan scheme secara otomatis
          WORKSPACE=$(ls | grep .xcworkspace | head -n 1)
          SCHEME=$(basename "$WORKSPACE" .xcworkspace)
          
          echo "Building Workspace: $WORKSPACE with Scheme: $SCHEME"
          
          # Membangun aplikasi tanpa sertifikat Apple (Unsigned)
          xcodebuild -workspace "$WORKSPACE" \
            -scheme "$SCHEME" \
            -configuration Release \
            -sdk iphoneos \
            -derivedDataPath derived_data \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO \
            build

          # Membungkus hasil build (.app) menjadi format payload .ipa
          cd derived_data/Build/Products/Release-iphoneos
          mkdir Payload
          cp -r "$SCHEME.app" Payload/
          zip -r "app-unsigned.ipa" Payload
          
      - name: Upload IPA Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ios-ipa-file
          path: ios/derived_data/Build/Products/Release-iphoneos/app-unsigned.ipa

      - name: Create GitHub Release (Opsional)
        uses: softprops/action-gh-release@v2
        with:
          files: ios/derived_data/Build/Products/Release-iphoneos/app-unsigned.ipa
          tag_name: "v1.0.${{ github.run_number }}"
          name: "iOS Build #${{ github.run_number }}"
          body: "Otomatis merilis file unsigned IPA."
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Cara Mengeksekusi:

1. Unggah kode proyek Anda (termasuk folder `.github` tadi) ke GitHub. Jika Anda belum pernah menghubungkan folder ini ke GitHub, jalankan perintah berikut di terminal Anda secara berurutan:
   ```bash
   git init
   git add .
   git commit -m "Upload proyek dan konfigurasi iOS Build"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPOSITORY.git
   git push -u origin main
   ```
   *(Catatan: Jika muncul error "Author identity unknown", jalankan perintah `git config --global user.name "Nama Anda"` dan `git config --global user.email "email@anda.com"`, lalu ulangi langkah `git commit`).*
2. Buka repository GitHub Anda di browser, masuk ke tab **Actions**.
3. Di panel kiri, klik tulisan **"Build iOS IPA (Unsigned)"**.
4. Di panel kanan, klik **"Run workflow"**.
5. Tunggu sekitar 15-25 menit. Setelah selesai, file `.ipa` Anda bisa langsung di-download dari halaman utama repository di bagian **Releases**!

> **Catatan Penting:** File `.ipa` yang dihasilkan ini tidak dapat di-upload ke App Store karena tidak memiliki tanda tangan digital resmi (unsigned). File ini 100% murni ditujukan untuk pengujian ke perangkat fisik menggunakan Sideloadly, AltStore, Scarlet, atau 3uTools (dengan IPA Signature).
