// src/Pages/WakaStaff/JadwalGuruStaff.tsx
import { useState, useEffect } from "react";
import StaffLayout from "../../component/WakaStaff/StaffLayout";
import { SearchBox } from "../../component/Shared/Search";
import { Table } from "../../component/Shared/Table";
import { Eye, Upload } from "lucide-react";
import { teacherService, type Teacher } from "../../services/teacherService";

interface JadwalGuruStaffProps {
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string, payload?: any) => void;
  onselectGuru?: (namaGuru: string) => void;
}

interface GuruJadwal {
  id: string;
  kodeGuru: string;
  namaGuru: string;
  mataPelajaran: string;
  role: string;
  scheduleImage?: string;
}

export default function JadwalGuruStaff({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  onselectGuru,
}: JadwalGuruStaffProps) {
  const [searchValue, setSearchValue] = useState("");
  const [guruData, setGuruData] = useState<GuruJadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await teacherService.getTeachers({ per_page: -1 });
      const teachers: Teacher[] = response.data || [];
      
      const mappedData: GuruJadwal[] = teachers.map((t) => ({
        id: t.id,
        kodeGuru: t.kodeGuru || "-",
        namaGuru: t.namaGuru,
        mataPelajaran: t.subject || t.keterangan || "-",
        role: t.role || "Guru",
        scheduleImage: (t as any).schedule_image_path // Cast as any because interface might not have it yet
      }));

      setGuruData(mappedData);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = guruData.filter(
    (item) =>
      item.kodeGuru.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.namaGuru.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.mataPelajaran.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.role.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleUpload = (row: GuruJadwal) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png, image/jpeg, image/jpg";

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
            setUploadingId(row.id);
            const response = await teacherService.uploadScheduleImage(row.id, file);
            
            // Update local state with new image URL if returned, or just refresh
            // The response usually contains the URL or we can assume success
            // If response has url:
            if (response.url) {
                 setGuruData(prev => prev.map(item => 
                    item.id === row.id ? { ...item, scheduleImage: response.url } : item
                 ));
            } else {
                fetchTeachers(); // Refresh to be sure
            }
            alert("Jadwal berhasil diunggah");
        } catch (error) {
            console.error("Upload failed", error);
            alert("Gagal mengunggah jadwal");
        } finally {
            setUploadingId(null);
        }
      }
    };

    input.click();
  };

  const handleViewDetail = (row: GuruJadwal) => {
    if (onselectGuru) {
      onselectGuru(row.namaGuru);
    }

    onMenuClick("lihat-guru", {
      namaGuru: row.namaGuru,
      noIdentitas: row.kodeGuru,
      jadwalImage: row.scheduleImage,
      guruId: row.id // Pass ID for detail fetching
    });
  };

  const columns = [
    { key: "kodeGuru", label: "Kode Guru" },
    { key: "namaGuru", label: "Nama Guru" },
    { key: "mataPelajaran", label: "Mata Pelajaran" },
    { key: "role", label: "Role" },
    {
      key: "aksi",
      label: "Aksi",
      align: "center",
      render: (_: any, row: GuruJadwal) => (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <button
            onClick={() => handleViewDetail(row)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#374151"
            }}
            title="Lihat Detail"
          >
            <Eye size={18} />
          </button>

          <button
            onClick={() => handleUpload(row)}
            disabled={uploadingId === row.id}
            style={{
              background: "none",
              border: "none",
              cursor: uploadingId === row.id ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              color: uploadingId === row.id ? "#9CA3AF" : "#374151"
            }}
             title="Upload Jadwal"
          >
            <Upload size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <StaffLayout
      pageTitle="Jadwal Guru"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 32,
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <SearchBox
            placeholder="Cari guru..."
            value={searchValue}
            onChange={setSearchValue}
          />
        </div>

        {loading ? (
             <div style={{ textAlign: "center", padding: "20px", color: "#6B7280" }}>Memuat data guru...</div>
        ) : (
            <Table
            columns={columns}
            data={filteredData}
            keyField="id"
            emptyMessage="Belum ada data jadwal guru."
            />
        )}
      </div>
    </StaffLayout>
  );
}
