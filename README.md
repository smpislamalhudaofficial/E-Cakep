# E-CAKEP v3.3 — Login Admin & Guru + GitHub Pages

Versi ini merupakan rebuild dari E-CAKEP v3.2.

## Perubahan utama
- Login Admin/Guru aktif.
- Role-based access: Admin penuh, Guru untuk pencatatan dan pemantauan.
- Session login berbasis token dengan masa berlaku 12 jam.
- Validasi role dilakukan di Google Apps Script, bukan hanya di frontend.
- Manajemen akun Admin/Guru.
- Sinkronisasi pengguna dari Sheet `Pengguna`.
- Dashboard/UI diperbarui dengan gaya aplikasi administrasi SEMPIA yang lebih modern.
- Fitur Excel menggunakan SheetJS melalui CDN resmi.
- Tetap mempertahankan data siswa, guru, pelanggaran, poin, foto Google Drive, QR, dan sinkronisasi Spreadsheet.

## Deploy Google Apps Script
1. Buka project Apps Script yang terhubung ke Spreadsheet E-CAKEP.
2. Ganti seluruh `Code.gs` dengan file `Code.gs` pada paket ini.
3. Pastikan `SPREADSHEET_ID` benar.
4. Jalankan fungsi `setupSheets()` satu kali dari editor Apps Script dan izinkan semua permission yang diminta.
5. Pastikan Sheet berikut tersedia:
   - Data Siswa
   - Data Guru
   - Pelanggaran
   - Pengguna
6. Deploy > New deployment > Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Salin URL `/exec` ke `config.js`.

## Akun awal
Setelah `setupSheets()` dijalankan, jika Sheet `Pengguna` masih kosong, sistem membuat:
- Username: `admin`
- Password: `admin123`
- Role: Admin

Segera ubah password melalui menu **Pengguna** setelah login.

## GitHub Pages
Upload seluruh isi folder ke repository. Pastikan `index.html` berada di root folder yang dipublish.

## Catatan Excel
Fitur `.xlsx` menggunakan SheetJS dari CDN. GitHub Pages harus memiliki akses internet agar modul Excel termuat.

## Versi
E-CAKEP v3.3
