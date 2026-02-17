# Evaluasi & Revisi Backend

Dokumen ini berisi hasil analisis perbandingan antara `backend_todo.md` dengan endpoint dan logic yang aktual ada di codebase saat ini.

| Status | Keterangan |
| :--- | :--- |
| ✅ | Sudah Terimplementasi |
| ⚠️ | Terimplementasi Sebagian / Perlu Penyesuaian |
| ❌ | Belum Terimplementasi |

---

## 2. Cegah Data Duplikat (Role Admin)
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /api/admin/data/sync`.
- **Temuan:** Logic pencegahan duplikat (`validateDuplicates`) telah diimplementasikan dalam `AdminDataController`. Endpoint ini memvalidasi `username`, `nisn`, `nip`, dan `email` terhadap data yang sudah ada di database untuk mencegah error "Unique constraint" pada operasi bulk.
- **Rekomendasi:** Gunakan endpoint ini sebelum melakukan sinkronisasi atau import data master untuk memastikan kebersihan data.

## 4. Ekspor Data Kehadiran (Role Waka)
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `GET /attendance/export` (via `AttendanceController@export`).
- **Temuan:** Mendukung filter `from`, `to`, `class_id`, `schedule_id`. Output berupa CSV.
- **Catatan:** Pastikan Role `waka` memiliki akses ke endpoint ini (saat ini middleware cek `role:admin,teacher`).

## 15. Status “Tidak Ada Jam Mengajar”
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `GET /api/me/schedules`.
- **Temuan:** Jika jadwal kosong, API mengembalikan status `no_schedule` dengan pesan "Tidak ada jam mengajar hari ini".

## 16. Filter Kehadiran Guru (Tanpa Jam)
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `GET /waka/attendance/summary` (`AttendanceController@wakaSummary`).
- **Temuan:** Endpoint sudah mendukung filter `from` dan `to` tanggal. Logic filter waktu spesifik (jam) tidak diterapkan, sudah sesuai permintaan.

## 17. Batasi Periode Pengurus Kelas
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /api/qrcodes/generate`.
- **Temuan:** Pengurus kelas dibatasi hanya bisa membuat QR Code untuk jadwal hari ini. Mencoba membuat untuk hari lain akan ditolak (422).

## 18. Setelah Scan Guru (Detail Presensi)
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /api/attendance/scan`.
- **Temuan:** Response mencakup `AttendanceResource` yang memuat relasi `schedule.class`, `student`, `teacher`. Detail sudah lengkap.

## 19. Nonaktifkan QR Setelah Waktu Berlalu
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `GET /api/qrcodes/{token}`.
- **Temuan:** QR Code otomatis dinonaktifkan (`is_active = false`) jika diakses setelah waktu berakhir (`expires_at`). Status menjadi `expired`.

## 20. Validasi File Upload (Hanya JPG/PNG)
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /teachers/{teacher}/schedule-image` & `POST /classes/{class}/schedule-image`.
- **Temuan:** Validasi laravel `'file' => 'required|image|max:2048'` sudah diterapkan, yang secara default mengizinkan jpg, png, bmp, gif, svg, webp.

## 21. Cegah Status Ganda
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /api/attendance/manual`.
- **Temuan:** Mengembalikan `409 Conflict` jika presensi siswa sudah tercatat untuk sesi tersebut. Mencegah timpa data tidak sengaja.

## 22. Update Status Dispensasi (Mobile)
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `PATCH /api/attendance/{attendance}` (via `AttendanceController@markExcuse`).
- **Temuan:** Status `dispensasi` dan `dinas` telah ditambahkan ke dalam validasi method `markExcuse`. Admin atau Guru kini dapat mengubah status presensi yang sudah ada menjadi dispensasi secara langsung melalui mobile atau web.

## 23. Tambahkan Sakit & Izin di Absensi (Mobile)
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /api/absence-requests`.
- **Temuan:** Controller `AbsenceRequestController` menangani request type `sick`, `permit`, `dispensation`. Input status juga divalidasi di `AttendanceController` (`in:present,late,excused,sick,absent,dinas,izin,return`).

## 24. Urutkan Berdasarkan Absen Terbanyak
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `GET /api/students/absences` (`AttendanceController@studentsAbsences`).
- **Temuan:** Menggunakan `withCount('attendances')` dan sorting di database level untuk performa lebih baik. Siswa dengan absensi terbanyak muncul di atas.

## 25. Sinkronisasi Kelas di Tiap Halaman
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `GET /api/settings/sync` (`SettingController@sync`).
- **Temuan:** Endpoint khusus untuk memuat `SchoolYear` dan `Semester` aktif serta pengaturan global lainnya untuk sinkronisasi frontend.

## 26. Validasi Tanggal Izin/Dispen/Sakit/Ijin
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /api/absence-requests`.
- **Temuan:** Menambahkan validasi `after_or_equal:today` pada `start_date` untuk mencegah input tanggal lampau.

## 1. Rekap Walikelas dengan Total
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `GET /me/homeroom/attendance/summary` (`TeacherController@myHomeroomAttendanceSummary`).
- **Temuan:** Mengembalikan count group by status.

## 14. Validasi Guru Sesuai Job
**Status:** ✅ Sudah Terimplementasi
- **Endpoint:** `POST /classes/{class}/schedules/bulk` (`ScheduleController@bulkUpsert`).
- **Temuan:** Validasi memastikan guru yang dipilih memiliki mata pelajaran yang sesuai dengan jadwal. Implementasi di `ScheduleController@bulkUpsert`.
