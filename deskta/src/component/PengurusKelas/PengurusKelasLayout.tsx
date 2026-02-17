//PengurusKelasLayout.tsx
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import Sidebar from "../Sidebar";
import { useLocalLenis } from "../Shared/SmoothScroll";

interface PengurusKelasLayoutProps {
  user: { name: string; phone: string; role?: string };
  currentPage: string;
  onMenuClick: (key: string) => void;
  onLogout: () => void;
  children: ReactNode;
  pageTitle?: string;
}

export default function PengurusKelasLayout({
  user,
  currentPage,
  onMenuClick,
  onLogout,
  children,
  pageTitle = "Dashboard",
}: PengurusKelasLayoutProps) {
  const [isOpen, setOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpenPengurus");
    return saved ? saved === "true" : true;
  });

  // ✅ DIUBAH: State untuk logo_sekolah
  const [logoSekolah, setLogoSekolah] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useLocalLenis(scrollContainerRef);

  useEffect(() => {
    localStorage.setItem("sidebarOpenPengurus", isOpen.toString());
  }, [isOpen]);

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
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#F8FAFC",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* Sidebar */}
      <div style={{ position: "relative", zIndex: 5, flexShrink: 0 }}>
        <Sidebar
          currentPage={currentPage}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
          isOpen={isOpen}
          onToggle={() => setOpen((v) => !v)}
          userRole="pengurus_kelas"
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          height: "100%",
          minHeight: 0,
        }}
      >
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
                {user.role?.replace('_', ' ') || "Siswa"}
              </div>
            </div>
            {/* ✅ DIUBAH: Hanya tampilkan logo jika logo_sekolah tidak kosong */}
            {logoSekolah && (
              <img
                src={logoSekolah}
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
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            height: "100%",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ height: "100%" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}