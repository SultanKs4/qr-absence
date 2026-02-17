import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, ArrowLeft, TrendingUp, PieChart } from 'lucide-react';
import './DashboardKelas.css';
import NavbarPengurus from "../../components/PengurusKelas/NavbarPengurus";
import apiService from '../../utils/api';

// Fungsi untuk mendapatkan total mata pelajaran hari ini dari data jadwal
const getTodaySubjectCount = (scheduleData) => {
  if (!scheduleData || !Array.isArray(scheduleData)) return 0;
  return scheduleData.length;
};


// SVG Avatar Component untuk Profil - Basic Icon
const ProfileIcon = ({ gender, size = 80 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#E5E7EB"/>
      <circle cx="12" cy="9" r="4" fill="#9CA3AF"/>
      <path d="M4 20c0-4 3-6 8-6s8 2 8 6" fill="#9CA3AF"/>
    </svg>
  );
};

// Subjects Modal
const SubjectsModal = ({ isOpen, onClose, scheduleImage = null }) => {
  if (!isOpen) return null;

  return (
    <div className="all-riwayat-modal-overlay" onClick={onClose}>
      <NavbarPengurus/>
      <div className="all-riwayat-modal" style={{ 
        maxWidth: '800px', 
        maxHeight: 'calc(100vh - 105px)',
        width: '90%',
        margin: '0 auto'
      }} onClick={(e) => e.stopPropagation()}>
        <div className="all-riwayat-header">
          <button onClick={onClose} className="backbutton">
            <ArrowLeft size={32} />
          </button>
          <h2>Jadwal Pembelajaran</h2>
        </div>
        
        <div className="all-riwayat-card" style={{ 
          overflowX: 'auto', 
          overflowY: 'auto',
          padding: '24px',
          maxHeight: 'calc(100vh - 205px)'
        }}>
          {scheduleImage ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '100%',
                maxWidth: '650px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                border: '2px solid #e5e7eb'
              }}>
                <img 
                  src={scheduleImage} 
                  alt="Jadwal Pembelajaran" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '16px',
              border: '3px dashed #d1d5db',
              minHeight: '400px'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <BookOpen size={60} color="#9ca3af" />
              </div>
              
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '12px'
              }}>Belum Ada Jadwal</h3>
              
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                Jadwal pembelajaran belum tersedia
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Multi-Line Chart Component with All Status Types
const MultiLineChart = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [visibleLines, setVisibleLines] = useState({
    hadir: true,
    sakit: true,
    izin: true,
    alpha: true,
    terlambat: true,
    pulang: true
  });

  const chartHeight = 240;
  const chartWidth = 600;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const statusConfig = {
    hadir: { label: 'Hadir', color: '#1FA83D' },
    sakit: { label: 'Sakit', color: '#9A0898' },
    izin: { label: 'Izin', color: '#EDD329' },
    alpha: { label: 'Alpha', color: '#D90000' },
    terlambat: { label: 'Terlambat', color: '#FF5F1A' },
    pulang: { label: 'Pulang', color: '#243CB5' }
  };

  // Jika tidak ada data, tampilkan pesan
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '2px dashed #d1d5db',
        minHeight: '240px'
      }}>
        <TrendingUp size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
          Belum ada data tren bulanan
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap(item => 
    Object.keys(statusConfig)
      .filter(key => visibleLines[key])
      .map(key => item[key] || 0)
  ), 1);

  const yScale = (value) => {
    return padding.top + ((maxValue - value) / maxValue) * (chartHeight - padding.top - padding.bottom);
  };

  const xScale = (index) => {
    return padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  };

  const toggleLine = (statusKey) => {
    setVisibleLines(prev => ({ ...prev, [statusKey]: !prev[statusKey] }));
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend with Toggle */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px', 
        marginBottom: '16px',
        justifyContent: 'center' 
      }}>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => toggleLine(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: visibleLines[key] ? 'white' : '#f3f4f6',
              border: `2px solid ${visibleLines[key] ? config.color : '#d1d5db'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: visibleLines[key] ? 1 : 0.5
            }}
          >
            <div style={{
              width: '10px',
              height: '10px',
              background: config.color,
              borderRadius: '50%'
            }}></div>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#1f2937'
            }}>{config.label}</span>
          </button>
        ))}
      </div>

      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const value = (maxValue * percent) / 100;
          const y = yScale(value);
          return (
            <g key={percent}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
                fontWeight="600"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((item, index) => (
          <text
            key={index}
            x={xScale(index)}
            y={chartHeight - padding.bottom + 25}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill="#6b7280"
          >
            {item.month}
          </text>
        ))}

        {/* Draw lines for each status */}
        {Object.entries(statusConfig).map(([statusKey, config]) => {
          if (!visibleLines[statusKey]) return null;

          const points = data.map((item, index) => ({
            x: xScale(index),
            y: yScale(item[statusKey] || 0),
            value: item[statusKey] || 0,
            month: item.month,
            statusKey
          }));

          const linePath = points.map((point, index) => 
            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
          ).join(' ');

          return (
            <g key={statusKey}>
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke={config.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {points.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="white"
                    stroke={config.color}
                    strokeWidth="3"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint({ ...point, color: config.color, label: config.label })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="15"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint({ ...point, color: config.color, label: config.label })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          border: `2px solid ${hoveredPoint.color}`,
          pointerEvents: 'none',
          zIndex: 1000,
          minWidth: '180px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '12px',
            textAlign: 'center',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '8px'
          }}>
            {hoveredPoint.month}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: hoveredPoint.color,
              borderRadius: '50%'
            }}></div>
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '600'
            }}>{hoveredPoint.label}:</span>
            <span style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: hoveredPoint.color,
              marginLeft: 'auto'
            }}>{hoveredPoint.value}</span>
          </div>
        </div>
      )}

      {/* Summary Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f0f9ff',
        borderRadius: '12px',
        border: '2px solid #bfdbfe'
      }}>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#1e40af',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          Grafik menunjukkan tren kehadiran siswa per status. Klik label untuk hide/show.
        </p>
      </div>
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '180px',
        height: '180px',
        background: '#f9fafb',
        borderRadius: '50%',
        border: '2px dashed #d1d5db'
      }}>
        <PieChart size={48} color="#9ca3af" style={{ marginBottom: '8px' }} />
        <p style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          fontWeight: '600',
          textAlign: 'center',
          padding: '0 20px'
        }}>Belum ada data</p>
      </div>
    );
  }

  const percentages = {
    hadir: (data.hadir / total) * 100,
    izin: (data.izin / total) * 100,
    sakit: (data.sakit / total) * 100,
    alpha: (data.alpha / total) * 100,
    terlambat: (data.terlambat / total) * 100,
    pulang: (data.pulang / total) * 100
  };

  const colors = {
    hadir: '#1FA83D',
    izin: '#EDD329',
    sakit: '#9A0898',
    alpha: '#D90000',
    terlambat: '#FF5F1A',
    pulang: '#243CB5'
  };

  const labels = {
    hadir: 'Total Kehadiran',
    izin: 'Total Izin',
    sakit: 'Total Sakit',
    alpha: 'Total Alfa',
    terlambat: 'Total Terlambat',
    pulang: 'Total Pulang'
  };

  let cumulativePercent = 0;
  const gradientStops = Object.keys(percentages).map(key => {
    const start = cumulativePercent;
    cumulativePercent += percentages[key];
    return `${colors[key]} ${start}% ${cumulativePercent}%`;
  }).join(', ');

  const handleMouseMove = (e) => {
    const chart = e.currentTarget;
    const rect = chart.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const normalizedAngle = (angle + 90 + 360) % 360;
    
    const outerRadius = 75;
    const innerRadius = 50;
    const distance = Math.sqrt(x * x + y * y);
    
    if (distance >= innerRadius && distance <= outerRadius) {
      let cumulative = 0;
      for (const [key, percent] of Object.entries(percentages)) {
        cumulative += percent;
        if (normalizedAngle < (cumulative / 100) * 360) {
          setHoveredSegment({ label: labels[key], value: data[key], color: colors[key] });
          break;
        }
      }
    } else {
      setHoveredSegment(null);
    }
  };

  return (
    <div className="chart-donut-wrapper" style={{ width: '180px', height: '180px' }}>
      <div 
        className="chart-donut"
        style={{ 
          background: `conic-gradient(${gradientStops})`,
          width: '150px',
          height: '150px'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSegment(null)}
      >
        <div className="chart-inner" style={{ width: '100px', height: '100px' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{total}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>Total Siswa</div>
          </div>
        </div>
      </div>
      
      {hoveredSegment && (
        <div className="chart-tooltip">
          <div className="tooltip-color" style={{ background: hoveredSegment.color }}></div>
          <div className="tooltip-content">
            <div className="tooltip-label">{hoveredSegment.label}</div>
            <div className="tooltip-value">{hoveredSegment.value} siswa</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Dashboard
const DashboardKelas = () => {
  // State management
  const [showSubjects, setShowSubjects] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [profileImage, setProfileImage] = useState(null);
  
  // Data state dengan default values
  const [profileData, setProfileData] = useState({
    name: '',
    kelas: '',
    id: '',
    gender: 'perempuan'
  });
  
  const [scheduleImage, setScheduleImage] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  
  const [dailyStats, setDailyStats] = useState({
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    terlambat: 0,
    pulang: 0
  });
  
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch dashboard data from real backend
        const dashboardData = await apiService.getMyClassDashboard();
        
        const user = dashboardData.user || {};
        const profile = dashboardData.student || {}; // Student profile for the pengurus
        const classRoom = dashboardData.class_room || {};
        const stats = dashboardData.stats || {};
        const trend = dashboardData.monthly_trend || [];
        const schedules = dashboardData.today_schedules || [];

        setProfileData({
          name: user.name || '-',
          kelas: classRoom.label || '-',
          id: profile.nis || '-',
          gender: profile.gender || 'perempuan'
        });
        setProfileImage(profile.photo_url);

        setDailyStats({
          hadir: stats.present || 0,
          izin: stats.excused || 0,
          sakit: stats.sick || 0,
          alpha: stats.absent || 0,
          terlambat: stats.late || 0,
          pulang: stats.return || 0
        });

        setScheduleData(schedules);
        
        // Map Monthly Trend
        const formattedTrend = trend.map(item => ({
          month: item.month,
          hadir: item.present || 0,
          sakit: item.sick || 0,
          izin: item.excused || 0,
          alpha: item.absent || 0,
          terlambat: item.late || 0,
          pulang: item.return || 0
        }));
        
        setMonthlyTrend(formattedTrend);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[currentDateTime.getDay()]}, ${currentDateTime.getDate()} ${months[currentDateTime.getMonth()]} ${currentDateTime.getFullYear()}`;
  };

  const formatTime = () => {
    return currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/';
    }
  };

  const totalSubjects = getTodaySubjectCount(scheduleData);

  return (
    <>
      <NavbarPengurus />
      <div className="dashboard">
        <div className="profile-section">
          <div className="profile-contenty">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="avatar-image" />
                ) : (
                  <div className="avatar-icon">
                    <ProfileIcon gender={profileData.gender} size={80} />
                  </div>
                )}
              </div>
            </div>
            <h1 className="profile-name">{profileData.name || 'Nama Pengguna'}</h1>
            <h3 className="profile-kelas">{profileData.kelas || 'Kelas'}</h3>
            <p className="profile-id">{profileData.id || 'ID'}</p>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Keluar
          </button>
        </div>

        <main className="dashboard-main">
          <div className="dashboard-grid-main">
            <div className="content-section">
              <div className="kehadiran-card">
                <h3 className="kehadiran-title">Kehadiran Kelas</h3>
                
                <div className="datetime-info-row">
                  <div className="datetime-badge">
                    <Calendar size={18} />
                    <span>{formatDate()}</span>
                  </div>
                  <div className="datetime-badge">
                    <Clock size={18} />
                    <span>{formatTime()}</span>
                  </div>
                </div>
                
                <div className="time-range-display">
                  <div className="time-display-box">07:00:00</div>
                  <div className="time-range-separator">—</div>
                  <div className="time-display-box">15:00:00</div>
                </div>
              </div>

              <div className="kehadiran-card">
                <h3 className="kehadiran-title">Mata Pelajaran Hari Ini</h3>

                <div style={{
                  background: 'white', border: '2px solid #d1d5db', borderRadius: '16px',
                  padding: '24px', marginBottom: '20px', color: '#1f2937',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Total Mata Pelajaran</div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold' }}>{totalSubjects}</div>
                    {totalSubjects === 0 && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
                        {isLoading ? 'Memuat data...' : 'Libur - Tidak ada jadwal'}
                      </div>
                    )}
                  </div>
                  <BookOpen size={64} style={{ opacity: 0.8 }} />
                </div>

                <button onClick={() => setShowSubjects(true)} className="btn-action" style={{
                  width: '100%', background: 'linear-gradient(135deg, #1e3a8a)',
                  color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                }}>
                  <BookOpen size={20} />
                  <span>Lihat Jadwal Kelas</span>
                </button>
              </div>

              {/* Chart Section - 2 Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <div className="kehadiran-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      padding: '12px', borderRadius: '12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <TrendingUp color="white" size={24} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Tren Kehadiran Bulanan
                    </h3>
                  </div>
                  <MultiLineChart data={monthlyTrend} />
                </div>

                <div className="kehadiran-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      padding: '12px', borderRadius: '12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <PieChart color="white" size={24} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Statistik Hari Ini
                    </h3>
                  </div>
                  
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '24px',
                    justifyContent: 'center', padding: '10px'
                  }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <DonutChart data={dailyStats} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1' }}>
                      {[
                        { label: 'Hadir', value: dailyStats.hadir, color: '#1FA83D' },
                        { label: 'Terlambat', value: dailyStats.terlambat, color: '#FF5F1A' },
                        { label: 'Pulang', value: dailyStats.pulang, color: '#243CB5' },
                        { label: 'Izin', value: dailyStats.izin, color: '#EDD329' },
                        { label: 'Sakit', value: dailyStats.sakit, color: '#9A0898' },
                        { label: 'Alpha', value: dailyStats.alpha, color: '#D90000' }
                      ].map((stat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '14px', height: '14px', background: stat.color,
                            borderRadius: '50%', flexShrink: 0
                          }}></div>
                          <div style={{
                            flex: 1, fontSize: '13px', color: '#6b7280', fontWeight: '600'
                          }}>{stat.label}</div>
                          <div style={{
                            fontSize: '20px', color: '#1f2937', fontWeight: 'bold'
                          }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <SubjectsModal isOpen={showSubjects} onClose={() => setShowSubjects(false)} 
          scheduleImage={scheduleImage} />
      </div>
    </>
  );
};

export default DashboardKelas;