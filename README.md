# E-CAKEP v3.2 — Tanpa Login (Perbaikan Sinkronisasi)

Versi ini **tidak menggunakan login, session, token, Akun Pengguna, atau portal berdasarkan role**. Aplikasi langsung membuka dashboard dan setiap request ke Google Apps Script dikirim tanpa token.

## Penyebab error “Sesi login tidak ditemukan”

Error tersebut berasal dari **deployment Google Apps Script lama yang masih menjalankan kode berbasis login/session**. Frontend v3.1 sudah tanpa login, tetapi URL `/exec` Anda masih menunjuk deployment yang belum diperbarui atau deployment baru belum dibuat sebagai **New version**.

Versi v3.2 sekarang memeriksa backend secara tegas. Backend yang benar harus menjawab `apiVersion: 32`, `authMode: "NONE"`, dan `requiresLogin: false`. Jika backend masih memakai session/login, aplikasi akan menampilkan pesan bahwa Code.gs lama masih aktif.

## File untuk GitHub Pages

Upload ke root repository:
- `index.html`
- `app.js`
- `styles.css`
- `config.js`
- `.nojekyll`

`config.js` adalah satu-satunya tempat untuk menyimpan URL Google Apps Script `/exec`.

## Cara update Google Apps Script — WAJIB

1. Spreadsheet → **Extensions → Apps Script**.
2. Hapus/ganti seluruh `Code.gs` dengan `Code.gs` v3.2 dari paket ini.
3. Pastikan `SPREADSHEET_ID` adalah ID Spreadsheet, bukan URL lengkap.
4. Simpan.
5. Jalankan `setupSheets()` satu kali dan izinkan akses yang diminta.
6. Buka **Deploy → Manage deployments**.
7. Pilih deployment Web App yang URL `/exec`-nya sama dengan `config.js`.
8. Klik **Edit (pensil)**.
9. Pada Version pilih **New version**.
10. Pastikan **Execute as: Me** dan akses Web App mengizinkan pengguna yang akan membuka aplikasi.
11. Klik **Deploy**.

Mengganti isi Code.gs tanpa langkah **New version → Deploy** tidak memperbarui `/exec` yang sedang dipakai.

## Tes backend

Buka di browser:

`URL_EXEC?action=ping`

Hasil yang benar harus mirip:

```json
{
  "ok": true,
  "app": "E-CAKEP v3.2 Tanpa Login",
  "apiVersion": 32,
  "authMode": "NONE",
  "requiresLogin": false
}
```

Jika masih muncul kalimat **Sesi login tidak ditemukan**, backend lama masih aktif. Jangan mengubah frontend untuk memasukkan username/password; deploy ulang `Code.gs` v3.2.

## config.js

Pastikan URL berakhir `/exec`:

```js
window.ECAKEP_CONFIG = Object.freeze({
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
  API_VERSION: 32,
  APP_NAME: 'E-CAKEP v3.2 Tanpa Login'
});
```

## Catatan keamanan

Mode tanpa login berarti **siapa pun yang memiliki URL aplikasi dapat menambah, mengubah, menghapus data, mengubah foto, dan mereset poin**. Gunakan hanya bila akses terbuka memang diinginkan.
