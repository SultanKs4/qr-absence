import React, { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/Admin/NavbarAdmin';
import './Dashboard.css';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// API Configuration
const baseURL = import.meta.env.VITE_API_URL;
const API_BASE_URL = baseURL ? baseURL : 'http://localhost:8000/api';

// API Service
const apiService = {
  // Get dashboard statistics (admin summary)
  getDashboardStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { 
        students_count: 0, 
        teachers_count: 0, 
        classes_count: 0, 
        majors_count: 0 
      };
    }
  },

  // Get school settings (public profile)
  getSchoolSettings: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/public`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch school settings');
      return await response.json();
    } catch (error) {
      console.error('Error fetching school settings:', error);
      return {};
    }
  },

  // Get attendance summary
  getAttendanceSummary: async (date = null) => {
    try {
      const url = date 
        ? `${API_BASE_URL}/attendance/summary?date=${date}`
        : `${API_BASE_URL}/attendance/summary`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch attendance summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      return {};
    }
  }
};

function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Dashboard statistics
  const [stats, setStats] = useState({
    totalMurid: 0,
    totalGuru: 0,
    totalKelas: 0,
    totalJurusan: 0
  });

  // School Profile
  const [schoolProfile, setSchoolProfile] = useState(null);

  // Attendance data
  const [attendanceData, setAttendanceData] = useState({
    tepatWaktu: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alfa: 0
  });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    
    try {
        const [statsResult, settingsResult, attendanceResult] = await Promise.all([
            apiService.getDashboardStats(),
            apiService.getSchoolSettings(),
            apiService.getAttendanceSummary(new Date().toISOString().split('T')[0])
        ]);

        // Map Stats
        setStats({
            totalMurid: statsResult.students_count || 0,
            totalGuru: statsResult.teachers_count || 0,
            totalKelas: statsResult.classes_count || 0,
            totalJurusan: statsResult.majors_count || 0
        });

        // Map School Profile
        setSchoolProfile(settingsResult);

        // Map Attendance
        setAttendanceData({
            tepatWaktu: attendanceResult.present || 0,
            terlambat: attendanceResult.late || 0,
            izin: (attendanceResult.excused || 0) + (attendanceResult.izin || 0),
            sakit: attendanceResult.sick || 0,
            alfa: (attendanceResult.absent || 0) + (attendanceResult.alpha || 0)
        });

    } catch (error) {
        console.error("Error loading dashboard data:", error);
    } finally {
        setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const statsInterval = setInterval(() => {
        loadData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(statsInterval);
  }, []);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <NavbarAdmin />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Memuat data dashboard...
        </div>
      </div>
    );
  }

  const chartData = {
    labels: ['Hadir', 'Sakit', 'Izin', 'Alpha'],
    datasets: [
      {
        data: [
          attendanceData.tepatWaktu + attendanceData.terlambat,
          attendanceData.sakit,
          attendanceData.izin,
          attendanceData.alfa,
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        hoverBackgroundColor: ['#059669', '#2563EB', '#D97706', '#DC2626'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
    }
  };


  return (
    <div className="dashboard-wrapper">
      <NavbarAdmin />

      <div className="dashboard-content">
        <div className="dashboard-header-section">
          <h1 className="page-title">Dashboard Admin</h1>
        </div>

        {/* STAT CARDS - DATA DARI API */}
        <div className="stats-cards-grid">
          <div className="stat-card-item card-blue">
            <div className="stat-dots">⋮</div>
            <div className="stat-number">{stats.totalMurid}</div>
            <div className="stat-label">Total Murid</div>
          </div>

          <div className="stat-card-item card-orange">
            <div className="stat-dots">⋮</div>
            <div className="stat-number">{stats.totalGuru}</div>
            <div className="stat-label">Total Guru</div>
          </div>

          <div className="stat-card-item card-cyan">
            <div className="stat-dots">⋮</div>
            <div className="stat-number">{stats.totalKelas}</div>
            <div className="stat-label">Total Kelas</div>
          </div>

          <div className="stat-card-item card-gray">
            <div className="stat-dots">⋮</div>
            <div className="stat-number">{stats.totalJurusan}</div>
            <div className="stat-label">Total Konsentrasi Keahlian</div>
          </div>
        </div>

        <div className="dashboard-main-grid">
            {/* RIWAYAT KEHADIRAN (HARI INI) */}
            <div className="attendance-section">
                <h2 className="section-title">Statistik Kehadiran Hari Ini</h2>
                
                <div className="attendance-card">
                    <div className="attendance-header">
                        <div className="date-display">
                            <h3>{formatDate(currentTime)}</h3>
                            <p>{formatTime(currentTime)}</p>
                        </div>
                    </div>

                    <div className="attendance-stats-container">
                         {/* Chart Section */}
                         <div className="chart-container">
                            <div className="chart-wrapper">
                                <Doughnut data={chartData} options={chartOptions} />
                                <div className="chart-center-text">
                                    <span className="total-students">
                                        {stats.totalMurid}
                                    </span>
                                    <span className="label">Siswa</span>
                                </div>
                            </div>
                        </div>

                        {/* Legend / Details */}
                        <div className="attendance-details">
                            <div className="stat-row">
                                <div className="stat-indicator present"></div>
                                <span className="stat-name">Hadir</span>
                                <span className="stat-value">{attendanceData.tepatWaktu + attendanceData.terlambat}</span>
                            </div>
                            <div className="stat-row">
                                <div className="stat-indicator sick"></div>
                                <span className="stat-name">Sakit</span>
                                <span className="stat-value">{attendanceData.sakit}</span>
                            </div>
                            <div className="stat-row">
                                <div className="stat-indicator permission"></div>
                                <span className="stat-name">Izin</span>
                                <span className="stat-value">{attendanceData.izin}</span>
                            </div>
                            <div className="stat-row">
                                <div className="stat-indicator absent"></div>
                                <span className="stat-name">Alpha</span>
                                <span className="stat-value">{attendanceData.alfa}</span>
                            </div>
                             <div className="stat-row">
                                <div className="stat-indicator late"></div>
                                <span className="stat-name">Terlambat</span>
                                <span className="stat-value">{attendanceData.terlambat}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PROFILE SEKOLAH */}
            <div className="school-profile-section">
                <h2 className="section-title">Profile Sekolah</h2>
                {schoolProfile ? (
                     <div className="school-profile-card">
                        <div className="profile-header">
                            {schoolProfile.school_logo_url ? (
                                <img src={schoolProfile.school_logo_url} alt="Logo Sekolah" className="school-logo-lg" />
                            ) : (
                                <div className="school-logo-placeholder-lg rounded-full bg-gray-200 flex items-center justify-center w-24 h-24 text-3xl font-bold text-gray-500">
                                    {schoolProfile.school_name ? schoolProfile.school_name.substring(0, 1) : 'S'}
                                </div>
                            )}
                            <div className="school-title">
                                <h3>{schoolProfile.school_name}</h3>
                                <span className="school-npsn">NPSN: {schoolProfile.school_npsn || '-'}</span>
                                <span className="school-accreditation">Akreditasi: {schoolProfile.school_accreditation || '-'}</span>
                            </div>
                        </div>
                        
                        <div className="profile-details-grid">
                            <div className="profile-item">
                                <span className="label">Kepala Sekolah</span>
                                <span className="value">{schoolProfile.school_headmaster || '-'}</span>
                                <span className="sub-value">NIP: {schoolProfile.school_headmaster_nip || '-'}</span>
                            </div>
                            
                             <div className="profile-item">
                                <span className="label">Alamat</span>
                                <span className="value">{schoolProfile.school_address}</span>
                                <span className="sub-value">
                                    {schoolProfile.school_subdistrict}, {schoolProfile.school_district}, {schoolProfile.school_city}, {schoolProfile.school_province} {schoolProfile.school_postal_code}
                                </span>
                            </div>

                            <div className="profile-item">
                                <span className="label">Kontak</span>
                                <div className="contact-value">
                                    <span>Email: {schoolProfile.school_email || '-'}</span>
                                    <span>Telp: {schoolProfile.school_phone || '-'}</span>
                                </div>
                            </div>
                        </div>
                     </div>
                ) : (
                    <div className="no-data">Data profile sekolah tidak tersedia</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;