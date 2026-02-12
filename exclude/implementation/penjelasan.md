# Materi Presentasi: Hasil Evaluasi & Revisi Sistem Absensi

Dokumen ini berisi poin-poin penjelasan teknis untuk setiap fitur yang telah dievaluasi dan diimplementasikan. Materi ini disusun untuk memudahkan presentasi kepada stakeholder.

---

### **I. Keamanan & Integritas Data**

#### **1. Pencegahan Data Duplikat (Item #2)**
*   **Masalah:** Risiko data ganda pada Username, NISN, atau NIP saat sinkronisasi massal.
*   **Solusi:** Implementasi `AdminDataController@sync` yang melakukan pra-validasi data sebelum disimpan.
*   **Manfaat:** Menjamin database tetap bersih dan mencegah error sistem akibat data konflik.

#### **2. Validasi File Upload (Item #20)**
*   **Masalah:** Upload file dengan format sembarangan yang bisa merusak tampilan atau keamanan.
*   **Solusi:** Pengetatan validasi hanya untuk format **JPG/PNG** dengan batas ukuran maksimal 2MB.
*   **Manfaat:** Konsistensi data aset dan efisiensi penyimpanan server.

#### **3. Pencegahan Status Ganda (Item #21)**
*   **Masalah:** Satu siswa bisa memiliki dua status berbeda (misal: Hadir dan Izin) di jam yang sama jika diinput manual berulang kali.
*   **Solusi:** Sistem memberikan respon `409 Conflict` jika deteksi data ganda ditemukan untuk sesi yang sama.
*   **Manfaat:** Data kehadiran 100% akurat dan tidak ambigu.

---

### **II. Sistem QR Code & Scanning**

#### **4. QR Code Berbasis Waktu (Item #19)**
*   **Fitur:** QR Code otomatis menjadi **Expired** (tidak aktif) jika di-scan setelah waktu pelajaran berakhir.
*   **Manfaat:** Mencegah siswa melakukan absensi dari luar jam pelajaran atau dari lokasi lain menggunakan foto QR yang sudah lama.

#### **5. Pembatasan Sesi Pengurus Kelas (Item #17)**
*   **Fitur:** Pengurus kelas hanya bisa men-generate QR Code untuk jadwal hari ini.
*   **Manfaat:** Menghindari penyalahgunaan wewenang pengurus kelas untuk membuat absensi di luar jadwal resmi.

#### **6. Detail Presensi Real-Time (Item #18)**
*   **Fitur:** Setelah guru melakukan scan, sistem langsung menampilkan detail lengkap siswa (Nama, Kelas, Mapel).
*   **Manfaat:** Memberikan konfirmasi instan kepada guru bahwa absensi telah berhasil dicatat dengan benar.

---

### **III. Manajemen Status Kehadiran**

#### **7. Update Status Dispensasi & Dinas (Item #22)**
*   **Fitur:** Penambahan status **Dispensasi** dan **Dinas** pada menu edit kehadiran.
*   **Manfaat:** Memberikan fleksibilitas bagi sekolah untuk mencatat siswa yang tidak di kelas karena tugas resmi sekolah.

#### **8. Penanganan Sakit & Izin (Item #23 & #26)**
*   **Fitur:** Pengajuan izin/sakit melalui mobile dengan validasi tanggal yang ketat (tidak bisa input tanggal lampau).
*   **Manfaat:** Memudahkan orang tua/siswa melakukan pelaporan dan mencegah manipulasi data kehadiran masa lalu.

#### **9. Status "Tidak Ada Jam Mengajar" (Item #15)**
*   **Fitur:** Dashboard guru secara otomatis mendeteksi jika tidak ada jadwal di hari tersebut.
*   **Manfaat:** Menghindari kebingungan guru saat membuka aplikasi di hari libur atau jam kosong.

---

### **IV. Pelaporan & Monitoring (Role Waka & Walikelas)**

#### **10. Ekspor Data Kehadiran (Item #4)**
*   **Fitur:** Ekspor data ke format **CSV/Excel** dengan filter yang sangat fleksibel (berdasarkan Kelas, Mapel, atau Rentang Tanggal).
*   **Manfaat:** Memudahkan Waka Kesiswaan dalam membuat laporan bulanan atau semesteran.

#### **11. Monitoring Absen Terbanyak (Item #24)**
*   **Fitur:** Sistem secara otomatis mengurutkan siswa dengan jumlah ketidakhadiran (alpha/bolos) terbanyak di bagian atas.
*   **Manfaat:** Deteksi dini bagi sekolah untuk melakukan tindak lanjut (follow-up) terhadap siswa bermasalah.

#### **12. Rekap Walikelas Terpadu (Item #1)**
*   **Fitur:** Dashboard khusus Walikelas yang menampilkan total kumulatif status kehadiran seluruh siswa di kelasnya.
*   **Manfaat:** Memberikan gambaran umum kondisi kelas secara instan tanpa harus membuka data satu per satu.

---

### **V. Validasi Operasional**

#### **13. Validasi Guru Sesuai Mata Pelajaran (Item #14)**
*   **Sistem:** Saat admin mengatur jadwal, sistem akan menolak jika guru yang dipilih tidak mengampu mata pelajaran tersebut.
*   **Manfaat:** Mencegah kesalahan input data jadwal pelajaran yang berakibat pada ketidaksinkronan laporan.

#### **14. Sinkronisasi Pengaturan Global (Item #25)**
*   **Sistem:** Sinkronisasi otomatis Tahun Ajaran dan Semester aktif di seluruh halaman aplikasi (Mobile & Desktop).
*   **Manfaat:** Memastikan seluruh data yang ditampilkan selalu merujuk pada periode pendidikan yang benar.

---

### **VI. Sistem Notifikasi WhatsApp (Whatekster)**

#### **15. Apa itu Whatekster?**
*   **Definisi:** `whatekster` adalah layanan **WhatsApp Gateway** eksternal berbasis Node.js yang berfungsi sebagai jembatan antara Backend Laravel dan WhatsApp.
*   **Cara Kerja:** Laravel mengirimkan perintah melalui HTTP Request ke Whatekster, kemudian Whatekster meneruskannya ke nomor tujuan menggunakan library Baileys.

#### **16. Fitur & Kegunaan di Sistem:**
*   **Otomatisasi Notifikasi:** Mengirimkan pesan otomatis saat siswa melakukan scan kehadiran atau saat ada pengajuan izin/sakit.
*   **Keamanan Sesi:** Whatekster menyimpan sesi login WhatsApp di folder `whatekster/auth/` sehingga koneksi tetap stabil tanpa perlu scan ulang setiap saat.
*   **Format Nomor Otomatis:** Sistem secara otomatis mengubah format nomor telepon lokal (08xx) menjadi format internasional (628xx) sebelum dikirim.
