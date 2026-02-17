//StaffLayout.tsx
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from 'react';
import Sidebar from '../Sidebar';
import AWANKIRI from '../../assets/Icon/AWANKIRI.png';
import AWANKANAN from '../../assets/Icon/AWANKANAN.png';
import INO from '../../assets/Icon/InoBlue.svg';
import RASI from '../../assets/Icon/RasiRed.svg';
import { useLocalLenis } from '../Shared/SmoothScroll';

interface StaffLayoutProps {
  children: ReactNode;
  pageTitle: string;
  currentPage: string;
  onMenuClick: (page: string) => void;
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
  pageIcon?: React.ReactNode;
}

export default function StaffLayout({
  children,
  pageTitle,
  currentPage,
  onMenuClick,
  user,
  onLogout,
  pageIcon,
}: StaffLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('wakaSidebarOpen');
    return saved ? saved === 'true' : true;
  });

  // ✅ DIUBAH: State untuk logo_sekolah
  const [logoSekolah, setLogoSekolah] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useLocalLenis(scrollContainerRef);

  useEffect(() => {
    localStorage.setItem('wakaSidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // ✅ DIUBAH: Load logo_sekolah dari localStorage
  useEffect(() => {
    const loadLogoSekolah = () => {
      const schoolData = localStorage.getItem('schoolData');
      if (schoolData) {
        try {
          const parsed = JSON.parse(schoolData);
          setLogoSekolah(parsed.logo_sekolah || '');
        } catch (error) {
          console.error('Error loading school data:', error);
        }
      }
    };

    loadLogoSekolah();

    // ✅ DIUBAH: Listen untuk update event dari ProfilSekolah
    const handleUpdate = () => {
      loadLogoSekolah();
    };
    window.addEventListener('schoolDataUpdated', handleUpdate);
    return () => window.removeEventListener('schoolDataUpdated', handleUpdate);
  }, []);

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
          style={{ position: 'absolute', top: 0, left: 0, width: 215 }}
        />
        <img
          src={AWANKANAN}
          alt="Awan Kanan Atas"
          style={{ position: 'absolute', top: 0, right: 0, width: 239 }}
        />
        <img
          src={INO}
          alt="Maskot Kiri"
          style={{ position: 'absolute', bottom: 0, left: 24, width: 210 }}
        />
        <img
          src={RASI}
          alt="Maskot Kanan"
          style={{ position: 'absolute', bottom: 0, right: 0, width: 170 }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar
          currentPage={currentPage}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          userRole="waka"
        />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100%',
        }}
      >
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
              {pageIcon && <div style={{ display: 'flex', alignItems: 'center', color: '#2563EB' }}>{pageIcon}</div>}
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
            {/* ✅ DIUBAH: Hanya tampilkan logo jika logo_sekolah tidak kosong */}
            {logoSekolah && (
              <img
                src={logoSekolah}
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
            )}
          </div>
        </header>

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
          <div style={{ width: '100%', maxWidth: '100%' }}>
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