PANDUAN SINGKAT - PORTAL UJIAN PMB STIPI MAGHFIRAH 2026
Versi: Secure Package Lock + Admin Reset

PERUBAHAN UTAMA VERSI INI
1. Peserta login memakai password peserta, lalu mengisi nama dan nomor ujian.
2. Admin login hanya memakai password admin, lalu masuk ke dashboard.
3. Peserta hanya bisa memilih satu paket:
   - Pilihan 1: Bahasa Arab dan Matematika.
   - Pilihan 2: Bahasa Inggris dan Matematika.
4. Setelah paket dipilih, paket dikunci berdasarkan nomor ujian.
5. Jika peserta logout, refresh, atau ganti perangkat, sistem akan mengecek status nomor ujian ke Google Sheets.
6. Peserta tidak melihat nilai setelah submit. Peserta hanya melihat pesan bahwa jawaban sudah terkirim.
7. Admin tetap melihat nilai, rekap, export CSV, monitoring ringan, dan tombol reset peserta.
8. Admin bisa reset peserta tertentu agar peserta dapat mengerjakan ulang.
9. Reset peserta akan:
   - membuka kunci paket,
   - mengosongkan daftar ujian selesai,
   - menghapus hasil peserta tersebut dari sheet Hasil PMB,
   - memberi tanda resetAt agar browser peserta ikut bersih saat login ulang.

ISI FOLDER
- index.html = halaman utama/login.
- styles.css = tampilan website.
- app.js = sistem ujian dan penguncian paket.
- config.js = konfigurasi Google Sheets dan monitoring.
- database/users.js = akun admin dan daftar password peserta.
- database/accounts.csv = cadangan daftar akun.
- google-apps-script.gs = script backend ringan untuk Google Sheets.
- assets/ = logo dan banner.

CARA UPLOAD KE GITHUB
1. Upload seluruh isi folder ini, bukan hanya index.html.
2. Pastikan struktur tetap seperti ini:
   - index.html
   - styles.css
   - app.js
   - config.js
   - google-apps-script.gs
   - database/users.js
   - database/accounts.csv
   - assets/logo-stipi-maghfirah.png
   - assets/banner-kampus-pemimpin.png
   - assets/banner-pendidikan-5-tahun.png
   - assets/banner-ujian-tulis-2026.png
3. Commit changes.
4. Tunggu GitHub Pages refresh 1-5 menit.
5. Tes dari mode incognito.

CARA MENGHUBUNGKAN GOOGLE SHEETS
Wajib dilakukan agar penguncian paket berlaku lintas perangkat.

1. Buat Google Sheet baru.
2. Klik Extensions > Apps Script.
3. Hapus isi script lama.
4. Tempel seluruh isi file google-apps-script.gs versi terbaru ini.
5. Klik Project Settings.
6. Pada Script Properties, tambahkan:
   - Property: ADMIN_PASSWORD
   - Value: ipimadmin2026
   Jika password admin di database/users.js diganti, value ini juga harus diganti.
7. Klik Deploy > New deployment.
8. Pilih type: Web app.
9. Execute as: Me.
10. Who has access: Anyone.
11. Klik Deploy.
12. Copy Web App URL.
13. Buka config.js.
14. Tempel URL pada:
    sheetsWebAppUrl: "ISI_URL_DI_SINI"
15. Upload ulang config.js ke GitHub.

PENTING SAAT UPDATE APPS SCRIPT
Jika sebelumnya sudah pernah deploy Apps Script:
1. Tempel ulang script terbaru.
2. Klik Deploy > Manage deployments.
3. Pilih deployment aktif.
4. Klik Edit.
5. Pada Version, pilih New version.
6. Deploy ulang.
7. Gunakan Web App URL yang sama di config.js.

CARA RESET PESERTA
1. Login sebagai admin.
2. Masuk dashboard.
3. Pada bagian Reset Peserta, masukkan nomor ujian, contoh PMB001.
4. Klik Reset Peserta.
5. Konfirmasi reset.
6. Minta peserta logout, refresh halaman, lalu login ulang.

CATATAN KEAMANAN JUJUR
Versi ini jauh lebih baik untuk mengunci pilihan paket lintas perangkat karena status paket disimpan di Google Sheets melalui Apps Script. Namun karena website tetap statis di GitHub Pages, password dan kunci jawaban masih bisa dibaca oleh orang yang sangat paham inspect/source code. Untuk ujian resmi skala besar dan keamanan tinggi, backend idealnya memakai Firebase/Supabase/server dengan autentikasi, rules, dan bank soal yang tidak dikirim seluruhnya ke browser.

SETTING MONITORING DI config.js
- cameraOptional: true = peserta diminta izin kamera, tetapi tidak memblokir kalau ditolak.
- micOptional: true = peserta diminta izin mic, tetapi tidak merekam audio penuh.
- cameraRequired: false = kamera tidak wajib.
- micRequired: false = mic tidak wajib.
- fullscreenRequired: true = sistem mencoba masuk fullscreen.
- syncActivities: false = paling aman untuk banyak peserta; hanya hasil akhir yang dikirim.
- syncActivities: true = event penting dikirim ke Google Sheets; gunakan hanya setelah diuji.

AKUN DEFAULT
- Admin:
  username: admin
  password: ipimadmin2026
- Password peserta default:
  ipim2026

ALUR UJI COBA YANG DISARANKAN
1. Login peserta dengan password peserta.
2. Isi nama dan nomor ujian, contoh PMB001.
3. Pilih Pilihan 2.
4. Mulai Bahasa Inggris, jawab beberapa soal, submit.
5. Logout.
6. Login lagi dengan nomor ujian PMB001 dari browser/device lain.
7. Pastikan peserta langsung masuk ke paket yang sama dan tidak bisa memilih paket lain.
8. Login admin.
9. Klik Ambil Hasil dari Google Sheets.
10. Reset PMB001.
11. Login ulang sebagai PMB001 dan pastikan paket sudah bisa dipilih lagi.


CATATAN UPDATE MOBILE FIX v2
- Pada HP, fullscreen otomatis dimatikan agar layar ujian bisa digeser/scroll normal.
- Area ujian memakai tinggi 100dvh agar tidak lompat saat address bar browser HP muncul/hilang.
- Tombol navigasi dibuat sticky di bawah layar HP agar peserta tidak perlu scroll jauh.
- Preview kamera disembunyikan pada layar HP untuk mengurangi lag, tetapi status kamera/mic tetap dicatat.
