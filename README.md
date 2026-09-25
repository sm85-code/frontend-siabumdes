# SIABUMDES — Sistem Informasi Akuntansi Badan Usaha Milik Desa

**Dokumen ini disusun sebagai spesifikasi fungsional dan teknis Aset Tak Berwujud berupa
perangkat lunak (*software*) dalam rangka pengadaan/kapitalisasi aset oleh Badan Usaha Milik
Desa (BUMDes), sesuai dengan prinsip pencatatan dan pelaporan keuangan BUMDes berdasarkan
Keputusan Menteri Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi (Kepmendesa PDTT)
Nomor 136 Tahun 2022 tentang Pedoman Pengelolaan Keuangan dan Kekayaan Badan Usaha Milik Desa.**

---

## 1. Identitas dan Ruang Lingkup Aset

| Uraian | Keterangan |
|---|---|
| Nama Aset | SIABUMDES (Sistem Informasi Akuntansi BUMDes) |
| Jenis Aset | Aset Tak Berwujud — Perangkat Lunak Aplikasi (*Software Asset*) |
| Bentuk | Aplikasi web (*web application*), diakses melalui peramban (*browser*), berbasis klien-server |
| Komponen | (1) Aplikasi *front-end* (antarmuka pengguna), (2) Aplikasi *back-end* (logika bisnis dan basis data), (3) Integrasi penyimpanan berkas pihak ketiga (Google Drive) |
| Fungsi Utama | Pencatatan transaksi, penyusunan laporan keuangan, penutupan buku bulanan otomatis, dan alokasi bagi hasil usaha BUMDes secara terkomputerisasi |
| Basis Regulasi | Kepmendesa PDTT No. 136 Tahun 2022; prinsip akuntansi berbasis akrual; struktur entitas Kantor Pusat dan Unit Usaha yang terpisah pembukuannya |

Dokumen ini menjelaskan **fitur fungsional** aplikasi, **kebijakan-kebijakan BUMDes** yang
ditanamkan sebagai aturan baku sistem (*embedded business rules*), serta **rumus akuntansi**
yang menjadi dasar seluruh perhitungan laporan, sebagai bukti spesifikasi teknis guna
keperluan penilaian, kapitalisasi, dan/atau audit atas aset tak berwujud dimaksud.

---

## 2. Arsitektur dan Struktur Entitas Pelaporan

Sistem mengelola pembukuan untuk **7 (tujuh) entitas terpisah** dalam satu instansi aplikasi:

1. **BUMDES (Kantor Pusat)** — entitas induk.
2. **Unit Usaha UU01 s.d. UU06** — entitas anak, masing-masing memiliki Bagan Akun Standar
   (*Chart of Accounts*/COA), buku besar, dan laporan keuangan yang terpisah dari Kantor Pusat
   maupun dari unit usaha lainnya.

Setiap entitas menyusun laporan keuangan berdasarkan **basis akrual**, dengan segregasi
akun pendapatan, beban, pokok pendapatan (HPP — khusus entitas dengan aktivitas
dagang/produksi), aset, kewajiban, dan ekuitas sesuai kategori dan sub-kategori akun yang
telah dipetakan (*slug taxonomy*) di dalam sistem.

---

## 3. Fitur Fungsional Aplikasi

### 3.1 Otentikasi dan Manajemen Pengguna

- Otentikasi berbasis sesi (*cookie* HttpOnly) dengan kombinasi *username*/*password*.
- Empat peran pengguna (*role-based access control*): **Admin**, **Pengurus**, **Pengawas**,
  dan **Pengelola** (unit usaha), masing-masing dengan kewenangan akses data yang berbeda.
- Admin dapat menambah, mengubah data (nama, *username*, e-mail, peran, penugasan unit
  usaha), mereset kata sandi, mengunci periode pencatatan per pengguna, dan menghapus
  pengguna — dengan pengaman agar sistem tidak pernah kehilangan seluruh akun Admin
  (minimal 1 akun Admin wajib tersisa pada setiap saat).
- Setiap pengguna dapat memperbarui data profil pribadi (nama, *username*, e-mail), mengganti
  kata sandi, dan mengunggah foto profil secara mandiri.

### 3.2 Pencatatan Transaksi Keuangan (*Journal Entry*)

- Input transaksi jurnal ganda (*double-entry bookkeeping*): setiap transaksi memiliki akun
  debit dan akun kredit dengan nominal yang sama, sehingga persamaan akuntansi senantiasa
  seimbang.
- Pengelompokan transaksi berdasarkan periode (bulanan) dan entitas (BUMDES/unit usaha).
- Fitur impor transaksi massal melalui berkas Excel (dengan templat baku) dan ekspor data
  transaksi ke Excel.
- Lampiran bukti transaksi (nota, kuitansi, foto) yang tersimpan pada Google Drive
  organisasi (bukan pada berkas sistem lokal, mengingat sifat *deployment* aplikasi yang
  tidak menjamin persistensi berkas lokal antar-pembaruan versi).
- Penguncian periode (*period lock*) yang mencegah perubahan/penghapusan transaksi pada
  periode yang telah ditutup, dan/atau periode yang dikunci Admin untuk pengguna tertentu.

### 3.3 Buku Besar per Akun (*General Ledger*)

- Menyajikan mutasi debit/kredit dan saldo berjalan (*running balance*) untuk setiap akun,
  per kelompok entitas dan per periode, dengan saldo awal periode dihitung dari akumulasi
  transaksi sebelum tanggal awal periode berjalan.

### 3.4 Laporan Keuangan (*Financial Statements*)

Seluruh laporan disusun otomatis dari data transaksi tersimpan, tanpa entri manual tambahan,
dan dapat diekspor dalam format **PDF**, **Excel**, dan **Word** dengan kop surat (identitas,
alamat, logo) organisasi yang dapat dikonfigurasi melalui menu Profil BUMDes.

Laporan yang tersedia:

1. Laporan Laba Rugi
2. Neraca (Laporan Posisi Keuangan)
3. Laporan Perubahan Ekuitas (LPE)
4. Laporan Arus Kas
5. Catatan atas Laporan Keuangan (CaLK)
6. Rekapitulasi bagi hasil per unit usaha

Rumus dan kebijakan penyusunan tiap laporan dijelaskan secara rinci pada **Bagian 5**.

### 3.5 Penutupan Buku Bulanan (*Monthly Closing*)

- Proses tutup buku dijalankan **per entitas per bulan** (Kantor Pusat maupun tiap unit
  usaha ditutup secara independen).
- Sistem menolak penutupan ganda atas periode dan entitas yang sama.
- Setiap akun pendapatan, HPP, dan beban ditutup (dinolkan) melalui jurnal penutup otomatis
  ke akun Ikhtisar Laba Rugi, kemudian saldo Ikhtisar Laba Rugi dialokasikan sesuai kebijakan
  bagi hasil (lihat Bagian 4 dan Bagian 5.6).
- Fasilitas pembatalan penutupan buku (*undo closing*) yang menghapus seluruh jurnal penutup
  terkait referensi periode dimaksud, untuk keperluan koreksi sebelum periode dikunci permanen.

### 3.6 Profil BUMDes dan Konfigurasi Kop Surat

- Data identitas organisasi (nama, nama badan hukum, alamat administratif, kontak),
  logo, warna tema laporan, dan nama-tanda tangan pejabat penandatangan laporan (tiga
  kolom: kiri, tengah, kanan) yang dapat diubah oleh Admin melalui antarmuka, tanpa
  memerlukan penerapan ulang (*redeploy*) aplikasi.
- **Parameter proporsi bagi hasil usaha** (lihat Bagian 4) juga dikonfigurasi pada menu
  ini, dengan validasi total wajib 100% (seratus persen) untuk setiap kelompok proporsi.

### 3.7 Modul Persediaan (*Inventory*)

- Pencatatan barang, mutasi stok masuk/keluar, dan nilai persediaan yang terhubung dengan
  akun neraca terkait, digunakan pada unit usaha dengan aktivitas dagang/produksi (HPP).

### 3.8 Bagan Akun Standar (*Chart of Accounts*)

- Struktur akun baku per entitas dengan atribut kategori (aset, kewajiban, ekuitas,
  pendapatan, beban, HPP), sub-kategori (*slug*) fungsional, dan saldo normal (debit/kredit),
  yang menjadi rujukan seluruh perhitungan laporan keuangan.

### 3.9 Dasbor (*Dashboard*)

- Ikhtisar kinerja keuangan (total pendapatan, beban, laba bersih), tren bulanan, dan
  ringkasan per unit usaha, disajikan secara visual (grafik) untuk mendukung pengambilan
  keputusan manajemen secara *real-time*.

### 3.10 Integrasi Penyimpanan Berkas (Google Drive)

- Bukti transaksi, logo organisasi, dan foto profil pengguna diunggah dan disimpan pada
  Google Drive milik organisasi (autentikasi OAuth 2.0 atas akun Google yang ditentukan
  organisasi), sehingga berkas tidak hilang akibat sifat *stateless*/*ephemeral* pada
  lingkungan penerapan (*hosting*) aplikasi.

---

## 4. Kebijakan-Kebijakan BUMDes yang Ditanamkan dalam Sistem

Selain fitur fungsional, sistem juga menanamkan sejumlah **kebijakan baku organisasi**
(*embedded governance rules*) sebagai bagian tidak terpisahkan dari logika aplikasi, sehingga
kepatuhan terhadap kebijakan tersebut tidak bergantung pada kedisiplinan manual operator,
melainkan ditegakkan otomatis oleh sistem.

### 4.1 Kebijakan Pemisahan Pembukuan Entitas (*Entity Segregation*)

Pembukuan Kantor Pusat BUMDES dan tiap Unit Usaha (UU01–UU06) wajib terpisah sepenuhnya:
transaksi, akun, saldo, dan laporan satu entitas tidak pernah tercampur atau otomatis
terkonsolidasi dengan entitas lain, guna menjaga independensi pertanggungjawaban keuangan
tiap unit usaha sesuai struktur organisasi BUMDes.

### 4.2 Kebijakan Penutupan Buku Bulanan (*Accrual Monthly Closing Entries*)

Setiap entitas **wajib ditutup setiap akhir bulan** sebelum periode berikutnya dianggap
final. Kebijakan ini diterapkan untuk menyelaraskan ketentuan Kepmendesa No. 136 Tahun 2022
(yang membatasi penyajian rincian bagi hasil pihak eksternal di dalam LPE) dengan kewajiban
AD/ART BUM Desa mengenai alokasi Bagi Hasil Usaha (BHU) secara berkala. Rincian mekanisme
dan rumus alokasi diuraikan pada Bagian 5.6.

### 4.3 Kebijakan Pencairan Bagi Hasil Berkala

Proporsi pembagian bagi hasil BUMDES Pusat beserta jadwal pencairannya kepada
Pengurus/Penasihat/Pengawas/Dana Sosial diatur **secara berkala setiap 3 (tiga) bulan**
sebagaimana diatur secara mengikat dan sah di dalam AD/ART BUM Desa, sedangkan bagi hasil
Unit Usaha kepada Kantor Pusat dicairkan **setiap awal bulan berikutnya** setelah tutup buku
bulan berjalan. Kebijakan pencairan berkala ini dinarasikan otomatis pada CaLK setiap
periode pelaporan.

### 4.4 Kebijakan Independensi Penarikan PADes Unit Usaha

Hak penarikan Pendapatan Asli Desa (PADes) yang bersumber dari Unit Usaha ke kas Kantor
Pusat dijaga akuntabilitasnya melalui pemindahan seluruh (100%) laba bersih operasional
Unit Usaha ke pos Kewajiban Lancar "Utang Bagi Hasil Unit" terlebih dahulu, bukan diakui
langsung sebagai pendapatan Kantor Pusat, sehingga kewajiban pencairan kepada Kantor Pusat
tercatat dan dapat ditelusuri (*auditable*) setiap saat.

### 4.5 Kebijakan Pengakuan Pendapatan (Basis Akrual)

Seluruh pendapatan dan beban diakui pada saat terjadinya transaksi (basis akrual), bukan
pada saat kas diterima/dikeluarkan, sesuai prinsip akuntansi yang berlaku umum dan ketentuan
Kepmendesa No. 136 Tahun 2022.

### 4.6 Kebijakan Pengendalian Internal atas Data Pengguna dan Akses

- Minimal 1 (satu) akun Admin wajib tetap tersedia pada setiap saat (tidak dapat dihapus
  atau diturunkan perannya apabila akan menyisakan nol akun Admin), untuk mencegah
  hilangnya kendali administratif atas sistem.
- Setiap peran (Admin, Pengurus, Pengawas, Pengelola) memiliki batasan akses data yang
  berbeda sesuai kewenangan dan tanggung jawabnya masing-masing dalam struktur organisasi
  BUMDes, sejalan dengan prinsip pemisahan tugas (*segregation of duties*) dalam
  pengendalian internal.
- Periode pencatatan yang telah ditutup, atau yang secara khusus dikunci oleh Admin,
  tidak dapat diubah/dihapus oleh pengguna operasional, untuk menjaga integritas data
  historis yang telah dilaporkan.

### 4.7 Kebijakan Dokumentasi Pendukung Transaksi

Setiap transaksi keuangan dianjurkan disertai bukti pendukung (nota, kuitansi, dokumentasi)
yang diunggah dan tersimpan pada media penyimpanan digital resmi organisasi (Google Drive),
sebagai bagian dari kebijakan tata kelola dokumentasi dan jejak audit (*audit trail*)
BUMDes.

### 4.8 Kebijakan Proporsi Bagi Hasil yang Dapat Diubah Secara Terkendali

Proporsi bagi hasil bukan nilai tetap yang tertanam permanen dalam kode program, melainkan
parameter organisasi yang **hanya dapat diubah oleh Admin** melalui menu Profil BUMDes, dan
**wajib berjumlah 100%** pada tiap kelompok proporsi sebelum perubahan dapat disimpan.
Kebijakan ini memungkinkan penyesuaian keputusan AD/ART dari waktu ke waktu tanpa mengubah
logika penutupan buku maupun rumus laporan keuangan itu sendiri, sekaligus mencegah
kesalahan input yang menyebabkan alokasi melebihi atau kurang dari keseluruhan laba.

---

## 5. Rumus Akuntansi yang Diterapkan Sistem

Bagian ini menguraikan logika kalkulasi baku (*hardcoded business rule*) yang tertanam pada
lapisan aplikasi (*application layer*) sistem, sebagai dasar pembentukan seluruh angka pada
laporan keuangan.

### 5.1 Prinsip Umum

- Setiap transaksi dicatat dengan **pasangan akun debit dan akun kredit** senilai sama
  (jurnal berpasangan/*double entry*), sehingga:

  ```
  Total Debit = Total Kredit           (untuk setiap transaksi)
  Total Aset  = Total Kewajiban + Total Ekuitas     (persamaan akuntansi, setiap saat)
  ```

- Saldo suatu akun dihitung berdasarkan **saldo normal** (*normal balance*) akun tersebut:

  ```
  Jika saldo normal akun = DEBIT :
      Saldo Akun = Σ(Debit) − Σ(Kredit)
  Jika saldo normal akun = KREDIT :
      Saldo Akun = Σ(Kredit) − Σ(Debit)
  ```

### 5.2 Laporan Laba Rugi

Dihitung dari akumulasi mutasi akun berkategori *pendapatan*, *HPP* (khusus unit usaha
dagang/produksi), dan *beban* dalam rentang tanggal (periode) laporan:

```
Pendapatan (per akun)  = Σ(Kredit) − Σ(Debit)
Beban / HPP (per akun) = Σ(Debit)  − Σ(Kredit)

Total Pendapatan  = Σ Pendapatan seluruh akun kategori "pendapatan"
Total HPP         = Σ HPP seluruh akun kategori "hpp"        (hanya entitas dagang/produksi)
Total Beban       = Σ Beban seluruh akun kategori "beban"

Laba Kotor   = Total Pendapatan − Total HPP                  (hanya entitas dagang/produksi)
Laba Bersih  = Laba Kotor − Total Beban                       (entitas dagang/produksi)
Laba Bersih  = Total Pendapatan − Total Beban                 (entitas jasa, format ringkas)
```

Format laporan otomatis menyesuaikan menjadi "format laba-kotor" untuk unit usaha dengan
aktivitas dagang/produksi, atau "format ringkas" untuk entitas lainnya.

### 5.3 Neraca (Laporan Posisi Keuangan)

Saldo setiap akun dihitung kumulatif sejak awal pembukuan sampai dengan tanggal pelaporan
(*as of date*), dikelompokkan berdasarkan kategori Aset, Kewajiban, dan Ekuitas:

```
Total Aset       = Σ saldo seluruh akun kategori "aset"
Total Kewajiban  = Σ saldo seluruh akun kategori "kewajiban"
Total Ekuitas    = Σ saldo seluruh akun kategori "ekuitas"
Total Pasiva     = Total Kewajiban + Total Ekuitas

Uji Keseimbangan : |Total Aset − Total Pasiva| < Rp 0,50   (toleransi pembulatan)
```

### 5.4 Laporan Arus Kas

Disusun berdasarkan metode langsung (*direct method*) atas seluruh transaksi yang melibatkan
akun sub-kategori kas/bank pada periode laporan:

```
Kas Masuk   = seluruh transaksi dengan sisi DEBIT pada akun kas/bank
Kas Keluar  = seluruh transaksi dengan sisi KREDIT pada akun kas/bank

Arus Kas Bersih = Total Kas Masuk − Total Kas Keluar
```

**Ketentuan khusus:** transaksi mutasi internal antar-akun kas/bank (misalnya penyetoran
tunai dari Kas ke Bank) yang mendebit sekaligus mengkredit akun berkategori kas/bank
**tidak diperhitungkan** sebagai arus kas masuk maupun keluar, karena tidak mencerminkan
perpindahan kas keluar-masuk dari/ke entitas BUMDes.

### 5.5 Laporan Perubahan Ekuitas (LPE)

LPE disusun **khusus untuk entitas Kantor Pusat (BUMDES)** dan menyajikan mutasi permodalan
murni, sesuai batasan Kepmendesa No. 136 Tahun 2022 yang melarang penyajian rincian bagi
hasil pihak eksternal non-Penyertaan Modal Desa di dalam LPE:

```
Penyertaan Modal Akhir   = Penyertaan Modal Desa (saldo awal tahun)
                          + Penyertaan Modal Masyarakat (saldo awal tahun)
                          + Penambahan Penyertaan Modal Desa (periode berjalan)
                          + Penambahan Penyertaan Modal Masyarakat (periode berjalan)

Saldo Laba Akhir         = Saldo Laba Tidak Dicadangkan (awal)
                          + Saldo Laba Dicadangkan (awal)
                          + Laba (Rugi) periode berjalan
                          − Bagi Hasil Penyertaan Modal Desa (periode berjalan)
                          − Bagi Hasil Penyertaan Modal Masyarakat (periode berjalan)

Ekuitas Akhir            = Penyertaan Modal Akhir + Saldo Laba Akhir
```

### 5.6 Kebijakan dan Rumus Alokasi Bagi Hasil Usaha (BHU) serta Jurnal Penutup Bulanan

Kebijakan ini merupakan **satu-satunya sumber kebenaran** (*single source of truth*) yang
diterapkan secara konsisten pada jurnal penutup riil (mempengaruhi saldo akun) maupun pada
narasi Catatan atas Laporan Keuangan (bersifat informatif), sehingga tidak dimungkinkan
terjadi perbedaan angka antara keduanya. Proporsi bagi hasil bersifat **dapat dikonfigurasi**
oleh Admin melalui menu Profil BUMDes (bukan nilai tetap dalam kode program — lihat Bagian
4.8), dengan nilai baku (*default*) sebagai berikut:

**a. Kantor Pusat BUMDES** — setiap akhir bulan, Laba Bersih Operasional dialokasikan
berdasarkan 6 (enam) angka proporsi yang totalnya wajib 100%:

```
Utang Bagi Hasil BUMDES (Kewajiban Lancar)
    = Laba Bersih × (Pengurus % + Penasihat % + Pengawas % + Dana Sosial %)
    = Laba Bersih × 52%                                   (nilai baku: 35% + 7% + 5% + 5%)

Bagi Hasil Desa / PADes (penambah Ekuitas)
    = Laba Bersih × PADes %  = Laba Bersih × 30%          (nilai baku)

Laba Dicadangkan / Penguatan Modal (penambah Ekuitas)
    = Laba Bersih × Penguatan Modal %  = Laba Bersih × 18% (nilai baku)

Kontrol: Pengurus % + Penasihat % + Pengawas % + Dana Sosial % + PADes % + Penguatan Modal % = 100%
```

Jurnal penutup memposting debit Ikhtisar Laba Rugi dan kredit ke tiga akun tujuan di atas.
Sisa pembulatan desimal (jika ada) dibebankan pada komponen porsi Kewajiban Lancar (Utang
Bagi Hasil BUMDES) sebagai elemen terakhir penjumlahan, sehingga total ketiga komponen
senantiasa sama dengan Laba Bersih tanpa selisih pembulatan.

**b. Unit Usaha (UU01 s.d. UU06)** — setiap akhir bulan, **100% (seratus persen)** Laba
Bersih Operasional unit usaha dipindahkan ke pos Kewajiban Lancar "Utang Bagi Hasil Unit"
untuk dicairkan tunai pada awal bulan berikutnya (Kebijakan 4.4):

```
Utang Bagi Hasil Unit = Laba Bersih Unit Usaha × 100%
```

Untuk keperluan pelaporan rekapitulasi (bukan jurnal), laba bersih unit usaha juga disajikan
menurut proporsi pembagian antara Pengelola Unit dan BUMDES Pusat, dengan 2 (dua) angka
proporsi yang totalnya wajib 100%:

```
Bagi Hasil Pengelola Unit  = Laba Bersih Unit × Pengelola %  = Laba Bersih Unit × 30%  (nilai baku)
Bagi Hasil BUMDES Pusat    = Laba Bersih Unit × BUMDES %     = Laba Bersih Unit × 70%  (nilai baku)

Kontrol: Pengelola % + BUMDES % = 100%
```

**c. Perlakuan atas kerugian (rugi):** apabila Laba Bersih periode bernilai negatif, seluruh
nilai kerugian dipindahkan (debit) ke akun Saldo Laba (Rugi) Ditahan, tanpa alokasi bagi
hasil, karena tidak terdapat laba yang dapat dibagikan.

### 5.7 Catatan atas Laporan Keuangan (CaLK)

CaLK disusun otomatis dari data ringkasan Laporan Laba Rugi, Neraca, dan Arus Kas pada
periode yang sama, disertai narasi kebijakan akuntansi (Bagian 4.2, 4.3, dan 5.6) yang
secara otomatis mengutip proporsi bagi hasil aktual sebagaimana dikonfigurasi pada saat
laporan dicetak, sehingga narasi kebijakan senantiasa konsisten dengan angka yang benar-benar
diposting.

---

## 6. Kesimpulan Spesifikasi

Aplikasi SIABUMDES merupakan sistem informasi akuntansi yang mengotomasi seluruh siklus
akuntansi BUMDes — mulai dari pencatatan transaksi berpasangan, penyusunan lima jenis
laporan keuangan pokok, penutupan buku bulanan otomatis per entitas, hingga alokasi bagi
hasil usaha yang dapat dikonfigurasi namun tetap terjaga konsistensinya antara jurnal riil
dan narasi pelaporan — sekaligus menegakkan kebijakan-kebijakan tata kelola BUMDes (Bagian 4)
secara otomatis dalam logika sistem, sesuai dengan kaidah akuntansi berbasis akrual dan
ketentuan Kepmendesa PDTT No. 136 Tahun 2022. Dokumen ini disusun sebagai bukti spesifikasi
teknis dan fungsional dalam rangka pengadaan/kapitalisasi Aset Tak Berwujud BUMDes.
