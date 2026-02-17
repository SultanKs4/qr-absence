import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HalamanUtama from '../assets/Icon/HalamanUtama.png';
import { settingService } from '../services/settingService';

// ==================== INTERFACE DEFINITIONS ====================
interface LandingPageProps {
  onRoleSelect: (role: string) => void;
}

interface SchoolData {
  nama_sekolah: string;
  logo_sekolah: string | null;
  maskot_sekolah: string | null;
}

// ==================== DEFAULT LANDING DATA ====================
const DEFAULT_LANDING_DATA: SchoolData = {
  nama_sekolah: 'SMKN 2 SINGOSARI',
  logo_sekolah: null,
  maskot_sekolah: null,
};

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'waka', label: 'Waka Staff' },
  { value: 'pengurus_kelas', label: 'Pengurus Kelas' },
  { value: 'siswa', label: 'Siswa' },
  { value: 'wakel', label: 'Wali Kelas' },
  { value: 'guru', label: 'Guru' },
];

// ==================== MAIN COMPONENT ====================
export default function LandingPage({ onRoleSelect }: LandingPageProps) {
  // ==================== STATE MANAGEMENT ====================
  const [selectedRole, setSelectedRole] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [schoolData, setSchoolData] = useState<SchoolData>(DEFAULT_LANDING_DATA);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  // ==================== LOAD SCHOOL DATA FROM API ====================
  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const settings = await settingService.getPublicSettings();
        setSchoolData({
          nama_sekolah: settings.school_name || DEFAULT_LANDING_DATA.nama_sekolah,
          logo_sekolah: settings.school_logo_url || null,
          maskot_sekolah: settings.school_mascot_url || null,
        });
      } catch (error) {
        console.error('Error fetching school data:', error);
        // Fallback to localStorage if API fails (optional, but keep it simple for now)
        const savedData = localStorage.getItem('schoolData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setSchoolData({
            nama_sekolah: parsedData.nama_sekolah || DEFAULT_LANDING_DATA.nama_sekolah,
            logo_sekolah: parsedData.logo_sekolah || null,
            maskot_sekolah: parsedData.maskot_sekolah || null,
          });
        }
      }
    };

    fetchSchoolData();
  }, []);

  // ==================== HANDLE CLICK OUTSIDE DROPDOWN ====================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // ==================== HANDLE CONTINUE ====================
  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
      navigate('/login');
    }
  };

  // ==================== GET SELECTED ROLE LABEL ====================
  const selectedRoleLabel =
    selectedRole
      ? ROLES.find(role => role.value === selectedRole)?.label
      : 'Masuk sebagai';

  // ==================== RENDER ====================
  return (
    <>
      {/* Background Halaman Utama */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${HalamanUtama})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Konten Utama */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo Sekolah yang Dinamis - Hanya tampil jika ada */}
        {schoolData.logo_sekolah && (
          <img
            src={schoolData.logo_sekolah}
            alt="Logo SMK"
            style={{
              position: 'absolute',
              top: '20px',
              right: '40px',
              width: '90px',
              height: 'auto',
              zIndex: 2,
              objectFit: 'contain',
            }}
          />
        )}

        {/* Container > judul, maskot, dan form pemilihan role */}
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Judul Utama */}
          <h1
            style={{
              fontSize: 'clamp(35px, 4vw, 40px)',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '2px',
              margin: 0,
              textShadow: '0 3px 8px rgba(0,0,0,0.3)',
            }}
          >
            PRESENSI PEMBELAJARAN DIGITAL
          </h1>

          {/* Nama Sekolah - Dinamis dari localStorage */}
          <p
            style={{
              fontSize: 'clamp(16px, 3vw, 24px)',
              fontWeight: 700,
              color: '#ffffff',
              margin: '8px 0 12px',
              letterSpacing: '1px',
            }}
          >
            {schoolData.nama_sekolah}
          </p>

          {/* Maskot Sekolah yang Dinamis - Hanya tampil jika ada */}
          {schoolData.maskot_sekolah ? (
            <img
              src={schoolData.maskot_sekolah}
              alt="Maskot Sekolah"
              style={{
                width: '100%',
                maxWidth: '400px',
                height: 'auto',
                marginBottom: '32px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ height: '100px', marginBottom: '32px' }} /> // Spacer jika kosong
          )}

          {/* Form Pemilihan Role */}
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div ref={dropdownRef} style={{ marginBottom: '24px', position: 'relative' }}>
              {/* Button Dropdown */}
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '2px solid rgba(30, 58, 138, 0.8)',
                  backgroundColor: '#001F3F',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#002952';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#001F3F';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                <span>{selectedRoleLabel}</span>
                <span style={{ marginLeft: '10px' }}>{isDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <div
                  ref={dropdownContentRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    border: '2px solid rgba(30, 58, 138, 0.6)',
                    borderRadius: '12px',
                    marginTop: '8px',
                    backgroundColor: '#ffffff',
                    zIndex: 1000,
                    maxHeight: 'calc(100vh - 300px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* Loop: Menampilkan semua role */}
                  {ROLES.map(role => (
                    <button
                      key={role.value}
                      onClick={() => {
                        setSelectedRole(role.value);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        border: 'none',
                        borderBottom: '1px solid #f1f1f1',
                        backgroundColor: selectedRole === role.value ? '#1D4ED8' : '#ffffff',
                        color: selectedRole === role.value ? '#ffffff' : '#0F172A',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        fontSize: '15px',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedRole !== role.value) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedRole !== role.value) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Button Lanjutkan */}
            {selectedRole && (
              <button
                onClick={handleContinue}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#001F3F',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(0, 31, 63, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#002952';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 31, 63, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#001F3F';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 31, 63, 0.3)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
              >
                Lanjutkan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styling */}
      <style>{`
        div[style*="maxHeight: calc(100vh - 300px)"] {
          scrollbar-width: thin;
          scrollbar-color: #001F3F #f1f1f1;
        }

        div[style*="maxHeight: calc(100vh - 300px)"]::-webkit-scrollbar {
          width: 8px;
        }

        div[style*="maxHeight: calc(100vh - 300px)"]::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 0 10px 10px 0;
        }

        div[style*="maxHeight: calc(100vh - 300px)"]::-webkit-scrollbar-thumb {
          background: #001F3F;
          border-radius: 4px;
        }

        div[style*="maxHeight: calc(100vh - 300px)"]::-webkit-scrollbar-thumb:hover {
          background: #002952;
        }
      `}</style>
    </>
  );
}