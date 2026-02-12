// FILE: DetailGuru.tsx - Halaman Detail Guru with API Integration
import { useState, useEffect } from 'react';
import AdminLayout from '../../component/Admin/AdminLayout';
import { storage } from '../../utils/storage';
import { User as UserIcon, ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { usePopup } from "../../component/Shared/Popup/PopupProvider";

/* ===================== INTERFACE DEFINITIONS ===================== */
interface User {
  role: string;
  name: string;
}

interface Guru {
  id: string;
  namaGuru: string;
  kodeGuru: string;
  jenisKelamin: string;
  role: string;
  noTelp: string;
  keterangan: string; // Mapel or Division
  waliKelasDari?: string;
  password?: string;
  originalData?: any;
}

interface DetailGuruProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
  guruId: string;
  onUpdateGuru?: (updatedGuru: Guru) => void;
}

/* ===================== OPTIONS DATA ===================== */
const peranList = [
  { id: 'Wali Kelas', nama: 'Wali Kelas' },
  { id: 'Guru', nama: 'Guru' },
  { id: 'Staff', nama: 'Staff' },
];

const mataPelajaranList = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi',
  'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'Seni Budaya', 'Penjasorkes',
  'PKn', 'Agama', 'Informatika', 'IPAS', 'Dasar Program Keahlian'
];

const staffBagianList = [
  'Tata Usaha', 'Administrasi', 'Perpustakaan', 'Laboratorium', 'Keuangan'
];

export default function DetailGuru({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  guruId,
  onUpdateGuru,
}: DetailGuruProps) {
  const { alert: popupAlert } = usePopup();

  // ==================== STATE MANAGEMENT ====================
  const [guruData, setGuruData] = useState<Guru | null>(null);
  const [originalData, setOriginalData] = useState<Guru | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Auxiliary data for validation
  const [allTeachers, setAllTeachers] = useState<Guru[]>([]);
  const [classList, setClassList] = useState<string[]>([]);

  // State for dynamic fields
  const [tempMataPelajaran, setTempMataPelajaran] = useState('');
  const [tempStaffBagian, setTempStaffBagian] = useState('');

  // ==================== LOAD DATA ====================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { teacherService } = await import('../../services/teacher');
        const { classService } = await import('../../services/class');

        // Fetch target teacher, all teachers (for validation), and classes
        const [targetTeacher, teachersList, classes] = await Promise.all([
          teacherService.getTeacherById(guruId).catch(() => null),
          teacherService.getTeachers().catch(() => []),
          classService.getClasses().catch(() => [])
        ]);

        // Map Class List
        const mappedClasses = classes.map((c: any) => c.name || `${c.grade} ${c.major_id || ''} ${c.label || ''}`).filter((n: any) => n);
        setClassList(mappedClasses);

        // Map All Teachers for validation
        const mappedTeachers: Guru[] = teachersList.map((t: any) => ({
          id: String(t.id),
          namaGuru: t.name,
          kodeGuru: t.nip || t.code || '-',
          jenisKelamin: t.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
          role: t.homeroom_class ? 'Wali Kelas' : (t.role === 'staff' ? 'Staff' : 'Guru'),
          noTelp: t.phone || '',
          keterangan: t.subject || '-',
          waliKelasDari: t.homeroom_class?.name || '',
          originalData: t
        }));
        setAllTeachers(mappedTeachers);

        // Process Target Teacher
        let foundGuru: Guru | null = null;
        if (targetTeacher) {
          foundGuru = {
            id: String(targetTeacher.id),
            namaGuru: targetTeacher.name,
            kodeGuru: targetTeacher.nip || targetTeacher.code || '-',
            jenisKelamin: targetTeacher.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
            role: targetTeacher.homeroom_class ? 'Wali Kelas' : (targetTeacher.role === 'staff' ? 'Staff' : 'Guru'),
            noTelp: targetTeacher.phone || '',
            keterangan: targetTeacher.subject || '',
            waliKelasDari: targetTeacher.homeroom_class?.name || '',
            originalData: targetTeacher
          };
        } else {
          // Fallback to local list if individual fetch failed but list succeeded (unlikely but possible)
          foundGuru = mappedTeachers.find(g => g.id === guruId) || null;

          // Fallback to localStorage as last resort
          if (!foundGuru) {
            foundGuru = storage.getSelectedGuru(); // Returns parsed object or null
          }
        }

        if (foundGuru) {
          setGuruData(foundGuru);
          setOriginalData(foundGuru);

          // Set temps
          if (foundGuru.role === 'Guru') setTempMataPelajaran(foundGuru.keterangan);
          else if (foundGuru.role === 'Staff') setTempStaffBagian(foundGuru.keterangan);
        } else {
          void popupAlert("Data guru tidak ditemukan.");
        }

      } catch (error) {
        console.error("Error loading detail guru:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (guruId) fetchData();
  }, [guruId]);

  // ==================== HELPER ====================
  const getAvailableKelasOptions = () => {
    const occupiedKelas = allTeachers
      .filter(g => g.role === 'Wali Kelas' && g.waliKelasDari && g.id !== guruData?.id)
      .map(g => g.waliKelasDari);
    return classList.filter(c => !occupiedKelas.includes(c as string));
  };


  // ==================== VALIDATION ====================
  const validateForm = (): boolean => {
    if (!guruData) return false;
    const errors: { [key: string]: string } = {};

    if (!guruData.namaGuru.trim()) errors.namaGuru = 'Nama guru harus diisi';

    // Check NIP uniqueness
    if (!guruData.kodeGuru.trim()) errors.kodeGuru = 'Kode guru harus diisi';
    else if (allTeachers.some(g => g.kodeGuru === guruData.kodeGuru && g.id !== guruData.id)) {
      errors.kodeGuru = 'Kode guru sudah digunakan';
    }

    if (guruData.noTelp && !/^\d{10,13}$/.test(guruData.noTelp.replace(/\D/g, ''))) {
      errors.noTelp = 'Nomor telepon tidak valid';
    }

    if (guruData.role === 'Guru' && !tempMataPelajaran) errors.mataPelajaran = 'Mata pelajaran wajib';
    if (guruData.role === 'Staff' && !tempStaffBagian) errors.staffBagian = 'Bagian wajib';

    if (guruData.role === 'Wali Kelas') {
      if (!guruData.waliKelasDari) errors.waliKelasDari = 'Kelas wajib dipilih';
      else {
        const occupied = allTeachers.find(g =>
          g.role === 'Wali Kelas' &&
          g.waliKelasDari === guruData.waliKelasDari &&
          g.id !== guruData.id
        );
        if (occupied) {
          errors.waliKelasDari = `Kelas ini sudah ada wali kelasnya (${occupied.namaGuru})`;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== ACTIONS ====================
  const handleSaveChanges = async () => {
    if (!guruData) return;
    if (!validateForm()) {
      void popupAlert('Mohon perbaiki isian form.');
      return;
    }

    setIsLoading(true);
    try {
      const { teacherService } = await import('../../services/teacher');

      let finalSubject = '';
      if (guruData.role === 'Guru') finalSubject = tempMataPelajaran;
      else if (guruData.role === 'Staff') finalSubject = tempStaffBagian;
      // For Wali Kelas, subject might be empty or something else

      const payload = {
        name: guruData.namaGuru,
        nip: guruData.kodeGuru,
        gender: guruData.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
        phone: guruData.noTelp,
        subject: finalSubject,
        role: guruData.role.toLowerCase().replace(' ', '_'),
        // Note: Changing homeroom class usually requires specific endpoint or logic
        // For now assuming updateTeacher handles basics.
      };

      const updated = await teacherService.updateTeacher(guruData.id, payload);

      // Construct updated local object
      const updatedLocal: Guru = {
        ...guruData,
        keterangan: finalSubject || (guruData.role === 'Wali Kelas' ? guruData.waliKelasDari || '' : ''),
        originalData: updated
      };

      setGuruData(updatedLocal);
      setOriginalData(updatedLocal);

      // Update cached list
      setAllTeachers(prev => prev.map(g => g.id === guruData.id ? updatedLocal : g));

      if (onUpdateGuru) onUpdateGuru(updatedLocal);

      setIsEditMode(false);
      void popupAlert('Data berhasil diperbarui!');
    } catch (e: any) {
      console.error(e);
      void popupAlert(`Gagal menyimpan: ${e?.response?.data?.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (confirm('Batal edit? Perubahan tidak akan disimpan.')) {
      setIsEditMode(false);
      setGuruData(originalData);
      setFormErrors({});
      // Reset temps if needed
      if (originalData) {
        if (originalData.role === 'Guru') setTempMataPelajaran(originalData.keterangan);
        else if (originalData.role === 'Staff') setTempStaffBagian(originalData.keterangan);
      }
    }
  };

  const handleBack = () => {
    if (isEditMode) {
      if (confirm('Batal edit? Perubahan tidak akan disimpan.')) {
        setIsEditMode(false);
        setGuruData(originalData);
        if (originalData) {
          if (originalData.role === 'Guru') setTempMataPelajaran(originalData.keterangan);
          else if (originalData.role === 'Staff') setTempStaffBagian(originalData.keterangan);
        }
        onMenuClick('guru');
      }
    } else {
      onMenuClick('guru');
    }
  };

  const handleFieldChange = (field: keyof Guru, value: string) => {
    if (!guruData) return;
    setGuruData({ ...guruData, [field]: value });
  };

  // ==================== RENDER ====================
  if (isLoading && !guruData) {
    return (
      <AdminLayout pageTitle="Detail Guru" currentPage={currentPage} onMenuClick={onMenuClick} user={user} onLogout={onLogout}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#64748B' }}>
          Loading...
        </div>
      </AdminLayout>
    );
  }

  if (!guruData) return null;

  return (
    <AdminLayout
      pageTitle="Detail Guru"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
      hideBackground
    >
      <div
        style={{
          backgroundImage: 'url(../src/assets/Background/bgdetailgurusiswa.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          padding: window.innerWidth < 768 ? '16px' : '24px',
          display: 'flex',
          alignItems: 'flex-start',
          paddingTop: '40px',
        }}
      >
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: window.innerWidth < 768 ? '20px' : '28px 32px',
              display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              alignItems: window.innerWidth < 768 ? 'flex-start' : 'center', gap: '20px'
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  border: '3px solid rgba(255, 255, 255, 0.2)', flexShrink: 0
                }}
                >
                  <UserIcon size={32} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {guruData.namaGuru}
                  </h2>
                  <p style={{ margin: 0, fontSize: '15px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                    NIP: {guruData.kodeGuru}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {!isEditMode ? (
                  <button onClick={() => setIsEditMode(true)} style={{
                    backgroundColor: '#2563EB', border: 'none', color: 'white', padding: '10px 24px',
                    borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                  >
                    <Edit2 size={16} /> Ubah Data
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancelEdit} style={{
                      backgroundColor: '#6B7280', border: 'none', color: 'white', padding: '10px 20px',
                      borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    >
                      <X size={16} /> Batal
                    </button>
                    <button onClick={handleSaveChanges} style={{
                      backgroundColor: '#10B981', border: 'none', color: 'white', padding: '10px 20px',
                      borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    >
                      <Save size={16} /> Simpan
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Form */}
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

                {/* Nama */}
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>Nama Guru</label>
                  <input
                    type="text"
                    value={guruData.namaGuru}
                    onChange={(e) => handleFieldChange('namaGuru', e.target.value)}
                    disabled={!isEditMode}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: formErrors.namaGuru ? '2px solid #EF4444' : '1px solid #E5E7EB',
                      backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  {isEditMode && formErrors.namaGuru && <p style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.namaGuru}</p>}
                </div>

                {/* Kode */}
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>Kode Guru / NIP</label>
                  <input
                    type="text"
                    value={guruData.kodeGuru}
                    onChange={(e) => handleFieldChange('kodeGuru', e.target.value)}
                    disabled={!isEditMode}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: formErrors.kodeGuru ? '2px solid #EF4444' : '1px solid #E5E7EB',
                      backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  {isEditMode && formErrors.kodeGuru && <p style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.kodeGuru}</p>}
                </div>

                {/* Role */}
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>Peran</label>
                  <select
                    value={guruData.role}
                    onChange={(e) => {
                      handleFieldChange('role', e.target.value);
                      setTempMataPelajaran('');
                      setTempStaffBagian('');
                      handleFieldChange('waliKelasDari', '');
                    }}
                    disabled={!isEditMode}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    {peranList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>

                {/* Role Specific */}
                {guruData.role === 'Guru' && (
                  <div>
                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>Mata Pelajaran</label>
                    <select
                      value={tempMataPelajaran}
                      onChange={(e) => setTempMataPelajaran(e.target.value)}
                      disabled={!isEditMode}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '8px',
                        border: formErrors.mataPelajaran ? '2px solid #EF4444' : '1px solid #E5E7EB',
                        backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Pilih Mata Pelajaran</option>
                      {mataPelajaranList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {isEditMode && formErrors.mataPelajaran && <p style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.mataPelajaran}</p>}
                  </div>
                )}

                {guruData.role === 'Wali Kelas' && (
                  <div>
                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>Wali Kelas Untuk</label>
                    <select
                      value={guruData.waliKelasDari}
                      onChange={(e) => handleFieldChange('waliKelasDari', e.target.value)}
                      disabled={!isEditMode}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '8px',
                        border: formErrors.waliKelasDari ? '2px solid #EF4444' : '1px solid #E5E7EB',
                        backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Pilih Kelas</option>
                      {getAvailableKelasOptions().map(c => <option key={c} value={c}>{c}</option>)}
                      {!getAvailableKelasOptions().includes(guruData.waliKelasDari || '') && guruData.waliKelasDari && (
                        <option value={guruData.waliKelasDari}>{guruData.waliKelasDari}</option>
                      )}
                    </select>
                    {isEditMode && formErrors.waliKelasDari && <p style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.waliKelasDari}</p>}
                  </div>
                )}

                {guruData.role === 'Staff' && (
                  <div>
                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>Bagian</label>
                    <select
                      value={tempStaffBagian}
                      onChange={(e) => setTempStaffBagian(e.target.value)}
                      disabled={!isEditMode}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '8px',
                        border: formErrors.staffBagian ? '2px solid #EF4444' : '1px solid #E5E7EB',
                        backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Pilih Bagian</option>
                      {staffBagianList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isEditMode && formErrors.staffBagian && <p style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.staffBagian}</p>}
                  </div>
                )}

                {/* JK */}
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>Jenis Kelamin</label>
                  <select
                    value={guruData.jenisKelamin === 'Laki-Laki' ? 'Laki-Laki' : 'Perempuan'}
                    onChange={(e) => handleFieldChange('jenisKelamin', e.target.value)}
                    disabled={!isEditMode}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option value="Laki-Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Telp */}
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 600 }}>No. Telepon</label>
                  <input
                    type="tel"
                    value={guruData.noTelp}
                    onChange={(e) => handleFieldChange('noTelp', e.target.value.replace(/\D/g, '').slice(0, 13))}
                    placeholder="08xxxxxxxxxx"
                    disabled={!isEditMode}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: formErrors.noTelp ? '2px solid #EF4444' : '1px solid #E5E7EB',
                      backgroundColor: 'white', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  {isEditMode && formErrors.noTelp && <p style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.noTelp}</p>}
                </div>

              </div>

              {/* Footer */}
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button onClick={handleBack} style={{
                  backgroundColor: '#2563EB', border: 'none', color: 'white', padding: '10px 24px',
                  borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <ArrowLeft size={18} /> Kembali
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
