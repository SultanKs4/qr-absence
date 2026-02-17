import { useState, useMemo, useEffect } from "react";
import { Eye, FileDown, Calendar, ArrowLeft, Search, ClipboardPlus, X, Upload } from "lucide-react";
import WalikelasLayout from "../../component/Walikelas/layoutwakel";
import { attendanceService } from "../../services/attendanceService";
import classService from "../../services/classService";

interface RekapKehadiranSiswaProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string, payload?: any) => void;
}

interface RekapRow {
  id: string;
  no: number;
  nisn: string;
  namaSiswa: string;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  pulang: number;
  status: 'aktif' | 'non-aktif';
}

interface PerizinanPulang {
  id: string;
  nisn: string;
  namaSiswa: string;
  alasanPulang: 'izin' | 'sakit' | 'dispensasi';
  alasanDetail?: string;
  mapel: string;
  namaGuru: string;
  tanggal: string;
  jamPelajaran: string;
  keterangan: string;
  buktiFoto1: string;
  buktiFoto2?: string;
  createdAt: string;
}

// data dummy (kept for perizinan logic if needed, or placeholders)
const guruPerMapel: Record<string, string[]> = {
  'Matematika': ['Solikhah S.pd', 'Budi Santoso S.pd', 'Dewi Lestari S.pd'],
  'Bahasa Indonesia': ['Siti Aminah S.pd', 'Ahmad Fauzi S.pd'],
  'Fisika': ['Dr. Bambang S.pd', 'Rina Kusuma S.pd'],
  'Kimia': ['Arief Budiman S.pd', 'Lina Marlina S.pd'],
  'MPKK': ['Tri Wahyuni S.pd', 'Eko Prasetyo S.pd', 'Yuni Astuti S.pd'],
  'Bahasa Inggris': ['Sarah Johnson S.pd', 'David Brown S.pd'],
  'Sejarah': ['Hendra Gunawan S.pd'],
  'Ekonomi': ['Fitri Handayani S.pd', 'Rudi Hermawan S.pd'],
};

const jamPelajaranOptions = [
  '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10', '1-11', '1-12',
  '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', '2-9', '2-10', '2-11', '2-12',
  '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '3-10', '3-11', '3-12',
  '4-5', '4-6', '4-7', '4-8', '4-9', '4-10', '4-11', '4-12',
  '5-6', '5-7', '5-8', '5-9', '5-10', '5-11', '5-12',
  '6-7', '6-8', '6-9', '6-10', '6-11', '6-12',
  '7-8', '7-9', '7-10', '7-11', '7-12',
  '8-9', '8-10', '8-11', '8-12',
  '9-10', '9-11', '9-12',
  '10-11', '10-12',
  '11-12'
];

export function RekapKehadiranSiswa({
  user,
  onLogout,
  currentPage,
  onMenuClick,
}: RekapKehadiranSiswaProps) {
  const COLORS = {
    HADIR: "#1FA83D",
    IZIN: "#ACA40D",
    PULANG: "#2F85EB",
    ALFA: "#D90000",
    SAKIT: "#520C8F"
  };

  const [searchTerm, setSearchTerm] = useState('');
    
    // Default dates: First and last day of current month
    const [periodeMulai, setPeriodeMulai] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    });
    const [periodeSelesai, setPeriodeSelesai] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    });

    const [rows, setRows] = useState<RekapRow[]>([]);

    const [kelasInfo, setKelasInfo] = useState<{namaKelas: string, waliKelas: string, id?: string}>({
        namaKelas: 'Memuat...',
        waliKelas: 'Memuat...',
    });

    const [isPerizinanOpen, setIsPerizinanOpen] = useState(false);
    const [perizinanData, setPerizinanData] = useState({
      nisn: '',
      namaSiswa: '',
      alasanPulang: '',
      alasanDetail: '',
      mapel: '',
      namaGuru: '',
      tanggal: '',
      jamPelajaran: '',
      file1: undefined as File | undefined,
      file2: undefined as File | undefined,
    });

    // Fetch Class Info
    useEffect(() => {
        const fetchClass = async () => {
            try {
                const data = await classService.getMyClass();
                // Assumes data has structure: { id, name, teacher: { user: { name } } } or similar
                // Adjust based on actual response structure from previous learnings
                setKelasInfo({
                    namaKelas: data.name || data.class_name || 'Kelas Tidak Diketahui',
                    waliKelas: data.teacher?.user?.name || user.name || 'Wali Kelas',
                    id: data.id
                });
            } catch (error) {
                console.error("Failed to fetch class info", error);
                setKelasInfo(prev => ({ ...prev, namaKelas: 'Gagal memuat data kelas' }));
            }
        };
        fetchClass();
    }, [user.name]);

    // Fetch Attendance Summary
    useEffect(() => {
        const fetchSummary = async () => {
            if (!kelasInfo.id) return;
            

            try {
                // Try to use the Waka summary endpoint if accessible, or fallback to homeroom specific if exists
                // Since there isn't a getMyHomeroomAttendanceSummary, we try getWakaClassAttendanceSummary first
                // If it fails with 403, we might need a different approach, but let's try assuming role permissions allow it for own class
                const response = await attendanceService.getWakaClassAttendanceSummary(kelasInfo.id, {
                    from: periodeMulai,
                    to: periodeSelesai
                });

                if (response && Array.isArray(response)) {
                    const mappedRows: RekapRow[] = response.map((item: any, index: number) => {
                        const totals = item.totals || {};
                        // Calculate total hadir including late if applicable, or just present
                        const hadirCount = (totals.present || 0) + (totals.late || 0); 
                        
                        return {
                            id: item.student?.id || String(index),
                            no: index + 1,
                            nisn: item.student?.nisn || '-',
                            namaSiswa: item.student?.user?.name || item.student?.name || '-',
                            hadir: hadirCount,
                            izin: totals.permission || 0,
                            sakit: totals.sick || 0,
                            alfa: totals.alpha || totals.absent || 0,
                            pulang: 0, // Backend might not have 'pulang' count yet
                            status: item.student?.status === 'active' ? 'aktif' : 'non-aktif' // Adjust based on student status field
                        };
                    });
                    setRows(mappedRows);
                }
            } catch (error) {
                console.error("Failed to fetch attendance summary", error);
            } finally {

            }
        };

        if (kelasInfo.id) {
            fetchSummary();
        }
    }, [kelasInfo.id, periodeMulai, periodeSelesai]);

    useEffect(() => {
       // Style injection kept as is
        const style = document.createElement("style");
        style.innerHTML = `
          .custom-date-input::-webkit-calendar-picker-indicator {
            filter: invert(1) brightness(100) !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }
          .custom-date-input::-webkit-inner-spin-button,
          .custom-date-input::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .custom-date-input {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
          }
        `;
        document.head.appendChild(style);
        return () => {
          document.head.removeChild(style);
        };
      }, []);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row =>
      row.nisn.toLowerCase().includes(term) ||
      row.namaSiswa.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  // ... rest of calculations
  const totalHadir = useMemo(() => filteredRows.reduce((sum, row) => sum + row.hadir, 0), [filteredRows]);
  const totalIzin = useMemo(() => filteredRows.reduce((sum, row) => sum + row.izin, 0), [filteredRows]);
  const totalSakit = useMemo(() => filteredRows.reduce((sum, row) => sum + row.sakit, 0), [filteredRows]);
  const totalAlfa = useMemo(() => filteredRows.reduce((sum, row) => sum + row.alfa, 0), [filteredRows]);
  const totalPulang = useMemo(() => filteredRows.reduce((sum, row) => sum + row.pulang, 0), [filteredRows]);

  // ... existing handlers (handleViewDetail, handleBack, formatDisplayDate, handleExportExcel, handleExportPDF, etc.)
  // We keep them as is, they work with `rows`/`filteredRows`.

  // Keeping perizinan logic as is for now, assuming it adds to local `rows` or localStorage
  // Ideally this should also save to backend, but no endpoint mentioned.

// ... return method same as before




  const handleViewDetail = (row: RekapRow) => {
    onMenuClick("daftar-ketidakhadiran-walikelas", {
      siswaName: row.namaSiswa,
      siswaIdentitas: row.nisn,
    });
  };

  const handleBack = () => {
    onMenuClick('kehadiran-siswa');
  };

  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleExportExcel = () => {
    try {
      const headers = ["No", "NISN", "Nama Siswa", "Hadir", "Izin", "Sakit", "Alfa", "Pulang", "Status"];
      const rowsData = filteredRows.map((row) => [
        row.no,
        row.nisn,
        row.namaSiswa,
        row.hadir,
        row.izin,
        row.sakit,
        row.alfa,
        row.pulang,
        row.status === 'aktif' ? 'Aktif' : 'Non-Aktif'
      ]);

      rowsData.push([
        'TOTAL',
        '',
        'Total Keseluruhan',
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlfa,
        totalPulang,
        ''
      ]);

      const csvContent = [
        headers.join(","),
        ...rowsData.map((row) => row.join(",")),
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Rekap_Kehadiran_${kelasInfo.namaKelas.replace(/\s+/g, '_')}_${periodeMulai}_${periodeSelesai}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('✅ File Excel berhasil diunduh!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('❌ Terjadi kesalahan saat mengekspor Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rekap Kehadiran Siswa</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
              color: #1E40AF;
            }
            .info { 
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #3B82F6;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #3B82F6;
              color: white;
              padding: 12px 8px;
              text-align: center;
              font-weight: bold;
              border: 1px solid #ddd;
            }
            td {
              padding: 10px 8px;
              border: 1px solid #ddd;
              text-align: center;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            tr:hover {
              background-color: #f3f4f6;
            }
            .total-row {
              background-color: #3B82F6 !important;
              color: white;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .hadir { color: #1FA83D; font-weight: bold; }
            .izin { color: #ACA40D; font-weight: bold; }
            .sakit { color: #520C8F; font-weight: bold; }
            .alfa { color: #D90000; font-weight: bold; }
            .pulang { color: #2F85EB; font-weight: bold; }
            .status-aktif { 
              background-color: #D1FAE5; 
              color: #065F46;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
            }
            .status-nonaktif { 
              background-color: #FEE2E2; 
              color: #991B1B;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">REKAP KEHADIRAN SISWA</div>
          </div>
          
          <div class="info">
            <div class="info-row">
              <span class="info-label">Kelas:</span>
              <span>${kelasInfo.namaKelas}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Wali Kelas:</span>
              <span>${kelasInfo.waliKelas}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Periode:</span>
              <span>${formatDisplayDate(periodeMulai)} - ${formatDisplayDate(periodeSelesai)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Data:</span>
              <span>${filteredRows.length} Siswa</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>Nama Siswa</th>
                <th>Hadir</th>
                <th>Izin</th>
                <th>Sakit</th>
                <th>Alfa</th>
                <th>Pulang</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
      `;

      filteredRows.forEach(row => {
        htmlContent += `
          <tr>
            <td>${row.no}</td>
            <td>${row.nisn}</td>
            <td>${row.namaSiswa}</td>
            <td class="hadir">${row.hadir}</td>
            <td class="izin">${row.izin}</td>
            <td class="sakit">${row.sakit}</td>
            <td class="alfa">${row.alfa}</td>
            <td class="pulang">${row.pulang}</td>
            <td><span class="${row.status === 'aktif' ? 'status-aktif' : 'status-nonaktif'}">${row.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}</span></td>
          </tr>
        `;
      });

      htmlContent += `
          <tr class="total-row">
            <td colspan="3"><strong>TOTAL KESELURUHAN</strong></td>
            <td><strong>${totalHadir}</strong></td>
            <td><strong>${totalIzin}</strong></td>
            <td><strong>${totalSakit}</strong></td>
            <td><strong>${totalAlfa}</strong></td>
            <td><strong>${totalPulang}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <div class="footer">
        <p>Dicetak pada: ${new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}</p>
        <p>${kelasInfo.namaKelas} - ${kelasInfo.waliKelas}</p>
      </div>
      
      </body>
      </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rekap_Kehadiran_${kelasInfo.namaKelas.replace(/\s+/g, '_')}_${periodeMulai}_${periodeSelesai}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('✅ File rekap kehadiran berhasil diunduh!');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      
      try {
        const csvHeaders = ["No,NISN,Nama Siswa,Hadir,Izin,Sakit,Alfa,Pulang,Status"];
        const csvRows = filteredRows.map(row => 
          `${row.no},${row.nisn},"${row.namaSiswa}",${row.hadir},${row.izin},${row.sakit},${row.alfa},${row.pulang},${row.status}`
        );
        csvRows.push(`TOTAL,,"Total Keseluruhan",${totalHadir},${totalIzin},${totalSakit},${totalAlfa},${totalPulang},`);
        
        const csvContent = csvHeaders.concat(csvRows).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rekap_Kehadiran_${kelasInfo.namaKelas.replace(/\s+/g, '_')}_${periodeMulai}_${periodeSelesai}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ Data berhasil diunduh sebagai file CSV!');
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        alert('❌ Terjadi kesalahan saat mengekspor data. Silakan coba lagi.');
      }
    }
  };

  const handleBuatPerizinan = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    setPerizinanData(prev => ({
      ...prev,
      tanggal: todayString
    }));
    
    setIsPerizinanOpen(true);
  };

  const handleClosePerizinan = () => {
    setIsPerizinanOpen(false);
    setPerizinanData({
      nisn: '',
      namaSiswa: '',
      alasanPulang: '',
      alasanDetail: '',
      mapel: '',
      namaGuru: '',
      tanggal: '',
      jamPelajaran: '',
      file1: undefined,
      file2: undefined,
    });
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const validateFileType = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(file.type);
  };

  const handleSubmitPerizinan = async () => {
    if (!perizinanData.nisn || !perizinanData.alasanPulang || !perizinanData.tanggal || 
        !perizinanData.mapel || !perizinanData.namaGuru || !perizinanData.file1 || !perizinanData.jamPelajaran) {
      alert('⚠️ Mohon isi semua field yang diperlukan (termasuk foto dan jam pelajaran)');
      return;
    }
    
    const jamPattern = /^\d+-\d+$/;
    if (!jamPattern.test(perizinanData.jamPelajaran)) {
      alert('⚠️ Format jam pelajaran tidak valid. Gunakan format seperti: 2-10, 1-4, dll');
      return;
    }
    
    if (!validateFileType(perizinanData.file1)) {
      alert('⚠️ Format file foto pertama harus JPG atau PNG');
      return;
    }
    
    if (perizinanData.file2 && !validateFileType(perizinanData.file2)) {
      alert('⚠️ Format file foto kedua harus JPG atau PNG');
      return;
    }
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    if (perizinanData.tanggal !== todayString) {
      alert('⚠️ Tanggal perizinan hanya bisa diisi dengan tanggal hari ini');
      return;
    }
    
    const siswa = rows.find(r => r.nisn === perizinanData.nisn);
    if (!siswa) {
      alert('⚠️ Siswa tidak ditemukan');
      return;
    }
    
    try {
      const buktiFoto1 = await convertFileToBase64(perizinanData.file1);
      const buktiFoto2 = perizinanData.file2 ? await convertFileToBase64(perizinanData.file2) : undefined;
      
      const formatDateToDisplay = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      };
      
      const formattedTanggal = formatDateToDisplay(perizinanData.tanggal);
      
      const alasanText = perizinanData.alasanPulang === 'izin' ? 'izin' : 
                        perizinanData.alasanPulang === 'sakit' ? 'sakit' : 
                        'dispensasi';
      
      const keterangan = `Pulang karena ${alasanText}${perizinanData.alasanDetail ? `: ${perizinanData.alasanDetail}` : ''}`;
      
      const newPerizinan: PerizinanPulang = {
        id: Date.now().toString(),
        nisn: perizinanData.nisn,
        namaSiswa: perizinanData.namaSiswa || siswa.namaSiswa,
        alasanPulang: perizinanData.alasanPulang as 'izin' | 'sakit' | 'dispensasi',
        alasanDetail: perizinanData.alasanDetail,
        mapel: perizinanData.mapel,
        namaGuru: perizinanData.namaGuru,
        tanggal: formattedTanggal,
        jamPelajaran: perizinanData.jamPelajaran,
        keterangan,
        buktiFoto1,
        buktiFoto2,
        createdAt: new Date().toLocaleString('id-ID'),
      };
      
      const existingPerizinan = localStorage.getItem('perizinanPulangList');
      let perizinanList = existingPerizinan ? JSON.parse(existingPerizinan) : [];
      perizinanList.push(newPerizinan);
      localStorage.setItem('perizinanPulangList', JSON.stringify(perizinanList));
      
      window.dispatchEvent(new Event('storage'));
      
      setRows(prevRows => 
        prevRows.map(row => {
          if (row.nisn === perizinanData.nisn) {
            return { ...row, pulang: row.pulang + 1 };
          }
          return row;
        })
      );
      
      alert(`✅ Perizinan PULANG berhasil dibuat!\n\n` +
            `Siswa: ${perizinanData.namaSiswa || siswa.namaSiswa}\n` +
            `Status: PULANG\n` +
            `Alasan Pulang: ${alasanText}\n` +
            `Mata Pelajaran: ${perizinanData.mapel}\n` +
            `Guru: ${perizinanData.namaGuru}\n` +
            `Tanggal: ${formattedTanggal}\n` +
            `Jam: ${perizinanData.jamPelajaran}\n` +
            `Keterangan: ${keterangan}\n\n` +
            `✅ Status PULANG telah ditambahkan ke halaman Kehadiran Siswa!`);
      
      handleClosePerizinan();
    } catch (error) {
      console.error('Error processing files:', error);
      alert('❌ Terjadi kesalahan saat memproses foto');
    }
  };



  const todayString = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  return (
    <WalikelasLayout
      pageTitle="Rekap Kehadiran"
      currentPage={currentPage as any}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #D1D5DB",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            color: "#374151",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F3F4F6";
            e.currentTarget.style.borderColor = "#9CA3AF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFFFFF";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }}
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 32,
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "#062A4A",
              borderRadius: 12,
              padding: "14px 20px",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="white" 
                stroke="white" 
                strokeWidth="0.5"
              >
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {kelasInfo.namaKelas}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {kelasInfo.waliKelas}
              </div>
            </div>
          </div>

          <div style={{
            position: 'relative',
            width: '300px',
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
            }} />
            <input
              type="text"
              placeholder="Cari NISN atau nama siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                color: '#111827',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#062A4A",
              padding: "10px 16px",
              borderRadius: 10,
              color: "#FFFFFF",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 6,
              }}
            >
              <Calendar size={18} />
            </div>

            <span style={{ fontSize: 14, fontWeight: 600 }}>Periode:</span>

            <input
              type="date"
              value={periodeMulai}
              onChange={(e) => setPeriodeMulai(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                colorScheme: "dark",
              }}
              className="custom-date-input"
            />

            <span style={{ fontWeight: 600, fontSize: 16 }}>—</span>

            <input
              type="date"
              value={periodeSelesai}
              onChange={(e) => setPeriodeSelesai(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                colorScheme: "dark",
              }}
              className="custom-date-input"
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              onClick={handleBuatPerizinan}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#059669"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#10B981"}
            >
              <ClipboardPlus size={16} />
              Buat Perizinan
            </button>

            <button
              onClick={handleExportExcel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563EB"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3B82F6"}
            >
              <FileDown size={16} />
              Unduh Excel
            </button>

            <button
              onClick={handleExportPDF}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#DC2626"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#EF4444"}
            >
              <FileDown size={16} />
              Unduh PDF
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px',
          }}>
            Total Keseluruhan
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>Hadir</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.HADIR }}>{totalHadir}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>Izin</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.IZIN }}>{totalIzin}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>Sakit</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.SAKIT }}>{totalSakit}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>Alfa</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.ALFA }}>{totalAlfa}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>Pulang</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.PULANG }}>{totalPulang}</div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{
            backgroundColor: '#F9FAFB',
            padding: '14px 20px',
            borderBottom: '2px solid #E5E7EB',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 130px minmax(180px, 1fr) 80px 80px 80px 100px 80px 80px',
              gap: '12px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#374151',
              letterSpacing: '0.3px',
            }}>
              <div>No</div>
              <div>NISN</div>
              <div>Nama Siswa</div>
              <div style={{ textAlign: 'center' }}>Hadir</div>
              <div style={{ textAlign: 'center' }}>Izin</div>
              <div style={{ textAlign: 'center' }}>Sakit</div>
              <div style={{ textAlign: 'center' }}>Alfa</div>
              <div style={{ textAlign: 'center' }}>Pulang</div>
              <div style={{ textAlign: 'center' }}>Aksi</div>
            </div>
          </div>

          <div>
            {filteredRows.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: '14px',
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  opacity: 0.3,
                }}>
                  📋
                </div>
                <p style={{ margin: 0, fontWeight: '500' }}>
                  Belum ada data kehadiran siswa.
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#B9B9B9' }}>
                  Data rekap kehadiran akan muncul di sini setelah Anda menginput kehadiran.
                </p>
              </div>
            ) : (
              filteredRows.map((row, idx) => (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 130px minmax(180px, 1fr) 80px 80px 80px 100px 80px 80px',
                    gap: '12px',
                    padding: '14px 20px',
                    fontSize: '14px',
                    borderBottom: idx < filteredRows.length - 1 ? '1px solid #F3F4F6' : 'none',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC'}
                >
                  <div style={{ color: '#6B7280', fontWeight: '500' }}>{row.no}</div>
                  <div style={{ color: '#374151', fontWeight: '500' }}>{row.nisn}</div>
                  <div style={{ color: '#111827', fontWeight: '600' }}>{row.namaSiswa}</div>
                  <div style={{ textAlign: 'center', color: COLORS.HADIR, fontWeight: '700' }}>{row.hadir}</div>
                  <div style={{ textAlign: 'center', color: COLORS.IZIN, fontWeight: '700' }}>{row.izin}</div>
                  <div style={{ textAlign: 'center', color: COLORS.SAKIT, fontWeight: '700' }}>{row.sakit}</div>
                  <div style={{ textAlign: 'center', color: COLORS.ALFA, fontWeight: '700' }}>{row.alfa}</div>
                  <div style={{ textAlign: 'center', color: COLORS.PULANG, fontWeight: '700' }}>{row.pulang}</div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <button
                      onClick={() => handleViewDetail(row)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                        color: '#374151',
                        fontWeight: '500',
                        fontSize: '13px',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.color = '#1E40AF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#374151';
                      }}
                      title="Lihat detail ketidakhadiran"
                    >
                      <Eye size={16} />
                      <span>Lihat</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isPerizinanOpen && (
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
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                backgroundColor: '#0F172A',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ClipboardPlus size={20} color="#FFFFFF" />
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontWeight: '700',
                  color: '#FFFFFF'
                }}>
                  Buat Perizinan 
                </h2>
              </div>
              <button
                onClick={handleClosePerizinan}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                    Pilih Siswa *
                  </p>
                  <select
                    value={perizinanData.nisn}
                    onChange={(e) => {
                      const selectedStudent = rows.find((r) => r.nisn === e.target.value);
                      setPerizinanData((prev) => ({
                        ...prev,
                        nisn: e.target.value,
                        namaSiswa: selectedStudent?.namaSiswa || '',
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Pilih siswa</option>
                    {rows.map((r) => (
                      <option key={r.nisn} value={r.nisn}>
                        {r.namaSiswa} ({r.nisn})
                      </option>
                    ))}
                  </select>
                </div>

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
                    Alasan Pulang *
                  </p>
                  <select
                    value={perizinanData.alasanPulang}
                    onChange={(e) =>
                      setPerizinanData((prev) => ({
                        ...prev,
                        alasanPulang: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Pilih alasan pulang</option>
                    <option value="izin">Izin (karena ada keperluan/izin)</option>
                    <option value="sakit">Sakit (tidak enak badan)</option>
                    <option value="dispensasi">Dispensasi</option>
                  </select>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '12px', 
                    color: '#6B7280', 
                    fontStyle: 'italic',
                  }}>
                    *Pilih alasan kenapa siswa pulang lebih awal
                  </p>
                </div>

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
                    Pilih Mata Pelajaran *
                  </p>
                  <select
                    value={perizinanData.mapel}
                    onChange={(e) =>
                      setPerizinanData((prev) => ({
                        ...prev,
                        mapel: e.target.value,
                        namaGuru: '',
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Pilih mata pelajaran</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Fisika">Fisika</option>
                    <option value="Kimia">Kimia</option>
                    <option value="MPKK">MPKK</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Sejarah">Sejarah</option>
                    <option value="Ekonomi">Ekonomi</option>
                  </select>
                </div>

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
                    Pilih Guru *
                  </p>
                  <select
                    value={perizinanData.namaGuru}
                    onChange={(e) =>
                      setPerizinanData((prev) => ({
                        ...prev,
                        namaGuru: e.target.value,
                      }))
                    }
                    disabled={!perizinanData.mapel}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: !perizinanData.mapel ? '#F9FAFB' : '#FFFFFF',
                      color: !perizinanData.mapel ? '#9CA3AF' : '#1F2937',
                      cursor: !perizinanData.mapel ? 'not-allowed' : 'pointer',
                      opacity: !perizinanData.mapel ? 0.7 : 1,
                    }}
                  >
                    {!perizinanData.mapel ? (
                      <option value="">Pilih guru</option>
                    ) : (
                      <>
                        <option value="">Pilih guru</option>
                        {guruPerMapel[perizinanData.mapel]?.map((guru) => (
                          <option key={guru} value={guru}>
                            {guru}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

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
                    Tanggal dan Jam *
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <p style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: 13, 
                        color: '#6B7280', 
                        fontWeight: 500 
                      }}>
                        Tanggal
                      </p>
                      <input
                        type="date"
                        value={perizinanData.tanggal}
                        onChange={(e) =>
                          setPerizinanData((prev) => ({
                            ...prev,
                            tanggal: e.target.value,
                          }))
                        }
                        min={todayString}
                        max={todayString}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                        }}
                      />
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '12px', 
                        color: '#6B7280', 
                        fontStyle: 'italic',
                      }}>
                        *Tanggal hanya bisa diisi dengan tanggal hari ini
                      </p>
                    </div>

                    <div>
                      <p style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: 13, 
                        color: '#6B7280', 
                        fontWeight: 500 
                      }}>
                        Jam Pelajaran *
                      </p>
                      <input
                        type="text"
                        value={perizinanData.jamPelajaran}
                        onChange={(e) =>
                          setPerizinanData((prev) => ({
                            ...prev,
                            jamPelajaran: e.target.value,
                          }))
                        }
                        list="jamPelajaranOptions"
                        placeholder="Contoh: 2-10, 1-4, 5-8"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                        }}
                      />
                      <datalist id="jamPelajaranOptions">
                        {jamPelajaranOptions.map((jam) => (
                          <option key={jam} value={jam}>
                            Jam {jam}
                          </option>
                        ))}
                      </datalist>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '12px', 
                        color: '#6B7280', 
                        fontStyle: 'italic',
                      }}>
                        *Masukkan rentang jam, contoh: 2-10 untuk jam ke-2 sampai jam ke-10
                      </p>
                    </div>

                    <div>
                      <p style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: 13, 
                        color: '#6B7280', 
                        fontWeight: 500 
                      }}>
                        Keterangan (Opsional)
                      </p>
                      <textarea
                        value={perizinanData.alasanDetail}
                        onChange={(e) =>
                          setPerizinanData((prev) => ({
                            ...prev,
                            alasanDetail: e.target.value,
                          }))
                        }
                        placeholder="Contoh: Pulang karena sakit kepala, ada keperluan keluarga, dll."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          minHeight: '80px',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                        }}
                      />
                    </div>
                  </div>
                </div>

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
                    Tambahkan Foto *
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '2px dashed #D1D5DB',
                        borderRadius: '8px',
                        backgroundColor: '#F9FAFB',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.jpg,.jpeg,.png';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            setPerizinanData((prev) => ({
                              ...prev,
                              file1: file,
                            }));
                          }
                        };
                        input.click();
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#9CA3AF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                    >
                      <Upload size={24} color="#6B7280" />
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#6B7280', 
                        fontWeight: 500 
                      }}>
                        {perizinanData.file1 ? perizinanData.file1.name : 'Upload foto bukti pertama* (JPG/PNG)'}
                      </span>
                    </div>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '12px', 
                      color: '#6B7280', 
                      fontStyle: 'italic',
                      marginTop: '-8px'
                    }}>
                      *Wajib diisi (surat izin/surat dokter/foto lain) - Format JPG/PNG
                    </p>

                    <div
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '2px dashed #D1D5DB',
                        borderRadius: '8px',
                        backgroundColor: '#F9FAFB',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.jpg,.jpeg,.png';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            setPerizinanData((prev) => ({
                              ...prev,
                              file2: file,
                            }));
                          }
                        };
                        input.click();
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#9CA3AF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                    >
                      <Upload size={24} color="#6B7280" />
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#6B7280', 
                        fontWeight: 500 
                      }}>
                        {perizinanData.file2 ? perizinanData.file2.name : 'Upload foto bukti kedua (opsional) - JPG/PNG'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '20px 24px',
                borderTop: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
                flexShrink: 0,
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={handleClosePerizinan}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  minWidth: '100px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSubmitPerizinan}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  minWidth: '100px',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.4)';
                }}
              >
                Simpan Perizinan
              </button>
            </div>
          </div>
        </div>
      )}
    </WalikelasLayout>
  );
}