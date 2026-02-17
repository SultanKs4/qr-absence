import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Eye, X, Users, ZoomIn } from 'lucide-react';
import NavbarPengurus from "../../components/PengurusKelas/NavbarPengurus";
import './RiwayatKelas.css';

import apiService from '../../utils/api';

function Riwayat() {
  // Set default tanggal awal bulan dan hari ini
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(0); // 0 = Semua Siswa
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentList, setStudentList] = useState([]);
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

  // Fetch students list
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const students = await apiService.getMyClassStudents();
        setStudentList(students.map(s => ({
          id: s.id,
          name: s.user?.name || '-',
          nis: s.nis || '-'
        })));
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
    window.scrollTo(0, 0);
  }, []);


  // Fetch attendance records and stats
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch attendance records from real backend
        const searchParams = {
          start_date: startDate,
          end_date: endDate
        };
        if (selectedStudent !== 0) {
          searchParams.student_id = selectedStudent;
        }

        const records = await apiService.getMyClassAttendanceHistory(searchParams);
        
        // Format records
        const formattedRecords = records.map(record => ({
          id: record.id,
          date: formatDateDisplay(record.created_at),
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
        
        // Fetch stats from class dashboard for summary efficiency
        const dashboardData = await apiService.getMyClassDashboard();
        const summary = dashboardData.stats || {};
        
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
  }, [startDate, endDate, selectedStudent]);


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

  const formatDateDisplay = (dateString) => {
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

  const handleDateApply = () => {
    if (new Date(startDate) > new Date(endDate)) {
      alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir!');
      return;
    }
    setShowDatePicker(false);
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudent(studentId);
    setShowStudentPicker(false);
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

  const getSelectedStudentName = () => {
    if (selectedStudent === 0) return 'Semua Siswa';
    const student = studentList.find(s => s.id === selectedStudent);
    return student ? student.name : 'Semua Siswa';
  };

  const requiresProof = (status) => {
    return ['Izin', 'Sakit', 'Pulang'].includes(status);
  };

  return (
    <div className="riwayat-page">
      <NavbarPengurus />
      
      <main className="riwayat-main">
        {/* Top Controls */}
        <div className="top-controls" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Date Range Picker */}
          <div className="riwayat-month-picker">
            <button 
              className="riwayat-month-picker-button"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#000000" />
                <span>Periode: {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}</span>
              </div>
              <ChevronDown 
                size={24}
                color="#000000"
                style={{ 
                  transform: showDatePicker ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>

            {showDatePicker && (
              <div className="riwayat-month-picker-dropdown riwayat-animate-slideUp">
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem' }}>
                  Pilih Rentang Tanggal
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Dari Tanggal:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      max={maxDate}
                      onChange={handleStartDateChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background:'#ffffff',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Sampai Tanggal:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      max={maxDate}
                      onChange={handleEndDateChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#ffffff',
                        border: '2px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleDateApply}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1e3a8a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#1e40af'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#1e3a8a'}
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student Picker */}
          <div className="riwayat-month-picker">
            <button 
              className="riwayat-month-picker-button"
              onClick={() => setShowStudentPicker(!showStudentPicker)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#000000" />
                <span>Siswa: {getSelectedStudentName()}</span>
              </div>
              <ChevronDown 
                size={24}
                color="#000000"
                style={{ 
                  transform: showStudentPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>

            {showStudentPicker && (
              <div className="riwayat-month-picker-dropdown riwayat-animate-slideUp" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem' }}>
                  Pilih Siswa
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleStudentSelect(0)}
                    style={{
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '0.5rem',
                      background: selectedStudent === 0 ? '#1e3a8a' : '#f3f4f6',
                      color: selectedStudent === 0 ? 'white' : '#374151',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Semua Siswa
                  </button>
                  {studentList.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleStudentSelect(student.id)}
                      style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        background: selectedStudent === student.id ? '#1e3a8a' : '#f3f4f6',
                        color: selectedStudent === student.id ? 'white' : '#374151',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {student.name} ({student.nis})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="pengurus-stats-wrapper">
          <div className="pengurus-stats-grid">
            <div className="pengurus-stat-box box-hadir">
              <div className="pengurus-stat-title">Hadir</div>
              <div className="pengurus-stat-number">{stats.hadir}</div>
            </div>
            <div className="pengurus-stat-box box-terlambat">
              <div className="pengurus-stat-title">Terlambat</div>
              <div className="pengurus-stat-number">{stats.terlambat}</div>
            </div>
            <div className="pengurus-stat-box box-izin">
              <div className="pengurus-stat-title">Izin</div>
              <div className="pengurus-stat-number">{stats.izin}</div>
            </div>
            <div className="pengurus-stat-box box-sakit">
              <div className="pengurus-stat-title">Sakit</div>
              <div className="pengurus-stat-number">{stats.sakit}</div>
            </div>
            <div className="pengurus-stat-box box-alpha">
              <div className="pengurus-stat-title">Alpha</div>
              <div className="pengurus-stat-number">{stats.alpha}</div>
            </div>
            <div className="pengurus-stat-box box-pulang">
              <div className="pengurus-stat-title">Pulang</div>
              <div className="pengurus-stat-number">{stats.pulang}</div>
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

        {/* Table Card */}
        {!isLoading && attendanceRecords.length > 0 ? (
          <div className="table-card">
            {/* Table Header */}
            <div className="table-header" style={{ gridTemplateColumns: '60px 200px 130px 150px 1fr 1.5fr 150px 100px' }}>
              <div>No</div>
              <div>Nama Siswa</div>
              <div>Tanggal</div>
              <div>Jam Pelajaran</div>
              <div>Mata Pelajaran</div>
              <div>Guru</div>
              <div>Status</div>
              <div>Detail</div>
            </div>

            {/* Table Rows */}
            {attendanceRecords.map((record, index) => (
              <div key={index} className="table-row" style={{ gridTemplateColumns: '60px 200px 130px 150px 1fr 1.5fr 150px 100px' }}>
                <div className="table-cell">{index + 1}</div>
                <div className="table-cell" style={{ fontWeight: '600' }}>{record.studentName}</div>
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
            <p>untuk {getSelectedStudentName()} - {formatDateDisplay(startDate)} sampai {formatDateDisplay(endDate)}</p>
          </div>
        )}
      </main>

      {/* Modal Detail */}
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
                <span className="detail-label">Nama Siswa:</span>
                <span className="detail-value">{selectedRecord.studentName}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">NIS:</span>
                <span className="detail-value">{selectedRecord.nis}</span>
              </div>

              <div className="detail-divider"></div>

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
                    <span className="detail-value">{selectedRecord.reason}</span>
                  </div>
                </>
              )}

              {/* Bukti Foto Section */}
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

      {/* Image Zoom Modal */}
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