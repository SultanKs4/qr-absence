import React, { useState, useEffect } from 'react';
import { Calendar, Eye, X, ZoomIn } from 'lucide-react';
import './Riwayat.css';
import NavbarSiswa from '../../components/Siswa/NavbarSiswa';

import apiService from '../../utils/api';


// ==================== UTILITY FUNCTIONS ====================
const getStatusColor = (status) => {
  const statusColors = {
    'Hadir': 'status-hadir',
    'Izin': 'status-izin',
    'Sakit': 'status-sakit',
    'Alpha': 'status-alpha',
    'Terlambat': 'status-terlambat',
    'Pulang': 'status-pulang'
  };
  return statusColors[status] || '';
};

function Riwayat() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [stats, setStats] = useState({
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    pulang: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const maxDate = today.toISOString().split('T')[0];

  // Fetch student profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await apiService.getProfile();
        console.log('Profile fetched:', profile);
        
        // Determine the correct student ID
        // apiService.getProfile() returns the user object with nested student_profile
        const studentId = profile.student_profile?.id || profile.id;
        
        setCurrentStudent({
          studentId: studentId, 
          name: profile.name,
          nis: profile.profile?.nis || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Set default student data
        setCurrentStudent({
          studentId: null,
          name: '',
          nis: ''
        });
      }
    };

    fetchProfile();
    window.scrollTo(0, 0);
  }, []);

  // Fetch attendance records and stats
  useEffect(() => {
    if (!currentStudent?.studentId) return;

    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch attendance records from real backend
        const records = await apiService.getAttendanceHistory({
          start_date: startDate,
          end_date: endDate
        });
        
        // Format records
        const formattedRecords = records.map(record => ({
          id: record.id,
          date: formatDisplayDate(record.created_at),
          period: record.schedule?.period || '-',
          subject: record.schedule?.subject?.name || '-',
          teacher: record.schedule?.teacher?.user?.name || '-',
          status: record.status_label || record.status,
          statusColor: getStatusColor(record.status_label || record.status),
          reason: record.reason || null,
          proofImage: record.proof_url || null,
          studentName: record.student?.user?.name || '',
          nis: record.student?.nis || ''
        }));
        
        setAttendanceRecords(formattedRecords);
        
        // Fetch stats from dashboard summary (most efficient way to get summary)
        const summaryResponse = await apiService.getStudentDashboard();
        const summary = summaryResponse.attendance_summary || {};
        
        setStats({
          hadir: summary.present || 0,
          terlambat: summary.late || 0,
          izin: summary.excused || 0,
          sakit: summary.sick || 0,
          alpha: summary.absent || 0,
          pulang: summary.return || 0
        });
        
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [currentStudent?.studentId, startDate, endDate]);


  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    const todayDate = new Date().toISOString().split('T')[0];
    
    if (newStartDate > todayDate) {
      alert('Tidak dapat memilih tanggal setelah hari ini!');
      return;
    }
    
    setStartDate(newStartDate);
    
    if (new Date(endDate) < new Date(newStartDate)) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    const todayDate = new Date().toISOString().split('T')[0];
    
    if (newEndDate > todayDate) {
      alert('Tidak dapat memilih tanggal setelah hari ini!');
      return;
    }
    
    if (new Date(newEndDate) >= new Date(startDate)) {
      setEndDate(newEndDate);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
  };

  const handleImageZoom = (imageUrl) => {
    setZoomedImage(imageUrl);
  };

  const closeImageZoom = () => {
    setZoomedImage(null);
  };

  const requiresProof = (status) => {
    return ['Izin', 'Sakit', 'Pulang'].includes(status);
  };

  return (
    <div className="riwayat-page">
      <NavbarSiswa />
      <main className="riwayat-main">
        <div className="date-range-filter">
          <div className="date-inputt-group">
            <label htmlFor="startDate">
              <Calendar size={18} />
              Dari Tanggal
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              max={maxDate}
              onChange={handleStartDateChange}
              className="date-inputt"
            />
          </div>
          
          <div className="date-separator">—</div>
          
          <div className="date-inputt-group">
            <label htmlFor="endDate">
              <Calendar size={18} />
              Sampai Tanggal
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              min={startDate}
              max={maxDate}
              onChange={handleEndDateChange}
              className="date-inputt"
            />
          </div>
        </div>

        <div className="riwayat-stats-wrapper">
          <div className="riwayat-stats-grid">
            <div className="riwayat-stat-box box-hadir">
              <div className="riwayat-stat-title">Hadir</div>
              <div className="riwayat-stat-number">{stats.hadir}</div>
            </div>
            <div className="riwayat-stat-box box-terlambat">
              <div className="riwayat-stat-title">Terlambat</div>
              <div className="riwayat-stat-number">{stats.terlambat}</div>
            </div>
            <div className="riwayat-stat-box box-izin">
              <div className="riwayat-stat-title">Izin</div>
              <div className="riwayat-stat-number">{stats.izin}</div>
            </div>
            <div className="riwayat-stat-box box-sakit">
              <div className="riwayat-stat-title">Sakit</div>
              <div className="riwayat-stat-number">{stats.sakit}</div>
            </div>
            <div className="riwayat-stat-box box-alpha">
              <div className="riwayat-stat-title">Alpha</div>
              <div className="riwayat-stat-number">{stats.alpha}</div>
            </div>
            <div className="riwayat-stat-box box-pulang">
              <div className="riwayat-stat-title">Pulang</div>
              <div className="riwayat-stat-number">{stats.pulang}</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            background: '#f9fafb',
            borderRadius: '16px',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{
              marginTop: '16px',
              fontSize: '16px',
              color: '#6b7280',
              fontWeight: '600'
            }}>Memuat data kehadiran...</p>
          </div>
        )}

        {!isLoading && attendanceRecords.length > 0 ? (
          <div className="table-card">
            <div className="table-header">
              <div>No</div>
              <div>Tanggal</div>
              <div>Jam Pelajaran</div>
              <div>Mata Pelajaran</div>
              <div>Guru</div>
              <div>Status</div>
              <div>Detail</div>
            </div>

            {attendanceRecords.map((record, index) => (
              <div key={index} className="table-row">
                <div className="table-cell">{index + 1}</div>
                <div className="table-cell">{record.date}</div>
                <div className="table-cell">{record.period}</div>
                <div className="table-cell">{record.subject}</div>
                <div className="table-cell">{record.teacher}</div>
                <div className="table-cell">
                  <span className={`status-badge ${record.statusColor}`}>
                    {record.status}
                  </span>
                </div>
                <div className="table-cell">
                  <button 
                    className="view-btn" 
                    onClick={() => handleViewDetail(record)}
                    title="Lihat Detail"
                  >
                    <Eye size={28} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="empty-state">
            <Calendar size={64} />
            <h3>Tidak ada data kehadiran</h3>
            <p>untuk periode {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}</p>
          </div>
        )}
      </main>

      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detail Kehadiran</h3>
              <button className="close-btn" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Tanggal:</span>
                <span className="detail-value">{selectedRecord.date}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Jam Pelajaran:</span>
                <span className="detail-value">{selectedRecord.period}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Mata Pelajaran:</span>
                <span className="detail-value">{selectedRecord.subject}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Guru:</span>
                <span className="detail-value">{selectedRecord.teacher}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedRecord.statusColor}`}>
                  {selectedRecord.status}
                </span>
              </div>

              {selectedRecord.reason && (
                <>
                  <div className="detail-divider"></div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Alasan:</span>
                    <span className="detail-value">{selectedRecord.reason || '-'}</span>
                  </div>
                </>
              )}

              {requiresProof(selectedRecord.status) && (
                <>
                  <div className="detail-divider"></div>
                  <div className="detail-row">
                    <span className="detail-label">Bukti Foto:</span>
                    <div className="detail-value">
                      {selectedRecord.proofImage ? (
                        <div className="proof-image-container">
                          <div 
                            className="proof-image-wrapper"
                            onClick={() => handleImageZoom(selectedRecord.proofImage)}
                          >
                            <img 
                              src={selectedRecord.proofImage} 
                              alt="Bukti dokumen"
                              className="proof-image"
                            />
                            <p className="proof-image-hint">
                              <ZoomIn size={14} style={{ display: 'inline', marginRight: '4px' }} />
                              Klik untuk memperbesar foto
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="no-proof-text">
                          Bukti foto belum diunggah oleh wali kelas
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {!selectedRecord.reason && !requiresProof(selectedRecord.status) && (
                <>
                  <div className="detail-divider"></div>
                  <p className="no-reason-text">
                    {selectedRecord.status === 'Hadir' 
                      ? 'Siswa hadir tepat waktu' 
                      : selectedRecord.status === 'Terlambat'
                      ? 'Siswa datang terlambat'
                      : 'Tidak ada keterangan tambahan'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={closeImageZoom}>
          <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={closeImageZoom}>
              <X size={24} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Bukti dokumen (diperbesar)"
              className="zoomed-image"
            />
          </div>
        </div>
      )}

      <style>{`
      
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Riwayat;