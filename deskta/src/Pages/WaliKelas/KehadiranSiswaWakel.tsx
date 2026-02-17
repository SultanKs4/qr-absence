import { useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceService } from '../../services/attendanceService';
import classService from '../../services/classService';
import WalikelasLayout from '../../component/Walikelas/layoutwakel';
// Removed unused imports if any, but WalikelasLayout is used.
import { ChevronDown, Calendar, BookOpen, FileText, X, Edit } from 'lucide-react';

import { FormModal } from '../../component/Shared/FormModal';
import { Select } from '../../component/Shared/Select';


// STATUS COLOR PALETTE - High Contrast for Accessibility
const STATUS_COLORS = {
  hadir: '#1FA83D',   // HIJAU - Hadir
  izin: '#ACA40D',    // KUNING - Izin
  sakit: '#520C8F',   // UNGU - Sakit
  alfa: '#D90000',   // MERAH - Alfa
  pulang: '#2F85EB',  // BIRU - Pulang
};

type StatusType = 'hadir' | 'izin' | 'sakit' | 'alfa' | 'pulang';

interface KehadiranRow {
  id: string;
  nisn: string;
  namaSiswa: string;
  mataPelajaran: string;
  namaGuru: string;
  tanggal: string;
  status: StatusType;
  keterangan?: string;
  jamPelajaran?: string;
  waktuHadir?: string;
  buktiFoto1?: string;
  buktiFoto2?: string;
  isPerizinanPulang?: boolean;
}

interface KehadiranSiswaWakelProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
}

export function KehadiranSiswaWakel({
  user,
  onLogout,
  currentPage,
  onMenuClick,
}: KehadiranSiswaWakelProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedMapel, setSelectedMapel] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState('');


  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;


  const [rows, setRows] = useState<KehadiranRow[]>([]);
  const [kelasInfoData, setKelasInfoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Class Info
  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        const data = await classService.getMyClass();
        setKelasInfoData(data);
      } catch (error) {
        console.error("Failed to fetch class info", error);
      }
    };
    fetchClassInfo();
  }, []);

  // Fetch Attendance Data
  const fetchAttendance = useCallback(async () => {
    if (!kelasInfoData) return;

    setLoading(true);
    try {
      // Use selectedDate if available, otherwise current formatted date (backend likely expects YYYY-MM-DD or similar)
      // The backend endpoint myHomeroomAttendance uses 'from' and 'to' or just filters by date if we pass it? 
      // Checking endpoint: myHomeroomAttendance filters by 'from', 'to', 'status'.
      // If we want daily attendance, we should pass from=DATE & to=DATE.
      
      const dateToFetch = selectedDate || formatDateForBackend(new Date());
      
      const response = await attendanceService.getMyHomeroomAttendance({
        from: dateToFetch,
        to: dateToFetch
      });

      // Response is array of Attendance objects
      // We need to map to KehadiranRow
      // Attendance object: { id, status, date, time, student: { user: { name }, nisn }, schedule: { subject: { name }, teacher: { user: { name } } } }
      
      const mappedRows: KehadiranRow[] = response.map((item: any) => ({
        id: String(item.id),
        nisn: item.student?.nisn || '-',
        namaSiswa: item.student?.user?.name || '-',
        mataPelajaran: item.schedule?.subject?.name || '-',
        namaGuru: item.schedule?.teacher?.user?.name || '-',
        tanggal: formatDateDisplay(item.date), // Convert YYYY-MM-DD to DD-MM-YYYY
        status: item.status.toLowerCase() as StatusType,
        keterangan: item.notes || item.attachment_path ? 'Ada Lampiran' : '-', 
        jamPelajaran: `${item.schedule?.start_time?.substring(0,5)} - ${item.schedule?.end_time?.substring(0,5)}`,
        waktuHadir: item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-',
        buktiFoto1: item.attachment_path ? item.attachment_path : undefined, // Assuming attachment_path is relative or needs URL mapping. Ideally backend returns full URL or we handle it.
      }));
      
      setRows(mappedRows);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, kelasInfoData]);

  useEffect(() => {
    if (kelasInfoData) {
      fetchAttendance();
    }
  }, [kelasInfoData, fetchAttendance]); 

  // Format Helper
  const formatDateDisplay = (dateString: string) => {
    if(!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  const formatDateForBackend = (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  
  const kelasInfo = {
    namaKelas: kelasInfoData ? kelasInfoData.name : 'Memuat...',
    tanggal: selectedDate ? formatDateDisplay(selectedDate) : formattedDate,
  };



  // Removed local storage listener
  /*
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  */
 useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const mapelOptions = useMemo(() => {
    const mapelSet = new Set(
      rows.map((r) => r.mataPelajaran).filter((v) => v && v !== '-')
    );
    return [
      { label: 'Semua Mata Pelajaran', value: 'all' },
      ...Array.from(mapelSet).map((mapel) => ({
        label: mapel,
        value: mapel,
      })),
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    let filtered = selectedMapel === 'all' 
      ? rows 
      : rows.filter((r) => r.mataPelajaran === selectedMapel);
    
    if (selectedDate) {
      filtered = filtered.filter((r) => r.tanggal === formatDateDisplay(selectedDate));
    }
    
    return filtered.map((row) => ({
      ...row,
    }));
  }, [rows, selectedMapel, selectedDate]);

  const totalHadir = filteredRows.filter((r) => r.status === 'hadir').length;
  const totalIzin = filteredRows.filter((r) => r.status === 'izin').length;
  const totalSakit = filteredRows.filter((r) => r.status === 'sakit').length;
  const totalAlfa = filteredRows.filter((r) => r.status === 'alfa').length;
  const totalPulang = filteredRows.filter((r) => r.status === 'pulang').length;



  const getMinMaxDateForFilter = () => {
    const startYear = 2026;
    const maxYear = 2030;
    
    return {
      minDate: `${startYear}-01-01`,
      maxDate: `${maxYear}-12-31`
    };
  };

  const handleStatusClick = (siswa: KehadiranRow) => {
    setEditingRow(siswa);
    setEditStatus(siswa.status);
    setEditKeterangan(siswa.keterangan || '');
    setIsEditOpen(true);
  };

  const StatusButton = ({ status, siswa }: { status: StatusType; siswa: KehadiranRow }) => {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#1FA83D';
    const label = status === 'alfa' ? 'Alfa' :
                  status === 'sakit' ? 'Sakit' :
                  status === 'izin' ? 'Izin' :
                  status === 'hadir' ? 'Hadir' :
                  'Pulang';
    
    return (
      <div
        onClick={() => handleStatusClick(siswa)}
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '13px',
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          minWidth: '100px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255,255,255,0.2)',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
        }}
      >
        <Edit size={14} />
        <span>{label}</span>
      </div>
    );
  };





  const [editingRow, setEditingRow] = useState<KehadiranRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<StatusType>('hadir');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { label: 'Hadir', value: 'hadir' as StatusType },
    { label: 'Sakit', value: 'sakit' as StatusType },
    { label: 'Izin', value: 'izin' as StatusType },
    { label: 'Alfa', value: 'alfa' as StatusType },
    { label: 'Pulang', value: 'pulang' as StatusType },
  ];



  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingRow(null);
    setEditKeterangan('');
    setIsSubmitting(false);
  };

  const handleSubmitEdit = () => {
    if (!editingRow) return;
    
    setIsSubmitting(true);
    
    if ((editStatus === 'pulang' || editStatus === 'izin' || editStatus === 'sakit') && !editKeterangan.trim()) {
      alert(`⚠️ Mohon isi keterangan untuk status ${editStatus}`);
      setIsSubmitting(false);
      return;
    }
    
    setTimeout(() => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingRow.id 
            ? { 
                ...r, 
                status: editStatus,
                keterangan: editKeterangan.trim(),
                waktuHadir: editStatus === 'hadir' ? '07:30 WIB' : undefined
              } 
            : r
        )
      );
      setIsSubmitting(false);
      setIsEditOpen(false);
      setEditingRow(null);
      setEditKeterangan('');
      alert('✅ Status kehadiran berhasil diperbarui!');
    }, 300);
  };



  const handleOpenDatePicker = () => {
    setTempDate(selectedDate || formattedDate);
    setShowDatePicker(true);
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
    setTempDate('');
  };

  const handleApplyDate = () => {
    if (tempDate) {
      setSelectedDate(tempDate);
    }
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setSelectedDate('');
    setShowDatePicker(false);
  };

  const parseDateToInput = (dateStr: string) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  };

  const formatInputToDate = (inputStr: string) => {
    if (!inputStr) return '';
    const [year, month, day] = inputStr.split('-');
    return `${day}-${month}-${year}`;
  };




  return (
    <WalikelasLayout
      pageTitle="Kehadiran Siswa"
      currentPage={currentPage as any}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      <div style={{ 
        position: 'relative',
        minHeight: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        padding: isMobile ? '16px' : '32px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
          }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={handleOpenDatePicker}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#0F172A',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '180px',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#FFFFFF" />
                  <span>
                    {kelasInfo.tanggal}
                  </span>
                </div>
                <ChevronDown size={14} color="#FFFFFF" />
              </button>
            </div>
            
            <div style={{
              backgroundColor: '#0F172A',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '12px',
              width: 'fit-content',
              minWidth: '250px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                left: -10,
                bottom: -20,
                width: 60,
                height: 60,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '50%'
              }} />

              <BookOpen size={24} color="#FFFFFF" />
              <div style={{ zIndex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{kelasInfo.namaKelas}</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Semua Mata Pelajaran</div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
            minWidth: isMobile ? '100%' : 'auto',
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
            }}>
              <button
                  onClick={() => {
                   fetchAttendance(); // Refresh button
                   // handleLihatRekap();
                  }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
              >
                <FileText size={15} />
                <span>Refresh</span>
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              gap: '20px',
              backgroundColor: '#F9FAFB',
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              maxWidth: 'fit-content',
              marginLeft: isMobile ? '0' : 'auto',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '50px',
              }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500', marginBottom: '2px' }}>Hadir</span>
                <span style={{ fontSize: '20px', color: '#1FA83D', fontWeight: '700' }}>{totalHadir}</span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '50px',
              }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500', marginBottom: '2px' }}>Izin</span>
                <span style={{ fontSize: '20px', color: '#ACA40D', fontWeight: '700' }}>{totalIzin}</span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '50px',
              }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500', marginBottom: '2px' }}>Sakit</span>
                <span style={{ fontSize: '20px', color: '#520C8F', fontWeight: '700' }}>{totalSakit}</span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '50px',
              }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500', marginBottom: '2px' }}>Alfa</span>
                <span style={{ fontSize: '20px', color: '#D90000', fontWeight: '700' }}>{totalAlfa}</span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '50px',
              }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500', marginBottom: '2px' }}>Pulang</span>
                <span style={{ fontSize: '20px', color: '#2F85EB', fontWeight: '700' }}>{totalPulang}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BookOpen size={18} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
              Filter Mata Pelajaran
            </span>
            <div style={{ width: '200px' }}>
              <Select
                value={selectedMapel}
                onChange={(val) => setSelectedMapel(val)}
                options={mapelOptions}
                placeholder="Pilih mata pelajaran"
              />
            </div>
          </div>
        </div>

        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          backgroundColor: 'white',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9' }}>
                <th style={{ ...styles.th, color: 'black' }}>No</th>
                <th style={{ ...styles.th, color: 'black' }}>NISN</th>
                <th style={{ ...styles.th, color: 'black' }}>Nama Siswa</th>
                <th style={{ ...styles.th, color: 'black' }}>Mata Pelajaran</th>
                <th style={{ ...styles.th, color: 'black' }}>Guru</th>
                <th style={{ ...styles.th, textAlign: 'center' as const, color: 'black' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} style={{
                  borderBottom: '1px solid #E5E7EB',
                  backgroundColor: index % 2 === 0 ? '#F8FAFC' : 'white'
                }}>
                  <td style={styles.td}>{index + 1}.</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '15px' }}>{row.nisn}</td>
                  <td style={{ ...styles.td, fontWeight: '700', color: '#111827' }}>{row.namaSiswa}</td>
                  <td style={styles.td}>{row.mataPelajaran}</td>
                  <td style={styles.td}>{row.namaGuru}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <StatusButton status={row.status} siswa={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRows.length === 0 && (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '8px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
                📝 Belum ada data kehadiran siswa.
              </p>
            </div>
          )}
        </div>
      </div>

      {showDatePicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                Pilih Tanggal
              </h2>
              <button
                onClick={handleCloseDatePicker}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
              }}>
                Pilih Tanggal
              </label>
              <input
                type="date"
                value={parseDateToInput(tempDate)}
                onChange={(e) => setTempDate(formatInputToDate(e.target.value))}
                min={getMinMaxDateForFilter().minDate}
                max={getMinMaxDateForFilter().maxDate}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                }}
              />
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '11px', 
                color: '#6B7280', 
                fontStyle: 'italic' 
              }}>
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
            }}>
              {selectedDate && (
                <button
                  onClick={handleClearDate}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                >
                  Hapus Tanggal
                </button>
              )}
              <button
                onClick={handleApplyDate}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      <FormModal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        title="Edit Status Kehadiran"
        onSubmit={handleSubmitEdit}
        submitLabel="Simpan"
        isSubmitting={isSubmitting}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {editingRow && (
            <>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280' }}>
                  Nama Siswa
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {editingRow.namaSiswa}
                </p>
              </div>
              
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280' }}>
                  Mata Pelajaran
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {editingRow.mataPelajaran}
                </p>
              </div>
              
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280' }}>
                  Tanggal
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {editingRow.tanggal}
                </p>
              </div>
            </>
          )}
          
          <div>
            <p
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
              }}
            >
              Ubah Status Kehadiran
            </p>
            <Select
              value={editStatus}
              onChange={(val) => setEditStatus(val as StatusType)}
              options={statusOptions}
              placeholder="Pilih status kehadiran"
            />
          </div>
          
          {(editStatus === 'pulang' || editStatus === 'izin' || editStatus === 'sakit') && (
            <div>
              <p
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Keterangan
              </p>
              <textarea
                value={editKeterangan}
                onChange={(e) => setEditKeterangan(e.target.value)}
                placeholder={`Masukkan keterangan untuk status ${editStatus}`}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: '#FFFFFF',
                }}
                required
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6B7280', fontStyle: 'italic' }}>
                *Keterangan wajib diisi untuk status ini
              </p>
            </div>
          )}
        </div>
      </FormModal>
    </WalikelasLayout>
  );
}

const styles = {
  th: {
    padding: '16px',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.025em'
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#1F2937',
    verticalAlign: 'middle'
  }
};