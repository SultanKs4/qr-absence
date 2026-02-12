import { type ReactNode, useState, useEffect, useRef } from 'react';
import { storage } from '../../utils/storage';
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from '../Sidebar';
import AWANKIRI from '../../assets/Icon/AWANKIRI.png';
import AwanBawahkanan from '../../assets/Icon/AwanBawahkanan.png';
import LogoSchool from '../../assets/Icon/logo smk.png';
import { useLocalLenis } from '../Shared/SmoothScroll';

interface GuruLayoutProps {
  children: ReactNode;
  pageTitle: string;
  currentPage: string;
  onMenuClick: (page: string) => void;
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
}

export default function GuruLayout({
  children,
  pageTitle,
  currentPage,
  onMenuClick,
  user,
  onLogout,
}: GuruLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => storage.getSidebarState('guru'));

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useLocalLenis(scrollContainerRef);

  useEffect(() => {
    storage.setSidebarState('guru', sidebarOpen);
  }, [sidebarOpen]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* BACKGROUND LAYER - Simple untuk guru */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <img
          src={AWANKIRI}
          alt="Awan Kiri Atas"
          style={{ position: 'absolute', top: 0, left: 0, width: 215, height: 'auto' }}
        />
        <img
          src={AwanBawahkanan}
          alt="Awan Kanan Bawah"
          style={{ position: 'absolute', bottom: 20, right: 20, width: 'auto', height: 'auto' }}
        />
      </div>

      {/* Sidebar */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar
          currentPage={currentPage}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          userRole="guru"
        />
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        {/* Header */}
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
            zIndex: 5,
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
                {user.role}
              </div>
            </div>
            <img
              src={LogoSchool}
              alt="Logo SMK"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                padding: "4px",
                backgroundColor: "white",
              }}
            />
          </div>
        </header>

        {/* Content */}
        <main
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ maxWidth: '100%', width: '100%' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
