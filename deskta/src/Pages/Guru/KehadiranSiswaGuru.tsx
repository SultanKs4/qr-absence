import { useState, useEffect, useMemo } from 'react';
import GuruLayout from '../../component/Guru/GuruLayout';
import CalendarIcon from '../../assets/Icon/calender.png';
import EditIcon from '../../assets/Icon/Edit.png';
import ChalkboardIcon from '../../assets/Icon/Chalkboard.png';

// STATUS COLOR PALETTE - High Contrast for Accessibility
const STATUS_COLORS = {
  hadir: '#1FA83D',   // HIJAU - Hadir
  izin: '#ACA40D',    // KUNING - Izin
  sakit: '#520C8F',   // UNGU - Sakit
  alfa: '#D90000',   // MERAH - Tidak Hadir
  pulang: '#2F85EB',  // BIRU - Pulang
  unknown: '#9CA3AF'
};

interface KehadiranSiswaGuruProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
  schedule?: any; // The schedule object passed from Dashboard
}

interface SiswaData {
  id: string; // student_id
  nisn: string;
  nama: string;
  mapel: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa' | 'pulang' | 'unknown';
  keterangan?: string;
  tanggal?: string;
  jamPelajaran?: string;
  guru?: string;
  waktuHadir?: string;
  suratPulang?: File | null;
  attendance_id?: string; // ID of the attendance record if exists
}

export default function KehadiranSiswaGuru({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  schedule
}: KehadiranSiswaGuruProps) {
  const [currentDate, setCurrentDate] = useState('');
  const [siswaList, setSiswaList] = useState<SiswaData[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingSiswa, setEditingSiswa] = useState<SiswaData | null>(null);

  // Initialize date
  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(now.toLocaleDateString('id-ID', options));
  }, []);

  // Fetch Students for Schedule
  useEffect(() => {
    if (schedule?.id) {
      fetchStudents(schedule.id);
    }
  }, [schedule]);

  const fetchStudents = async (scheduleId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/me/schedules/${scheduleId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Map backend data to frontend interface
        // Backend returns list of students with 'attendance' relation if exists
        const mappedStudents = (data.students || []).map((s: any) => {
          const att = s.attendance; // The attendance record for today/session
          // Status mapping
          let status: SiswaData['status'] = 'unknown';
          if (att) {
            if (att.status === 'present') status = 'hadir';
            else if (att.status === 'sick') status = 'sakit';
            else if (att.status === 'permission') status = 'izin';
            else if (att.status === 'alpha') status = 'alfa';
            else if (att.status === 'leave_early') status = 'pulang';
          } else {
            // If no attendance record, default to alpha or unknown?
            // Usually unknown or alpha until marked. Let's use 'unknown' (grey) or 'alfa' (red)
            // The request says default to alpha?
            status = 'alfa'; // Default if not present
          }

          return {
            id: s.id.toString(),
            nisn: s.nisn || '-',
            nama: s.name,
            mapel: schedule.subject,
            status: status,
            keterangan: att?.description,
            attendance_id: att?.id,
            guru: user.name,
            tanggal: currentDate,
            jamPelajaran: schedule.jam // e.g. "07:00 - 08:30"
          };
        });
        setSiswaList(mappedStudents);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleEditClick = (siswa: SiswaData) => {
    setEditingSiswa(siswa);
  };

  const handleSaveStatus = async (newStatus: SiswaData['status']) => {
    if (!editingSiswa || !schedule?.id) return;

    // Map status to backend enum
    const statusMap: Record<string, string> = {
      'hadir': 'present',
      'sakit': 'sick',
      'izin': 'permission',
      'alfa': 'alpha',
      'pulang': 'leave_early'
    };

    const backendStatus = statusMap[newStatus];
    if (!backendStatus) return;

    try {
      const token = localStorage.getItem('token');
      // Use manual input endpoint
      const response = await fetch(`http://localhost:8000/api/attendance/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schedule_id: schedule.id,
          student_id: editingSiswa.id,
          status: backendStatus,
          date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
          notes: editingSiswa.keterangan
        })
      });

      if (response.ok) {
        // Update local state
        setSiswaList(prevList =>
          prevList.map(s =>
            s.id === editingSiswa.id ? { ...s, status: newStatus } : s
          )
        );
        setEditingSiswa(null);
        alert("Status berhasil diperbarui");
      } else {
        console.error("Failed to update status");
        alert("Gagal memperbarui status");
      }

    } catch (error) {
      console.error("Error saving status:", error);
    }
  };

  // Custom Status Renderer dengan icon mata untuk SEMUA STATUS
  const StatusButton = ({ status, siswa }: { status: string; siswa: SiswaData }) => {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#9CA3AF';
    const label = status === 'alfa' ? 'Alfa' : status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <div
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
          minWidth: '100px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'default',
        }}
      >
        <span>{label}</span>
      </div>
    );
  };

  // Icon X untuk tombol close modal
  const XIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <img src={ChalkboardIcon} alt="Class" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)', zIndex: 1 }} />
            <div style={{ zIndex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{schedule?.className || 'Pilih Jadwal'}</div>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>{schedule?.subject || '-'}</div>
            </div>
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
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>No</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>NISN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Nama Siswa</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Mata Pelajaran</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center' }}>Memuat data siswa...</td></tr>
                ) : siswaList.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center' }}>Tidak ada siswa dalam kelas ini (atau pilih jadwal terlebih dahulu).</td></tr>
                ) : (
                  siswaList.map((siswa, index) => (
                    <tr key={siswa.id} style={{
                      borderBottom: '1px solid #E2E8F0',
                      backgroundColor: index % 2 === 0 ? '#F8FAFC' : 'white'
                    }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{index + 1}.</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>{siswa.nisn}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>{siswa.nama}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{siswa.mapel}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <StatusButton status={siswa.status} siswa={siswa} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Edit Status Modal */}
      {editingSiswa && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Sunting Status Kehadiran
              </h3>
              <button onClick={() => setEditingSiswa(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XIcon />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>NAMA SISWA</label>
                <div style={{ backgroundColor: '#F9FAFB', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', fontWeight: '600' }}>
                  {editingSiswa.nama}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>STATUS KEHADIRAN</label>
                <select
                  value={editingSiswa.status}
                  onChange={(e) => setEditingSiswa({ ...editingSiswa, status: e.target.value as SiswaData['status'] })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                >
                  <option value="hadir">Hadir</option>
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                  <option value="alfa">Alfa</option>
                  <option value="pulang">Pulang</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '20px 24px', backgroundColor: '#F9FAFB', display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditingSiswa(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: 'white', fontWeight: '600', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => handleSaveStatus(editingSiswa.status)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  );
}