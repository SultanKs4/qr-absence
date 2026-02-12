import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GuruLayout from "../../component/Guru/GuruLayout";
import DetailJadwalGuru from "./DetailJadwalGuru";
import InputAbsenGuru from "./InputManualGuru";
import KehadiranSiswaGuru from "./KehadiranSiswaGuru";
import BookIcon from "../../assets/Icon/open-book.png";
import EyeIcon from "../../assets/Icon/Eye.png";
import QRCodeIcon from "../../assets/Icon/qr_code.png";
import { JadwalModal } from "../../component/Shared/Form/Jadwal";
import { MetodeGuru } from "../../component/Shared/Form/MetodeGuru";
import { TidakBisaMengajar } from "../../component/Shared/Form/TidakBisaMengajar";
import { usePopup } from "../../component/Shared/Popup/PopupProvider";
import QRScanner from "../../component/Shared/QRScanner";
import { isCancellation } from "../../utils/errorHelpers";


// Icon Components
function CalendarIconSVG() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIconSVG() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ==================== INTERFACES ====================
interface DashboardGuruProps {
  user: { name: string; role: string };
  onLogout: () => void;
}

type GuruPage =
  | "dashboard"
  | "jadwal"
  | "jadwal-anda"
  | "presensi"
  | "kehadiran"
  | "input-manual"
  | "notifikasi"
  | "pengaturan";

type ModalType = "schedule" | "metode" | "tidakBisa" | null;

interface ScheduleItem {
  id: string;
  subject: string;
  className: string;
  jurusan?: string;
  jam?: string;
}

const PAGE_TITLES: Record<GuruPage, string> = {
  dashboard: "Beranda",
  jadwal: "Kehadiran Siswa",
  "jadwal-anda": "Jadwal Kelas",
  presensi: "Scan QR",
  kehadiran: "Kehadiran Siswa",
  "input-manual": "Input Manual",
  notifikasi: "Notifikasi",
  pengaturan: "Pengaturan",
};

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1400,
};

const formatScheduleFromAPI = (schedule: any): ScheduleItem => {
  // Fix: API returns start_time/end_time directly, not in time_slot
  const startTime = schedule.start_time?.substring(0, 5) || '00:00';
  const endTime = schedule.end_time?.substring(0, 5) || '00:00';

  // Create a slot label based on time or fallback
  const jamLabel = `${startTime} - ${endTime}`;

  return {
    id: schedule.id.toString(),
    subject: schedule.subject_name || schedule.title || 'Mata Pelajaran',
    className: schedule.class?.name || 'Kelas',
    jurusan: schedule.class?.major?.name || schedule.class?.name || '',
    jam: jamLabel,
  };
};

// ==================== STYLES ==================== //
const styles = {
  // Container Styles
  mainContainer: (isMobile: boolean) => ({
    position: "relative" as const,
    zIndex: 2,
    display: "flex",
    flexDirection: "column" as const,
    gap: 24,
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: isMobile ? "12px" : "16px",
  }),

  topGrid: (isMobile: boolean) => ({
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
    width: "100%",
    alignItems: "stretch",
  }),

  scheduleGrid: (isMobile: boolean) => ({
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    padding: "16px 0",
    alignItems: "center",
    width: isMobile ? "100%" : "75%",
    margin: "0 auto",
  }),

  // Card  Stylingnya //

  // User Info Card
  userCard: (isMobile: boolean) => ({
    backgroundColor: "#0B2948",
    borderRadius: 16,
    padding: isMobile ? "20px" : "24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 4px 12px rgba(11, 41, 72, 0.2)",
    position: "relative" as const,
    overflow: "hidden" as const,
    minHeight: isMobile ? "auto" : "120px",
  }),

  decorativeCircle: {
    position: "absolute" as const,
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    zIndex: 0,
  },

  userIcon: (isMobile: boolean) => ({
    width: isMobile ? "48px" : "56px",
    height: isMobile ? "48px" : "56px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative" as const,
    zIndex: 1,
  }),

  // Date & Time Card
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  totalMengajarCard: (isMobile: boolean) => ({
    backgroundColor: "#0B2948",
    borderRadius: 16,
    padding: isMobile ? "20px" : "24px",
    boxShadow: "0 4px 12px rgba(11, 41, 72, 0.2)",
    border: "1px solid #0B2948",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    minHeight: isMobile ? "auto" : "120px",
    color: "#FFFFFF",
  }),

  totalBadge: (isMobile: boolean) => ({
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: "12px 20px",
    fontSize: isMobile ? "16px" : "18px",
    fontWeight: 700,
    color: "#0B2948",
    textAlign: "center" as const,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  }),

  titleSection: (isMobile: boolean) => ({
    width: isMobile ? "100%" : "75%",
    backgroundColor: "#0B2948",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: isMobile ? "12px 16px" : "14px 20px",
    fontSize: isMobile ? "16px" : "18px",
    fontWeight: 800,
    margin: "0 auto",
    marginBottom: 0,
    boxShadow: "0 6px 16px rgba(11, 41, 72, 0.35)",
    textAlign: "center" as const,
  }),

  scheduleCard: (isMobile: boolean) => ({
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: isMobile ? "16px" : "18px 24px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    border: "1px solid #D1D5DB",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    position: "relative" as const,
    transition: "all 0.2s ease",
    cursor: "default",
    width: "100%",
    maxWidth: "100%",
  }),

  bookIconWrapper: (isMobile: boolean) => ({
    width: isMobile ? "40px" : "44px",
    height: isMobile ? "40px" : "44px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
  }),

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #E5E7EB",
  },

  // Coming Soon
  comingSoon: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "48px 24px",
    textAlign: "center" as const,
  },
};

// ==================== MAIN COMPONENT ====================
export default function DashboardGuru({ user, onLogout }: DashboardGuruProps) {
  const { alert: popupAlert, confirm: popupConfirm } = usePopup();
  // ========== STATE ==========
  const [currentPage, setCurrentPage] = useState<GuruPage>("dashboard");
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(
    null
  );

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < BREAKPOINTS.mobile
  );
  const navigate = useNavigate();

  const [currentDateStr, setCurrentDateStr] = useState("");
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [iconStates, setIconStates] = useState<Record<string, "qr" | "eye">>({});

  // API Data State
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);


  // ========== EFFECTS ==========
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDateStr(now.toLocaleDateString("id-ID", options));
      setCurrentTimeStr(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    const handleResize = () =>
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile);
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ========== FETCH SCHEDULES ==========
  useEffect(() => {
    const controller = new AbortController();
    const fetchSchedules = async () => {
      try {
        setIsLoadingSchedules(true);
        setError(null);
        const { dashboardService } = await import('../../services/dashboard');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const data = await dashboardService.getTeacherSchedules(
          { date: today },
          { signal: controller.signal }
        );
        const formattedSchedules = data.map(formatScheduleFromAPI);
        setSchedules(formattedSchedules);
      } catch (error: any) {
        if (!isCancellation(error)) {
          console.error('Failed to fetch schedules:', error);
          setError('Gagal memuat jadwal mengajar hari ini.');
        }
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
    return () => controller.abort();
  }, []);

  // ========== NAVIGATION HANDLERS ==========
  const handleMenuClick = (page: string) => setCurrentPage(page as GuruPage);

  const handleLogoutClick = async () => {
    if (await popupConfirm("Apakah Anda yakin ingin keluar?")) {
      onLogout();
      navigate("/");
    }
  };

  // ========== SCHEDULE HANDLERS ==========


  const handleActionClick = (e: React.MouseEvent, schedule: ScheduleItem) => {
    e.stopPropagation();
    const currentState = iconStates[schedule.id] || "qr";

    if (currentState === "qr") {
      // First click: Change to Eye and open QR Modal
      setIconStates((prev) => ({ ...prev, [schedule.id]: "eye" }));
      setSelectedSchedule(schedule);
      setActiveModal("metode");
    } else {
      // Second click: Change back to QR and navigate to Jadwal
      setIconStates((prev) => ({ ...prev, [schedule.id]: "qr" }));
      setCurrentPage("jadwal");
      setSelectedSchedule(schedule);
    }
  };

  // ========== MODAL HANDLERS ==========
  const handleMulaiAbsen = () => {
    setActiveModal(null);
    setCurrentPage("input-manual");
  };

  const handleTidakBisaMengajar = () => {
    setActiveModal("tidakBisa");
  };

  const handlePilihMetodeDariTidakBisaMengajar = () => {
    setActiveModal("metode");
  };

  const handlePilihQR = () => {
    setActiveModal("schedule");
  };

  /*
  const handlePilihManual = () => {
    setActiveModal(null);
    setCurrentPage("input-manual");
  };
  */

  // ========== SCAN LOGIC ==========
  const handleScanResult = async (result: string) => {
    console.log("Scanned:", result);
    // Call API to record attendance
    try {
      const { dashboardService } = await import('../../services/dashboard');
      // result is the token
      const response = await dashboardService.scanAttendance(result);

      setScanResult(`Berhasil: ${response.student?.user?.name || 'Siswa'} - ${response.status}`);
      await popupAlert(`✅ Absensi Berhasil!\nSiswa: ${response.student?.user?.name}\nStatus: ${response.status}`);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Gagal memproses QR Code";
      setScanResult(`Gagal: ${msg}`);
      await popupAlert(`❌ Gagal: ${msg}`);
    }
  };

  const handleSubmitTidakBisaMengajar = async (data: {
    alasan: string;
    keterangan?: string;
    foto1?: File;
  }) => {
    console.log("Data tidak bisa mengajar:", data);
    await popupAlert(
      `Laporan berhasil dikirim!\nAlasan: ${data.alasan}\nKeterangan: ${data.keterangan || "-"
      }\nFoto: ${data.foto1 ? "Ada" : "Tidak ada"}`
    );
    setActiveModal(null);
  };

  // ========== DATA ==========

  // ========== RENDER PAGES ==========
  const renderPage = () => {
    switch (currentPage) {
      case "jadwal":
        return (
          <KehadiranSiswaGuru
            user={user}
            onLogout={handleLogoutClick}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
          />
        );
      case "presensi":
        return (
          <GuruLayout
            pageTitle="Scan QR"
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            user={user}
            onLogout={handleLogoutClick}
          >
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>
                  Scan QR Code Siswa
                </h2>
                <p style={{ color: '#6B7280', marginTop: '8px' }}>
                  Arahkan kamera ke QR Code kartu pelajar siswa untuk mencatat kehadiran
                </p>
              </div>

              <QRScanner
                isActive={currentPage === 'presensi'}
                onScan={handleScanResult}
                onError={(err) => console.error(err)}
              />

              {scanResult && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#065F46', fontWeight: 'bold' }}>
                    Scan Berhasil!
                  </p>
                  <p style={{ color: '#047857', marginTop: '4px' }}>
                    {scanResult}
                  </p>
                  <button
                    onClick={() => setScanResult(null)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Scan Lagi
                  </button>
                </div>
              )}
            </div>
          </GuruLayout>
        );
      case "input-manual":
        return (
          <InputAbsenGuru
            user={user}
            onLogout={handleLogoutClick}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            schedule={selectedSchedule}
          />
        );
      case "jadwal-anda":
        return (
          <DetailJadwalGuru
            user={user}
            onLogout={handleLogoutClick}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
          />
        );
      case "kehadiran":
        return (
          <KehadiranSiswaGuru
            user={user}
            onLogout={handleLogoutClick}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
          />
        );
      case "notifikasi":
      case "pengaturan":
        return (
          <GuruLayout
            pageTitle={PAGE_TITLES[currentPage]}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            user={user}
            onLogout={handleLogoutClick}
          >
            <div style={styles.comingSoon}>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1F2937",
                  marginBottom: "8px",
                }}
              >
                Coming Soon
              </h2>
              <p style={{ color: "#6B7280", fontSize: "16px" }}>
                Fitur {PAGE_TITLES[currentPage]} sedang dalam pengembangan
              </p>
            </div>
          </GuruLayout>
        );
      case "dashboard":
      default:
        return (
          <GuruLayout
            pageTitle="Beranda"
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            user={user}
            onLogout={handleLogoutClick}
          >
            <div style={styles.mainContainer(isMobile)}>
              {/* ========== TOP SECTION ========== */}
              {error && (
                <div style={{
                  padding: "16px 20px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FEE2E2",
                  borderRadius: "12px",
                  color: "#B91C1C",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%"
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              <div style={styles.topGrid(isMobile)}>
                {/* User Info Card */}
                <div style={styles.userCard(isMobile)}>
                  <div style={styles.decorativeCircle} />
                  <div style={styles.userIcon(isMobile)}>
                    <svg
                      width={isMobile ? "28" : "32"}
                      height={isMobile ? "28" : "32"}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? "16px" : "18px",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.name || "Guru"}
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? "13px" : "14px",
                        color: "rgba(255, 255, 255, 0.85)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {/* @ts-ignore */}
                      {user.code || user.nip || user.id || "-"}
                    </div>
                  </div>
                </div>

                {/* Date & Time Card - Same as Siswa */}
                <div
                  style={{
                    background: "#0B2948",
                    borderRadius: "16px",
                    padding: isMobile ? "20px" : "24px",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(11, 41, 72, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "12px",
                    minHeight: isMobile ? "auto" : "120px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ opacity: 0.8 }}>
                      <CalendarIconSVG />
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: "600" }}>
                      {currentDateStr || "Memuat..."}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ opacity: 0.8 }}>
                      <ClockIconSVG />
                    </div>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        letterSpacing: "1px",
                      }}
                    >
                      {currentTimeStr || "00:00:00"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: 0.9,
                    }}
                  >
                    Semester Genap
                  </div>
                </div>

                {/* Total Mengajar Card */}
                <div style={styles.totalMengajarCard(isMobile)}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={styles.iconWrapper}>
                      <img
                        src={BookIcon}
                        alt="Book"
                        style={{
                          width: 20,
                          height: 20,
                          filter: "brightness(0) invert(1)"
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? "13px" : "14px",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        flex: 1,
                      }}
                    >
                      Total Mengajar Hari Ini
                    </div>
                  </div>
                  <div style={styles.totalBadge(isMobile)}>
                    {isLoadingSchedules ? 'Memuat...' : `${schedules.length} Kelas`}
                  </div>
                </div>
              </div>


              {/* ========== JADWAL TITLE ========== */}
              <div style={styles.titleSection(isMobile)}>Jadwal Hari Ini</div>

              {/* ========== SCHEDULE GRID ========== */}
              <div style={styles.scheduleGrid(isMobile)}>
                {isLoadingSchedules ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    Memuat jadwal...
                  </div>
                ) : schedules.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    Tidak ada jadwal hari ini
                  </div>
                ) : (
                  schedules.map((schedule) => {
                    const jamParts = schedule.jam?.split("(") || [];
                    const jamKe = jamParts[0]?.trim() || schedule.jam;
                    const jamWaktu = jamParts.length > 1 ? `(${jamParts[1]}` : "";

                    return (
                      <div
                        key={schedule.id}
                        style={styles.scheduleCard(isMobile)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 6px 14px rgba(0, 0, 0, 0.15)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.backgroundColor = "#F9FAFB";
                          e.currentTarget.style.borderColor = "#9CA3AF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 2px 8px rgba(0, 0, 0, 0.08)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#D1D5DB";
                        }}
                      >
                        {/* Icon Buku */}
                        <div style={styles.bookIconWrapper(isMobile)}>
                          <img
                            src={BookIcon}
                            alt="Book"
                            style={{
                              width: isMobile ? "18px" : "20px",
                              height: isMobile ? "18px" : "20px",
                              objectFit: "contain",
                              filter: "brightness(0) invert(1)",
                            }}
                          />
                        </div>

                        {/* Mata Pelajaran & Jam */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: isMobile ? "15px" : "16px",
                              fontWeight: 700,
                              color: "#111827",
                              marginBottom: 4,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {schedule.subject}
                          </div>
                          <div
                            style={{
                              fontSize: isMobile ? "12px" : "13px",
                              color: "#6B7280",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            Jam ke {jamKe}
                          </div>
                        </div>

                        {/* Kelas & Waktu */}
                        <div
                          style={{
                            flex: 1,
                            textAlign: "left",
                            paddingLeft: "24px",
                            display: isMobile ? "none" : "block",
                          }}
                        >
                          <div
                            style={{
                              fontSize: isMobile ? "14px" : "15px",
                              fontWeight: 700,
                              color: "#111827",
                              marginBottom: 4,
                            }}
                          >
                            {schedule.className}
                          </div>
                          <div
                            style={{
                              fontSize: isMobile ? "12px" : "13px",
                              color: "#6B7280",
                              fontWeight: 500,
                            }}
                          >
                            {jamWaktu}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {/* Toggle Button */}
                          <div
                            onClick={(e) => handleActionClick(e, schedule)}
                            style={styles.actionButton}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#E5E7EB";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#F3F4F6";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            <img
                              src={
                                (iconStates[schedule.id] || "qr") === "qr"
                                  ? QRCodeIcon
                                  : EyeIcon
                              }
                              alt="Action"
                              style={{ width: 18, height: 18 }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ========== MODALS ========== */}

            <JadwalModal
              isOpen={activeModal === "schedule"}
              onClose={() => setActiveModal(null)}
              data={
                selectedSchedule
                  ? {
                    subject: selectedSchedule.subject,
                    className: selectedSchedule.className,
                    jurusan: selectedSchedule.jurusan,
                    jam: selectedSchedule.jam,
                    statusGuru: "Hadir",
                  }
                  : null
              }
              onMulaiAbsen={handleMulaiAbsen}
              onTidakBisaMengajar={handleTidakBisaMengajar}
            />

            <MetodeGuru
              isOpen={activeModal === "metode"}
              onClose={() => {
                setActiveModal(null);
                setCurrentPage("input-manual");
              }}
              onPilihQR={handlePilihQR}
              onTidakBisaMengajar={handlePilihMetodeDariTidakBisaMengajar}
              scheduleId={selectedSchedule?.id}
            />

            <TidakBisaMengajar
              isOpen={activeModal === "tidakBisa"}
              onClose={() => setActiveModal(null)}
              data={
                selectedSchedule
                  ? {
                    subject: selectedSchedule.subject,
                    className: selectedSchedule.className,
                    jurusan: selectedSchedule.jurusan,
                    jam: selectedSchedule.jam,
                  }
                  : null
              }
              onSubmit={handleSubmitTidakBisaMengajar}
              onPilihMetode={handlePilihMetodeDariTidakBisaMengajar}
            />
          </GuruLayout>
        );
    }
  };

  return renderPage();
}

