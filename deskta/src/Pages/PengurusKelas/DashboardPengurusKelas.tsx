import { useMemo, useState, useEffect } from "react";
import PengurusKelasLayout from "../../component/PengurusKelas/PengurusKelasLayout";
import DaftarMapel from "./DaftarMapel";
import TidakHadirPenguruskelas from "./TidakHadirPenguruskelas";
import JadwalPengurus from "./JadwalPengurus";
import { dashboardService } from "../../services/dashboardService";
// import openBook from "../../assets/Icon/open-book.png";
import INO from "../../assets/Icon/INO.png";
import RASI from "../../assets/Icon/RASI.png";
import { Modal } from "../../component/Shared/Modal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { BookOpen } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

type PageType =
  | "Beranda"
  | "daftar-mapel"
  | "absensi"
  | "jadwal-anda"
  | "laporan"
  | "profil";

interface ScheduleItem {
  id: string;
  mapel: string;
  guru: string;
  start: string;
  end: string;
}

interface DashboardPengurusKelasProps {
  user: { 
    name: string; 
    phone: string; 
    role?: string;
    profile?: {
      nis?: string;
      class_name?: string;
    }
  };
  onLogout: () => void;
}

// Mapping ID pengurus kelas ke nama removed - using profile data

// Utility functions removed

// Dummy data removed - fetched from API

export default function DashboardPengurusKelas({
  user,
  onLogout,
}: DashboardPengurusKelasProps) {
  const [currentPage, setCurrentPage] = useState<PageType>("Beranda");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);

  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    pulang: 0,
  });

  // Use data directly from user object (synced in App.tsx)
  const displayName = user.name;
  const displayNISN = user.profile?.nis || user.phone || "0000000000";
  
  const userWithName = {
    name: displayName,
    phone: user.phone,
    role: user.role,
    profile: user.profile
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDate(now.toLocaleDateString("id-ID", options));
      setCurrentTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardService.getClassDashboard();
        if (response) {
          setMonthlyTrendData(response.monthlyTrend || []);
          const ds = response.dailyStats || {};
          setWeeklyStats({
            hadir: ds.hadir || 0,
            izin: ds.izin || 0,
            sakit: ds.sakit || 0,
            alpha: ds.alpha || 0,
            pulang: ds.pulang || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching class dashboard:", error);
      }
    };
    fetchData();
  }, []);

  // Data Dummy 
  const schedules = useMemo<ScheduleItem[]>(
    () => [
      {
        id: "1",
        mapel: "Matematika",
        guru: " Wiwin Winangsih, S.Pd, M.Pd",
        start: "07:00",
        end: "09:40",
      },
      {
        id: "2",
        mapel: "Pendidikan Agama Islam",
        guru: "M Juzki Arif, M.Pd",
        start: "10:00",
        end: "13:00",
      },
      {
        id: "3",
        mapel: "Bahasa Daerah",
        guru: "Moch Bachrudin S.Pd",
        start: "13:00",
        end: "15:00",
      },
      
    ],
    []
  );

  const handleMenuClick = (page: string) => {
    const allowedPages: PageType[] = [
      "Beranda",
      "daftar-mapel",
      "absensi",
      "jadwal-anda",
      "laporan",
      "profil",
    ];
    if (allowedPages.includes(page as PageType)) {
      setCurrentPage(page as PageType);
      return;
    }
    setCurrentPage("Beranda");
  };

  // Dummy user info
  const userInfo = {
    name: displayName,
    id: displayNISN,
  };

  return (
    <PengurusKelasLayout
      pageTitle={
        currentPage === "daftar-mapel"
          ? "Daftar Mapel"
          : currentPage === "absensi"
            ? "Daftar Ketidakhadiran"
            : currentPage === "jadwal-anda"
              ? "Jadwal Anda"
              : "Beranda"
      }
      currentPage={currentPage}
      onMenuClick={handleMenuClick}
      user={userWithName}
      onLogout={onLogout}
    >
      {currentPage === "daftar-mapel" ? (
        <DaftarMapel />
      ) : currentPage === "absensi" ? (
        <TidakHadirPenguruskelas />
      ) : currentPage === "jadwal-anda" ? (
        <JadwalPengurus
          user={userWithName}
          currentPage={currentPage}
          onMenuClick={handleMenuClick}
          onLogout={onLogout}
        />
      ) : (
        <>
          <div
            style={{
              width: "100%",
              maxWidth: "1400px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              position: "relative",
              paddingBottom: "100px",
            }}
          >
            {/* Header Cards: User Info, Schedule, Total Mapel */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
                width: "100%",
              }}
            >
              {/* User Information Card - Dark Blue */}
              <div
                style={{
                  background: "#0B2948",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 4px 12px rgba(11, 41, 72, 0.2)",
                  border: "1px solid #0B2948",
                  minHeight: "120px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                {/* Person Icon */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ filter: "brightness(0) invert(1)" }}
                  >
                    <path
                      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                      fill="white"
                    />
                  </svg>
                </div>

                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "#FFFFFF",
                      marginBottom: "4px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {userInfo.name}
                  </div>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {userInfo.id}
                  </div>
                </div>
              </div>

              {/* Card Tanggal & Waktu */}
              <div
                style={{
                  background: "#F1F5F9",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                  border: "1px solid #E2E8F0",
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "#0F172A",
                      lineHeight: "1.4",
                    }}
                  >
                    {currentDate || "Memuat..."}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "18px",
                      color: "#0B2948",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentTime || "00:00"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <TimePill label="07:00:00" />
                  <span style={{ fontWeight: 700, color: "#64748B" }}>—</span>
                  <TimePill label="15:00:00" />
                </div>
              </div>

              {/* Card Total Mapel & Tombol Lihat */}
              <div
                style={{
                  background: "#F1F5F9",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                  border: "1px solid #E2E8F0",
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#0F172A",
                    marginBottom: "8px",
                  }}
                >
                  Total Mata Pelajaran Hari Ini
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "8px 24px",
                    borderRadius: "12px",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    fontWeight: 800,
                    fontSize: "20px",
                    color: "#0B2948",
                    marginBottom: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  {schedules.length} Mapel
                </div>
                <button
                  onClick={() => setIsMapelModalOpen(true)}
                  style={{
                    background: "#0F52BA",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 20px",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#0A3E8F")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#0F52BA")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Lihat Mapel
                </button>
              </div>
            </div>

            {/* Statistik Kehadiran Header */}
            <div
              style={{
                background: "#0B2948",
                color: "#fff",
                borderRadius: "12px",
                padding: "16px 24px",
                fontWeight: 800,
                fontSize: "18px",
                boxShadow: "0 4px 12px rgba(11, 41, 72, 0.2)",
                width: "fit-content",
              }}
            >
              Statistik Kehadiran
            </div>

            {/* Charts Grid - DIPERBARUI DENGAN LINE CHART */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "24px",
                width: "100%",
                zIndex: 2,
              }}
            >
              {/* Grafik Kehadiran Bulanan - LINE CHART BARU */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                  border: "1px solid #E2E8F0",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  Grafik Kehadiran Bulanan
                </h3>
                <MonthlyLineChart data={monthlyTrendData} />
              </div>

              {/* Statistik Minggu Ini */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                  border: "1px solid #E2E8F0",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  Statistik Minggu Ini
                </h3>
                <WeeklyDonutChart data={weeklyStats} />
              </div>
            </div>

            {/* Character Illustrations */}
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                width: "200px",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <img src={INO} alt="Ino" style={{ width: "100%", height: "auto" }} />
            </div>
            <div
              style={{
                position: "fixed",
                bottom: 0,
                right: 0,
                width: "200px",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <img src={RASI} alt="Rasi" style={{ width: "100%", height: "auto" }} />
            </div>
          </div>

          {/* Modal Lihat Mapel */}
          <MapelListModal
            isOpen={isMapelModalOpen}
            onClose={() => setIsMapelModalOpen(false)}
            schedules={schedules}
          />
        </>
      )}
    </PengurusKelasLayout>
  );
}

// Sub-components

function TimePill({ label }: { label: string }) {
  return (
    <div
      style={{
        minWidth: "110px",
        padding: "10px 14px",
        borderRadius: "12px",
        border: "1px solid #CBD5E1",
        background: "#fff",
        boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
        textAlign: "center",
        fontWeight: 800,
        fontSize: "14px",
        color: "#0F172A",
      }}
    >
      {label}
    </div>
  );
}

// LINE CHART BARU - DENGAN WARNA REVISI
function MonthlyLineChart({
  data,
}: {
  data: Array<{ month: string; hadir: number; izin: number; sakit: number; alpha: number; pulang: number }>;
}) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Hadir",
        data: data.map((d) => d.hadir),
        borderColor: "#1FA83D", // HIJAU - Hadir
        backgroundColor: "rgba(31, 168, 61, 0.1)",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#1FA83D",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Izin",
        data: data.map((d) => d.izin),
        borderColor: "#ACA40D", // KUNING - Izin
        backgroundColor: "rgba(172, 164, 13, 0.1)",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#ACA40D",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Sakit",
        data: data.map((d) => d.sakit),
        borderColor: "#520C8F", // UNGU - Sakit
        backgroundColor: "rgba(82, 12, 143, 0.1)",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#520C8F",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Alfa",
        data: data.map((d) => d.alpha),
        borderColor: "#D90000", // MERAH - Alfa
        backgroundColor: "rgba(217, 0, 0, 0.1)",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#D90000",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Pulang",
        data: data.map((d) => d.pulang),
        borderColor: "#2F85EB", // BIRU - Pulang
        backgroundColor: "rgba(47, 133, 235, 0.1)",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#2F85EB",
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
          label: function(context: any) {
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
          stepSize: 10,
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

// Weekly Donut Chart Component - DENGAN WARNA REVISI
function WeeklyDonutChart({
  data,
}: {
  data: { hadir: number; izin: number; sakit: number; alpha: number; pulang: number };
}) {
  const chartData = {
    labels: ["Hadir", "Izin", "Sakit", "Alfa", "Pulang"],
    datasets: [
      {
        data: [data.hadir, data.izin, data.sakit, data.alpha, data.pulang],
        backgroundColor: [
          "#1FA83D", // HIJAU - Hadir
          "#ACA40D", // KUNING - Izin
          "#520C8F", // UNGU - Sakit
          "#D90000", // MERAH - Alfa
          "#2F85EB"  // BIRU - Pulang
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 20,
          font: {
            size: 13,
            family: "'Inter', sans-serif",
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((value / total) * 100);

                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: style.backgroundColor,
                  strokeStyle: style.borderColor,
                  lineWidth: style.borderWidth,
                  hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                  index: i
                };
              });
            }
            return [];
          }
        },
      },
    },
  };

  return (
    <div style={{ height: "250px", width: "100%", display: "flex", justifyContent: "center" }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

function MapelListModal({
  isOpen,
  onClose,
  schedules,
}: {
  isOpen: boolean;
  onClose: () => void;
  schedules: ScheduleItem[];
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        style={{
          border: "2px solid #0F52BA",
          borderRadius: "16px",
          overflow: "hidden",
          width: "100%",
          maxWidth: "500px",
          background: "white",
        }}
      >
        <div
          style={{
            backgroundColor: "#0B2948",
            color: "white",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <BookOpen size={24} color="white" />
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
              Jadwal Pelajaran Hari Ini
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {schedules.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      color: "#0F172A",
                      fontSize: "15px",
                    }}
                  >
                    {item.mapel}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748B" }}>
                    {item.guru}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#0F52BA",
                    fontSize: "14px",
                    background: "#E0F2FE",
                    padding: "4px 12px",
                    borderRadius: "20px",
                  }}
                >
                  {item.start} - {item.end}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#0B2948",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}