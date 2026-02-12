import { useState, useEffect } from 'react';
import GuruLayout from '../../component/Guru/GuruLayout.tsx';
import CalendarIcon from '../../assets/Icon/calender.png';
import EditIcon from '../../assets/Icon/Edit.png';
import ChalkboardIcon from '../../assets/Icon/Chalkboard.png';
import { usePopup } from "../../component/Shared/Popup/PopupProvider";
import { STATUS_BACKEND_TO_FRONTEND, STATUS_COLORS_HEX } from "../../utils/statusMapping";

interface KehadiranSiswaGuruProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
}
const styles = {
  th: {
    padding: '16px',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '0.025em'
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#1F2937',
    verticalAlign: 'middle'
  }
};

interface SiswaData {
  id: string;
  nisn: string;
  nama: string;
  mapel: string;
  status: 'present' | 'late' | 'excused' | 'sick' | 'absent' | null;
  keterangan?: string;
  tanggal?: string;
  jamPelajaran?: string;
  guru?: string;
  waktuHadir?: string;
}

export default function KehadiranSiswaGuru({
  user,
  onLogout,
  currentPage,
  onMenuClick,
}: KehadiranSiswaGuruProps) {
  const { alert: popupAlert, confirm: popupConfirm } = usePopup();
  const [currentDate] = useState(new Date().toLocaleDateString('id-ID'));

  const [selectedKelas, setSelectedKelas] = useState('Memuat...');
  const [selectedMapel, setSelectedMapel] = useState('Memuat...');
  const [editingSiswa, setEditingSiswa] = useState<SiswaData | null>(null);
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [siswaList, setSiswaList] = useState<SiswaData[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const { dashboardService } = await import('../../services/dashboard');
        // Fetch teacher's schedules for today to get the class
        const schedules = await dashboardService.getTeacherSchedules(
          { date: new Date().toISOString().split('T')[0] },
          { signal: controller.signal }
        );

        if (schedules.length > 0) {
          const schedule = schedules[0];
          setActiveScheduleId(schedule.id.toString());
          setSelectedKelas(schedule.class?.name || 'Kelas');
          setSelectedMapel(schedule.subject_name || schedule.title || 'Mapel');

          if (schedule.class_id) {
            // Fetch class students
            const classData = await dashboardService.getClassDetails(
              schedule.class_id.toString(),
              { signal: controller.signal }
            );

            // Fetch existing attendance for this schedule
            let attendanceRecords: any[] = [];
            try {
              attendanceRecords = await dashboardService.getAttendanceBySchedule(
                schedule.id.toString(),
                {
                  params: { date: new Date().toISOString().split('T')[0] },
                  signal: controller.signal
                }
              );
            } catch (err: any) {
              if (err.name !== 'AbortError') {
                console.error("Failed to fetch attendance records", err);
              }
            }

            if (classData && classData.students) {
              const mappedStudents = classData.students.map((s: any) => {
                // Find existing record
                // Find existing record by student_id or student.id
                const record = attendanceRecords.find((a: any) =>
                  (a.student_id ? a.student_id.toString() : (a.student?.id?.toString())) === s.id.toString()
                );

                let status = record ? record.status : null;
                // Normalize 'return' from backend to 'pulang' for frontend UI
                if (status === 'return') status = 'pulang';

                return {
                  id: s.id.toString(),
                  nisn: s.nisn || '-',
                  nama: s.user?.name || 'Siswa',
                  mapel: schedule.subject_name || schedule.title || 'Mapel',
                  status: status, // Default to null if no record
                  tanggal: currentDate,
                  jamPelajaran: '1-2',
                  guru: user.name,
                  keterangan: record?.reason,
                  waktuHadir: record ? new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined
                };
              });
              setSiswaList(mappedStudents);
            }
          }
        } else {
          setSelectedKelas("Tidak ada jadwal");
          setSelectedMapel("-");
          setSiswaList([]);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError' && e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
          console.error(e);
        }
      }
    };
    fetchData();

    return () => controller.abort();
  }, [user.name, currentDate]);

  const handleCloseAttendance = async () => {
    if (!activeScheduleId) {
      await popupAlert("Tidak ada jadwal aktif saat ini.");
      return;
    }

    const confirmed = await popupConfirm(
      "Siswa yang belum absen akan otomatis ditandai sebagai ALPHA (Tidak Hadir). Lanjutkan?",
      {
        title: "Tutup Absensi?",
        confirmText: "Ya, Tutup Absensi",
        cancelText: "Batal"
      }
    );

    if (!confirmed) return;

    try {
      const { default: apiClient } = await import('../../services/api');
      const response = await apiClient.post(`/me/schedules/${activeScheduleId}/close`);

      const data = response.data || response;
      await popupAlert(`✅ ${data.message || 'Absensi berhasil ditutup'}`);
      window.location.reload();

    } catch (e: any) {
      console.error(e);
      const { getErrorMessage } = await import('../../services/api');
      await popupAlert(`❌ Error: ${getErrorMessage(e)}`);
    }
  };

  const handleEditClick = (siswa: SiswaData) => {
    setEditingSiswa(siswa);
  };

  const handleSaveStatus = (newStatus: SiswaData['status'], newKeterangan?: string) => {
    if (!editingSiswa) return;

    setSiswaList(prevList =>
      prevList.map(s =>
        s.id === editingSiswa.id ? { ...s, status: newStatus, keterangan: newKeterangan } : s
      )
    );
    setEditingSiswa(null);
  };

  // Fungsi untuk membuka modal detail status - SEMUA STATUS BISA DIKLIK
  const handleStatusClick = (siswa: SiswaData) => {
    setSelectedSiswa(siswa);
    setIsDetailModalOpen(true);
  };

  // Fungsi untuk mendapatkan teks status
  const getStatusText = (status: string, waktuHadir?: string) => {
    switch (status) {
      case "absent":
        return "Siswa tidak hadir tanpa keterangan";
      case "excused":
        return "Siswa izin dengan keterangan";
      case "sick":
        return "Siswa sakit dengan surat dokter";
      case "present":
        return waktuHadir ? `Siswa hadir tepat waktu pada ${waktuHadir}` : "Siswa hadir tepat waktu";
      case "late":
        return waktuHadir ? `Siswa terlambat hadir pada ${waktuHadir}` : "Siswa terlambat";
      default:
        return status;
    }
  };

  // Custom Status Renderer dengan icon mata untuk SEMUA STATUS
  const StatusButton = ({ status, siswa }: { status: string | null | undefined; siswa: SiswaData }) => {
    if (!status) return <span style={{ color: '#9CA3AF', fontSize: '13px' }}>-</span>;

    const color = STATUS_COLORS_HEX[status] || '#6B7280';
    // Use mapped label or fallback to Title Case
    const label = STATUS_BACKEND_TO_FRONTEND[status] || (status.charAt(0).toUpperCase() + status.slice(1));

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
        <EyeIcon size={14} />
        <span>{label}</span>
      </div>
    );
  };

  // Icon mata untuk lihat detail
  const EyeIcon = ({ size = 16 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Icon X untuk tombol close modal
  const XIcon = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d="M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Icon check untuk status hadir
  const CheckIcon = ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Icon time untuk waktu hadir
  const TimeIcon = ({ size = 16 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7V12L15 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  // Fungsi helper untuk DetailRow
  const DetailRow = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 20px 1fr',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '1px solid #E5E7EB',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <div style={{ fontWeight: 600, color: '#374151' }}>{label}</div>
      </div>
      <div style={{ fontWeight: 600, color: '#374151', textAlign: 'center' }}>:</div>
      <div style={{ fontWeight: 500, color: '#1F2937', textAlign: 'right' }}>
        {value}
      </div>
    </div>
  );

  return (
    <GuruLayout
      pageTitle="Kehadiran Siswa"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      <div style={{ padding: '0 4px' }}>

        {/* Top Info Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

          {/* Date Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0F172A',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            width: 'fit-content',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <img src={CalendarIcon} alt="Date" style={{ width: 18, height: 18, marginRight: 10, filter: 'brightness(0) invert(1)' }} />
            {currentDate}
          </div>

          {/* Class Info & Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Class Info Card */}
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
              {/* Decorative circle */}
              <div style={{
                position: 'absolute',
                left: -10,
                bottom: -20,
                width: 60,
                height: 60,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '50%'
              }} />

              <img src={ChalkboardIcon} alt="Class" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)', zIndex: 1 }} />
              <div style={{ zIndex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{selectedKelas}</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>{selectedMapel}</div>
              </div>
            </div>

            {/* Close Attendance Button */}
            <button
              onClick={handleCloseAttendance}
              disabled={!activeScheduleId || activeScheduleId === '0'}
              style={{
                backgroundColor: '#DC2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: activeScheduleId ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                opacity: activeScheduleId ? 1 : 0.6,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeScheduleId) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeScheduleId) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
                }
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white', opacity: 0.8 }}></div>
              Tutup Absensi
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1E293B', color: 'white' }}>
                  <th style={{ ...styles.th, color: 'white' }}>No</th>
                  <th style={{ ...styles.th, color: 'white' }}>NISN</th>
                  <th style={{ ...styles.th, color: 'white' }}>Nama Siswa</th>
                  <th style={{ ...styles.th, color: 'white' }}>Mata Pelajaran</th>
                  <th style={{ ...styles.th, color: 'white' }}>Guru</th>
                  <th style={{ ...styles.th, textAlign: 'center', color: 'white' }}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'center', color: 'white' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, index) => (
                  <tr key={siswa.id} style={{
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: index % 2 === 0 ? '#F8FAFC' : 'white'
                  }}>
                    <td style={styles.td}>{index + 1}.</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '15px' }}>{siswa.nisn}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#111827' }}>{siswa.nama}</td>
                    <td style={styles.td}>{siswa.mapel}</td>
                    <td style={styles.td}>{siswa.guru || '-'}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <StatusButton status={siswa.status} siswa={siswa} />
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditClick(siswa)}
                        style={{
                          background: 'white',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
                      >
                        <img src={EditIcon} alt="Edit" style={{ width: 18, height: 18 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Edit Status Modal */}
      {editingSiswa && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '0',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Edit Status Kehadiran
              </h3>
              <button
                onClick={() => setEditingSiswa(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: '24px',
                  padding: 0,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Nama Siswa Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nama Siswa
                </label>
                <div style={{
                  backgroundColor: '#F9FAFB',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  color: '#1F2937',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  {editingSiswa.nama}
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status Kehadiran
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={editingSiswa.status || 'present'}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, status: e.target.value as SiswaData['status'] })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '15px',
                      color: '#1F2937',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="present">Hadir</option>
                    <option value="excused">Izin</option>
                    <option value="sick">Sakit</option>
                    <option value="absent">Tidak Hadir</option>
                    <option value="late">Terlambat</option>
                  </select>
                </div>

                {/* Keterangan field */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Keterangan
                  </label>
                  <textarea
                    value={editingSiswa.keterangan || ''}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, keterangan: e.target.value })}
                    placeholder="Tambahkan keterangan (opsional)..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '15px',
                      color: '#1F2937',
                      backgroundColor: 'white',
                      minHeight: '100px',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '20px 24px',
              backgroundColor: '#F9FAFB',
              borderTop: '1px solid #F3F4F6',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setEditingSiswa(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveStatus(editingSiswa.status, editingSiswa.keterangan)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
                  transition: 'all 0.2s'
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Status Modal - UNTUK SEMUA STATUS */}
      {isDetailModalOpen && selectedSiswa && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header Modal */}
            <div style={{
              backgroundColor: '#0B2948',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <EyeIcon size={24} />
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                }}>
                  Detail Kehadiran
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <XIcon size={24} />
              </button>
            </div>

            {/* Content Modal */}
            <div style={{
              padding: 24,
              overflowY: 'auto',
              flex: 1,
            }}>
              {/* Row Tanggal */}
              <DetailRow
                label="Tanggal"
                value={selectedSiswa.tanggal || currentDate}
                icon={<img src={CalendarIcon} alt="Calendar" style={{ width: 16, height: 16, opacity: 0.7 }} />}
              />

              {/* Row Jam Pelajaran */}
              <DetailRow
                label="Jam Pelajaran"
                value={selectedSiswa.jamPelajaran || '1-4'}
              />

              {/* Row Nama Siswa */}
              <DetailRow
                label="Nama Siswa"
                value={selectedSiswa.nama}
              />

              {/* Row NISN */}
              <DetailRow
                label="NISN"
                value={selectedSiswa.nisn}
              />

              {/* Row Mata Pelajaran */}
              <DetailRow
                label="Mata Pelajaran"
                value={selectedSiswa.mapel}
              />

              {/* Row Guru */}
              <DetailRow
                label="Guru"
                value={selectedSiswa.guru || '-'}
              />

              {/* Row Waktu Hadir (khusus untuk status hadir) */}
              {selectedSiswa.status === 'present' && selectedSiswa.waktuHadir && (
                <DetailRow
                  label="Waktu Hadir"
                  value={selectedSiswa.waktuHadir}
                  icon={<TimeIcon size={16} />}
                />
              )}

              {/* Row Status */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 20px 1fr',
                alignItems: 'center',
                marginBottom: 24,
                paddingBottom: 12,
                borderBottom: '1px solid #E5E7EB',
              }}>
                <div style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedSiswa.status === 'present' && <CheckIcon size={18} color="#1FA83D" />}
                  Status
                </div>
                <div style={{ fontWeight: 600, color: '#374151', textAlign: 'center' }}>:</div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: STATUS_COLORS_HEX[selectedSiswa.status || 'present'], // Fallback to avoid error if null
                    color: '#FFFFFF',
                    padding: '4px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {selectedSiswa.status === 'absent' ? 'Tidak Hadir' :
                      selectedSiswa.status === 'sick' ? 'Sakit' :
                        selectedSiswa.status === 'excused' ? 'Izin' :
                          selectedSiswa.status === 'present' ? 'Hadir' :
                            selectedSiswa.status === 'late' ? 'Terlambat' :
                              'Pulang'}
                  </span>
                </div>
              </div>

              {/* Info Box - Ditampilkan untuk SEMUA status */}
              <div style={{
                backgroundColor: selectedSiswa.status === 'present' ? '#F0FDF4' : '#EFF6FF',
                border: `1px solid ${selectedSiswa.status === 'present' ? '#BBF7D0' : '#BFDBFE'}`,
                borderRadius: 8,
                padding: 16,
                textAlign: 'center',
                marginBottom: (selectedSiswa.status === 'excused' || selectedSiswa.status === 'sick' || selectedSiswa.status === 'late') && selectedSiswa.keterangan ? 24 : 0,
              }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: selectedSiswa.status === 'present' ? '#166534' : '#1E40AF',
                }}>
                  {getStatusText(selectedSiswa.status || 'present', selectedSiswa.waktuHadir)}
                </div>
              </div>

              {/* Keterangan untuk izin, sakit, DAN PULANG */}
              {(selectedSiswa.status === 'excused' || selectedSiswa.status === 'sick' || selectedSiswa.status === 'late') && selectedSiswa.keterangan && (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 20px 1fr',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                    }}>
                      Keterangan
                    </div>
                    <div style={{ fontWeight: 600, color: '#374151', textAlign: 'center' }}>:</div>
                    <div></div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      color: '#6B7280',
                      lineHeight: 1.5,
                    }}>
                      {selectedSiswa.keterangan}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  );
}

