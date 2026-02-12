# Implementasi Profil Sekolah dan Maskot

Dokumen ini menjelaskan struktur data dan response API untuk fitur pengaturan profil sekolah lengkap, termasuk logo dan maskot.

## 1. Struktur Database (Tabel `settings`)

Data akan disimpan sebagai key-value pair di tabel `settings`.

| Key | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `school_name` | string | Nama resmi sekolah (e.g., SMKN 2 Singosari) |
| `school_logo` | string (path) | Path ke file logo di storage |
| `school_mascot` | string (path) | Path ke file maskot di storage |
| `school_email` | string | Email resmi sekolah |
| `school_phone` | string | Nomor telepon sekolah |
| `school_address` | string | Alamat jalan |
| `school_subdistrict` | string | Kelurahan/Desa |
| `school_district` | string | Kecamatan |
| `school_city` | string | Kabupaten/Kota |
| `school_province` | string | Provinsi |
| `school_postal_code` | string | Kode Pos |
| `school_npsn` | string | Nomor Pokok Sekolah Nasional |
| `school_accreditation` | string | Akreditasi Sekolah (A/B/C) |
| `school_headmaster` | string | Nama Kepala Sekolah |
| `school_headmaster_nip` | string | NIP Kepala Sekolah |

## 2. API Response Structure

### Endpoint: `GET /api/settings` atau `GET /api/settings/sync`

Response ini akan digunakan oleh Frontend (Web/Mobile) untuk menampilkan data sekolah.

```json
{
    "status": "success",
    "data": {
        "school_name": "SMK NEGERI 2 SINGOSARI",
        "school_logo": "settings/logo/abc.png",
        "school_logo_url": "http://domain.com/storage/settings/logo/abc.png",
        "school_mascot": "settings/mascot/xyz.png",
        "school_mascot_url": "http://domain.com/storage/settings/mascot/xyz.png",
        "school_email": "smkn2.singosari@yahoo.co.id",
        "school_phone": "(0341) 458823",
        "school_address": "Jl. Perusahaan No.20, Tunjungtirto",
        "school_subdistrict": "Tunjungtirto",
        "school_district": "Singosari",
        "school_city": "Kab. Malang",
        "school_province": "Jawa Timur",
        "school_postal_code": "65153",
        "school_npsn": "20517748",
        "school_accreditation": "A",
        "school_headmaster": "SUMIJAH, S.Pd., M.Si",
        "school_headmaster_nip": "97002101998022009",
        "school_type": "SMK"
    }
}
```

## 3. Cara Penggunaan di Frontend

### Menampilkan Logo
Gunakan `school_logo_url` langsung di tag `img`.

```jsx
<img src={settings.school_logo_url} alt="Logo Sekolah" className="w-12 h-12" />
```

### Menampilkan Maskot
Gunakan `school_mascot_url`.

```jsx
<img src={settings.school_mascot_url} alt="Maskot Sekolah" className="w-full h-auto" />
```

### Menampilkan Alamat Lengkap
Anda bisa menggabungkan field alamat untuk tampilan yang lebih lengkap.

```jsx
<p>
  {settings.school_address}, {settings.school_subdistrict}, {settings.school_district}, {settings.school_city}
</p>
```
