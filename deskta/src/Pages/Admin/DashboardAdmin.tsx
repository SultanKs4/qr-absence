import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../component/Admin/AdminLayout";
import JurusanAdmin from "./JurusanAdmin";
import KelasAdmin from "./KelasAdmin";
import GuruAdmin from "./GuruAdmin";
import SiswaAdmin from "./SiswaAdmin";
import DetailSiswa from "./DetailSiswa";
import DetailGuru from "./DetailGuru";
import ProfilSekolah from "./ProfilSekolah";

import { dashboardService } from "../../services/dashboardService";

interface User {
  role: string;
  name: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminPage =
  | "dashboard"
  | "jurusan"
  | "kelas"
  | "siswa"
  | "guru"
  | "notifikasi"
  | "pengaturan"
  | "detail-siswa"
  | "detail-guru"
  | "profil-sekolah";  

export default function AdminDashboard({
  user,
  onLogout,
}: AdminDashboardProps) {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");
  const navigate = useNavigate();
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [selectedGuruId, setSelectedGuruId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [semester, setSemester] = useState("Semester Genap");
  const [stats, setStats] = useState({
    classes_count: 0,
    students_count: 0,
    teachers_count: 0,
    rooms_count: 0
  });

  const updateDateTime = () => {
    const now = new Date();

    setCurrentDate(
      now.toLocaleDateString("id-ID", {
        weekday: "long",    
        day: "numeric",     
        month: "long",      
        year: "numeric",    
      })
    );

    setCurrentTime(
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    );
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getAdminSummary();
        if (data) {
          setStats({
            classes_count: data.classes_count || 0,
            students_count: data.students_count || 0,
            teachers_count: data.teachers_count || 0,
            rooms_count: data.rooms_count || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    fetchStats();
    updateDateTime(); 
    const interval = setInterval(updateDateTime, 1000); 
    
    const month = new Date().getMonth();
    if (month >= 0 && month <= 5) {
      setSemester("Semester Genap");
    } else {
      setSemester("Semester Ganjil");
    }
    
    return () => clearInterval(interval); 
  }, []);

  const handleMenuClick = (page: string) => {
    setCurrentPage(page as AdminPage);
  };

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
      default:
        return (
          <AdminLayout
            pageTitle="Beranda"
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            user={user}
            onLogout={handleLogout}
            hideBackground={false}
          >
            <div
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "0 4px",
                position: "relative",
                minHeight: "calc(100vh - 100px)",
              }}
            >
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    marginBottom: "32px",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #001F3E 0%, #0C4A6E 100%)",
                      borderRadius: "16px",
                      padding: "28px 32px",
                      boxShadow: "0 8px 32px rgba(0, 31, 62, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "white",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "white",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Selamat Datang di Beranda, Admin
                      </h2>
                      <p
                        style={{
                          fontSize: "16px",
                          color: "rgba(255, 255, 255, 0.9)",
                          margin: "0",
                          maxWidth: "600px",
                        }}
                      >
                        Kelola data sekolah, pantau aktivitas, dan lihat statistik secara langsung.
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "8px",
                      }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.9)",
                            fontWeight: "600",
                          }}
                        >
                          {currentDate}
                        </div>
                        <div
                          style={{
                            fontSize: "28px",
                            color: "white",
                            fontWeight: "700",
                            letterSpacing: "1px",
                          }}
                        >
                          {currentTime}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: "500",
                            marginTop: "4px",
                          }}
                        >
                          {semester}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: "32px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#001F3E",
                      margin: "0 0 20px 20px",
                    }}
                  >
                    Statistik Sekolah
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "24px",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(135deg, #001F3E 0%, #0C4A6E 100%)",
                        borderRadius: "16px",
                        padding: "28px",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 8px 24px rgba(0, 31, 62, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow = "0 16px 32px rgba(0, 31, 62, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 31, 62, 0.3)";
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "-20px",
                          right: "-20px",
                          width: "80px",
                          height: "80px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "50%",
                        }}
                      />
                      
                      <div
                        style={{
                          fontSize: "42px",
                          fontWeight: 800,
                          lineHeight: 1.2,
                          color: "white",
                          marginBottom: "8px",
                          textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {stats.classes_count}
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          color: "rgba(255, 255, 255, 0.9)",
                          fontWeight: "600",
                          marginBottom: "12px",
                        }}
                      >
                        Total Rombel
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          🏫
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.9)",
                            fontWeight: "bold",
                          }}
                        >
                          Rombongan Belajar
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "linear-gradient(135deg, #001F3E 0%, #0C4A6E 100%)",
                        borderRadius: "16px",
                        padding: "28px",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 8px 24px rgba(0, 31, 62, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow = "0 16px 32px rgba(0, 31, 62, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 31, 62, 0.3)";
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "-20px",
                          right: "-20px",
                          width: "80px",
                          height: "80px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "50%",
                        }}
                      />
                      
                      <div
                        style={{
                          fontSize: "42px",
                          fontWeight: 800,
                          lineHeight: 1.2,
                          color: "white",
                          marginBottom: "8px",
                          textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {stats.students_count}
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          color: "rgba(255, 255, 255, 0.9)",
                          fontWeight: "600",
                          marginBottom: "12px",
                        }}
                      >
                        Total Murid
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          👨‍🎓
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.9)",
                            fontWeight: "bold",
                          }}
                        >
                          Siswa Aktif
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "linear-gradient(135deg, #001F3E 0%, #0C4A6E 100%)",
                        borderRadius: "16px",
                        padding: "28px",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 8px 24px rgba(0, 31, 62, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow = "0 16px 32px rgba(0, 31, 62, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 31, 62, 0.3)";
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "-20px",
                          right: "-20px",
                          width: "80px",
                          height: "80px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "50%",
                        }}
                      />
                      
                      <div
                        style={{
                          fontSize: "42px",
                          fontWeight: 800,
                          lineHeight: 1.2,
                          color: "white",
                          marginBottom: "8px",
                          textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {stats.teachers_count}
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          color: "rgba(255, 255, 255, 0.9)",
                          fontWeight: "600",
                          marginBottom: "12px",
                        }}
                      >
                        Total Guru
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          👨‍🏫
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.9)",
                            fontWeight: "bold",
                          }}
                        >
                          Tenaga Pendidik
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "linear-gradient(135deg, #001F3E 0%, #0C4A6E 100%)",
                        borderRadius: "16px",
                        padding: "28px",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 8px 24px rgba(0, 31, 62, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow = "0 16px 32px rgba(0, 31, 62, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 31, 62, 0.3)";
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "-20px",
                          right: "-20px",
                          width: "80px",
                          height: "80px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "50%",
                        }}
                      />
                      
                      <div
                        style={{
                          fontSize: "42px",
                          fontWeight: 800,
                          lineHeight: 1.2,
                          color: "white",
                          marginBottom: "8px",
                          textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {stats.rooms_count}
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          color: "rgba(255, 255, 255, 0.9)",
                          fontWeight: "600",
                          marginBottom: "12px",
                        }}
                      >
                        Total Lab/Ruangan
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          🔬
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.9)",
                            fontWeight: "bold",
                          }}
                        >
                          Fasilitas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#001F3E",
                      margin: "0 0 20px 20px",
                    }}
                  >
                    Akses Cepat
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: "24px",
                    }}
                  >
                    <button
                      onClick={() => handleMenuClick("siswa")}
                      style={{
                        background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                        borderRadius: "16px",
                        padding: "24px",
                        border: "1px solid #E5E7EB",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15)";
                        e.currentTarget.style.borderColor = "#10B981";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.borderColor = "#E5E7EB";
                      }}
                    >
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          color: "white",
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        👨‍🎓
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#001F3E",
                            marginBottom: "4px",
                          }}
                        >
                          Data Siswa
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#000000",
                            fontWeight: "500",
                          }}
                        >
                          Kelola data siswa dan presensi
                        </div>
                      </div>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "#F3F4F6",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        →
                      </div>
                    </button>

                    <button
                      onClick={() => handleMenuClick("guru")}
                      style={{
                        background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                        borderRadius: "16px",
                        padding: "24px",
                        border: "1px solid #E5E7EB",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15)";
                        e.currentTarget.style.borderColor = "#8B5CF6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.borderColor = "#E5E7EB";
                      }}
                    >
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          color: "white",
                          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                        }}
                      >
                        👨‍🏫
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#001F3E",
                            marginBottom: "4px",
                          }}
                        >
                          Data Guru
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#000000",
                            fontWeight: "500",
                          }}
                        >
                          Kelola data guru dan jadwal mengajar
                        </div>
                      </div>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "#F3F4F6",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        →
                      </div>
                    </button>

                    <button
                      onClick={() => handleMenuClick("kelas")}
                      style={{
                        background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                        borderRadius: "16px",
                        padding: "24px",
                        border: "1px solid #E5E7EB",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15)";
                        e.currentTarget.style.borderColor = "#3B82F6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.borderColor = "#E5E7EB";
                      }}
                    >
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          color: "white",
                          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        🏫
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#001F3E",
                            marginBottom: "4px",
                          }}
                        >
                          Data Kelas
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#000000",
                            fontWeight: "500",
                          }}
                        >
                          Kelola kelas dan jurusan
                        </div>
                      </div>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "#F3F4F6",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        →
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AdminLayout>
        );

      case "jurusan":
        return (
          <JurusanAdmin
            user={user}
            onLogout={handleLogout}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
          />
        );

      case "kelas":
        return (
          <KelasAdmin
            user={user}
            onLogout={handleLogout}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
          />
        );

      case "siswa":
        return (
          <SiswaAdmin
            user={user}
            onLogout={handleLogout}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            onNavigateToDetail={(id) => {
              setSelectedSiswaId(id);
              setCurrentPage("detail-siswa");
            }}
          />
        );

      case "guru":
        return (
          <GuruAdmin
            user={user}
            onLogout={handleLogout}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            onNavigateToDetail={(id) => {
              setSelectedGuruId(id);
              setCurrentPage("detail-guru");
            }}
          />
        );

      case "detail-siswa":
        return selectedSiswaId ? (
          <DetailSiswa
            user={user}
            onLogout={handleLogout}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            siswaId={selectedSiswaId}
          />
        ) : null;

      case "detail-guru":
        return selectedGuruId ? (
          <DetailGuru
            user={user}
            onLogout={handleLogout}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
            guruId={selectedGuruId}
          />
        ) : null;

      case "profil-sekolah":
        return (
          <ProfilSekolah
            user={user}
            onLogout={handleLogout}
            currentPage={currentPage}
            onMenuClick={handleMenuClick}
          />
        );
    }
  };

  return renderPage();
}