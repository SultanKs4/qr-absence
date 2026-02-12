import { type ReactNode, useState, useEffect, useRef } from 'react';
import { storage } from '../../utils/storage';
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from '../Sidebar';
import AWANKANAN from '../../assets/Icon/AWANKANAN.png';
import AWANKIRI from '../../assets/Icon/AWANKIRI.png';
import INO from '../../assets/Icon/InoBlue.svg';
import RASI from '../../assets/Icon/RasiRed.svg';
import LogoSchool from '../../assets/Icon/logo smk.png';
import { useLocalLenis } from '../Shared/SmoothScroll';

interface WalikelasLayoutProps {
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

export default function WalikelasLayout({
  children,
  pageTitle,
  currentPage,
  onMenuClick,
  user,
  onLogout,
  hideBackground = false,
}: WalikelasLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => storage.getSidebarState('walikelas'));

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useLocalLenis(scrollContainerRef);

  useEffect(() => {
    storage.setSidebarState('walikelas', sidebarOpen);
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
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* BACKGROUND LAYER GLOBAL - Sama seperti AdminLayout */}
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
              backgroundColor: "#F8FAFC",
            }}
          />

          {/* Awan dan dekorasi - sama seperti AdminLayout */}
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
              opacity: 0.15,
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
              opacity: 0.1,
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
          userRole="wakel"
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
        {/* Header - Sama persis dengan AdminLayout */}
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
            position: "relative",
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
            {pageTitle === "Dashboard" && (
              <p style={{ margin: "4px 0 0 16px", fontSize: "14px", color: "#6B7280" }}>
                Selamat bekerja, {user.name}!
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
                Wali Kelas
              </div>
            </div>
            {/* Logo SMK - Sama seperti AdminLayout */}
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

        {/* Content Area - Diperbarui untuk konsistensi */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "transparent",
          }}
        >
          {/* Main Content Container dengan smooth scroll */}
          <main
            id="main-scroll-container"
            ref={scrollContainerRef}
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
              {/* Animasi untuk transisi halaman */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{
                    position: "relative",
                    zIndex: 5,
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    borderRadius: "12px",
                    padding: "0",
                    width: "100%",
                  }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
