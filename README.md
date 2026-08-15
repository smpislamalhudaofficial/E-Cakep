# E-CAKEP v3.2 — Login & Role Pengguna

Versi ini dibangun dari mekanisme koneksi v3.1 yang sudah berhasil, lalu login ditambahkan kembali tanpa `config.js`. URL Apps Script tertanam langsung di `app.js`.

## Role

- **Admin**: akses penuh Data Siswa, Data Guru, Akun Pengguna, reset poin, hapus data, foto profil, pengaturan, import/export Excel.
- **Guru**: pencatatan pelanggaran, Riwayat, Data Siswa/profil, Dashboard Wali. Jika akun ditautkan ke Data Guru maka nama guru otomatis terkunci. Kelas wali membatasi dashboard/riwayat sesuai kelas.
- **Siswa/Wali**: hanya melihat profil, foto, poin, dan riwayat siswa yang ditautkan pada akun.

## Login awal

- Username: `admin`
- Password: `admin123`

Segera ubah password melalui menu **Akun Pengguna**.

## Update Google Apps Script

1. Ganti seluruh `Code.gs` dengan file v3.2 ini.
2. Pastikan `SPREADSHEET_ID` benar.
3. Jalankan `setupSheets()` satu kali. Ini akan membuat/menyesuaikan sheet **Pengguna** dan akun Admin awal bila belum ada.
4. Deploy > Manage deployments > Edit > **New version** > Deploy.
5. Tes URL `/exec?action=ping`. Hasil harus memuat `apiVersion: 32`.

## Upload GitHub Pages

Upload ke root repository:

- `index.html`
- `app.js`
- `styles.css`
- `.nojekyll`

`config.js` tidak digunakan.

## Akun Pengguna

Admin dapat menambah akun manual atau import Excel. Kolom template: Username, Password, Nama Pengguna, Role, Nama Guru, NISN Siswa, Kelas Wali, Aktif.

Role yang valid: `Admin`, `Guru`, `Siswa/Wali`.
