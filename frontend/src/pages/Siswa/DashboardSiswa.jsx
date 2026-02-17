import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, ArrowLeft, PieChart, TrendingUp } from 'lucide-react';
import './DashboardSiswa.css';
import NavbarSiswa from '../../components/Siswa/NavbarSiswa';

import apiService from '../../utils/api';

// ==================== UTILITY FUNCTIONS ====================
const getTodaySubjectCount = (scheduleData) => {
  if (!scheduleData || !Array.isArray(scheduleData)) return 0;
  return scheduleData.length || 0;
};


// ==================== COMPONENTS ====================
const ProfileIcon = ({ gender, size = 80 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#E5E7EB" />
      <circle cx="12" cy="9" r="4" fill="#9CA3AF" />
      <path d="M4 20c0-4 3-6 8-6s8 2 8 6" fill="#9CA3AF" />
    </svg>
  );
};

const SubjectsModal = ({ isOpen, onClose, scheduleData }) => {
  if (!isOpen) return null;

  const hasScheduleImage = scheduleData?.scheduleImageUrl;

  return (
    <div className="siswa-overlay-modal-semua-riwayat" onClick={onClose}>
      <NavbarSiswa />
      <div className="siswa-modal-semua-riwayat" style={{
        maxWidth: '800px',
        maxHeight: 'calc(100vh - 105px)',
        width: '90%',
        margin: '0 auto'
      }} onClick={(e) => e.stopPropagation()}>
        <div className="siswa-header-semua-riwayat">
          <button onClick={onClose} className="siswa-tombol-kembali">
            <ArrowLeft size={32} />
          </button>
          <h2>Jadwal Pembelajaran</h2>
        </div>

        <div className="siswa-kartu-semua-riwayat" style={{
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '24px',
          maxHeight: 'calc(100vh - 205px)'
        }}>
          {hasScheduleImage ? (
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
                  src={scheduleData.scheduleImageUrl}
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

const LineChart = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chartHeight = 240;
  const chartWidth = 600;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '2px dashed #d1d5db'
      }}>
        <TrendingUp size={48} color="#9ca3af" style={{ marginBottom: '12px' }} />
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, fontWeight: '600' }}>
          Belum ada data tren bulanan
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.percentage));
  const minValue = Math.min(...data.map(d => d.percentage));
  const range = maxValue - minValue || 10;

  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + ((maxValue + 5 - item.percentage) / (range + 10)) * (chartHeight - padding.top - padding.bottom);
    return { x, y, ...item };
  });

  const linePath = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${points[0].x} ${chartHeight - padding.bottom} Z`;

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((val) => {
          const y = padding.top + ((100 - val) / 100) * (chartHeight - padding.top - padding.bottom);
          return (
            <g key={val}>
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
              >
                {val}%
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#lineGradient)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#3b82f6" strokeWidth="3" style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint(point)} onMouseLeave={() => setHoveredPoint(null)} />
            <circle cx={point.x} cy={point.y} r="15" fill="transparent" style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint(point)} onMouseLeave={() => setHoveredPoint(null)} />
            <text x={point.x} y={point.y - 15} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1f2937">
              {point.percentage}%
            </text>
            <text x={point.x} y={chartHeight - padding.bottom + 25} textAnchor="middle" fontSize="13" fontWeight="600" fill="#6b7280">
              {point.month}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <g>
            {(() => {
              const firstPoint = points[0];
              const lastPoint = points[points.length - 1];
              const trend = lastPoint.percentage - firstPoint.percentage;
              const trendColor = trend >= 0 ? '#22c55e' : '#ef4444';
              const trendText = trend >= 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;

              return (
                <text x={chartWidth - padding.right} y={padding.top - 10} textAnchor="end" fontSize="14" fontWeight="bold" fill={trendColor}>
                  {trendText} {trend >= 0 ? '↑' : '↓'}
                </text>
              );
            })()}
          </g>
        )}
      </svg>

      {hoveredPoint && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          background: 'white', padding: '16px 20px', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)', border: '2px solid #3b82f6',
          pointerEvents: 'none', zIndex: 1000, minWidth: '200px'
        }}>
          <div style={{
            fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px',
            textAlign: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px'
          }}>
            {hoveredPoint.month}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Persentase:</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{hoveredPoint.percentage}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Hadir:</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{hoveredPoint.hadir} hari</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Total Hari:</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{hoveredPoint.total} hari</span>
          </div>
        </div>
      )}
    </div>
  );
};

const DonutChart = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  if (!data) {
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
          padding: '0 20px',
          margin: 0
        }}>Belum ada data</p>
      </div>
    );
  }

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
          padding: '0 20px',
          margin: 0
        }}>Belum ada data minggu ini</p>
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
    hadir: 'Hadir',
    izin: 'Izin',
    sakit: 'Sakit',
    alpha: 'Alpha',
    terlambat: 'Terlambat',
    pulang: 'Pulang'
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
    <div className="siswa-pembungkus-chart-donut" style={{ width: '180px', height: '180px' }}>
      <div
        className="siswa-chart-donut"
        style={{
          background: `conic-gradient(${gradientStops})`,
          width: '150px',
          height: '150px'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSegment(null)}
      >
        <div className="siswa-dalam-chart" style={{ width: '100px', height: '100px' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{total}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>Total Hari</div>
          </div>
        </div>
      </div>

      {hoveredSegment && (
        <div className="siswa-tooltip-chart">
          <div className="siswa-warna-tooltip" style={{ background: hoveredSegment.color }}></div>
          <div className="siswa-konten-tooltip">
            <div className="siswa-label-tooltip">{hoveredSegment.label}</div>
            <div className="siswa-nilai-tooltip">{hoveredSegment.value} hari</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN DASHBOARD COMPONENT ====================
const Dashboard = () => {
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    kelas: '',
    id: '',
    gender: 'perempuan',
    studentId: null
  });
  const [scheduleData, setScheduleData] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState({
    hadir: 0,
    terlambat: 0,
    pulang: 0,
    izin: 0,
    sakit: 0,
    alpha: 0
  });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showSubjects, setShowSubjects] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Fetch data dari API saat component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch dashboard summary (includes profile, summary, trend, and schedules)
        const summaryResponse = await apiService.getStudentDashboard();
        
        const user = summaryResponse.user || {};
        const profile = summaryResponse.student || {};
        const summary = summaryResponse.attendance_summary || {};
        const trend = summaryResponse.monthly_trend || [];
        const schedules = summaryResponse.today_schedules || [];

        setProfileData({
          name: user.name || '-',
          kelas: profile.class_room?.label || '-',
          id: profile.nis || '-',
          gender: profile.gender || 'perempuan',
          studentId: user.id
        });
        setProfileImage(profile.photo_url);

        // Map schedules
        setScheduleData(schedules);

        // Map Weekly Stats (from summary)
        setWeeklyStats({
          hadir: summary.present || 0,
          terlambat: summary.late || 0,
          pulang: summary.return || 0,
          izin: summary.excused || 0,
          sakit: summary.sick || 0,
          alpha: summary.absent || 0
        });

        // Map Monthly Trend
        const formattedTrend = trend.map(item => ({
          month: item.month,
          percentage: Math.round(item.percentage),
          hadir: item.present,
          total: item.total
        }));
        
        setMonthlyTrend(formattedTrend);

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format functions
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
      <NavbarSiswa />
      <div className="siswa-dashboard-utama">
        <div className="siswa-bagian-profil">
          <div className="siswa-konten-profil">
            <div className="siswa-pembungkus-avatar">
              <div className="siswa-avatar-profil">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="siswa-gambar-avatar" />
                ) : (
                  <div className="siswa-ikon-avatar">
                    <ProfileIcon gender={profileData.gender} size={80} />
                  </div>
                )}
              </div>
            </div>
            <h1 className="siswa-nama-profil">{profileData.name || '-'}</h1>
            <h3 className="siswa-kelas-profil">{profileData.kelas || '-'}</h3>
            <p className="siswa-id-profil">{profileData.id || '-'}</p>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Keluar
          </button>
        </div>

        <main className="siswa-dashboard-konten">
          <div className="siswa-dashboard-grid">
            <div className="siswa-bagian-konten">
              <div className="siswa-kartu-kehadiran">
                <h3 className="siswa-judul-kehadiran">Kehadiran Siswa</h3>

                <div className="siswa-baris-info-waktu">
                  <div className="siswa-lencana-waktu">
                    <Calendar size={18} />
                    <span>{formatDate()}</span>
                  </div>
                  <div className="siswa-lencana-waktu">
                    <Clock size={18} />
                    <span>{formatTime()}</span>
                  </div>
                </div>

                <div className="siswa-tampilan-rentang-waktu">
                  <div className="siswa-kotak-tampilan-waktu">07:00:00</div>
                  <div className="siswa-pemisah-rentang-waktu">—</div>
                  <div className="siswa-kotak-tampilan-waktu">15:00:00</div>
                </div>
              </div>

              <div className="siswa-kartu-kehadiran">
                <h3 className="siswa-judul-kehadiran">Mata Pelajaran Hari Ini</h3>

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

                <button onClick={() => setShowSubjects(true)} className="siswa-btn-aksi" style={{
                  width: '100%', background: 'linear-gradient(135deg, #1e3a8a)',
                  color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                }}>
                  <BookOpen size={20} />
                  <span>Lihat Jadwal Kelas</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <div className="siswa-kartu-kehadiran">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'
                  }}>
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
                  <LineChart data={monthlyTrend} />
                  <div style={{
                    marginTop: '20px', padding: '16px', background: '#f0f9ff',
                    borderRadius: '12px', border: '2px solid #bfdbfe'
                  }}>
                    <p style={{
                      margin: 0, fontSize: '13px', color: '#1e40af',
                      fontWeight: '600', textAlign: 'center'
                    }}>
                      Grafik menunjukkan persentase kehadiran pribadi per bulan
                    </p>
                  </div>
                </div>

                <div className="siswa-kartu-kehadiran">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      padding: '12px', borderRadius: '12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <PieChart color="white" size={24} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Statistik Minggu Ini
                    </h3>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '24px',
                    justifyContent: 'center', padding: '10px'
                  }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <DonutChart data={weeklyStats} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1' }}>
                      {[
                        { label: 'Hadir', value: weeklyStats.hadir, color: '#1FA83D' },
                        { label: 'Terlambat', value: weeklyStats.terlambat, color: '#FF5F1A' },
                        { label: 'Pulang', value: weeklyStats.pulang, color: '#243CB5' },
                        { label: 'Izin', value: weeklyStats.izin, color: '#EDD329' },
                        { label: 'Sakit', value: weeklyStats.sakit, color: '#9A0898' },
                        { label: 'Alpha', value: weeklyStats.alpha, color: '#D90000' }
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
          scheduleData={scheduleData} />
      </div>
    </>
  );
};

export default Dashboard;