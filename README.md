# E-CAKEP v3.4

Elektronik Catatan Kedisiplinan — GitHub Pages + Google Apps Script.

## Role
- **Admin**: akses penuh, master data, pengguna, foto massal, logo, pengaturan.
- **Guru**: dapat melihat seluruh data sekolah, mencatat kedisiplinan, Dashboard Wali untuk kelas yang dipilih, dan melihat riwayat pencatatan pada Profil Saya (20 per halaman).
- **Siswa**: hanya melihat profil dan riwayat miliknya sendiri serta dapat mencetak profil.

## Login awal
Username: `admin`  
Password: `admin123`

## Update v3.4
- UI gradasi ungu-biru, font Roboto/Helvetica, desktop diperbesar tanpa mengubah skala mobile secara berlebihan.
- Popup konfirmasi hapus/reset berada di tengah layar dengan ikon peringatan.
- Logo aplikasi 1:1 dan dapat diganti Admin dari Pengaturan; logo aktif dipakai pada login, sidebar, dan halaman cetak.
- Icon navigasi tersedia sebagai file SVG di `assets/icons/` dan dapat diganti dengan mempertahankan nama file.
- Wali kelas ditautkan pada Data Guru dan ditampilkan pada profil/cetak siswa.
- Foto profil dioptimalkan dan dikompresi.
- Profil Guru menampilkan riwayat pencatatan dengan pagination 20 item.
- Nama guru pada Data Guru dapat dibuka untuk melihat profil guru.
- Password pada Data Pengguna dapat ditampilkan dengan tombol mata.
- Halaman cetak Profil Siswa memakai foto siswa dan nama Wali Kelas.
- Template Excel tetap memiliki header berwarna, bold, border, dan lebar kolom otomatis.

## Deployment
1. Ganti seluruh `Code.gs` pada Apps Script dengan versi v3.4.
2. Pastikan `SPREADSHEET_ID` benar.
3. Jalankan `setupSheets()` satu kali. **Jangan menghapus Sheet Pengguna.**
4. Deploy > Manage deployments > Edit > New version > Deploy.
5. Gunakan URL `/exec` pada `config.js`.
6. Upload isi folder ini ke GitHub Pages.

## Catatan migrasi
`setupSheets()` menambahkan kolom **Wali Kelas** pada Data Guru jika belum ada dan mempertahankan data pengguna lama.
