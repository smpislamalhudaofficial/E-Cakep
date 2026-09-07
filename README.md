# E-CAKEP v3.3

Elektronik Catatan Kedisiplinan — aplikasi web untuk pencatatan kedisiplinan siswa. Paket ini disiapkan untuk GitHub Pages dengan Google Apps Script sebagai backend.

## Role
- **Admin**: akses penuh, data master, pengguna, foto massal, logo aplikasi, dan pengaturan.
- **Guru**: pencatatan pelanggaran dan pemantauan siswa sesuai kelas/akun guru.
- **Siswa**: hanya melihat profil dan riwayat kedisiplinan miliknya sendiri serta mencetak profil.

## Login awal
Username: `admin`  
Password: `admin123`

Jika Sheet **Pengguna** sudah ada, jalankan `setupSheets()` setelah memperbarui `Code.gs`. Migrasi v3.3 tidak menghapus data pengguna yang sudah ada dan akan memastikan akun admin tersedia.

## Deploy Google Apps Script
1. Buka Apps Script yang terhubung dengan Spreadsheet E-CAKEP.
2. Ganti seluruh kode dengan `Code.gs` v3.3.
3. Pastikan `SPREADSHEET_ID` berisi ID Spreadsheet.
4. Jalankan `setupSheets()` satu kali.
5. Deploy > Manage deployments > Edit > New version > Deploy.
6. Gunakan URL Web App yang berakhiran `/exec` di `config.js`.

## GitHub Pages
Upload seluruh isi folder ini ke repository GitHub, termasuk folder `assets`. Aktifkan GitHub Pages dari branch yang digunakan.

## Excel
Fitur Excel menggunakan library `xlsx-js-style` dari CDN agar template dapat memiliki header biru, teks bold, border hitam, dan ukuran kolom otomatis. Jika internet tidak tersedia, fitur Excel tidak dapat dimuat.

## Foto massal
- Siswa: upload ZIP berisi JPG/PNG/WebP; nama file menggunakan **NISN** sebagai pencocokan utama, nama siswa sebagai fallback.
- Guru: nama file menggunakan **nama guru**.
- Maksimal 1 MB per foto; foto dikompresi otomatis sebelum dikirim ke Google Drive.
- Foto terbaru menggantikan foto lama.
- ZIP dibatasi 25 MB di browser dan diproses bertahap agar tidak membebani request Apps Script.

## Logo aplikasi
Logo default berada di `assets/logo-ecakep.svg`. Admin dapat mengganti logo melalui **Pengaturan > Logo Aplikasi** dengan JPG, PNG, atau SVG maksimal 1 MB. Logo aktif digunakan pada login, sidebar, dan halaman cetak.
