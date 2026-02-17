import { useState, useMemo, useEffect } from "react";
import { Eye, FileDown } from "lucide-react";
import StaffLayout from "../../component/WakaStaff/StaffLayout";
import { Table } from "../../component/Shared/Table";
import { attendanceService } from "../../services/attendanceService";

interface RekapKehadiranSiswaProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string, payload?: any) => void;
  kelas?: string;
  kelasId?: string;
  namaKelas?: string;
  waliKelas?: string;
  onBack?: () => void;
}

interface SiswaRow {
  no: number;
  nisn: string;
  namaSiswa: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  pulang: number;
}

export default function RekapKehadiranSiswa({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  kelasId,
  namaKelas = "12 Mekatronika 2",
  waliKelas = "Ewit Erniyah S.pd",
  onBack,
}: RekapKehadiranSiswaProps) {
  // Set default dates (first and last day of current month)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [siswaData, setSiswaData] = useState<SiswaRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Warna sesuai revisi
  const COLORS = {
    HADIR: "#1FA83D",
    IZIN: "#ACA40D",
    PULANG: "#2F85EB",
    TIDAK_HADIR: "#D90000",
    SAKIT: "#520C8F"
  };

  // Inject CSS untuk ubah icon kalender jadi putih
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .custom-date-input::-webkit-calendar-picker-indicator {
        filter: invert(1) brightness(100) !important;
        opacity: 1 !important;
        cursor: pointer !important;
      }
      .custom-date-input::-webkit-inner-spin-button,
      .custom-date-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .custom-date-input {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (kelasId) {
        fetchData();
    }
  }, [kelasId, startDate, endDate]);

  const fetchData = async () => {
    if (!kelasId) return;
    setLoading(true);
    try {
        const response = await attendanceService.getWakaClassAttendanceSummary(kelasId, {
            from: startDate,
            to: endDate
        });
        
        // Response is array of { student: {}, totals: { present: 1, ... } }
        const rows: SiswaRow[] = (response || []).map((item: any, index: number) => {
            const totals = item.totals || {};
            // Map backend status to frontend keys
            // Backend: present, sick, permission, alpha, late?
            // Frontend: hadir, sakit, izin, alpha, pulang
            
            // Note: 'late' is usually counted as 'hadir' in simple recap, or separate.
            // Based on previous code, 'hadir' includes 'present' and maybe 'late'.
            // Let's assume 'late' contributes to 'hadir' or shows separately.
            // The previous mock data had 'hadir'. 
            // Let's sum 'present' + 'late'.
            
            const hadir = (totals.present || 0) + (totals.late || 0);
            
            return {
                no: index + 1,
                nisn: item.student?.nisn || "-",
                namaSiswa: item.student?.user?.name || item.student?.name || "-",
                hadir: hadir,
                sakit: totals.sick || 0,
                izin: totals.permission || 0,
                alpha: totals.alpha || totals.absent || 0, // 'absent' usually means alpha if not otherwise specified
                pulang: 0 // Backend doesn't seem to have 'pulang' status explicitly in totals? 
                          // If 'pulang' is a status, it should be in totals.
                          // 'pulang' usually means 'permission to go home'.
            };
        });

        setSiswaData(rows);
    } catch (error) {
        console.error("Failed to fetch recap:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleExportExcel = () => {
    // Buat data untuk Excel
    const headers = ["No", "NISN", "Nama Siswa", "Hadir", "Sakit", "Izin", "Alfa", "Pulang"];
    const rows = siswaData.map((siswa) => [
      siswa.no,
      siswa.nisn,
      siswa.namaSiswa,
      siswa.hadir,
      siswa.sakit,
      siswa.izin,
      siswa.alpha,
      siswa.pulang,
    ]);

    // Gabungkan headers dan rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Tambahkan BOM untuk support Unicode di Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // Buat download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Kehadiran_${namaKelas}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Buat konten HTML untuk PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { text-align: center; color: #062A4A; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #062A4A; color: white; }
          .hadir { color: ${COLORS.HADIR}; font-weight: bold; }
          .sakit { color: ${COLORS.SAKIT}; font-weight: bold; }
          .izin { color: ${COLORS.IZIN}; font-weight: bold; }
          .alpha { color: ${COLORS.TIDAK_HADIR}; font-weight: bold; }
          .pulang { color: ${COLORS.PULANG}; font-weight: bold; }
        </style>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Tutup tab setelah print dialog muncul
              setTimeout(function() {
                window.close();
              }, 500);
            }, 250);
          };
        </script>
      </head>
      <body>
        <h2>Rekap Kehadiran Siswa</h2>
        <div class="info">
          <strong>Kelas:</strong> ${namaKelas}<br>
          <strong>Wali Kelas:</strong> ${waliKelas}<br>
          <strong>Periode:</strong> ${startDate} - ${endDate}
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NISN</th>
              <th>Nama Siswa</th>
              <th>Hadir</th>
              <th>Sakit</th>
              <th>Izin</th>
              <th>Alfa</th>
              <th>Pulang</th>
            </tr>
          </thead>
          <tbody>
            ${siswaData.map((siswa) => `
              <tr>
                <td>${siswa.no}</td>
                <td>${siswa.nisn}</td>
                <td>${siswa.namaSiswa}</td>
                <td class="hadir">${siswa.hadir}</td>
                <td class="sakit">${siswa.sakit}</td>
                <td class="izin">${siswa.izin}</td>
                <td class="alpha">${siswa.alpha}</td>
                <td class="pulang">${siswa.pulang}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Buat Blob dan download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    // Buka di tab baru untuk print to PDF
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        URL.revokeObjectURL(url);
      };
    }
  };

  // ✅ HANDLER UNTUK NAVIGASI KE DAFTAR KETIDAKHADIRAN
  const handleViewDetail = (row: SiswaRow) => {
    onMenuClick("daftar-ketidakhadiran", {
      siswaName: row.namaSiswa,
      siswaIdentitas: row.nisn,
    });
  };

  const columns = useMemo(
    () => [
      { 
        key: "nisn", 
        label: <div style={{ textAlign: "center" }}>NISN</div>,
        render: (value: string) => (
          <div style={{ textAlign: "center" }}>{value}</div>
        ),
      },
      { key: "namaSiswa", label: "Nama Siswa" },
      { 
        key: "hadir", 
        label: <div style={{ textAlign: "center" }}>Hadir</div>,
        render: (value: number) => (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: COLORS.HADIR, fontWeight: 700 }}>{value}</span>
          </div>
        ),
      },
      { 
        key: "sakit", 
        label: <div style={{ textAlign: "center" }}>Sakit</div>,
        render: (value: number) => (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: COLORS.SAKIT, fontWeight: 700 }}>{value}</span>
          </div>
        ),
      },
      { 
        key: "izin", 
        label: <div style={{ textAlign: "center" }}>Izin</div>,
        render: (value: number) => (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: COLORS.IZIN, fontWeight: 700 }}>{value}</span>
          </div>
        ),
      },
      { 
        key: "alpha", 
        label: <div style={{ textAlign: "center" }}>Alfa</div>,
        render: (value: number) => (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: COLORS.TIDAK_HADIR, fontWeight: 700 }}>{value}</span>
          </div>
        ),
      },
      { 
        key: "pulang", 
        label: <div style={{ textAlign: "center" }}>Pulang</div>,
        render: (value: number) => (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: COLORS.PULANG, fontWeight: 700 }}>{value}</span>
          </div>
        ),
      },
      {
        key: "aksi",
        label: <div style={{ textAlign: "center" }}>Aksi</div>,
        render: (_: any, row: SiswaRow) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => handleViewDetail(row)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Eye size={20} color="#1F2937" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <StaffLayout
      pageTitle="Rekap Kehadiran Siswa"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      {/* Button Kembali */}
      {onBack && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: "#374151",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
              e.currentTarget.style.borderColor = "#9CA3AF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.borderColor = "#D1D5DB";
            }}
          >
            <span style={{ fontSize: 16 }}>←</span>
            Kembali
          </button>
        </div>
      )}

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 32,
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Kelas Info - KIRI */}
          <div
            style={{
              backgroundColor: "#062A4A",
              borderRadius: 12,
              padding: "14px 20px",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="white" 
                stroke="white" 
                strokeWidth="0.5"
              >
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {namaKelas}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {waliKelas}
              </div>
            </div>
          </div>

          {/* Date Range and Export - KANAN */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Periode Box - Navy Style */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#062A4A",
                padding: "10px 16px",
                borderRadius: 10,
                color: "#FFFFFF",
              }}
            >
              {/* Icon Kalender */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 6,
                }}
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>

              {/* Label Periode */}
              <span style={{ fontSize: 14, fontWeight: 600 }}>Periode:</span>

              {/* Start Date */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.3)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  colorScheme: "dark",
                }}
                className="custom-date-input"
              />

              {/* Separator */}
              <span style={{ fontWeight: 600, fontSize: 16 }}>—</span>

              {/* End Date */}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.3)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  colorScheme: "dark",
                }}
                className="custom-date-input"
              />
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportExcel}
              disabled={loading || siswaData.length === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || siswaData.length === 0 ? "not-allowed" : "pointer",
                opacity: loading || siswaData.length === 0 ? 0.6 : 1,
              }}
            >
              <FileDown size={16} />
              Unduh Excel
            </button>

            <button
              onClick={handleExportPDF}
              disabled={loading || siswaData.length === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || siswaData.length === 0 ? "not-allowed" : "pointer",
                opacity: loading || siswaData.length === 0 ? 0.6 : 1,
              }}
            >
              <FileDown size={16} />
              Unduh PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={siswaData}
          keyField="nisn"
          emptyMessage={loading ? "Memuat data rekap..." : "Belum ada data rekap kehadiran siswa."}
        />
      </div>
    </StaffLayout>
  );
}