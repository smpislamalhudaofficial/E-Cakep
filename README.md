# E-CAKEP v3.1 — GitHub Pages Tanpa Login

Versi ini menghapus fitur login, role, Akun Pengguna, dan portal Siswa/Wali. Aplikasi langsung masuk ke dashboard.

## File GitHub Pages
Upload file berikut ke root repository GitHub Pages:
- `index.html`
- `app.js`
- `styles.css`
- `.nojekyll`

`config.js` tidak diperlukan. URL Google Apps Script sudah tertanam langsung pada `app.js`.

## Google Apps Script
1. Buka Spreadsheet > Extensions > Apps Script.
2. Ganti seluruh `Code.gs` lama dengan `Code.gs` dari paket ini.
3. Pastikan `SPREADSHEET_ID` benar.
4. Jalankan `setupSheets()` satu kali.
5. Deploy > Manage deployments > Edit > New version > Deploy.
6. Web app dijalankan sebagai pemilik dan akses deployment harus dapat dipanggil oleh pengguna web Anda.
7. Tes URL `/exec?action=ping`.

Hasil yang benar memuat:
```json
{"ok":true,"app":"E-CAKEP v3.1 Tanpa Login","apiVersion":31}
```

## Data lama
Sheet `Pengguna` lama boleh dibiarkan. Versi ini tidak membaca atau menggunakannya. Jika ingin, sheet itu dapat dihapus manual setelah memastikan tidak diperlukan lagi.

## Penting soal keamanan
Karena login dihilangkan, siapa pun yang dapat membuka URL GitHub Pages E-CAKEP dapat menambah, mengubah, menghapus data, mereset poin, dan mengubah foto. Gunakan hanya jika risiko akses terbuka ini dapat diterima.
