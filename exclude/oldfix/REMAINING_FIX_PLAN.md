# Rencana Penyelesaian Sisa Masalah (REMAINING_FIX_PLAN.md)

Dokumen ini merinci langkah-langkah untuk menyelesaikan sisa masalah yang teridentifikasi di `TODOFIX.md` setelah perbaikan fase pertama.

## 🏗️ Fase 1: Backend Stabilitas & Konfigurasi (Laravel)

### 1.1 Pembersihan "Demo Fallbacks"
*   **Masalah**: Blok `catch` pada `DashboardController` mengembalikan data dummy jika API gagal.
*   **Tindakan**: Hapus data hardcoded dan ganti dengan respon error yang informatif (e.g., `503 Service Unavailable`) agar Frontend dapat menampilkan state error yang tepat.

### 1.2 Normalisasi Hari & Konfigurasi Terpusat
*   **Normalisasi Akhir Pekan**: Update `ScheduleController@normalizeDay` untuk mendukung mapping hari Sabtu dan Minggu.
*   **Centralized Config**: Pindahkan *grace period* (15 menit) yang saat ini hardcoded ke `config/app.php` atau Database agar mudah diatur.

### 1.3 Integrasi WhatsApp Retry
*   **Tindakan**: Implementasikan logika retry pada `WhatsAppService` menggunakan nilai dari `config/whatsapp.php` yang saat ini belum digunakan.

---

## 🎨 Fase 2: Sinkronisasi & Standarisasi Frontend

### 2.1 Sinkronisasi Logout & Storage
*   **Masalah**: Inkonsistensi penggunaan `localStorage` antara Web (userData, token) dan Deskta (user, userRole).
*   **Tindakan**:
    *   Buat file utility `storage.js` (Web) dan `storage.ts` (Deskta) dengan skema key yang sama.
    *   Samakan alur logout: Hapus semua data session dan arahkan ke login secara konsisten.

### 2.2 Utilitas Pemetaan Status Terpusat
*   **Masalah**: Logika warna dan label status diduplikasi di banyak file.
*   **Tindakan**: Migrasikan semua komponen untuk menggunakan `statusMapping.js` yang sudah ada, dan tambahkan fungsi `getStatusTheme(status)` untuk standarisasi warna teks/background.

### 2.3 Perbaikan Hardcoded URL di Deskta
*   **Tindakan**: Ganti `http://localhost:8000` di `KehadiranSiswaGuru.tsx` dan file lainnya dengan variabel lingkungan (`VITE_API_URL`) dari `.env`.

---

## 🚀 Fase 3: Real-time & Race Conditions

### 3.1 Implementasi Laravel Echo
*   **Tindakan**: Aktifkan pendengar event (listener) pada `PresensiSiswa.jsx` agar daftar siswa yang hadir terupdate secara otomatis saat event `AttendanceRecorded` disiarkan dari backend.

### 3.2 Penanganan Memory Leak & Race Conditions
*   **Tindakan**:
    *   Tambahkan cleanup function pada `useEffect` di dashboard (Web & Deskta) untuk membatalkan fetch jika komponen di-unmount.
    *   Gunakan `AbortController` untuk mencegah update state pada request yang sudah kadaluarsa.

---

## 📋 Daftar File yang Akan Dimodifikasi
1.  `backend/app/Http/Controllers/DashboardController.php`
2.  `backend/app/Http/Controllers/ScheduleController.php`
3.  `backend/app/Services/WhatsAppService.php`
4.  `deskta/src/utils/constants.ts` (Base URL fix)
5.  `frontend/src/utils/statusMapping.js` (Expansion)
6.  `frontend/src/pages/Guru/PresensiSiswa.jsx` (Echo implementation)

---
*Rencana ini disusun untuk memastikan tidak ada lagi data dummy yang tersisa dan sistem berjalan secara sinkron antara Web, Desktop, dan Mobile.*
