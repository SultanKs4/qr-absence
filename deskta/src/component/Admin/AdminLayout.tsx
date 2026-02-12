import { type ReactNode, useState, useEffect } from "react";
import { storage } from '../../utils/storage';
import Sidebar from "../../component/Sidebar";
import AWANKANAN from "../../assets/Icon/AWANKANAN.png";
import AWANKIRI from "../../assets/Icon/AWANKIRI.png";
import INO from "../../assets/Icon/InoBlue.svg";
import RASI from "../../assets/Icon/RasiRed.svg";
import LogoSchool from "../../assets/Icon/logo smk.png";

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle: string;
  currentPage: string;
  onMenuClick: (page: string) => void;
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
  hideBackground?: boolean;
}

export default function AdminLayout({
  children,
  pageTitle,
  currentPage,
  onMenuClick,
  user,
  onLogout,
  hideBackground = false,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => storage.getSidebarState('admin'));

  useEffect(() => {
    storage.setSidebarState('admin', sidebarOpen);
  }, [sidebarOpen]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#FFFFFF", // Ubah jadi putih solid
        overflow: "hidden",
      }}
    >
      {/* BACKGROUND LAYER GLOBAL */}
      {!hideBackground && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* Background warna dengan opacity rendah */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#F8FAFC", // Warna background lembut
            }}
          />

          {/* Awan dan dekorasi */}
          <img
            src={AWANKIRI}
            alt="Awan Kiri Atas"
            style={{
              position: "absolute",
              top: -20,
              left: -30,
              width: 280,
              height: "auto",
              filter: "brightness(1.1)",
              opacity: 0.15, // Kurangi opacity agar tidak terlalu dominan
            }}
          />
          <img
            src={AWANKANAN}
            alt="Awan Kanan Atas"
            style={{
              position: "absolute",
              top: -30,
              right: -40,
              width: 300,
              height: "auto",
              filter: "brightness(1.1)",
              opacity: 0.15,
            }}
          />
          <img
            src={INO}
            alt="INO"
            style={{
              position: "absolute",
              bottom: -20,
              left: -40,
              width: 260,
              height: "auto",
              opacity: 0.1, // Sangat rendah agar subtle
            }}
          />
          <img
            src={RASI}
            alt="RASI"
            style={{
              position: "absolute",
              bottom: -20,
              right: -30,
              width: 220,
              height: "auto",
              opacity: 0.1,
            }}
          />
        </div>
      )}

      {/* Sidebar */}
      <div style={{ position: "relative", zIndex: 20 }}>
        <Sidebar
          currentPage={currentPage}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          userRole={user.role}
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Header - beri background putih solid */}
        <header
          style={{
            backgroundColor: "white",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            gap: "16px",
            boxShadow: "0 2px 12px rgba(0, 31, 62, 0.08)",
            borderBottom: "1px solid #E5E7EB",
            flexShrink: 0,
            zIndex: 15,
            position: "relative", // Pastikan berada di atas background
          }}
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#001F3E",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "28px",
                  backgroundColor: "#2563EB",
                  borderRadius: "2px",
                }}
              />
              {pageTitle}
            </h1>
            {pageTitle === "Beranda" && (
              <p style={{ margin: "4px 0 0 16px", fontSize: "14px", color: "#6B7280" }}>
                Selamat datang kembali, {user.name}!
              </p>
            )}
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0
          }}>
            <div style={{
              textAlign: "right",
              paddingRight: "16px",
              borderRight: "1px solid #E5E7EB"
            }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#001F3E" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "capitalize" }}>
                {user.role.replace('_', ' ')}
              </div>
            </div>
            <img
              src={LogoSchool}
              alt="Logo SMK"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                padding: "4px",
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
              }}
            />
          </div>
        </header>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "transparent", // Transparan agar background dekorasi terlihat
          }}
        >
          {/* Main Content Container */}
          <main
            style={{
              position: "relative",
              zIndex: 5,
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Content Wrapper dengan background putih */}
            <div
              style={{
                position: "relative",
                zIndex: 5,
                maxWidth: "1400px",
                width: "100%",
                margin: "0 auto",
                flex: 1,
              }}
            >
              {/* Konten utama dengan background putih dan sedikit transparansi */}
              <div
                style={{
                  position: "relative",
                  zIndex: 5,
                  backgroundColor: "rgba(255, 255, 255, 0.7)", // Putih dengan transparansi
                  borderRadius: "12px",
                  padding: "0",
                }}
              >
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}