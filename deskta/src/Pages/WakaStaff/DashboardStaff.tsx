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
import { usePopup } from "../../component/Shared/Popup/PopupProvider";
import { dashboardService } from "../../services/dashboard";
import { STORAGE_BASE_URL } from "../../utils/constants";
import { isCancellation } from "../../utils/errorHelpers";
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
} from "chart.js";
import { Line } from "react-chartjs-2";
import LoadingState from "../../component/Shared/LoadingState";
import ErrorState from "../../component/Shared/ErrorState";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
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
  | "daftar-ketidakhadiran";

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
};

// Dummy data updated for Monthly view (Mon-Fri) with 5 categories sesuai gambar




const statCards = [
  { label: "Tepat Waktu", key: "hadir", color: "#1FA83D" },
  { label: "Terlambat", key: "terlambat", color: "#FFA500" },
  { label: "Izin", key: "izin", color: "#ACA40D" },
  { label: "Sakit", key: "sakit", color: "#520C8F" },
  { label: "Alpha", key: "alpha", color: "#D90000" },
  { label: "Pulang", key: "pulang", color: "#2F85EB" },
];

const historyInfo = {
  date: "Senin, 7 Januari 2026",
  start: "07:00:00",
  end: "15:00:00",
  time: "08:00",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08)",
  border: "1px solid #E5E7EB",
};

// Warna sesuai format revisi
const COLORS = {
  HADIR: "#1FA83D",      // HIJAU - Hadir
  IZIN: "#ACA40D",       // KUNING - Izin
  PULANG: "#2F85EB",     // BIRU - Pulang
  TIDAK_HADIR: "#D90000", // MERAH - Tidak Hadir
  SAKIT: "#520C8F",      // UNGU - Sakit
};

import type { WakaSummary } from "../../types/api";

// ... (existing imports)

export default function DashboardStaff({ user, onLogout }: DashboardStaffProps) {
  const { confirm: popupConfirm } = usePopup();

  const [currentPage, setCurrentPage] = useState<WakaPage>("dashboard");
  const navigate = useNavigate();

  // API data states
  const [wakaSummary, setWakaSummary] = useState<WakaSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... (rest of the component)


  // Fetch dashboard data
  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const wakaStats = await dashboardService.getWakaDashboardSummary({ signal: controller.signal });
        setWakaSummary(wakaStats);
      } catch (err: any) {
        if (!isCancellation(err)) {
          console.error('Error fetching dashboard data:', err);
          setError('Gagal memuat ringkasan data Waka/Staff.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
    // Refresh every minute
    const interval = setInterval(fetchDashboardData, 60000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const [selectedGuru, setSelectedGuru] = useState<string | null>(null);
  const [selectedGuruId, setSelectedGuruId] = useState<string | null>(null);
  const [selectedGuruIdentitas, setSelectedGuruIdentitas] = useState<string | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<string | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [selectedJadwalImage, setSelectedJadwalImage] = useState<string | null>(null);
  const [selectedKelasInfo, setSelectedKelasInfo] = useState<{
    namaKelas: string;
    waliKelas: string;
  } | null>(null);

  const [selectedSiswa, setSelectedSiswa] = useState<{
    name: string;
    identitas: string;
  } | null>(null);

  const handleMenuClick = (page: string, payload?: any) => {
    setCurrentPage(page as WakaPage);

    // Handle payload untuk lihat-kelas
    if (page === "lihat-kelas" && payload) {
      setSelectedKelas(payload.kelas);
      setSelectedKelasId(payload.classId);
      setSelectedJadwalImage(payload.jadwalImage);
    }

    // Handle payload untuk lihat-guru
    if (page === "lihat-guru" && payload) {
      setSelectedGuru(payload.namaGuru);
      setSelectedGuruIdentitas(payload.noIdentitas);
      setSelectedJadwalImage(payload.jadwalImage);
    }

    // Handle payload untuk daftar-ketidakhadiran
    if (page === "daftar-ketidakhadiran" && payload) {
      setSelectedSiswa({
        name: payload.siswaName,
        identitas: payload.siswaIdentitas,
      });
    }
  };

  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

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

  const handleLogout = async () => {
    if (await popupConfirm("Apakah Anda yakin ingin keluar?")) {
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
            noIdentitas={selectedGuruIdentitas || undefined}
            jadwalImage={selectedJadwalImage ? `${STORAGE_BASE_URL}/${selectedJadwalImage}` : undefined}
            onBack={() => handleMenuClick("jadwal-guru")}
          />
        );

      case "lihat-kelas":
        return (
          <DetailKelas
            {...commonProps}
            kelas={selectedKelas || undefined}
            jadwalImage={selectedJadwalImage ? `${STORAGE_BASE_URL}/${selectedJadwalImage}` : undefined}
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
            kelasId={selectedKelasId || undefined}
            onBack={() => handleMenuClick("kehadiran-siswa")}
          />
        );

      case "kehadiran-guru":
        return (
          <KehadiranGuru
            {...commonProps}
            onNavigateToDetail={(guruId: string, guruName: string, noIdentitas?: string) => {
              setSelectedGuruId(guruId);
              setSelectedGuru(guruName);
              setSelectedGuruIdentitas(noIdentitas || null);
              handleMenuClick("detail-kehadiran-guru");
            }}
          />
        );

      case "detail-kehadiran-guru":
        return (
          <DetailKehadiranGuru
            {...commonProps}
            teacherId={selectedGuruId || undefined}
            guruName={selectedGuru || undefined}
            onBack={() => handleMenuClick("kehadiran-guru")}
          />
        );

      case "rekap-kehadiran-siswa":
        return (
          <RekapKehadiranSiswa
            {...commonProps}
            namaKelas={selectedKelasInfo?.namaKelas || "X Mekatronika 1"}
            waliKelas={selectedKelasInfo?.waliKelas || "Ewit Erniyah S.pd"}
            classId={selectedKelasId || undefined}
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

      case "guru-pengganti":
        return (
          <StaffLayout
            pageTitle={PAGE_TITLES[currentPage]}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            user={user}
            onLogout={handleLogout}
          >
            <GuruPenggantiList />
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

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              backgroundColor: "#F9FAFB",
              padding: "4px",
              minHeight: "80vh",
            }}>
              {/* Error Alert replaced by Conditional Rendering */}
              {isLoading && !wakaSummary ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} onRetry={() => window.location.reload()} />
              ) : (
                <>

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
                        subtitle="Rekap keseluruhan"
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
                          gap: "12px",
                        }}
                      >
                        {statCards.filter(item => item.label !== "Pulang").map((item) => (
                          <div
                            key={item.label}
                            style={{
                              border: `1px solid ${item.color}20`,
                              borderRadius: "12px",
                              padding: "16px",
                              textAlign: "center",
                              backgroundColor: `${item.color}10`,
                              transition: "all 0.2s ease",
                              cursor: "default",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#6B7280",
                                fontWeight: 600,
                                marginBottom: "6px",
                              }}
                            >
                              {item.label}
                            </p>
                            <p
                              style={{
                                margin: "0",
                                fontSize: "22px",
                                fontWeight: 700,
                                color: item.color,
                              }}
                            >
                              {wakaSummary?.statistik ? wakaSummary.statistik[item.key] : 0}
                            </p>
                          </div>
                        ))}
                      </div>
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
                      <MonthlyLineChart data={wakaSummary?.trend?.map((t: any) => ({
                        month: t.month || t.label,
                        hadir: t.present !== undefined ? t.present : t.hadir,
                        izin: t.sick_excused !== undefined ? t.sick_excused : t.izin,
                        tidak_hadir: t.absent !== undefined ? t.absent : t.alpha,
                        sakit: t.sick !== undefined ? t.sick : 0,
                        pulang: t.return !== undefined ? t.return : t.terlambat
                      })) || []} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </StaffLayout>
        );
    }
  };

  return renderPage();
}


function GuruPenggantiList() {
  const [loading, setLoading] = useState(true);
  const [absentTeachers, setAbsentTeachers] = useState<any[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAbsentTeachers = async () => {
      try {
        setLoading(true);
        const { dashboardService } = await import("../../services/dashboard");
        const today = new Date().toISOString().split('T')[0];
        const response: any = await dashboardService.getTeachersDailyAttendance({ date: today }, { signal: controller.signal });

        const items = response.items?.data || response.items || [];
        const absent = items.filter((item: any) => (item.status || item.attendance?.status) === 'absent');
        setAbsentTeachers(absent);
      } catch (err: any) {
        if (!isCancellation(err)) {
          console.error("Failed to fetch absent teachers", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAbsentTeachers();
    return () => controller.abort();
  }, []);

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }}>
      <div style={{ marginBottom: "24px", borderBottom: "1px solid #F3F4F6", paddingBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
          Daftar Guru Perlu Pengganti
        </h2>
        <p style={{ color: "#6B7280", fontSize: "14px" }}>
          Berikut adalah daftar guru yang tidak hadir hari ini dan memerlukan guru pengganti.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Memuat daftar guru...</div>
      ) : absentTeachers.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
          Tidak ada guru yang memerlukan pengganti hari ini. Semua guru terjadwal atau sudah hadir.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>Nama Guru</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>NIP</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontSize: "12px", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {absentTeachers.map((item, index) => (
                <tr key={item.teacher?.id || index} style={{ borderBottom: "1px solid #F3F4F6", transition: "background-color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>{item.teacher?.user?.name || item.teacher?.name || "-"}</td>
                  <td style={{ padding: "12px 16px", color: "#4B5563" }}>{item.teacher?.nip || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      backgroundColor: "#FEE2E2",
                      color: "#991B1B",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      Alpha
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <button
                      disabled
                      style={{
                        backgroundColor: "#E5E7EB",
                        color: "#9CA3AF",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        margin: "0 auto"
                      }}
                      title="Fitur ini akan segera hadir"
                    >
                      <span style={{ fontSize: "14px" }}>🔒</span>
                      Segera Hadir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
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
        label: "Tidak Hadir",
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
    </div>
  );
}

function TimeRange({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "160px",
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        backgroundColor: "#F9FAFB",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#3B82F6";
        e.currentTarget.style.backgroundColor = "#F0F9FF";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E5E7EB";
        e.currentTarget.style.backgroundColor = "#F9FAFB";
      }}
    >
      <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <strong style={{ fontSize: "18px", color: "#111827", fontWeight: 700 }}>{value}</strong>
    </div>
  );
}



