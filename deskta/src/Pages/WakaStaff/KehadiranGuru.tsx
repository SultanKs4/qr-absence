// src/Pages/WakaStaff/KehadiranGuru.tsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../component/WakaStaff/StaffLayout";
import { Table } from "../../component/Shared/Table";
import { Eye, Search } from "lucide-react";
import { attendanceService } from "../../services/attendanceService";
import { masterService } from "../../services/masterService";

type StatusType =
  | "hadir"
  | "terlambat"
  | "tidak-hadir"
  | "sakit"
  | "izin"
  | "alpha"
  | "tidak-ada-jadwal";

interface KehadiranGuruProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
  onNavigateToDetail?: (guruId: string, guruName: string) => void;
}

interface KehadiranGuruRow {
  id: string;
  namaGuru: string;
  jadwal: string; // This might be "XII RPL 2" or something. But endpoint doesn't return class directly unless we check schedule.
  kehadiranJam: StatusType[];
  teacherId: string;
}

interface TimeSlot {
  id: number;
  time: string; // specific field name from TimeSlot model? Assume 'time' or 'start_time'
  start_time: string;
  end_time: string;
  name: string;
}

export default function KehadiranGuru({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  onNavigateToDetail,
}: KehadiranGuruProps) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<KehadiranGuruRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTanggal, setSelectedTanggal] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedTanggal]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch
      const [timeSlotsResponse, dailyResponse] = await Promise.all([
        masterService.getTimeSlots(),
        attendanceService.getTeachersDailyAttendance(selectedTanggal)
      ]);

      const timeSlots: TimeSlot[] = timeSlotsResponse.data || [];
      // Sort time slots by start_time
      timeSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      // Take first 10 slots or as many as exist
      const relevantSlots = timeSlots.slice(0, 10);

      const items = dailyResponse.items ? dailyResponse.items.data : []; // Paginated response usually has 'data'

      const newRows: KehadiranGuruRow[] = items.map((item: any) => {
        const teacher = item.teacher;
        const attendances = item.attendances || [];
        
        // Initialize with "tidak-ada-jadwal"
        const kehadiranJam: StatusType[] = Array(10).fill("tidak-ada-jadwal");

        attendances.forEach((att: any) => {
          if (att.schedule) {
            // Find corresponding time slot index
            const slotIndex = relevantSlots.findIndex((slot) => slot.start_time === att.schedule.start_time);
            
            if (slotIndex !== -1 && slotIndex < 10) {
              // Map backend status to frontend StatusType
              // Backend status: present, late, absent, sick, permission, alpha
              let status: StatusType = "tidak-hadir";
              if (att.status === "present") status = "hadir";
              else if (att.status === "late") status = "terlambat";
              else if (att.status === "sick") status = "sakit";
              else if (att.status === "permission") status = "izin";
              else if (att.status === "alpha") status = "alpha";
              else if (att.status === "absent") status = "tidak-hadir";

              kehadiranJam[slotIndex] = status;
            }
          }
        });

        // Determine "jadwal" text - maybe first class name found?
        // Or if multiple, "Multiple Classes"
        let jadwalText = "-";
        const schedules = attendances.map((a: any) => a.schedule?.subject?.name || a.schedule?.keterangan).filter(Boolean);
        if (schedules.length > 0) {
            jadwalText = [...new Set(schedules)].join(", ");
        }

        return {
          id: teacher.id.toString(),
          teacherId: teacher.id.toString(),
          namaGuru: teacher.user?.name || teacher.name || "Unknown",
          jadwal: jadwalText.substring(0, 20) + (jadwalText.length > 20 ? "..." : ""),
          kehadiranJam
        };
      });

      setRows(newRows);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) =>
      r.namaGuru.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const renderStatusBar = (data: StatusType[]) => {
    const statusColors: Record<string, string> = {
      "hadir": "#1FA83D",          // HIJAU - Hadir
      "terlambat": "#ACA40D",      // KUNING - Terlambat
      "izin": "#ACA40D",           // KUNING - Izin
      "sakit": "#520C8F",          // UNGU - Sakit
      "tidak-hadir": "#D90000",    // MERAH - Tidak Hadir
      "alpha": "#D90000",          // MERAH - Alpha
      "tidak-ada-jadwal": "#9CA3AF", // ABU-ABU - Tidak Ada Jadwal
    };

    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            width: 240,
            height: 16,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid #1F2937",
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const status = data[i];
            const color = statusColors[status] || "#D90000";

            return (
              <div
                key={i}
                title={`Jam ke-${i+1}: ${status}`}
                style={{
                  flex: 1,
                  backgroundColor: color,
                  borderRight: i !== 9 ? "1px solid #1F2937" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#000000",
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleView = (row: KehadiranGuruRow) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(row.id, row.namaGuru);
    } else {
      navigate(`/waka/kehadiran/detail/${row.id}`, {
        state: {
          guru: row,
          selectedTanggal,
          guruId: row.id, // Ensure guruId is passed explicitly
          teacherId: row.teacherId,
          guruName: row.namaGuru
        },
      });
    }
  };

  const columns = useMemo(
    () => [
      { key: "namaGuru", label: "Nama Guru" },
      {
        key: "jadwal",
        label: <div style={{ textAlign: "center" }}>Jadwal/Mapel</div>,
        render: (value: string) => (
          <div style={{ textAlign: "center" }}>{value}</div>
        ),
      },
      {
        key: "kehadiranJam",
        label: <div style={{ textAlign: "center" }}>Status (Jam ke 1-10)</div>,
        render: (value: StatusType[]) => renderStatusBar(value),
      },
      {
        key: "aksi",
        label: <div style={{ textAlign: "center" }}>Aksi</div>,
        render: (_: unknown, row: KehadiranGuruRow) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => handleView(row)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Eye size={20} color="#1F2937" strokeWidth={2} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <StaffLayout
      pageTitle="Kehadiran Guru"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      {/* SEARCH + DATE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {/* SEARCH */}
        <div style={{ position: "relative", flex: 1, maxWidth: 520 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              top: "50%",
              left: 14,
              transform: "translateY(-50%)",
              color: "#6B7280",
            }}
          />
          <input
            type="text"
            placeholder="Cari nama guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "12px 16px 12px 44px",
              width: "100%",
              borderRadius: 14,
              border: "1px solid #D1D5DB",
              backgroundColor: "#F3F4F6",
              fontWeight: 600,
              fontSize: 14,
            }}
          />
        </div>

        {/* DATE */}
        <input
          type="date"
          value={selectedTanggal}
          onChange={(e) => setSelectedTanggal(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            border: "1px solid #D1D5DB",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        />
      </div>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          padding: isMobile ? 16 : 32,
        }}
      >
        {loading ? (
             <div style={{ padding: "20px", textAlign: "center" }}>Memuat data...</div>
        ) : (
            <Table
            columns={columns}
            data={filteredRows}
            keyField="id"
            emptyMessage="Belum ada data kehadiran guru."
            />
        )}
      </div>
    </StaffLayout>
  );
}