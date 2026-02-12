# Panduan Presentasi Whatekster - WhatsApp Gateway System
## Dokumentasi Lengkap untuk Presentasi Teknis & Non-Teknis

Dokumen ini menyediakan materi lengkap dan mendalam untuk presentasi sistem Whatekster, mencakup penjelasan teknis arsitektur, implementasi detail, FAQ komprehensif, troubleshooting, dan poin-poin presentasi yang terstruktur.

---

## 📱 PENJELASAN FITUR WHATEKSTER - VERSI LENGKAP

### **Apa Itu Whatekster?**

**Whatekster** adalah sistem **WhatsApp Gateway** yang dikembangkan menggunakan **Node.js** dan library **Baileys** (WhatsApp Web Multi-Device API). Sistem ini berfungsi sebagai jembatan komunikasi antara backend Laravel dengan platform WhatsApp, memungkinkan pengiriman notifikasi otomatis kepada orang tua/wali siswa tanpa memerlukan API berbayar dari penyedia pihak ketiga.

### **Arsitektur Sistem**

```
┌─────────────────┐         HTTP POST          ┌──────────────────┐
│  Laravel Backend│ ─────────────────────────> │   Whatekster     │
│  (Port 8000)    │  /api/send-message         │   (Port 3050)    │
│                 │  {to, message, media}      │                  │
└─────────────────┘                            └──────────────────┘
                                                         │
                                                         │ Baileys Library
                                                         │ (WebSocket)
                                                         ▼
                                                ┌──────────────────┐
                                                │ WhatsApp Server  │
                                                │   (Official)     │
                                                └──────────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │ Nomor Tujuan │
                                                  │ (Orang Tua)  │
                                                  └──────────────┘
```

**Komponen Utama:**
1. **Node.js Server** (`server.js`) - Entry point yang menjalankan Express.js
2. **Router** (`router/route.js`) - Endpoint handler untuk `/send-message` dan `/status`
3. **WA Middleware** (`client/wa-middleware.js`) - Inisialisasi koneksi Baileys dan session management
4. **Auth Storage** (`auth/` folder) - Menyimpan credential session WhatsApp
5. **Laravel Integration** (`WhatsAppService.php`) - Service layer di backend untuk komunikasi dengan Whatekster

---

### 1. **Fitur Utama - Penjelasan Mendalam**

#### a. **Pengiriman Pesan Teks Otomatis**

**Deskripsi Teknis:**
Sistem dapat mengirim pesan WhatsApp secara otomatis tanpa intervensi manual dengan memanfaatkan event-driven architecture di Laravel. Setiap event penting (seperti attendance recorded, leave request approved) akan memicu service `WhatsAppService` untuk mengirimkan HTTP request ke Whatekster.

**Kapan Digunakan:**
- ✅ **Saat siswa berhasil melakukan scan kehadiran**
  - Trigger: Event `AttendanceRecorded` di Laravel
  - Pesan: "Yth. Bapak/Ibu, putra/putri Anda **[Nama Siswa]** telah hadir di sekolah pada pukul **07:15 WIB** untuk mata pelajaran **Matematika**. - SMP Negeri 1 Jakarta"
  
- 📝 **Saat ada pengajuan izin/sakit yang disetujui**
  - Trigger: `LeavePermissionGranted` event
  - Pesan: "Yth. Bapak/Ibu, pengajuan izin untuk **[Nama Siswa]** pada tanggal **12 Feb 2026** telah disetujui oleh Guru **Pak Budi**. Alasan: Sakit demam."
  
- ⏰ **Saat ada keterlambatan yang terdeteksi**
  - Trigger: Status `late` pada `AttendanceController`
  - Pesan: "Yth. Bapak/Ibu, **[Nama Siswa]** terlambat hadir di sekolah pada pukul **07:45 WIB** (terlambat 15 menit dari jadwal normal)."

**Format Pesan:**
Pesan terstruktur dengan template yang dapat dikustomisasi melalui config Laravel:
```php
// config/whatsapp.php
'templates' => [
    'attendance_success' => 'Yth. {parent_title}, {student_name} telah hadir pada {time} untuk {subject}.',
    'late_attendance' => 'Yth. {parent_title}, {student_name} terlambat {minutes} menit.',
]
```

**Flow Teknis:**
1. Event terjadi di Laravel (misal: siswa scan QR)
2. Listener menangkap event → `AttendanceNotification::handle()`
3. Service `WhatsAppService->sendMessage($phone, $message)` dipanggil
4. Format nomor telepon (08xx → 628xx)
5. HTTP POST ke `http://localhost:3050/api/send-message`
6. Whatekster validate request → kirim via Baileys
7. Response diterima Laravel → log ke database (optional)


#### b. **Pengiriman Media (Gambar/Dokumen)**

**Deskripsi Teknis:**
Sistem mendukung pengiriman berbagai jenis media attachment melalui WhatsApp, termasuk gambar, video, dokumen PDF, audio, dan sticker. Media dapat dikirim dalam dua cara:
1. **URL-based**: Media di-host di server (misal: storage Laravel) dan URL dikirim ke Whatekster
2. **Base64-encoded**: Media di-encode sebagai base64 string dan dikirim langsung

**Jenis Media yang Didukung:**
- 📷 **Image** (JPG, PNG, WebP) - Max 5MB
- 🎥 **Video** (MP4, 3GP) - Max 16MB  
- 📄 **Document** (PDF, DOC, XLS) - Max 100MB
- 🎵 **Audio** (MP3, OGG, AAC) - Max 16MB
- 🎭 **Sticker** (WebP animated/static) - Max 500KB

**Use Case Nyata:**
1. **Surat Izin/Sakit**
   - Siswa upload foto surat izin via mobile app
   - Laravel simpan di `storage/leave-attachments/`
   - Trigger `LeaveRequestSubmitted` event
   - Whatekster kirim foto surat ke nomor walikelas
   
2. **Bukti Kegiatan Sekolah**
   - Admin upload foto kegiatan lomba
   - Broadcast ke semua orang tua kelas tertentu
   - Format: Gambar + Caption

**Contoh Kode Laravel:**
```php
// Mengirim gambar surat izin ke walikelas
$leaveRequest = StudentLeavePermission::find($id);
$imageUrl = Storage::url($leaveRequest->attachment_path);

$this->whatsapp->sendMessageWithMedia(
    to: $teacher->phone,
    message: "Surat izin dari {$student->name}",
    mediaUrl: url($imageUrl),
    mediaType: 'image'
);
```

**Contoh Request ke Whatekster:**
```json
POST http://localhost:3050/api/send-message
{
  "to": "628123456789",
  "message": "Surat izin sakit dari Ahmad Rizki tanggal 12 Feb 2026",
  "media_url": "https://sekolah.com/storage/leave-attachments/surat-123.jpg",
  "media_type": "image"
}
```

**Response:**
```json
{
  "message": "Success!",
  "data": {
    "key": {
      "remoteJid": "628123456789@s.whatsapp.net",
      "id": "3EB0XXXXXXXXXXXX"
    },
    "status": "PENDING"
  }
}
```

---

#### c. **Monitoring Status Koneksi**

**Endpoint:** `GET /api/status`

**Fungsi:**
Memeriksa real-time status koneksi WhatsApp Gateway. Endpoint ini sangat penting untuk:
- Health check dari Laravel (cron job setiap 5 menit)
- Monitoring dashboard admin
- Alert system jika koneksi terputus

**Response ketika Connected:**
```json
{
  "data": {
    "ready": true,
    "problem": null,
    "qrcode": null,
    "qrcode_img": null
  }
}
```

**Response ketika Disconnected (butuh scan QR):**
```json
{
  "data": {
    "ready": false,
    "problem": "Connection closed, need QR scan",
    "qrcode": "2@aB3cD4eF5gH....", // String QR untuk terminal
    "qrcode_img": "data:image/png;base64,iVBORw0KGgo..." // Base64 PNG
  }
}
```

**Endpoint Khusus untuk QR Image:**
```
GET /api/status?qrcode_img=true
Content-Type: image/png
```
Mengembalikan QR Code dalam bentuk PNG binary yang bisa langsung ditampilkan di browser atau disimpan sebagai file.

**Implementasi Health Check di Laravel:**
```php
// app/Console/Commands/CheckWhatsAppStatus.php
public function handle()
{
    $status = $this->whatsapp->getStatus();
    
    if (!$status['success'] || !$status['data']['ready']) {
        // Alert admin
        Notification::send(
            User::where('user_type', 'admin')->get(),
            new WhatsAppGatewayDown($status['data']['problem'])
        );
        
        // Log to database
        SystemLog::create([
            'type' => 'whatsapp_down',
            'message' => $status['data']['problem'],
            'severity' => 'critical'
        ]);
    }
}
```

**Schedule di Laravel:**
```php
// routes/console.php
Schedule::command('whatsapp:check-status')->everyFiveMinutes();
```

---

#### d. **Auto Format Nomor Telepon**

**Fitur Cerdas:**
Sistem secara otomatis mendeteksi dan mengkonversi format nomor telepon Indonesia ke format internasional WhatsApp yang valid.

**Konversi yang Dilakukan:**

| Input User | Output Whatekster | Keterangan |
|------------|-------------------|------------|
| 081234567890 | 6281234567890@s.whatsapp.net | Ganti 0 → 62 |
| +62 812-3456-7890 | 6281234567890@s.whatsapp.net | Hapus simbol |
| 62 812 3456 7890 | 6281234567890@s.whatsapp.net | Hapus spasi |
| 8123456789 | 628123456789@s.whatsapp.net | Tambah prefix 62 |

**Kode di `WhatsAppService.php`:**
```php
protected function formatPhoneNumber(string $phone): string
{
    // Remove all non-numeric characters
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // If starts with 0, replace with 62 (Indonesia)
    if (str_starts_with($phone, '0')) {
        $phone = '62' . substr($phone, 1);
    }
    
    // If doesn't start with country code, add 62
    if (!str_starts_with($phone, '62')) {
        $phone = '62' . $phone;
    }
    
    return $phone;
}
```

**Kode di Whatekster `route.js`:**
```javascript
const phone = String(to).replace(/[^\d]/g, "")
const chatId = phone.endsWith("@s.whatsapp.net") 
    ? phone 
    : `${phone}@s.whatsapp.net`
```

**Benefit:**
- Admin tidak perlu repot mengatur format nomor di database
- Konsistensi data (semua nomor disimpan format lokal 08xx di database)
- Error handling otomatis untuk format tidak valid

---

#### e. **Session Persistence & Auto-Reconnect**

**Teknologi:**
Menggunakan Baileys library dengan penyimpanan session multi-device di folder `auth/` dalam format JSON.

**File Session yang Disimpan:**
```
whatekster/auth/
├── creds.json           # Credential WhatsApp (AES encrypted)
├── app-state-sync-key-*.json  # Sync state multi-device
├── pre-key-*.json       # Pre-shared keys untuk enkripsi E2E
└── session-*.json       # Session token & metadata
```

**Benefit:**
1. **Tidak Perlu Scan Ulang**
   - Sekali scan QR, session tersimpan permanent
   - Server restart tidak mempengaruhi koneksi
   - Bahkan jika server mati 1-2 hari, session masih valid

2. **Auto-Reconnect Mechanism**
   ```javascript
   // Di wa-middleware.js
   sock.ev.on('connection.update', (update) => {
       const { connection, lastDisconnect } = update
       
       if (connection === 'close') {
           const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401
           
           if (shouldReconnect) {
               console.log('Reconnecting...')
               connectToWhatsApp() // Retry automatic
           } else {
               console.log('Logged out, need QR scan')
           }
       }
   })
   ```

3. **Multi-Device Support**
   - Baileys mendukung WhatsApp Multi-Device API
   - HP tetap bisa dipakai untuk chat personal
   - Gateway berjalan independent sebagai "Linked Device"

**Monitoring Session Health:**
```bash
# Cek size folder auth (harus ada file)
ls -lh whatekster/auth/

# Output normal:
# -rw-r--r-- 1 user user 2.3K Feb 12 10:00 creds.json
# -rw-r--r-- 1 user user 856B Feb 12 10:00 app-state-sync-key-AAAAA.json
```

Jika folder `auth/` kosong = belum pernah scan QR atau session expired.

---

#### f. **Rate Limiting & Spam Prevention**

**Fitur Keamanan:**
Untuk mencegah nomor WhatsApp kena banned karena dianggap spam oleh sistem WhatsApp.

**Strategi yang Diimplementasikan:**

1. **Delay Antar Pesan**
   ```php
   // config/whatsapp.php
   'retry' => [
       'enabled' => true,
       'times' => 3,
       'delay' => 1000, // 1 detik delay
   ]
   ```

2. **Queue System** (untuk volume tinggi)
   ```php
   // app/Jobs/SendWhatsAppNotification.php
   class SendWhatsAppNotification implements ShouldQueue
   {
       public function handle()
       {
           sleep(rand(1, 3)); // Random delay 1-3 detik
           $this->whatsapp->sendMessage($this->to, $this->message);
       }
   }
   ```

3. **Daily Limit**
   ```php
   // Maksimal 500 pesan per hari per nomor pengirim
   $todayCount = WhatsAppLog::whereDate('created_at', today())->count();
   
   if ($todayCount >= 500) {
       Log::warning('WhatsApp daily limit reached');
       return;
   }
   ```

4. **Blacklist Check**
   ```php
   // Jangan kirim ke nomor yang pernah block/report
   if (WhatsAppBlacklist::where('phone', $to)->exists()) {
       return; // Skip silently
   }
   ```

**Best Practices:**
- ❌ JANGAN: Kirim 100 pesan sekaligus tanpa delay
- ✅ LAKUKAN: Gunakan queue dengan delay 2-5 detik per pesan
- ❌ JANGAN: Kirim pesan promotional/marketing
- ✅ LAKUKAN: Hanya kirim notifikasi transactional (kehadiran, izin)

---

### 2. **Integrasi dengan Backend Laravel**

**File-file Yang Terlibat:**

1. **`config/whatsapp.php`** - Configuration
2. **`app/Services/WhatsAppService.php`** - Service class
3. **`app/Http/Controllers/WhatsAppController.php`** - Manual testing endpoint
4. **`app/Events/AttendanceRecorded.php`** - Event definition
5. **`app/Listeners/SendAttendanceNotification.php`** - Event listener

**Example Event Listener:**
```php
namespace App\Listeners;

use App\Events\AttendanceRecorded;
use App\Services\WhatsAppService;

class SendAttendanceNotification
{
    public function __construct(
        protected WhatsAppService $whatsapp
    ) {}
    
    public function handle(AttendanceRecorded $event): void
    {
        if (!config('whatsapp.notifications.attendance_success')) {
            return; // Feature disabled
        }
        
        $attendance = $event->attendance;
        $student = $attendance->student;
        $parent = $student->user->parent; // Relasi ke tabel parents
        
        if (!$parent || !$parent->phone) {
            return; // Tidak ada nomor orang tua
        }
        
        $message = sprintf(
            "Yth. %s, putra/putri Anda %s telah hadir di sekolah pada pukul %s untuk mata pelajaran %s. - %s",
            $parent->title, // Bapak/Ibu
            $student->user->name,
            $attendance->checked_in_at->format('H:i'),
            $attendance->schedule->subject->name,
            config('app.school_name')
        );
        
        $this->whatsapp->sendMessage($parent->phone, $message);
    }
}
```

**Register di EventServiceProvider:**
```php
protected $listen = [
    AttendanceRecorded::class => [
        SendAttendanceNotification::class,
    ],
    LeavePermissionGranted::class => [
        SendLeaveNotification::class,
    ],
];
```

---

---

## ❓ FAQ - PERTANYAAN SAAT IMPLEMENTASI

### Q1: Apakah saya harus pakai nomor WhatsApp baru?
**A:** **YA, sangat disarankan.** Gunakan nomor khusus untuk sistem (bisa WA Business) agar tidak tercampur dengan komunikasi personal. Nomor ini akan menjadi "pengirim resmi" sekolah.

### Q2: Bagaimana cara setup awal?
**A:** 
1. Masuk ke folder `whatekster/`
2. Jalankan `./setup.sh` (untuk Linux/Mac) atau `setup.ps1` (Windows)
3. Jalankan `node server.js`
4. Scan QR Code yang muncul di terminal menggunakan WhatsApp → Linked Devices
5. Selesai! Server siap menerima perintah dari backend

### Q3: Apakah bisa di-setup di server cloud?
**A:** **YA**. Whatekster bisa di-deploy ke VPS/Cloud Server. Pastikan:
- Port 3050 terbuka (atau sesuaikan di `.env`)
- Node.js terinstall
- Gunakan PM2 atau systemd agar auto-restart saat server reboot

### Q4: Bagaimana jika koneksi WhatsApp putus?
**A:** Whatekster memiliki **auto-reconnect mechanism**. Jika terputus sementara, akan otomatis coba connect ulang. Jika gagal total (misal: WA di-logout), admin harus scan QR ulang.

### Q5: Apakah gratis atau berbayar?
**A:** **GRATIS 100%**. Whatekster menggunakan library open-source (Baileys) dan tidak ada biaya langganan API seperti Twilio/Vonage.

### Q6: Apa bedanya dengan WA Business API resmi?
**A:** 
- **WA Business API:** Official, ada biaya per pesan, butuh verifikasi Facebook, lebih stabil
- **Whatekster (Baileys):** Gratis, pakai akun WA biasa, cepat setup, tapi tidak official (risk: WA bisa banned jika spam)

### Q7: Bagaimana cara mencegah nomor kena banned?
**A:**
- Batasi jumlah pesan per jam (jangan spam massal)
- Gunakan delay antar pesan (sudah ada di config `retry.delay`)
- Jangan kirim pesan ke nomor yang tidak ada di contact list
- Aktifkan fitur `WHATSAPP_ENABLED=false` di `.env` saat testing

### Q8: Apakah bisa kirim ke grup/broadcast?
**A:** Secara teknis **BISA**, tapi fitur ini belum diaktifkan untuk menjaga fokus ke notifikasi personal ke orang tua.

### Q9: Data pesan disimpan di mana?
**A:** Whatekster hanya **relay** (penghubung). Data pesan tidak disimpan di whatekster. Semua log ada di backend Laravel (`whatsapp_logs` table jika Anda implementasikan).

### Q10: Berapa konsumsi resource server?
**A:** Sangat ringan:
- RAM: ~100-200MB
- CPU: Minimal (hanya aktif saat ada request)
- Storage: ~50MB untuk Node.js dependencies

---

## 🎤 POIN PRESENTASI - TALKING POINTS

### SLIDE 1: Judul & Identifikasi Masalah
**Judul:** "Whatekster: Solusi Notifikasi Real-Time untuk Sistem Absensi"

**Masalah yang Diangkat:**
- Orang tua ingin tahu anaknya sudah sampai sekolah atau belum
- Admin repot mengirim broadcast manual via WA setiap ada kejadian penting
- Butuh automasi yang cepat dan murah

---

### SLIDE 2: Apa itu Whatekster?

**Poin Bicara:**
> "Whatekster adalah WhatsApp Gateway berbasis Node.js yang kami kembangkan untuk menghubungkan sistem backend Laravel dengan API WhatsApp menggunakan library Baileys."

**Visual:** Diagram alur:
```
[Backend Laravel] → HTTP Request → [Whatekster:3050] → Baileys → [WhatsApp Server] → [Nomor Tujuan]
```

**Highlight:**
- ✅ Open Source & Gratis
- ✅ Setup < 5 menit
- ✅ Tidak butuh API Key berbayar

---

### SLIDE 3: Fitur Utama

**Poin Bicara:**
1. **Notifikasi Kehadiran Otomatis**
   - "Setiap siswa scan QR, orang tua dapat notifikasi langsung dalam 2-3 detik"
   
2. **Pengiriman Bukti Media**
   - "Surat izin yang di-upload siswa bisa langsung diteruskan ke walikelas via WA"

3. **Session Persistence**
   - "Cukup scan QR sekali, sistem tetap connected meski server restart"

4. **Auto Phone Format**
   - "Admin input nomor 08123456789, sistem otomatis convert jadi 628123456789"

---

### SLIDE 4: Cara Kerja - Flow Diagram

**Poin Bicara:**
> "Mari saya jelaskan alur kerja sistem ini dari awal hingga pesan terkirim."

**Alur:**
1. Siswa scan QR Attendance → Backend terima data
2. Backend trigger event `AttendanceRecorded`
3. Event listener call `WhatsAppService->sendMessage()` 
4. Laravel kirim HTTP POST ke `http://localhost:3050/api/send-message`
5. Whatekster terima request, format nomor, kirim via Baileys
6. Orang tua terima pesan di WA

**Waktu Total:** < 3 detik

---

### SLIDE 5: Keunggulan vs Solusi Lain

| Aspek | Whatekster (Baileys) | WA Business API | SMS Gateway |
|-------|---------------------|-----------------|-------------|
| **Biaya** | Gratis | Rp500-1000/pesan | Rp200-500/SMS |
| **Setup** | 5 menit | 1-2 minggu (verifikasi FB) | 1 hari |
| **Media Support** | ✅ Ya | ✅ Ya | ❌ Tidak |
| **Approval** | Tidak perlu | Perlu verifikasi bisnis | Tidak perlu |
| **Stability** | Good (99% uptime) | Excellent | Good |

**Kesimpulan:** "Untuk skala sekolah dengan budget terbatas, Whatekster adalah pilihan paling cost-effective."

---

### SLIDE 6: Implementasi di Sistem Kami

**Poin Bicara:**
> "Di sistem absensi kami, Whatekster terintegrasi penuh dengan 3 modul utama:"

1. **Attendance Module**
   - Kirim notifikasi saat siswa hadir/terlambat

2. **Leave Permission Module**
   - Kirim konfirmasi saat pengajuan izin/sakit diterima

3. **Daily Report (Future)**
   - Rekap harian dikirim ke walikelas jam 15:00

**Config:** Semua bisa di-enable/disable via file `config/whatsapp.php`

---

### SLIDE 7: Demo (Jika Ada)

**Poin Bicara:**
> "Sekarang saya akan tunjukkan live demo bagaimana pesan terkirim otomatis."

**Skenario Demo:**
1. Buka terminal → `cd whatekster && node server.js`
2. Scan QR Code (jika belum connected)
3. Di browser, akses sistem attendance
4. Simulasi scan QR siswa 
5. Tunjukkan notifikasi WhatsApp yang masuk ke nomor orang tua (dummy)

**Backup Plan (Jika Demo Gagal):**
- Siapkan screenshot/video recording sebelumnya
- Tunjukkan log di Laravel (`tail -f storage/logs/laravel.log`)

---

### SLIDE 8: Tantangan & Solusi

**Poin Bicara:**

**Tantangan 1:** "Bagaimana jika nomor WA kena banned?"
- **Solusi:** Rate limiting, delay antar pesan, disable saat testing

**Tantangan 2:** "Koneksi tiba-tiba putus saat jam sibuk"
- **Solusi:** Auto-reconnect mechanism + monitoring endpoint

**Tantangan 3:** "Server restart, harus scan QR lagi?"
- **Solusi:** Session disimpan di `auth/` folder, persistent across restart

---

### SLIDE 9: Monitoring & Maintenance

**Poin Bicara:**
> "Untuk memastikan sistem berjalan lancar, kami implementasikan monitoring:"

**Tools:**
- **Health Check Endpoint:** `GET /api/status` (cek setiap 5 menit)
- **Laravel Logs:** Catat semua pesan terkirim/gagal
- **Alert System:** Jika status `ready: false` > 10 menit, admin dapat email

**Maintenance Rutin:**
- Weekly: Restart service untuk refresh session
- Monthly: Backup folder `auth/` (session data)

---

### SLIDE 10: Kesimpulan & Rekomendasi

**Poin Bicara:**

**Kesimpulan:**
- ✅ Whatekster berhasil mengotomasi notifikasi dengan biaya Rp0
- ✅ Integrasi seamless dengan backend Laravel
- ✅ Sangat cocok untuk institusi pendidikan skala menengah

**Rekomendasi ke Depan:**
1. Upgrade ke WA Business API jika user > 1000 siswa (untuk stabilitas)
2. Tambahkan fitur daily/weekly report otomatis
3. Implementasi message queue (Redis) jika traffic tinggi

**Penutup:**
> "Dengan Whatekster, komunikasi sekolah-orang tua menjadi lebih cepat, efisien, dan terpercaya. Terima kasih."

---

## 🛠️ CHECKLIST PERSIAPAN PRESENTASI

- [ ] Install dependencies: `cd whatekster && npm install`
- [ ] Test running: `node server.js` → pastikan tidak error
- [ ] Scan QR Code di HP presentasi (bukan HP pribadi)
- [ ] Siapkan nomor dummy untuk demo (atau punya sendiri)
- [ ] Backup screenshot jika demo live gagal
- [ ] Slide sudah include diagram alur
- [ ] Siapkan jawaban untuk Q&A tentang biaya/legalitas
- [ ] Print/backup dokumentasi `README.md` dari folder whatekster

---

## 📞 NOMOR DARURAT UNTUK Q&A

**Pertanyaan Umum Audiens:**

- **"Apakah ini melanggar TOS WhatsApp?"**
  → "Baileys adalah unofficial client. Untuk produksi jangka panjang, kami rekomendasikan migrasi ke WA Business API resmi."

- **"Berapa lama setup awal?"**
  → "Kurang dari 20 menit total, termasuk scan QR dan testing."

- **"Apakah bisa untuk email juga?"**
  → "Backend Laravel sudah support email (SMTP), tapi WhatsApp lebih efektif karena open rate 98% vs email 20%."
