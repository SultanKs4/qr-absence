import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardGuru.css';
import NavbarGuru from '../../components/Guru/NavbarGuru';
import { authService } from '../../services/auth';
import { authHelpers } from '../../utils/authHelpers';
import attendanceService from '../../services/attendance';

function DashboardGuru() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [qrVerified, setQrVerified] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [user] = useState(authHelpers.getUserData());

  // State untuk melacak jadwal yang sudah selesai absensi
  const [completedAbsensi, setCompletedAbsensi] = useState(new Set());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getTeacherDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching guru dashboard data:", err);
      setError("Gagal mengambil data dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const updateDateTime = () => {
      const now = new Date();
      
      // Update time
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
      
      // Update date
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      
      const dayName = days[now.getDay()];
      const date = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      
      setCurrentDate(`${dayName}, ${date} ${monthName} ${year}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleIconClick = (jadwal) => {
    setSelectedSchedule({
      id: jadwal.id,
      mataPelajaran: jadwal.subject,
      kelas: jadwal.class_name,
      jamKe: jadwal.time_slot.replace('Jam Ke ', ''),
      waktu: `${jadwal.start_time} - ${jadwal.end_time}`
    });
    setQrVerified(false);
  };

  const handleCloseModal = () => {
    setSelectedSchedule(null);
    setQrVerified(false);
  };

  const handleQrVerified = () => {
    setQrVerified(true);
  };

  const handleAbsensiSelesai = () => {
    if (selectedSchedule) {
      setCompletedAbsensi(prev => new Set(prev).add(selectedSchedule.id));
    }
    
    // Format tanggal untuk navigasi
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dayName = days[now.getDay()];
    const formattedDate = `${day}-${month}-${year} (${dayName})`;
    
    handleCloseModal();

    navigate('/guru/presensi', {
      state: {
        scheduleId: selectedSchedule?.id,
        mataPelajaran: selectedSchedule?.mataPelajaran,
        jamKe: selectedSchedule?.jamKe,
        kelas: selectedSchedule?.kelas,
        waktu: selectedSchedule?.waktu,
        tanggal: formattedDate
      }
    });
  };

  const simulateScanSuccess = () => {
    handleQrVerified();
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      authService.logout();
      navigate('/login');
    }
  };

  const renderStatusIcon = (jadwalId) => {
    const isCompleted = completedAbsensi.has(jadwalId);

    if (isCompleted) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="status-icon eye-icon">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C23.27 7.61 19 4.5 12 4.5zm0 13c-3.5 0-6.5-2.5-6.5-5.5S8.5 6.5 12 6.5s6.5 2.5 6.5 5.5-3 5.5-6.5 5.5zm0-8c-1.38 0-2.5.67-2.5 1.5S10.62 13 12 13s2.5-.67 2.5-1.5S13.38 9.5 12 9.5z"/>
        </svg>
      );
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="status-icon qr-icon">
        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2z"/>
      </svg>
    );
  };

  if (loading) {
    return <div className="loading-container">Memuat data dashboard...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  const teacher = dashboardData?.teacher || {};
  const allJadwal = dashboardData?.schedule_today || [];

  return (
    <div className="dashboard-container">
      <NavbarGuru />
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="profile-card">
          <div className="profile-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h2 className="profile-name">{teacher.name || user?.name}</h2>
          <p className="profile-id">{teacher.nip || user?.nip || "-"}</p>
          
          <button className="btn-logout" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? '' : 'full-width'}`}>
        <div className="header-section">
          <div className="date-time-card">
            <div className="date-display">
              <span>{currentDate}</span>
              <span className="current-time-small">{currentTime}</span>
            </div>
            <div className="time-range">
              <div className="time-box">07:00:00</div>
              <span className="time-separator">—</span>
              <div className="time-box">15:00:00</div>
            </div>
          </div>

          <div className="current-time-card">
            <div className="total-label">Total Mengajar Hari Ini</div>
            <div className="class-count">{allJadwal.length} Kelas</div>
          </div>
        </div>

        <div className="schedule-section">
          <h2 className="schedule-title">
            Jadwal Hari Ini
            <span className="bell-icon">🔔</span>
          </h2>

          <div className="schedule-list">
            {allJadwal.map((jadwal) => (
              <div key={jadwal.id} className="schedule-card-compact" onClick={() => handleIconClick(jadwal)}>
                <div className="card-content">
                  <div className="schedule-icon-compact">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </div>
                  <div className="schedule-info-compact">
                    <div className="schedule-name">{jadwal.subject}</div>
                    <div className="schedule-class">{jadwal.class_name}</div>
                  </div>
                  <button 
                    className="btn-qr-compact"
                  >
                    {renderStatusIcon(jadwal.id)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL - Hanya Scan */}
      {selectedSchedule && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className={qrVerified ? "modal-absen-detail" : "modal-absen-scan"}
            onClick={(e) => e.stopPropagation()}
          >
            {!qrVerified && (
              <>
                <div className="modal-simple-header">
                  <button className="back-btn" onClick={handleCloseModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </button>
                  <h3>Scan</h3>
                  <button className="close-btn" onClick={handleCloseModal}>×</button>
                </div>

                <div className="tab-content-dotted">
                  <div className="scan-area">
                    <div className="qr-box-large">
                      <div className="qr-frame">
                        {/* QR Code Pattern */}
                        <svg viewBox="0 0 200 200" className="qr-pattern">
                          {/* Corner squares */}
                          <rect x="20" y="20" width="50" height="50" fill="#000" rx="5"/>
                          <rect x="130" y="20" width="50" height="50" fill="#000" rx="5"/>
                          <rect x="20" y="130" width="50" height="50" fill="#000" rx="5"/>
                          
                          {/* Inner white squares */}
                          <rect x="30" y="30" width="30" height="30" fill="#fff" rx="3"/>
                          <rect x="140" y="30" width="30" height="30" fill="#fff" rx="3"/>
                          <rect x="30" y="140" width="30" height="30" fill="#fff" rx="3"/>
                          
                          {/* Center dots */}
                          <rect x="40" y="40" width="10" height="10" fill="#000" rx="2"/>
                          <rect x="150" y="40" width="10" height="10" fill="#000" rx="2"/>
                          <rect x="40" y="150" width="10" height="10" fill="#000" rx="2"/>
                          
                          {/* Random pattern blocks */}
                          <rect x="85" y="30" width="10" height="10" fill="#000"/>
                          <rect x="100" y="30" width="10" height="10" fill="#000"/>
                          <rect x="85" y="45" width="10" height="10" fill="#000"/>
                          <rect x="30" y="85" width="10" height="10" fill="#000"/>
                          <rect x="45" y="85" width="10" height="10" fill="#000"/>
                          <rect x="30" y="100" width="10" height="10" fill="#000"/>
                          <rect x="150" y="85" width="10" height="10" fill="#000"/>
                          <rect x="165" y="85" width="10" height="10" fill="#000"/>
                          <rect x="150" y="100" width="10" height="10" fill="#000"/>
                          <rect x="85" y="150" width="10" height="10" fill="#000"/>
                          <rect x="100" y="150" width="10" height="10" fill="#000"/>
                          <rect x="85" y="165" width="10" height="10" fill="#000"/>
                          
                          {/* Center blocks */}
                          <rect x="80" y="80" width="15" height="15" fill="#000"/>
                          <rect x="105" y="80" width="15" height="15" fill="#000"/>
                          <rect x="80" y="105" width="15" height="15" fill="#000"/>
                          <rect x="105" y="105" width="15" height="15" fill="#000"/>
                        </svg>
                        
                        {/* Magnifying Glass Icon */}
                        <div className="magnify-icon">
                          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="40" cy="40" r="25" stroke="#000" strokeWidth="6" fill="none"/>
                            <line x1="58" y1="58" x2="85" y2="85" stroke="#000" strokeWidth="8" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <button onClick={simulateScanSuccess} className="btn-simulasi">
                      Simulasi Scan Berhasil
                    </button>
                  </div>
                </div>
              </>
            )}

            {qrVerified && (
              <>
                <div className="modal-detail-header">
                  <div className="header-left">
                    <div className="header-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                    </div>
                    <h2>{selectedSchedule.mataPelajaran}</h2>
                  </div>
                  <div className="header-class">{selectedSchedule.kelas}</div>
                </div>

                <div className="modal-detail-body">
                  <h3 className="section-title">Keterangan</h3>
                  
                  <div className="detail-row">
                    <span className="detail-label">Mata Pelajaran</span>
                    <span className="detail-value">{selectedSchedule.mataPelajaran}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Kelas/Jurusan</span>
                    <span className="detail-value">{selectedSchedule.kelas}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Jam ke-</span>
                    <span className="detail-value">{selectedSchedule.waktu} (Jam ke {selectedSchedule.jamKe})</span>
                  </div>
                  
                  <h3 className="section-title status-title">Status Guru</h3>
                  
                  <div className="detail-row">
                    <span className="detail-label">Hadir</span>
                    <span className="status-badge-green">Hadir</span>
                  </div>
                  
                  <p className="status-description">Anda terjadwal mengajar kelas ini</p>
                  
                  <button className="btn-mulai-absen-full" onClick={handleAbsensiSelesai}>
                    Mulai Presensi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardGuru;