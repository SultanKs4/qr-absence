import { useState, useEffect, useMemo } from 'react';
import { storage } from '../../utils/storage';
import WalikelasLayout from '../../component/Walikelas/layoutwakel';
import { FormModal } from '../../component/Shared/FormModal';
import { Select } from '../../component/Shared/Select';
import { usePopup } from "../../component/Shared/Popup/PopupProvider";
import { Calendar, BookOpen, FileText, Eye, ChevronDown, X, Edit } from 'lucide-react';
import { dashboardService } from '../../services/dashboard';
import { attendanceService } from '../../services/attendance';

// STATUS COLOR PALETTE - High Contrast from Merging
const STATUS_COLORS = {
  hadir: '#1FA83D',
  present: '#1FA83D',
  izin: '#ACA40D',
  excused: '#ACA40D',
  dinas: '#ACA40D',
  sakit: '#520C8F',
  sick: '#520C8F',
  'tidak-hadir': '#D90000',
  absent: '#D90000',
  alpha: '#D90000',
  late: '#F59E0B',
  pulang: '#2F85EB',
  return: '#2F85EB',
};

type StatusType = 'hadir' | 'izin' | 'sakit' | 'tidak-hadir' | 'pulang' | 'alpha' | 'present' | 'late' | 'excused' | 'sick' | 'absent' | 'dinas' | 'return';

interface KehadiranRow {
  id: string; // Attendance ID
  studentId: string;
  nisn: string;
  namaSiswa: string;
  mataPelajaran: string;
  namaGuru: string;
  tanggal: string;
  status: StatusType;
  keterangan?: string;
  jamPelajaran?: string;
  waktuHadir?: string;
  scheduleId?: number;
  bukti?: string;
  isPerizinanPulang?: boolean; // Flag for LS data
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
  const { alert: popupAlert } = usePopup();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedMapel, setSelectedMapel] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [tempDate, setTempDate] = useState(currentDate);

  const [selectedSiswa, setSelectedSiswa] = useState<KehadiranRow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [kelasInfo, setKelasInfo] = useState({
    id: 0,
    namaKelas: 'Memuat...',
    waliKelas: user.name,
  });

  const [rows, setRows] = useState<KehadiranRow[]>([]);

  // Editing State
  const [editingRow, setEditingRow] = useState<KehadiranRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('present');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Class Info
  useEffect(() => {
    const fetchClass = async () => {
      try {
        const classData = await dashboardService.getMyHomeroom();
        setKelasInfo({
          id: classData.id,
          namaKelas: classData.name,
          waliKelas: classData.homeroom_teacher?.user?.name || user.name
        });
      } catch (e) {
        console.error("Error fetching class info", e);
      }
    };
    fetchClass();
  }, [user.name]);

  // Fetch Attendance Data + LocalStorage
  useEffect(() => {
    const fetchData = async () => {
      if (!kelasInfo.id) return;
      setIsLoading(true);
      try {
        // 1. API Data
        const response = await attendanceService.getClassAttendanceByDate(kelasInfo.id, selectedDate);
        const data = (response.data as any).data || response.data;
        let mappedRows: KehadiranRow[] = [];

        if (Array.isArray(data)) {
          mappedRows = data.map((item: any) => ({
            id: item.id?.toString() || `att-${item.student_id}-${item.schedule_id}`,
            studentId: item.student_id?.toString(),
            scheduleId: item.schedule_id,
            nisn: item.student?.nisn || '-',
            namaSiswa: item.student?.name || 'Siswa',
            mataPelajaran: item.schedule?.subject_name || '-',
            namaGuru: item.schedule?.teacher?.user?.name || '-',
            tanggal: item.date,
            status: item.status,
            keterangan: item.reason,
            jamPelajaran: item.schedule?.start_time ? `${item.schedule.start_time.slice(0, 5)} - ${item.schedule.end_time.slice(0, 5)}` : '-',
            waktuHadir: item.checked_in_at ? item.checked_in_at.slice(0, 5) + ' WIB' : undefined,
            bukti: item.attachment,
            isPerizinanPulang: false
          }));
        }

        // 2. LocalStorage Data (Perizinan Pulang)
        // Only if date matches
        const perizinanList = storage.getPerizinanPulangList();
        if (perizinanList && perizinanList.length > 0) {
          try {
            // const perizinanList = JSON.parse(perizinanData); // Already parsed by storage
            const lsRows: KehadiranRow[] = perizinanList
              .filter((p: any) => {
                // Check if date matches selection (simple string compare)
                // LS format might differ, assuming matching 'YYYY-MM-DD' or displayed format
                // But let's verify: Merging code used rows directly.
                // We will filter by selectedDate if provided.
                const pDate = p.tanggal || p.createdAt?.split('T')[0];
                return pDate === selectedDate;
              })
              .map((p: any, idx: number) => ({
                id: `ls-${p.id || idx}`,
                studentId: '0', // No real ID
                nisn: p.nisn,
                namaSiswa: p.namaSiswa,
                mataPelajaran: p.mapel || '-',
                namaGuru: p.namaGuru || '-',
                tanggal: p.tanggal,
                status: 'pulang' as StatusType,
                keterangan: p.keterangan,
                jamPelajaran: p.jamPelajaran || '-',
                waktuHadir: undefined,
                bukti: p.buktiFoto1,
                isPerizinanPulang: true
              }));

            mappedRows = [...mappedRows, ...lsRows];
          } catch (e) {
            console.error("Error parsing localStorage", e);
          }
        }

        setRows(mappedRows);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Listen for storage changes
    const handleStorage = () => fetchData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);

  }, [kelasInfo.id, selectedDate]);


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
    // Filter mapel
    const filtered = selectedMapel === 'all' ? rows : rows.filter((r) => r.mataPelajaran === selectedMapel);
    return filtered;
  }, [rows, selectedMapel]);

  // Statistik
  const totalHadir = filteredRows.filter((r) => r.status === 'present' || r.status === 'hadir').length;
  const totalIzin = filteredRows.filter((r) => r.status === 'excused' || r.status === 'izin' || r.status === 'dinas').length;
  const totalSakit = filteredRows.filter((r) => r.status === 'sick' || r.status === 'sakit').length;
  const totalTidakHadir = filteredRows.filter((r) => r.status === 'absent' || r.status === 'alpha' || r.status === 'tidak-hadir').length;
  const totalPulang = filteredRows.filter((r) => r.status === 'pulang' || r.status === 'return').length;


  const handleStatusClick = (siswa: KehadiranRow) => {
    setSelectedSiswa(siswa);
    setIsDetailModalOpen(true);
  };

  const StatusButton = ({ status, siswa }: { status: string; siswa: KehadiranRow }) => {
    // Mapping status backend to color key
    let colorKey = status;
    let label = status;

    if (status === 'present') { colorKey = 'hadir'; label = 'Hadir'; }
    if (status === 'sick') { colorKey = 'sakit'; label = 'Sakit'; }
    if (status === 'excused') { colorKey = 'izin'; label = 'Izin'; }
    if (status === 'dinas') { colorKey = 'izin'; label = 'Dinas'; }
    if (status === 'absent' || status === 'alpha') { colorKey = 'tidak-hadir'; label = 'Alfa'; }
    if (status === 'late') { colorKey = 'late'; label = 'Terlambat'; }
    if (status === 'return' || status === 'pulang') { colorKey = 'pulang'; label = 'Pulang'; }

    const color = STATUS_COLORS[colorKey as keyof typeof STATUS_COLORS] || '#6B7280';

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
        <Eye size={14} />
        <span>{label}</span>
      </div>
    );
  };

  // Edit Handlers
  const handleEditClick = () => {
    if (selectedSiswa) {
      if (selectedSiswa.isPerizinanPulang) {
        void popupAlert("Data Perizinan Pulang hanya bisa dilihat.");
        return;
      }
      setEditingRow(selectedSiswa);
      setEditStatus(selectedSiswa.status === 'hadir' ? 'present' : selectedSiswa.status); // normalize
      setEditKeterangan(selectedSiswa.keterangan || '');
      setIsDetailModalOpen(false); // Close detail, open edit
      setIsEditOpen(true);
    }
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingRow(null);
    setEditKeterangan('');
  };

  const handleSubmitEdit = async () => {
    if (!editingRow) return;
    if (!editingRow.scheduleId) {
      void popupAlert("Data tidak valid untuk diedit (No Schedule ID)");
      return;
    }

    setIsSubmitting(true);
    try {
      await attendanceService.createManualAttendance({
        attendee_type: 'student',
        student_id: Number(editingRow.studentId),
        schedule_id: editingRow.scheduleId,
        status: editStatus,
        date: editingRow.tanggal,
        reason: editKeterangan
      });

      await popupAlert("✅ Status kehadiran berhasil diperbarui!");
      handleCloseEdit();

      // Refresh page to ensure data sync
      window.location.reload();

    } catch (error) {
      console.error("Error updating attendance:", error);
      await popupAlert("❌ Gagal memperbarui status kehadiran");
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Top Info Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap', gap: 10
        }}>
          {/* Left: Class Info & Date Picker */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: '#0F172A',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              display: 'flex', gap: 10, alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <BookOpen size={20} />
              <span style={{ fontWeight: 'bold' }}>{kelasInfo.namaKelas}</span>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: '8px',
                  backgroundColor: '#0F172A', color: 'white',
                  border: 'none',
                  cursor: 'pointer', fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              >
                <Calendar size={18} />
                {selectedDate}
                <ChevronDown size={14} />
              </button>
              {showDatePicker && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 10,
                  backgroundColor: 'white', padding: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 8, marginTop: 5
                }}>
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                  />
                  <div style={{ display: 'flex', gap: 5, marginTop: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowDatePicker(false)} style={{ padding: '4px 8px' }}>Batal</button>
                    <button
                      onClick={() => { setSelectedDate(tempDate); setShowDatePicker(false); }}
                      style={{ padding: '4px 8px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 4 }}
                    >
                      Pilih
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onMenuClick('rekap-kehadiran-siswa')}
              style={{
                display: 'flex', gap: 6, alignItems: 'center',
                padding: '8px 14px', backgroundColor: '#3B82F6', color: 'white',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
            >
              <FileText size={16} /> Lihat Rekap
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ flex: 1, backgroundColor: '#F0FDF4', padding: 16, borderRadius: 8, textAlign: 'center', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Hadir</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>{totalHadir}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#FEFCE8', padding: 16, borderRadius: 8, textAlign: 'center', border: '1px solid #FEF08A' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#854D0E' }}>Izin</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#854D0E' }}>{totalIzin}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#FAF5FF', padding: 16, borderRadius: 8, textAlign: 'center', border: '1px solid #E9D5FF' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6B21A8' }}>Sakit</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#6B21A8' }}>{totalSakit}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 16, borderRadius: 8, textAlign: 'center', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>Tidak Hadir</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#991B1B' }}>{totalTidakHadir}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 8, textAlign: 'center', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF' }}>Pulang</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1E40AF' }}>{totalPulang}</div>
          </div>
        </div>

        {/* Filter Mapel */}
        <div style={{ marginBottom: 20, width: '300px' }}>
          <Select
            options={mapelOptions}
            value={selectedMapel}
            onChange={setSelectedMapel}
            placeholder="Semua Mata Pelajaran"
          />
        </div>

        {/* Table */}
        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '50px 120px 200px 150px 150px 150px 1fr 120px',
            backgroundColor: '#F9FAFB',
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: '#374151',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <div>No</div>
            <div>NISN</div>
            <div>Nama Siswa</div>
            <div>Mata Pelajaran</div>
            <div>Guru</div>
            <div>Jam</div>
            <div>Keterangan</div>
            <div style={{ textAlign: 'center' }}>Status</div>
          </div>

          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Memuat data kehadiran...</div>
          ) : filteredRows.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Belum ada data kehadiran untuk tanggal ini.</div>
          ) : (
            filteredRows.map((row, index) => (
              <div key={row.id} style={{
                display: 'grid',
                gridTemplateColumns: '50px 120px 200px 150px 150px 150px 1fr 120px',
                padding: '12px 16px',
                fontSize: 14,
                alignItems: 'center',
                borderBottom: '1px solid #F3F4F6',
                backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB'
              }}>
                <div style={{ color: '#6B7280' }}>{index + 1}</div>
                <div>{row.nisn}</div>
                <div style={{ fontWeight: 600 }}>{row.namaSiswa}</div>
                <div>{row.mataPelajaran}</div>
                <div>{row.namaGuru}</div>
                <div>{row.jamPelajaran}</div>
                <div style={{ color: '#6B7280', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {row.keterangan || '-'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <StatusButton status={row.status} siswa={row} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DETAIL */}
      {isDetailModalOpen && selectedSiswa && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: 12, width: '90%', maxWidth: 500,
            overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              padding: '16px 24px', backgroundColor: '#0F172A', color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Detail Kehadiran</h3>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Siswa</label>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>{selectedSiswa.namaSiswa}</div>
                <div style={{ fontSize: 14, color: '#6B7280' }}>{selectedSiswa.nisn}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Mata Pelajaran</label>
                  <div style={{ fontWeight: 600 }}>{selectedSiswa.mataPelajaran}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Guru</label>
                  <div style={{ fontWeight: 600 }}>{selectedSiswa.namaGuru}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Jam</label>
                  <div style={{ fontWeight: 600 }}>{selectedSiswa.jamPelajaran}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Waktu Hadir</label>
                  <div style={{ fontWeight: 600 }}>{selectedSiswa.waktuHadir || '-'}</div>
                </div>
              </div>

              {selectedSiswa.keterangan && (
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Keterangan</label>
                  <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>{selectedSiswa.keterangan}</p>
                </div>
              )}

              {selectedSiswa.bukti && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Bukti</label>
                  <div style={{ padding: 10, textAlign: 'center', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                    📷 Lihat Bukti (Mockup)
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                {/* Hanya tampilkan tombol edit jika bukan data perizinan pulang (LS) */}
                {!selectedSiswa.isPerizinanPulang && (
                  <button onClick={handleEditClick} style={{
                    padding: '10px 16px', backgroundColor: '#F59E0B', color: 'white',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <Edit size={16} /> Edit Status
                  </button>
                )}
                <button onClick={() => setIsDetailModalOpen(false)} style={{
                  padding: '10px 16px', backgroundColor: '#E5E7EB', color: '#374151',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600
                }}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT STATUS */}
      <FormModal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        title="Edit Status Kehadiran"
        onSubmit={handleSubmitEdit}
        submitLabel={isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
        isSubmitting={isSubmitting}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Status Kehadiran</label>
            <Select
              options={[
                { label: 'Hadir', value: 'present' },
                { label: 'Izin', value: 'excused' },
                { label: 'Sakit', value: 'sick' },
                { label: 'Absen/Alfa', value: 'absent' },
                { label: 'Terlambat', value: 'late' },
              ]}
              value={editStatus}
              onChange={setEditStatus}
            />
          </div>

          {(editStatus === 'excused' || editStatus === 'sick' || editStatus === 'late') && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Keterangan</label>
              <textarea
                value={editKeterangan}
                onChange={(e) => setEditKeterangan(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB',
                  fontFamily: 'inherit'
                }}
                placeholder="Tuliskan alasan/keterangan..."
              />
            </div>
          )}
        </div>
      </FormModal>

    </WalikelasLayout>
  );
}
