import { Home, BookOpen, Users, GraduationCap, LogOut, Calendar } from 'lucide-react';
import LogoSchool from '../assets/Icon/logo smk.png'; // Added Logo import

interface SidebarProps {
  currentPage: string;
  onMenuClick: (page: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  userRole?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// Menu untuk Admin
const MENU_ITEMS_ADMIN: MenuItem[] = [
  { id: "dashboard", label: "Beranda", icon: <Home size={20} /> },
  { id: "jurusan", label: "Data Konsentrasi keahlian", icon: <BookOpen size={20} /> },
  { id: "kelas", label: "Data Kelas", icon: <Users size={20} /> },
  { id: "siswa", label: "Data Siswa", icon: <GraduationCap size={20} /> },
  { id: "guru", label: "Data Guru", icon: <GraduationCap size={20} /> },
];

// Waka staff
const MENU_ITEMS_WAKA: MenuItem[] = [
  { id: "dashboard", label: "Beranda", icon: <Home size={20} /> },
  { id: "jadwal-kelas", label: "Jadwal Kelas", icon: <Calendar size={20} /> },
  { id: "jadwal-guru", label: "Jadwal Guru", icon: <Calendar size={20} /> },
  { id: "kehadiran-siswa", label: "Kehadiran Siswa", icon: <Users size={20} /> },
  { id: "kehadiran-guru", label: "Kehadiran Guru", icon: <GraduationCap size={20} /> },
];

// siswa
const MENU_ITEMS_SISWA: MenuItem[] = [
  { id: "dashboard", label: "Beranda", icon: <Home size={20} /> },
  { id: "jadwal-anda", label: "Jadwal Anda", icon: <Calendar size={20} /> },
  { id: "absensi", label: "Daftar Ketidakhadiran", icon: <Users size={20} /> },
];

//pengurus kelas
const MENU_ITEMS_PENGURUS_KELAS: MenuItem[] = [
  { id: "dashboard", label: "Beranda", icon: <Home size={20} /> },
  { id: "daftar-mapel", label: "Daftar Mapel", icon: <BookOpen size={20} /> },
  { id: "jadwal-anda", label: "Jadwal Anda", icon: <Calendar size={20} /> },
  { id: "absensi", label: "Daftar Ketidakhadiran", icon: <Users size={20} /> },
];

//wali kelas
const MENU_ITEMS_WALIKELAS: MenuItem[] = [
  { id: "Beranda", label: "Beranda", icon: <Home size={20} /> },
  { id: "jadwal-pengurus", label: "Jadwal Kelas", icon: <Calendar size={20} /> },
];

// Menu untuk Guru
const MENU_ITEMS_GURU: MenuItem[] = [
  { id: "dashboard", label: "Beranda", icon: <Home size={20} /> },
  // { id: "presensi", label: "Presensi", icon: <Calendar size={20} /> },
  { id: "jadwal-anda", label: "Jadwal Anda", icon: <Calendar size={20} /> },
  // { id: "kehadiran", label: "Kehadiran Siswa", icon: <Users size={20} /> },
];

export default function Sidebar({
  currentPage,
  onMenuClick,
  onLogout,
  isOpen,
  onToggle,
  userRole = "admin",
}: SidebarProps) {
  const fonts = "'Plus Jakarta Sans', 'Space Grotesk', system-ui, sans-serif";
  let MENU_ITEMS = MENU_ITEMS_ADMIN;
  let roleLabel = "Admin";

  // select menu berdasarkan role
  if (userRole === "guru") {
    MENU_ITEMS = MENU_ITEMS_GURU;
    roleLabel = "Guru";
  } else if (userRole === "waka") {
    MENU_ITEMS = MENU_ITEMS_WAKA;
    roleLabel = "Waka Staff";
  } else if (userRole === "siswa") {
    MENU_ITEMS = MENU_ITEMS_SISWA;
    roleLabel = "Siswa";
  } else if (userRole === "pengurus_kelas") {
    MENU_ITEMS = MENU_ITEMS_PENGURUS_KELAS;
    roleLabel = "Pengurus Kelas";
  } else if (userRole === "wakel") {
    MENU_ITEMS = MENU_ITEMS_WALIKELAS;
    roleLabel = "Wali Kelas";
  }

  return (
    <aside
      style={{
        width: isOpen ? "270px" : "86px",
        background:
          "linear-gradient(180deg, #0B1221 0%, #0D1424 55%, #0A1020 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        transition: "width 0.25s ease",
        overflow: "hidden",
        boxShadow: "6px 0 20px rgba(2, 6, 23, 0.35)",
        position: "relative",
        zIndex: 50,
        fontFamily: fonts,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120px 360px at 0% 20%, rgba(56, 189, 248, 0.12), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      {/* Header */}
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))",
          minHeight: "72px",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* LOGO ADDITION */}
          {isOpen && (
            <img
              src={LogoSchool}
              alt="Logo"
              style={{ width: "32px", height: "auto" }}
            />
          )}

          <button
            onClick={onToggle}
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              color: "white",
              cursor: "pointer",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              fontSize: "14px",
              transition: "all 0.2s",
              boxShadow: "0 8px 16px rgba(15, 23, 42, 0.35)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.95)";
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.6)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.7)";
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.35)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            title="Toggle Sidebar"
          >
            {isOpen ? "◀" : "▶"}
          </button>

          {isOpen && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "14px", // Adjusted size for better fit with logo
                  fontWeight: 800,
                  color: "#E2E8F0",
                  letterSpacing: "0.3px",
                }}
              >
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {!isOpen && (
          <img
            src={LogoSchool}
            alt="Logo"
            style={{ width: "24px", height: "auto" }}
          />
        )}
      </div>

      {/* Navigation Menu */}
      <nav
        style={{
          flex: 1,
          padding: "22px 12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuClick(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: isOpen ? "12px 14px" : "12px",
              borderRadius: "14px",
              border: "1px solid rgba(148, 163, 184, 0.12)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background:
                currentPage === item.id
                  ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #0EA5E9 100%)"
                  : "rgba(15, 23, 42, 0.35)",
              color: currentPage === item.id ? "white" : "#CBD5F5",
              fontSize: "14px",
              fontWeight: 600,
              textAlign: "left",
              position: "relative",
              overflow: "hidden",
              boxShadow:
                currentPage === item.id
                  ? "0 12px 18px rgba(37, 99, 235, 0.35)"
                  : "none",
            }}
            onMouseEnter={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.7)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.35)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.12)";
              }
            }}
            title={!isOpen ? item.label : undefined}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: currentPage === item.id ? "white" : "#94A3B8",
                background:
                  currentPage === item.id
                    ? "rgba(255, 255, 255, 0.14)"
                    : "rgba(15, 23, 42, 0.35)",
                borderRadius: "10px",
                transition: "color 0.2s",
              }}
            >
              {item.icon}
            </div>

            {isOpen && (
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                  textAlign: "left",
                }}
              >
                {item.label}
              </span>
            )}

            {currentPage === item.id && isOpen && (
              <div style={{
                width: "6px",
                height: "22px",
                backgroundColor: "#7DD3FC",
                borderRadius: "99px",
                marginLeft: "6px",
              }} />
            )}
          </button>
        ))}
      </nav>

      {/* Footer with Logout */}
      <div
        style={{
          padding: "16px 12px",
          borderTop: "1px solid rgba(148, 163, 184, 0.2)",
          background:
            "linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            background:
              "linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95))",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 18px rgba(185, 28, 28, 0.35)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "0 14px 22px rgba(220, 38, 38, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 10px 18px rgba(185, 28, 28, 0.35)";
          }}
          title={!isOpen ? "Keluar" : undefined}
        >
          <div style={{
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "white",
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "10px",
          }}>
            <LogOut size={20} />
          </div>

          {isOpen && (
            <>
              <span style={{ flex: 1, textAlign: "left" }}>Keluar</span>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>⏎</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}