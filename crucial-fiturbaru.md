# Crucial Features & Fixes Priority List

Dokumen ini berisi daftar fitur krusial yang perlu diperbaiki atau diimplementasikan segera, diurutkan berdasarkan prioritas.

## 🚨 P0 - Critical (Blockers & Bugs)
*Fitur yang rusak atau menyesatkan pengguna.*

1.  **[Frontend] Fix Student Profile 404 Error**
    *   **Masalah:** Halaman profile siswa (`Riwayat.jsx`) error 404 saat memanggil `/api/student/profile`.
    *   **Action:** Perbaiki endpoint route di backend atau sesuaikan request di frontend.

2.  **[Deskta] Real Data untuk Dashboard Staff (Waka)**
    *   **Masalah:** `DashboardStaff.tsx` menampilkan data kehadiran hardcoded (Tepat Waktu: 2100, dll). Ini menyesatkan untuk monitoring harian.
    *   **Action:** Integrasikan endpoint:
        *   `GET /api/attendance/summary/today` (Rekap harian)
        *   `GET /api/attendance/analytics/weekly` (Grafik mingguan)

3.  **[Deskta] Real Data untuk Dashboard Admin**
    *   **Masalah:** Statistik sekolah (Jumlah Siswa, Guru, Rombel) masih hardcoded.
    *   **Action:** Integrasikan `GET /api/admin/dashboard/stats`.

## 🚀 P1 - High Priority (Core Integration)
*Fitur utama yang belum terintegrasi dengan backend.*

4.  **[Deskta] School Info di Landing Page** ✅
    *   **Masalah:** Nama sekolah dan logo di `LandingPage.tsx` masih mengandalkan LocalStorage atau dummy.
    *   **Action:** Implementasi `GET /api/public/school-info` agar data sekolah dinamis sesuai setting backend.
    *   **Status:** Selesai. Menggunakan `settingService` di `LandingPage.tsx`.

5.  **[All] Server-Side Validation untuk Import Data** ✅
    *   **Masalah:** Import Siswa dan Guru saat ini hanya parsing excel di client-side tanpa validasi data duplikat (NISN/NIP) yang memadai.
    *   **Action:** Pastikan endpoint `/api/students/import` dan `/api/teachers/import` menghandle validasi dan return error message yang jelas.
    *   **Status:** Selesai. Menambahkan custom validation messages di `StudentController` & `TeacherController`.

6.  **[Deskta] Sinkronisasi User Profile (`/api/me`)** ✅
    *   **Masalah:** Info user yang login di Navbar/Sidebar mungkin tidak sinkron dengan database jika hanya mengandalkan data saat login awal.
    *   **Action:** Panggil `GET /api/me` saat aplikasi start untuk memastikan role dan nama user terbaru.
    *   **Status:** Selesai. Menambahkan logic sync di `App.tsx` menggunakan `authService.me()`.

## 🛠 P2 - Medium Priority (Refactoring & Polish)
*Peningkatan kualitas kode dan UX.*

7.  **[Frontend] Refactor Direct Fetch di Jadwal Guru**
    *   **Masalah:** `Jadwal.jsx` masih menggunakan `fetch()` manual, tidak konsisten dengan `apiService`.
    *   **Action:** Pindahkan logic ke `services/attendanceService.js`.

8.  **[Deskta/Frontend] Dynamic Excel Templates**
    *   **Masalah:** Tombol "Download Format" mendownload file statis assets. Jika format DB berubah, template jadi usang.
    *   **Action:** Backend menyediakan endpoint `GET /api/export/template/{type}`.

9.  **[Cleanup] Hapus Legacy `dataManager.js`**
    *   **Masalah:** File `src/utils/dataManager.js` (dummy data manager) masih ada dan berpotensi membingungkan developer.
    *   **Action:** Hapus file jika sudah tidak ada referensi kode yang menggunakannya.
