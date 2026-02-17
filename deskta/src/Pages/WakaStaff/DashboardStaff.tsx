import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../component/WakaStaff/StaffLayout";
import JadwalKelasStaff from "./JadwalKelasStaff";
import JadwalGuruStaff from "./JadwalGuruStaff";
import DetailGuru from "./LihatGuru";
import DetailKelas from "./LihatKelas";
import KehadiranGuru from "./KehadiranGuru";
import KehadiranSiswa from "./KehadiranSiswa";
import DetailSiswaStaff from "./DetailSiswaStaff";
import DetailKehadiranGuru from "./DetailKehadiranGuru";
import RekapKehadiranSiswa from "./RekapKehadiranSiswa";
import DaftarKetidakhadiran from "./DaftarKetidakhadiran";
import JadwalSiswaEdit from "./JadwalSiswaEdit";
import { dashboardService } from "../../services/dashboardService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  BarElement
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  BarElement
);

interface DashboardStaffProps {
  user: { name: string; role: string; phone?: string };
  onLogout: () => void;
}

type WakaPage =
  | "dashboard"
  | "jadwal-kelas"
  | "jadwal-guru"
  | "kehadiran-siswa"
  | "kehadiran-guru"
  | "guru-pengganti"
  | "lihat-guru"
  | "lihat-kelas"
  | "detail-siswa-staff"
  | "detail-kehadiran-guru"
  | "rekap-kehadiran-siswa"
  | "daftar-ketidakhadiran"
  | "edit-jadwal-kelas";

type StatisticType = "tepat-waktu" | "terlambat" | "izin" | "sakit" | "pulang" | null;

const PAGE_TITLES: Record<WakaPage, string> = {
  dashboard: "Dashboard",
  "jadwal-kelas": "Jadwal Kelas",
  "jadwal-guru": "Jadwal Guru",
  "kehadiran-siswa": "Kehadiran Siswa",
  "kehadiran-guru": "Kehadiran Guru",
  "guru-pengganti": "Daftar Guru Pengganti",
  "lihat-guru": "Detail Guru",
  "lihat-kelas": "Detail Kelas",
  "detail-siswa-staff": "Detail Siswa Staff",
  "detail-kehadiran-guru": "Detail Kehadiran Guru",
  "rekap-kehadiran-siswa": "Rekap Kehadiran Siswa",
  "daftar-ketidakhadiran": "Daftar Ketidakhadiran",
  "edit-jadwal-kelas": "Edit Struktur Jadwal",
};

// Warna sesuai format revisi
const COLORS = {
  HADIR: "#1FA83D",      // HIJAU - Hadir
  IZIN: "#ACA40D",       // KUNING - Izin
  PULANG: "#2F85EB",     // BIRU - Pulang
  TIDAK_HADIR: "#D90000", // MERAH - alfa
  SAKIT: "#520C8F",      // UNGU - Sakit
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08)",
  border: "1px solid rgba(229, 231, 235, 0.8)",
  backdropFilter: "blur(10px)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

export default function DashboardStaff({ user, onLogout }: DashboardStaffProps) {
  const [currentPage, setCurrentPage] = useState<WakaPage>("dashboard");
  const [selectedGuru, setSelectedGuru] = useState<string | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<string | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [selectedKelasInfo, setSelectedKelasInfo] = useState<{
    namaKelas: string;
    waliKelas: string;
  } | null>(null);
  const [selectedSiswa, setSelectedSiswa] = useState<{
    name: string;
    identitas: string;
  } | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatisticType>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  
  // Data State
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    pulang: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [historyInfo, setHistoryInfo] = useState({
    date: "",
    start: "",
    end: "",
    time: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardService.getWakaDashboard();
        
        // Update stats
        setStats(data.statistik);
        
        // Update charts
        setDailyData(data.daily_stats || []);
        setMonthlyData(data.trend || []);
        
        // Update history info card
        const now = new Date();
        const startTime = "07:00:00"; // Could be from settings
        const endTime = "15:00:00";   // Could be from settings
        
        setHistoryInfo({
          date: new Date(data.date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          start: startTime,
          end: endTime,
          time: now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
        });
        
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentPage === "dashboard") {
      fetchDashboardData();
    }
  }, [currentPage]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      setCurrentDate(now.toLocaleDateString("id-ID", options));
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = (page: string, payload?: any) => {
    setCurrentPage(page as WakaPage);
    
    // Handle payload for ID setting
    if (payload?.kelasId) {
      setSelectedKelasId(String(payload.kelasId));
    }

    // Handle payload untuk daftar-ketidakhadiran
    if (page === "daftar-ketidakhadiran" && payload) {
      setSelectedSiswa({
        name: payload.siswaName,
        identitas: payload.siswaIdentitas,
      });
    }
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      onLogout();
      navigate("/");
    }
  };

  const commonProps = {
    user,
    onLogout: handleLogout,
    currentPage,
    onMenuClick: handleMenuClick,
  };

  const renderPage = () => {
    switch (currentPage) {
      case "jadwal-kelas":
        return (
          <JadwalKelasStaff
            {...commonProps}
            onselectKelas={(kelasId: string) => {
              setSelectedKelas(kelasId);
              handleMenuClick("lihat-kelas");
            }}
          />
        );

      case "jadwal-guru":
        return (
          <JadwalGuruStaff
            {...commonProps}
            onselectGuru={(guruId: string) => {
              setSelectedGuru(guruId);
              handleMenuClick("lihat-guru");
            }}
          />
        );

      case "lihat-guru":
        return (
          <DetailGuru
            {...commonProps}
            namaGuru={selectedGuru || undefined}
            onBack={() => handleMenuClick("jadwal-guru")}
          />
        );

      case "lihat-kelas":
        return (
          <DetailKelas
            {...commonProps}
            kelas={selectedKelas || undefined}
            onBack={() => handleMenuClick("jadwal-kelas")}
          />
        );

      case "kehadiran-siswa":
        return (
          <KehadiranSiswa
            {...commonProps}
            onNavigateToDetail={(kelasId: string, kelasInfo: { namaKelas: string; waliKelas: string }) => {
              setSelectedKelasId(kelasId);
              setSelectedKelasInfo(kelasInfo);
              handleMenuClick("detail-siswa-staff");
            }}
          />
        );

      case "detail-siswa-staff":
        return (
          <DetailSiswaStaff
            {...commonProps}
            selectedKelas={selectedKelas || ""}
            kelasId={selectedKelasId || undefined}
            onBack={() => handleMenuClick("kehadiran-siswa")}
            onNavigateToRecap={() => handleMenuClick("rekap-kehadiran-siswa")}
          />
        );

      case "kehadiran-guru":
        return (
          <KehadiranGuru
            {...commonProps}
            onNavigateToDetail={() => {
              handleMenuClick("detail-kehadiran-guru");
            }}
          />
        );

      case "detail-kehadiran-guru":
        return (
          <DetailKehadiranGuru
            {...commonProps}
            onBack={() => handleMenuClick("kehadiran-guru")}
          />
        );

      case "rekap-kehadiran-siswa":
        return (
          <RekapKehadiranSiswa
            {...commonProps}
            kelasId={selectedKelasId || undefined}
            namaKelas={selectedKelasInfo?.namaKelas || "X Mekatronika 1"}
            waliKelas={selectedKelasInfo?.waliKelas || "Ewit Erniyah S.pd"}
            onBack={() => handleMenuClick("detail-siswa-staff")}
          />
        );

      case "daftar-ketidakhadiran":
        return (
          <DaftarKetidakhadiran
            {...commonProps}
            siswaName={selectedSiswa?.name}
            siswaIdentitas={selectedSiswa?.identitas}
            onBack={() => handleMenuClick("rekap-kehadiran-siswa")}
          />
        );

      case "edit-jadwal-kelas":
        return (
          <JadwalSiswaEdit
            {...commonProps}
            id={selectedKelasId || undefined}
            onBack={() => handleMenuClick("jadwal-kelas")}
          />
        );

      case "guru-pengganti":
        return (
          <StaffLayout
            pageTitle={PAGE_TITLES[currentPage]}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            user={user}
            onLogout={handleLogout}
          >
            <ComingSoon title={PAGE_TITLES[currentPage]} />
          </StaffLayout>
        );

      case "dashboard":
      default:
        return (
          <StaffLayout
            pageTitle="Beranda"
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            user={user}
            onLogout={handleLogout}
          >
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "28px", backgroundColor: "#F9FAFB", padding: "4px" }}>
              {/* Welcome Section */}
              <div style={{ marginBottom: "8px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>
                  Selamat Datang, {user.name}
                </h2>
                <p style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0" }}>
                  Ringkasan aktivitas dan data sekolah hari ini
                </p>
              </div>

              {/* Top Section: History & Statistics */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: "24px",
                }}
              >
                {/* Riwayat Kehadiran Card */}
                <div style={cardStyle}>
                  <SectionHeader
                    title="Riwayat Kehadiran"
                    subtitle={`${currentDate} • ${currentTime}`}
                  />
                  <HistoryCard
                    start={historyInfo.start}
                    end={historyInfo.end}
                  />
                </div>

                {/* Statistik Kehadiran Card */}
                <div style={cardStyle}>
                  <SectionHeader
                    title="Statistik Kehadiran"
                    subtitle="Klik untuk melihat detail"
                  />
                  <LinkStatsGrid 
                    stats={stats}
                    selectedStat={selectedStat}
                    onSelectStat={setSelectedStat}
                  />
                  {selectedStat && (
                    <StatisticDetail stat={selectedStat} />
                  )}
                </div>
              </div>

              {/* Grafik Section */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {/* Weekly Chart - Kembali ke bentuk semula dengan warna baru */}
                <div style={cardStyle}>
                  <SectionHeader title="Grafik Kehadiran Harian" subtitle="Rekap Mingguan (Senin - Jumat)" />
                  <WeeklyBarGraph data={dailyData} />
                </div>

                {/* Monthly Chart - Line Chart seperti DashboardSiswa */}
                <div style={{
                  ...cardStyle,
                  transition: "all 0.3s ease",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 31, 62, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
                  }}>
                  <SectionHeader
                    title="Grafik Kehadiran Bulanan"
                    subtitle="Periode Jan - Jun"
                  />
                  <MonthlyLineChart data={monthlyData} />
                </div>
              </div>
              </div>
            )}
          </StaffLayout>
        );
    }
  };

  return renderPage();
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#6B7280", fontWeight: 500 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}


function LinkStatsGrid({ 
  stats, 
  selectedStat,
  onSelectStat 
}: { 
  stats: any;
  selectedStat: StatisticType;
  onSelectStat: (stat: StatisticType) => void;
}) {
  const statCards = [
    { id: "tepat-waktu", label: "Tepat Waktu", value: stats.hadir?.toString() || "0", color: "#1FA83D", icon: "✓" },
    { id: "terlambat", label: "Terlambat", value: stats.terlambat?.toString() || "0", color: "#ACA40D", icon: "⏱" },
    { id: "izin", label: "Izin", value: (stats.izin || 0).toString(), color: "#520C8F", icon: "📋" },
    { id: "sakit", label: "Sakit", value: stats.sakit?.toString() || "0", color: "#D90000", icon: "🏥" },
    { id: "pulang", label: "Pulang", value: stats.pulang?.toString() || "0", color: "#2F85EB", icon: "🚪" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(85px, 1fr))",
        gap: "12px",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {statCards.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelectStat(selectedStat === item.id ? null : (item.id as StatisticType))}
          style={{
            border: `2px solid ${selectedStat === item.id ? item.color : item.color + "20"}`,
            borderRadius: "12px",
            padding: "14px 12px",
            textAlign: "center",
            backgroundColor: selectedStat === item.id ? item.color + "15" : item.color + "08",
            transition: "all 0.2s ease",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transform: selectedStat === item.id ? "scale(1.05)" : "scale(1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = item.color + "20";
            e.currentTarget.style.borderColor = item.color;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            if (selectedStat !== item.id) {
              e.currentTarget.style.backgroundColor = item.color + "08";
              e.currentTarget.style.borderColor = item.color + "20";
            }
            e.currentTarget.style.transform = selectedStat === item.id ? "scale(1.05)" : "translateY(0)";
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "#6B7280",
              fontWeight: 600,
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </p>
          <p
            style={{
              margin: "0",
              fontSize: "20px",
              fontWeight: 700,
              color: item.color,
            }}
          >
            {item.icon}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "16px",
              fontWeight: 700,
              color: item.color,
            }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatisticDetail({ stat }: { stat: Exclude<StatisticType, null> }) {
  const details: Record<string, { desc: string; color: string }> = {
    "tepat-waktu": { 
      desc: "Total guru yang hadir tepat waktu sesuai jadwal kerja", 
      color: "#1FA83D" 
    },
    "terlambat": { 
      desc: "Total guru yang terlambat lebih dari 5 menit", 
      color: "#ACA40D" 
    },
    "izin": { 
      desc: "Total guru yang mengajukan izin dan disetujui", 
      color: "#520C8F" 
    },
    "sakit": { 
      desc: "Total guru yang tidak masuk karena sakit", 
      color: "#D90000" 
    },
    "pulang": { 
      desc: "Total guru yang pulang lebih awal dengan izin", 
      color: "#2F85EB" 
    },
  };

  const detail = details[stat];

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px 14px",
        backgroundColor: detail.color + "10",
        border: `1px solid ${detail.color}30`,
        borderRadius: "8px",
        animation: "slideIn 0.3s ease",
      }}
    >
      <p style={{ margin: 0, fontSize: "12px", color: "#4B5563", lineHeight: "1.5" }}>
        {detail.desc}
      </p>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function WeeklyBarGraph({ data = [] }: { data?: any[] }) {
  const chartData = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        label: "Hadir",
        data: data.map((d) => d.hadir),
        backgroundColor: [
          "rgba(31, 168, 61, 0.9)",
          "rgba(31, 168, 61, 0.85)",
          "rgba(31, 168, 61, 0.95)",
          "rgba(31, 168, 61, 0.88)",
          "rgba(31, 168, 61, 0.92)",
        ],
        borderColor: COLORS.HADIR,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: "rgba(31, 168, 61, 1)",
        hoverBorderColor: COLORS.HADIR,
        hoverBorderWidth: 3,
      },
      {
        label: "alfa",
        data: data.map((d) => d.tidak_hadir),
        backgroundColor: [
          "rgba(217, 0, 0, 0.85)",
          "rgba(217, 0, 0, 0.8)",
          "rgba(217, 0, 0, 0.9)",
          "rgba(217, 0, 0, 0.83)",
          "rgba(217, 0, 0, 0.87)",
        ],
        borderColor: COLORS.TIDAK_HADIR,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: "rgba(217, 0, 0, 1)",
        hoverBorderColor: COLORS.TIDAK_HADIR,
        hoverBorderWidth: 3,
      },
      {
        label: "Izin",
        data: data.map((d) => d.izin),
        backgroundColor: [
          "rgba(172, 164, 13, 0.85)",
          "rgba(172, 164, 13, 0.8)",
          "rgba(172, 164, 13, 0.9)",
          "rgba(172, 164, 13, 0.83)",
          "rgba(172, 164, 13, 0.87)",
        ],
        borderColor: COLORS.IZIN,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: "rgba(172, 164, 13, 1)",
        hoverBorderColor: COLORS.IZIN,
        hoverBorderWidth: 3,
      },
      {
        label: "Sakit",
        data: data.map((d) => d.sakit),
        backgroundColor: [
          "rgba(82, 12, 143, 0.85)",
          "rgba(82, 12, 143, 0.8)",
          "rgba(82, 12, 143, 0.9)",
          "rgba(82, 12, 143, 0.83)",
          "rgba(82, 12, 143, 0.87)",
        ],
        borderColor: COLORS.SAKIT,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: "rgba(82, 12, 143, 1)",
        hoverBorderColor: COLORS.SAKIT,
        hoverBorderWidth: 3,
      },
      {
        label: "Pulang",
        data: data.map((d) => d.pulang),
        backgroundColor: [
          "rgba(47, 133, 235, 0.85)",
          "rgba(47, 133, 235, 0.8)",
          "rgba(47, 133, 235, 0.9)",
          "rgba(47, 133, 235, 0.83)",
          "rgba(47, 133, 235, 0.87)",
        ],
        borderColor: COLORS.PULANG,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: "rgba(47, 133, 235, 1)",
        hoverBorderColor: COLORS.PULANG,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "x" as const,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 20,
          font: {
            size: 13,
            weight: "bold" as const,
            family: "'Inter', sans-serif",
          },
          color: "#374151",
        },
      },
      tooltip: {
        backgroundColor: "rgba(31, 41, 55, 0.95)",
        padding: 14,
        titleFont: { size: 14, weight: "bold" as const, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, weight: "normal" as const, family: "'Inter', sans-serif" },
        cornerRadius: 10,
        displayColors: true,
        borderColor: "#E5E7EB",
        borderWidth: 1,
        boxPadding: 8,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y + ' murid';
            return label;
          },
          afterLabel: function (context: any) {
            const total = context.chart.data.datasets.reduce((sum: number, dataset: any) => {
              return sum + (dataset.data[context.dataIndex] || 0);
            }, 0);
            return `Total: ${total} murid`;
          }
        }
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: "bold" as const,
          },
          color: "#6B7280",
        },
      },
      y: {
        stacked: false,
        beginAtZero: true,
        max: 35,
        grid: {
          color: "rgba(243, 244, 246, 0.8)",
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: "normal" as const,
          },
          color: "#9CA3AF",
          padding: 10,
          stepSize: 5,
          callback: function (value: any) {
            return value + ' murid';
          }
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuart" as const,
    }
  };

  return (
    <div style={{ 
      height: "350px", 
      width: "100%",
      padding: "10px 0"
    }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Monthly Line Chart Component - dengan 5 kategori
function MonthlyLineChart({
  data,
}: {
  data: Array<{ month: string; hadir: number; izin: number; tidak_hadir: number; sakit: number; pulang: number }>;
}) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Hadir",
        data: data.map((d) => d.hadir),
        borderColor: COLORS.HADIR,
        backgroundColor: `${COLORS.HADIR}20`,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: COLORS.HADIR,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Izin",
        data: data.map((d) => d.izin),
        borderColor: COLORS.IZIN,
        backgroundColor: `${COLORS.IZIN}20`,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: COLORS.IZIN,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Pulang",
        data: data.map((d) => d.pulang),
        borderColor: COLORS.PULANG,
        backgroundColor: `${COLORS.PULANG}20`,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: COLORS.PULANG,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "alfa",
        data: data.map((d) => d.tidak_hadir),
        borderColor: COLORS.TIDAK_HADIR,
        backgroundColor: `${COLORS.TIDAK_HADIR}20`,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: COLORS.TIDAK_HADIR,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Sakit",
        data: data.map((d) => d.sakit),
        borderColor: COLORS.SAKIT,
        backgroundColor: `${COLORS.SAKIT}20`,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: COLORS.SAKIT,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "#1F2937",
        padding: 12,
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y + ' orang';
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#F3F4F6",
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          padding: 8,
          stepSize: 50,
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
  };

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

function HistoryCard({ start, end }: { start: string; end: string }) {
  // Calculate work duration
  const startTime = new Date(`2024-01-01 ${start}`);
  const endTime = new Date(`2024-01-01 ${end}`);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Check if on time (before 7:30 AM)
  const isOnTime = start <= "07:30:00";
  const statusColor = isOnTime ? "#10B981" : "#F59E0B";
  const statusText = isOnTime ? "Tepat Waktu" : "Terlambat";
  const statusIcon = isOnTime ? "✓" : "⏱";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Time Range Cards */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <TimeRange label="Mulai" value={start} />
        <TimeRange label="Selesai" value={end} />
      </div>

      {/* Work Duration Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Duration Display */}
        <div
          style={{
            backgroundColor: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
            backgroundImage: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
            borderRadius: "12px",
            padding: "14px 16px",
            border: "1px solid #BAE6FD",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ⏱ Durasi Kerja
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>
              {durationHours}h {durationMinutes}m
            </span>
          </div>
          
          {/* Progress Bar */}
          <div style={{ position: "relative", height: "6px", backgroundColor: "rgba(2, 132, 199, 0.15)", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                backgroundColor: "#0284C7",
                borderRadius: "3px",
                width: `${Math.min((durationHours * 60 + durationMinutes) / 480 * 100, 100)}%`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div style={{ marginTop: "6px", fontSize: "10px", color: "#0369A1", fontWeight: 500 }}>
            Target: 8 jam | Tercapai: {((durationHours * 60 + durationMinutes) / 480 * 100).toFixed(0)}%
          </div>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            backgroundColor: statusColor + "15",
            border: `2px solid ${statusColor}`,
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: statusColor + "30",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            {statusIcon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>Status</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: statusColor }}>
              {statusText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeRange({ label, value }: { label: string; value: string }) {
  const isStart = label === "Mulai";
  const gradientStart = isStart ? "#F0FDF4" : "#FEF3C7";
  const gradientEnd = isStart ? "#DCFCE7" : "#FCD34D";
  const borderColor = isStart ? "#86EFAC" : "#FCD34D";
  const textColor = isStart ? "#15803D" : "#92400E";
  const icon = isStart ? "🕖" : "🏁";

  return (
    <div
      style={{
        flex: 1,
        minWidth: "160px",
        backgroundImage: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
        border: `2px solid ${borderColor}`,
        borderRadius: "14px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.12)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: borderColor,
          opacity: 0.1,
        }}
      />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: "11px", color: textColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          {label}
        </span>
        <span style={{ fontSize: "18px" }}>{icon}</span>
      </div>
      
      <strong style={{ fontSize: "22px", color: textColor, fontWeight: 800, fontFamily: "'Monaco', 'Courier New', monospace" }}>
        {value}
      </strong>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "48px 32px",
        border: "2px dashed #E5E7EB",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
      <h2
        style={{
          fontSize: "20px",
          marginBottom: "8px",
          color: "#111827",
          fontWeight: 700,
        }}
      >
        {title}
      </h2>
      <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>Konten masih dalam pengembangan.</p>
    </div>
  );
}