import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardGuru.css';
import NavbarGuru from '../../components/Guru/NavbarGuru';
import { isJadwalCompleted } from '../../utils/dataManager';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

const apiService = {
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }),

  async getDashboard() {
    const response = await fetch(`${API_BASE_URL}/me/teacher/dashboard`, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return response.json();
  }
};

function DashboardGuru() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentFormattedDate, setCurrentFormattedDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [qrVerified, setQrVerified] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});

  // State untuk melacak jadwal yang sudah selesai absensi
  const [completedAbsensi, setCompletedAbsensi] = useState(new Set());

  // Fetch Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await apiService.getDashboard();
        setDashboardData(data);

        // Map schedule data
        const schedules = (data.schedule_today || []).map(item => ({
          id: item.id,
          mataPelajaran: item.subject,
          kelas: item.class_name,
          jamKe: item.time_slot, // Assuming backend sends string or number
          waktu: `${item.start_time} - ${item.end_time}`,
          totalStudents: item.total_students,
          statistics: item.statistics
        }));
        setScheduleList(schedules);

        if (data.teacher) {
          setProfile(data.teacher);
        }

      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Effect untuk load completed absensi
  useEffect(() => {
    const loadCompletedAbsensi = () => {
      const completed = new Set();
      scheduleList.forEach(jadwal => {
        // Use backend statistics to determine completion if available, 
        // fall back to local check or check if any presence exists
        const stats = jadwal.statistics;
        const totalAttendance = (stats?.present || 0) + (stats?.late || 0) + (stats?.sick || 0) + (stats?.izin || 0) + (stats?.absent || 0);

        if (totalAttendance > 0 || isJadwalCompleted(jadwal.id, currentFormattedDate)) {
          completed.add(jadwal.id);
        }
      });
      setCompletedAbsensi(completed);
    };

    if (currentFormattedDate && scheduleList.length > 0) {
      loadCompletedAbsensi();
    }
  }, [currentFormattedDate, scheduleList]);

  useEffect(() => {
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

      // Format untuk key storage
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const formattedDate = `${day}-${month}-${year} (${dayName})`;
      setCurrentFormattedDate(formattedDate);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleIconClick = (jadwal) => {
    setSelectedSchedule(jadwal);
    // Directly verify for now, skipping "Scan" simulation unless we have a real scan feature
    setQrVerified(true);
  };

  const handleCloseModal = () => {
    setSelectedSchedule(null);
    setQrVerified(false);
  };

  const handleAbsensiSelesai = () => {
    if (selectedSchedule) {
      const isCompleted = completedAbsensi.has(selectedSchedule.id);

      handleCloseModal();

      navigate('/guru/presensi', {
        state: {
          jadwalId: selectedSchedule.id,
          mataPelajaran: selectedSchedule.mataPelajaran,
          jamKe: selectedSchedule.jamKe,
          kelas: selectedSchedule.kelas,
          waktu: selectedSchedule.waktu,
          tanggal: currentFormattedDate,
          isEdit: isCompleted
        }
      });
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const renderStatusIcon = (jadwalId) => {
    const isCompleted = completedAbsensi.has(jadwalId);

    if (isCompleted) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="status-icon eye-icon">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C23.27 7.61 19 4.5 12 4.5zm0 13c-3.5 0-6.5-2.5-6.5-5.5S8.5 6.5 12 6.5s6.5 2.5 6.5 5.5-3 5.5-6.5 5.5zm0-8c-1.38 0-2.5.67-2.5 1.5S10.62 13 12 13s2.5-.67 2.5-1.5S13.38 9.5 12 9.5z" />
        </svg>
      );
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="status-icon qr-icon">
        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2z" />
      </svg>
    );
  };

  return (
    <div className="dashboard-container">
      <NavbarGuru />
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
          <h2 className="profile-name3">{profile.name || '-'}</h2>
          <p className="profile-id">{profile.nip || '-'}</p>

          <button className="btn-logout" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
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
              <div className="time-box">
                {dashboardData?.school_hours?.start_time || '07:00'}
              </div>
              <span className="time-separator">—</span>
              <div className="time-box">
                {dashboardData?.school_hours?.end_time || '15:00'}
              </div>
            </div>
          </div>

          <div className="current-time-card">
            <div className="total-label">Total Mengajar Hari Ini</div>
            <div className="class-count">{scheduleList.length} Kelas</div>
          </div>
        </div>

        <div className="schedule-section">
          <h2 className="schedule-title">
            Jadwal Hari Ini
            <span className="bell-icon">🔔</span>
          </h2>

          <div className="schedule-list">
            {loading ? (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>Memuat jadwal...</p>
            ) : scheduleList.length === 0 ? (
              <div className="empty-schedule">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '64px', height: '64px', opacity: 0.3, margin: '20px auto' }}>
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
                <p style={{ textAlign: 'center', color: '#666', fontSize: '16px' }}>Tidak ada jadwal mengajar hari ini</p>
              </div>
            ) : (
              scheduleList.map((jadwal) => (
                <div key={jadwal.id} className="schedule-card-compact">
                  <div className="card-content">
                    <div className="schedule-icon-compact">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                    </div>
                    <div className="schedule-info-compact">
                      <div className="schedule-name">{jadwal.mataPelajaran}</div>
                      <div className="schedule-class">{jadwal.kelas}</div>
                    </div>
                    <button
                      className="btn-qr-compact"
                      onClick={() => handleIconClick(jadwal)}
                    >
                      {renderStatusIcon(jadwal.id)}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* MODAL - Detail Presensi */}
      {selectedSchedule && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-absen-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-detail-header">
              <div className="header-left">
                <div className="header-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
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
                <span className="detail-value">{selectedSchedule.waktu} ({selectedSchedule.jamKe})</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Total Siswa</span>
                <span className="detail-value">{selectedSchedule.totalStudents} Siswa</span>
              </div>

              <h3 className="section-title status-title">Status Presensi</h3>

              <div className="detail-row">
                <span className="detail-label">Kehadiran</span>
                <span className={completedAbsensi.has(selectedSchedule.id) ? "status-badge-green" : "status-badge-yellow"}>
                  {completedAbsensi.has(selectedSchedule.id) ? "Sudah Diabsen" : "Belum Diabsen"}
                </span>
              </div>

              <p className="status-description">
                {completedAbsensi.has(selectedSchedule.id)
                  ? "Anda sudah melakukan presensi untuk kelas ini."
                  : "Silakan mulai presensi untuk mencatat kehadiran siswa."}
              </p>

              <button className="btn-mulai-absen-full" onClick={handleAbsensiSelesai}>
                {completedAbsensi.has(selectedSchedule.id) ? 'Lihat/Edit Presensi' : 'Mulai Presensi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardGuru;