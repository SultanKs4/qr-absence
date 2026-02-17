import { useState, useEffect, useMemo } from 'react';
import StaffLayout from '../../component/WakaStaff/StaffLayout';
import { Select } from '../../component/Shared/Select';
import { Table } from '../../component/Shared/Table';
import { Download, FileText, ArrowLeft, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { attendanceService, type ClassAttendanceResponse } from '../../services/attendanceService';

interface DetailSiswaStaffProps {
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string, payload?: any) => void;
  selectedKelas: string;
  payload?: any; // Contains kelasId from JadwalKelasStaff
  onNavigateToRecap?: () => void;
  kelasId?: string;
  onBack?: () => void;
}

// Interface for table row data
interface AttendanceRow {
  no: number;
  nama: string;
  nisn: string;
  status: string;
  waktu: string;
}

export default function DetailSiswaStaff({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  selectedKelas,
  payload,
  onNavigateToRecap
}: DetailSiswaStaffProps) {
  // State for data
  const [attendanceData, setAttendanceData] = useState<ClassAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<string[]>([]); // Array of date strings YYYY-MM-DD
  
  // State for filters
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [currentGuru, setCurrentGuru] = useState('');
  
  // State for UI
  const [notification, setNotification] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  // Generate last 7 days for date filter
  useEffect(() => {
    const today = new Date();
    const dateList = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dateList.push(d.toISOString().split('T')[0]);
    }
    setDates(dateList);
    setSelectedTanggal(dateList[0]);
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    if (selectedTanggal && payload?.kelasId) {
        fetchAttendance(payload.kelasId, selectedTanggal);
    }
  }, [selectedTanggal, payload?.kelasId]);

  const fetchAttendance = async (classId: string, date: string) => {
    setLoading(true);
    setAttendanceData(null);
    try {
        const data = await attendanceService.getDailyClassAttendance(classId, date);
        setAttendanceData(data);
        
        // Reset selected mapel if it doesn't exist in new data
        if (data.items.length > 0) {
            // Select first subject by default if not already selected or invalid
             if (!selectedMapel || !data.items.find(item => item.schedule.subject_name === selectedMapel)) {
                 const firstItem = data.items[0];
                 setSelectedMapel(firstItem.schedule.subject_name);
                 setCurrentGuru(firstItem.schedule.teacher.user.name);
             }
        } else {
            setSelectedMapel('');
            setCurrentGuru('');
        }

    } catch (error) {
        console.error("Failed to fetch attendance:", error);
        showNotification('error', 'Gagal memuat data kehadiran');
    } finally {
        setLoading(false);
    }
  };

  // Update Guru when Mapel changes
  useEffect(() => {
      if (attendanceData && selectedMapel) {
          const scheduleItem = attendanceData.items.find(
              item => item.schedule.subject_name === selectedMapel
          );
          if (scheduleItem) {
              setCurrentGuru(scheduleItem.schedule.teacher.user.name);
          }
      }
  }, [selectedMapel, attendanceData]);


  // Derived Data for Dropdowns
  const tanggalOptions = dates.map(date => ({
      label: new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      value: date
  }));

  const mapelOptions = useMemo(() => {
      if (!attendanceData) return [];
      return attendanceData.items.map(item => ({
          label: `${item.schedule.subject_name} (${item.schedule.start_time.slice(0, 5)} - ${item.schedule.end_time.slice(0, 5)})`,
          value: item.schedule.subject_name
      }));
  }, [attendanceData]);


  // Filtered Rows for Table
  const filteredRows: AttendanceRow[] = useMemo(() => {
      if (!attendanceData || !selectedMapel) return [];

      const scheduleItem = attendanceData.items.find(
          item => item.schedule.subject_name === selectedMapel
      );

      if (!scheduleItem) return [];

      return scheduleItem.attendances.map((att, index) => ({
          no: index + 1,
          nama: att.student.user.name,
          nisn: att.student.nisn,
          status: att.status,
          waktu: att.checked_in_at ? att.checked_in_at.split(' ')[1].slice(0, 5) : '-'
      }));

  }, [attendanceData, selectedMapel]);


  const showNotification = (type: 'error' | 'success', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleBack = () => {
    onMenuClick('jadwal-kelas');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(`Laporan Kehadiran - ${selectedKelas}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Tanggal: ${new Date(selectedTanggal).toLocaleDateString('id-ID')}`, 14, 30);
    doc.text(`Mata Pelajaran: ${selectedMapel}`, 14, 36);
    doc.text(`Guru: ${currentGuru}`, 14, 42);

    // Table
    (doc as any).autoTable({
      startY: 50,
      head: [['No', 'Nama Siswa', 'NISN', 'Status', 'Waktu Hadir']],
      body: filteredRows.map(row => [
        row.no,
        row.nama,
        row.nisn,
        row.status,
        row.waktu
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Presensi_${selectedKelas}_${selectedTanggal}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['No,Nama Siswa,NISN,Status,Waktu Hadir'];
    const rows = filteredRows.map(row => 
      `${row.no},"${row.nama}","${row.nisn}",${row.status},${row.waktu}`
    );
    
    const csvContent = [
        `Kelas: ${selectedKelas}`,
        `Tanggal: ${selectedTanggal}`,
        `Mata Pelajaran: ${selectedMapel}`,
        `Guru: ${currentGuru}`,
        '',
        ...headers, 
        ...rows
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Presensi_${selectedKelas}_${selectedTanggal}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { key: 'no', label: 'No', width: '60px' },
    { key: 'nama', label: 'Nama Siswa' },
    { key: 'nisn', label: 'NISN' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => {
        let bg = '#F3F4F6';
        let color = '#374151';
        
        switch(value.toLowerCase()) {
          case 'present':
          case 'hadir':
            bg = '#D1FAE5';
            color = '#059669';
            break;
          case 'sick':
          case 'sakit':
            bg = '#FEF3C7';
            color = '#D97706';
            break;
          case 'permission':
          case 'izin':
            bg = '#DBEAFE';
            color = '#2563EB';
            break;
          case 'alpha':
          case 'alpa':
            bg = '#FEE2E2';
            color = '#DC2626';
            break;
        }
        
        return (
          <span style={{
            backgroundColor: bg,
            color: color,
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'capitalize'
          }}>
            {value === 'present' ? 'Hadir' : value}
          </span>
        );
      }
    },
    { key: 'waktu', label: 'Waktu Hadir' },
  ];

  return (
    <StaffLayout
      pageTitle="Detail Kehadiran Siswa"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
        {/* Notification */}
        {notification && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '16px 20px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out',
            backgroundColor: notification.type === 'error' ? '#FEE2E2' : '#ECFDF5',
            border: notification.type === 'error' ? '1px solid #FECACA' : '1px solid #A7F3D0',
          }}
        >
          <AlertCircle
            size={20}
            style={{
              color: notification.type === 'error' ? '#DC2626' : '#059669',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: notification.type === 'error' ? '#DC2626' : '#059669',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {notification.message}
          </span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 32,
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32,
        }}>
          <div>
            <button
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                marginBottom: 16,
                fontSize: 14,
                fontWeight: 500
              }}
            >
              <ArrowLeft size={18} />
              Kembali ke Jadwal
            </button>
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#111827',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              {selectedKelas}
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#6B7280',
                backgroundColor: '#F3F4F6',
                padding: '4px 12px',
                borderRadius: 6
              }}>
                Wali Kelas: {payload?.waliKelas || '-'}
              </span>
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => onNavigateToRecap && onNavigateToRecap()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                backgroundColor: '#062A4A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <CalendarIcon size={18} />
              Lihat Rekap Bulanan
            </button>
            <button
              onClick={exportCSV}
              disabled={loading || filteredRows.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading || filteredRows.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading || filteredRows.length === 0 ? 0.6 : 1
              }}
            >
              <FileText size={18} />
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              disabled={loading || filteredRows.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                backgroundColor: '#0B2948',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: loading || filteredRows.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading || filteredRows.length === 0 ? 0.6 : 1
              }}
            >
              <Download size={18} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
          marginBottom: 32,
          backgroundColor: '#F9FAFB',
          padding: 20,
          borderRadius: 8,
          border: '1px solid #F3F4F6'
        }}>
          <Select
            label="Pilih Tanggal"
            value={selectedTanggal}
            onChange={setSelectedTanggal}
            options={tanggalOptions}
            icon={<CalendarIcon size={18} />}
          />
          
          <Select
            label="Mata Pelajaran"
            value={selectedMapel}
            onChange={setSelectedMapel}
            options={mapelOptions}
            placeholder={loading ? "Memuat jadwal..." : "Pilih Mata Pelajaran"}
            disabled={loading || mapelOptions.length === 0}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                color: '#0B2948'
              }}>
                Guru Pengampu
              </div>
            </label>
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#E5E7EB',
              borderRadius: 8,
              color: '#4B5563',
              fontSize: 14,
              border: '1px solid #D1D5DB',
              height: 42,
              display: 'flex',
              alignItems: 'center'
            }}>
              {currentGuru || '-'}
            </div>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={filteredRows}
          keyField="no"
          emptyMessage={loading ? "Memuat data presensi..." : "Tidak ada data presensi siswa."}
        />
      </div>
    </StaffLayout>
  );
}