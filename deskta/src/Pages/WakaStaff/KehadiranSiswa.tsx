import { useEffect, useMemo, useState } from "react";
import StaffLayout from "../../component/WakaStaff/StaffLayout";
import { Table } from "../../component/Shared/Table";
import { masterService, type Major } from "../../services/masterService";

interface KelasRow {
  id: string;
  tingkat: string;
  namaKelas: string;
  namaJurusan: string;
  waliKelas: string;
}

interface KehadiranSiswaProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string, payload?: any) => void;
  onNavigateToDetail?: (kelasId: string, kelasData: KelasRow) => void;
}

export default function KehadiranSiswa({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  onNavigateToDetail,
}: KehadiranSiswaProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  
  const [kelasData, setKelasData] = useState<KelasRow[]>([]);
  const [jurusanList, setJurusanList] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    
    fetchData();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [majorsResponse, classesResponse] = await Promise.all([
            masterService.getMajors(),
            masterService.getClasses()
        ]);

        const majors: Major[] = majorsResponse.data || [];
        const classes: any[] = classesResponse.data || [];

        // Set Majors List
        setJurusanList(majors.map(m => m.name));

        // Map Classes
        const rows: KelasRow[] = classes.map((c: any) => {
            // Determine grade for filtering (e.g., "10", "11", "12")
            // Backend might return "X", "10", etc.
            // We'll trust c.grade for now
            // If backend returns Roman, verify mapping.
            // Assuming grade is "10", "11", "12" based on previous analysis of Model.
            // But Model accessor 'grade_roman' returns Roman.
            // Let's check c.grade raw value. 
            // Actually ClassResource returns grade: $this->grade.
            
            return {
                id: String(c.id),
                tingkat: String(c.grade), 
                namaKelas: c.class_name || c.name, // ClassResource returns 'class_name' which is "X RPL 1"
                namaJurusan: c.major_name || "-",
                waliKelas: c.homeroom_teacher_name || "Belum ditentukan"
            };
        });

        setKelasData(rows);

        // Derive unique grades for filter
        const uniqueGrades = Array.from(new Set(rows.map(r => r.tingkat))).sort();
        setKelasList(uniqueGrades);

    } catch (error) {
        console.error("Failed to fetch data:", error);
    } finally {
        setLoading(false);
    }
  };

  // Filter data sesuai jurusan & kelas
  const filteredData = useMemo(() => {
    return kelasData.filter((item) => {
      const jurusanMatch =
        !selectedJurusan || item.namaJurusan === selectedJurusan;
      const kelasMatch =
        !selectedKelas || item.tingkat === selectedKelas;

      return jurusanMatch && kelasMatch;
    });
  }, [kelasData, selectedJurusan, selectedKelas]);

  // Kolom tabel (tetap)
  const columns = useMemo(
    () => [
      { key: "namaKelas", label: "Kelas" },
      { key: "namaJurusan", label: "Konsentrasi Keahlian" },
      { key: "waliKelas", label: "Wali Kelas" },
    ],
    []
  );

  const handleViewDetail = (row: KelasRow) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(row.id, row);
    }
  };

  return (
    <StaffLayout
      pageTitle="Kehadiran Siswa"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: isMobile ? 16 : 24,
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Filter */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>
            Silahkan Pilih Konsentrasi Keahlian dan Tingkat Kelas :
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Dropdown Jurusan */}
            <select
              value={selectedJurusan}
              onChange={(e) => setSelectedJurusan(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                minWidth: 200,
              }}
            >
              <option value="">Semua Konsentrasi Keahlian</option>
              {jurusanList.map((jurusan) => (
                <option key={jurusan} value={jurusan}>
                  {jurusan}
                </option>
              ))}
            </select>

            {/* Dropdown Kelas */}
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                minWidth: 120,
              }}
            >
              <option value="">Semua Tingkat Kelas</option>
              {kelasList.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel */}
        {loading ? (
             <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>Memuat data kelas...</div>
        ) : (
            <Table
            columns={columns}
            data={filteredData}
            onView={handleViewDetail}
            keyField="id"
            emptyMessage="Belum ada data kelas."
            />
        )}
      </div>
    </StaffLayout>
  );
}