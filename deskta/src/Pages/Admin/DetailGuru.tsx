// FILE: DetailGuru.tsx - Halaman Detail Guru Refactored
import { useState, useEffect } from 'react';
import AdminLayout from '../../component/Admin/AdminLayout';
import { User as UserIcon, Edit2, Save, X, ArrowLeft } from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { masterService, type Subject, type ClassRoom } from '../../services/masterService';

/* ===================== INTERFACE DEFINITIONS ===================== */
interface User {
  role: string;
  name: string;
}

interface Guru {
  id: string;
  namaGuru: string; // name
  kodeGuru: string; // nip
  jenisKelamin: string;
  role: string; // role
  noTelp: string; // phone
  keterangan: string; // subject or wali class name or staff bagian
  waliKelasDari?: string; // class name
  waka_field?: string; // specific field for staff
  email?: string;
  password?: string;
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



const staffBagianList = [
  { id: 'Tata Usaha', nama: 'Tata Usaha' },
  { id: 'Administrasi', nama: 'Administrasi' },
  { id: 'Perpustakaan', nama: 'Perpustakaan' },
  { id: 'Laboratorium', nama: 'Laboratorium' },
  { id: 'Keuangan', nama: 'Keuangan' },
];

/* ===================== MAIN COMPONENT ===================== */
export default function DetailGuru({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  guruId,
  onUpdateGuru,
}: DetailGuruProps) {
  // ==================== STATE MANAGEMENT ====================
  const [guruData, setGuruData] = useState<Guru | null>(null);
  const [originalData, setOriginalData] = useState<Guru | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  
  const [tempMataPelajaran, setTempMataPelajaran] = useState('');
  const [tempStaffBagian, setTempStaffBagian] = useState('');

  // ==================== FETCH DATA ====================
  const fetchMasterData = async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        masterService.getSubjects(),
        masterService.getClasses()
      ]);
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const fetchGuruDetail = async () => {
    if (!guruId) {
       // Try fallback to localStorage if guruId prop is missing/empty (backward compatibility)
       const storedId = localStorage.getItem('selectedGuruId');
       if (!storedId) {
         setError('ID Guru tidak ditemukan.');
         setLoading(false);
         return;
       }
       // If we found it in localStorage, we use it next render or just proceed if we could assign to variable.
       // But better to expect guruId prop or handle in parent.
       // For now, let's assume if guruId is empty, we check localStorage.
    }

    const targetId = guruId || localStorage.getItem('selectedGuruId');
    if (!targetId) {
        setError('ID Guru tidak ditemukan.');
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      const response = await teacherService.getTeacherById(targetId);
      const data = response.data;
      
      const mappedGuru: Guru = {
        id: data.id.toString(),
        namaGuru: data.name,
        kodeGuru: data.nip, // or data.username
        jenisKelamin: 'Laki-Laki', // API doesn't have gender yet?
        role: data.role || 'Guru',
        noTelp: data.phone || '',
        email: data.email,
        keterangan: '', // Will be computed
        waliKelasDari: data.homeroom_class ? data.homeroom_class.name : undefined
      };

      if (mappedGuru.role === 'Guru') {
        mappedGuru.keterangan = data.subject || '';
        setTempMataPelajaran(mappedGuru.keterangan);
      } else if (mappedGuru.role === 'Wali Kelas') {
        mappedGuru.keterangan = mappedGuru.waliKelasDari || '';
      } else if (mappedGuru.role === 'Staff') {
        mappedGuru.waka_field = data.waka_field || data.bidang;
        mappedGuru.keterangan = mappedGuru.waka_field || ''; 
        setTempStaffBagian(mappedGuru.keterangan);
      }

      setGuruData(mappedGuru);
      setOriginalData(mappedGuru);
    } catch (err: any) {
      console.error('Error fetching teacher detail:', err);
      setError('Gagal memuat data guru.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchGuruDetail();
  }, [guruId]);

  // ==================== FORM VALIDATION ====================
  const validateField = (field: string, value: string) => {
    const newErrors = { ...formErrors };

    if (field === 'namaGuru') {
      if (!value.trim()) newErrors.namaGuru = 'Nama guru harus diisi';
      else if (value.trim().length < 3) newErrors.namaGuru = 'Nama guru minimal 3 karakter';
      else delete newErrors.namaGuru;
    }

    if (field === 'kodeGuru') {
      if (!value.trim()) newErrors.kodeGuru = 'Kode guru harus diisi';
      else delete newErrors.kodeGuru;
    }

    if (field === 'noTelp') {
      if (value && value.trim()) {
        if (!/^08\d{10,11}$/.test(value)) newErrors.noTelp = 'Nomor telepon harus 12-13 digit (08xxxxxxxxxx)';
        else delete newErrors.noTelp;
      } else delete newErrors.noTelp;
    }

    setFormErrors(newErrors);
  };

  const validateForm = (): boolean => {
    if (!guruData) return false;
    const errors: {[key: string]: string} = {};
    
    if (!guruData.namaGuru.trim()) errors.namaGuru = 'Nama guru harus diisi';
    if (!guruData.kodeGuru.trim()) errors.kodeGuru = 'Kode guru harus diisi';
    
    if (guruData.noTelp && guruData.noTelp.trim() && !/^08\d{10,11}$/.test(guruData.noTelp)) {
      errors.noTelp = 'Nomor telepon tidak valid';
    }
    
    if (guruData.role === 'Guru' && !tempMataPelajaran) errors.mataPelajaran = 'Mata pelajaran harus dipilih';
    if (guruData.role === 'Wali Kelas' && !guruData.waliKelasDari) errors.waliKelasDari = 'Kelas harus dipilih';
    if (guruData.role === 'Staff' && !tempStaffBagian) errors.staffBagian = 'Bagian staff harus dipilih';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== EVENT HANDLERS ====================
  const handleEnableEdit = () => {
    setIsEditMode(true);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setGuruData(originalData);
    setFormErrors({});
    if (originalData) {
      setTempMataPelajaran(originalData.role === 'Guru' ? originalData.keterangan : '');
      setTempStaffBagian(originalData.role === 'Staff' ? originalData.keterangan : '');
    }
  };

  const handleSaveChanges = async () => {
    if (!guruData || !validateForm()) return;
    
    try {
      const payload: any = {
        name: guruData.namaGuru,
        nip: guruData.kodeGuru,
        jabatan: guruData.role,
        phone: guruData.noTelp,
        email: guruData.email,
        // password: guruData.password // Only send if changing password
      };

      if (guruData.role === 'Guru') {
        payload.subject = tempMataPelajaran;
      } else if (guruData.role === 'Wali Kelas') {
         const selectedClass = classes.find(c => c.name === guruData.waliKelasDari);
         if (selectedClass) {
           payload.homeroom_class_id = selectedClass.id;
         }
      } else if (guruData.role === 'Staff') {
        payload.bidang = tempStaffBagian;
        payload.waka_field = tempStaffBagian;
      }

      await teacherService.updateTeacher(guruData.id, payload);
      
      // Update local state
      let updatedData = { ...guruData };
      if (updatedData.role === 'Guru') updatedData.keterangan = tempMataPelajaran;
      else if (updatedData.role === 'Wali Kelas') updatedData.keterangan = updatedData.waliKelasDari || '';
      else if (updatedData.role === 'Staff') updatedData.keterangan = tempStaffBagian;
      
      setGuruData(updatedData);
      setOriginalData(updatedData);
      setIsEditMode(false);
      
      if (onUpdateGuru) onUpdateGuru(updatedData);
      alert('✓ Data berhasil diperbarui!');
      
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan perubahan: ' + (err.message || 'Unknown error'));
    }
  };

  const handleFieldChange = (field: keyof Guru, value: string) => {
    if (!guruData) return;
    const updatedGuru = { ...guruData, [field]: value };
    
    if (field === 'role') {
      setTempMataPelajaran('');
      setTempStaffBagian('');
      updatedGuru.waliKelasDari = '';
    }
    setGuruData(updatedGuru);
  };

  const handleBack = () => {
    if (isEditMode) {
      if (confirm('Anda sedang dalam mode edit. Yakin ingin kembali tanpa menyimpan?')) {
        setIsEditMode(false);
        onMenuClick('guru');
      }
    } else {
      onMenuClick('guru');
    }
  };

  // ==================== RENDERING ====================
  if (loading || !guruData) {
    return (
      <AdminLayout pageTitle="Detail Guru" currentPage={currentPage} onMenuClick={onMenuClick} user={user} onLogout={onLogout}>
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            {error ? <span style={{color: 'red'}}>{error}</span> : <span>Loading...</span>}
         </div>
      </AdminLayout>
    );
  }

  const isMobile = window.innerWidth < 768;

  return (
    <AdminLayout
      pageTitle="Detail Guru"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
      hideBackground
    >
      <div style={{
          backgroundImage: 'url(../src/assets/Background/bgdetailgurusiswa.png)',
          backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh',
          padding: isMobile ? '16px' : '24px', display: 'flex', alignItems: 'flex-start', paddingTop: '40px'
      }}>
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
          
           {/* BACK BUTTON */}
           <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'white', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginBottom: '20px', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
            <ArrowLeft size={20} />
            Kembali ke Data Guru
          </button>

          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* HEADER */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: isMobile ? '20px' : '28px 32px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '20px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                 <div style={{ width: isMobile ? '60px' : '70px', height: isMobile ? '60px' : '70px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '3px solid rgba(255,255,255,0.2)' }}>
                   <UserIcon size={isMobile ? 28 : 32} />
                 </div>
                 <div>
                   <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{guruData.namaGuru}</h2>
                   <p style={{ margin: 0, fontSize: isMobile ? '13px' : '15px', color: '#cbd5e1', fontFamily: 'monospace' }}>Kode: {guruData.kodeGuru}</p>
                 </div>
               </div>
               
               <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                 {!isEditMode ? (
                   <button onClick={handleEnableEdit} style={{ backgroundColor: '#2563EB', border: 'none', color: 'white', padding: isMobile ? '10px 20px' : '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                     <Edit2 size={16} /> Ubah Data
                   </button>
                 ) : (
                   <>
                     <button onClick={handleCancelEdit} style={{ backgroundColor: '#6B7280', border: 'none', color: 'white', padding: isMobile ? '10px 16px' : '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: isMobile ? 1 : 'auto', justifyContent: 'center' }}>
                       <X size={16} /> Batal
                     </button>
                     <button onClick={handleSaveChanges} style={{ backgroundColor: '#10B981', border: 'none', color: 'white', padding: isMobile ? '10px 16px' : '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: isMobile ? 1 : 'auto', justifyContent: 'center' }}>
                       <Save size={16} /> Simpan
                     </button>
                   </>
                 )}
               </div>
            </div>

            {/* FORM */}
            <div style={{ padding: isMobile ? '20px' : '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '16px' : '24px' }}>
                
                {/* Nama */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Nama Guru</label>
                  <input type="text" value={guruData.namaGuru} onChange={(e) => { handleFieldChange('namaGuru', e.target.value); validateField('namaGuru', e.target.value); }} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: formErrors.namaGuru ? '2px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'text' : 'not-allowed', boxSizing: 'border-box' }} />
                  {formErrors.namaGuru && isEditMode && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.namaGuru}</p>}
                </div>

                {/* Kode */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Kode Guru</label>
                  <input type="text" value={guruData.kodeGuru} onChange={(e) => { handleFieldChange('kodeGuru', e.target.value); validateField('kodeGuru', e.target.value); }} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: formErrors.kodeGuru ? '2px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'text' : 'not-allowed', boxSizing: 'border-box' }} />
                  {formErrors.kodeGuru && isEditMode && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.kodeGuru}</p>}
                </div>

                {/* Role */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Peran</label>
                  <select value={guruData.role} onChange={(e) => handleFieldChange('role', e.target.value)} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'pointer' : 'not-allowed', boxSizing: 'border-box' }}>
                    {peranList.map(item => <option key={item.id} value={item.id}>{item.nama}</option>)}
                  </select>
                </div>

                {/* Conditional Fields based on Role */}
                {guruData.role === 'Guru' && (
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Mata Pelajaran</label>
                    <select value={tempMataPelajaran} onChange={(e) => setTempMataPelajaran(e.target.value)} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: formErrors.mataPelajaran ? '2px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'pointer' : 'not-allowed', boxSizing: 'border-box' }}>
                      <option value="">Pilih Mata Pelajaran</option>
                      {subjects.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                    {formErrors.mataPelajaran && isEditMode && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.mataPelajaran}</p>}
                  </div>
                )}
                
                {guruData.role === 'Wali Kelas' && (
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Wali Kelas Dari</label>
                    <select value={guruData.waliKelasDari} onChange={(e) => handleFieldChange('waliKelasDari', e.target.value)} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: formErrors.waliKelasDari ? '2px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'pointer' : 'not-allowed', boxSizing: 'border-box' }}>
                      <option value="">Pilih Kelas</option>
                      {classes.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                    {formErrors.waliKelasDari && isEditMode && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.waliKelasDari}</p>}
                  </div>
                )}

                {guruData.role === 'Staff' && (
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Bagian</label>
                     <select value={tempStaffBagian} onChange={(e) => setTempStaffBagian(e.target.value)} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: formErrors.staffBagian ? '2px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'pointer' : 'not-allowed', boxSizing: 'border-box' }}>
                      <option value="">Pilih Bagian</option>
                      {staffBagianList.map(item => <option key={item.id} value={item.nama}>{item.nama}</option>)}
                    </select>
                    {formErrors.staffBagian && isEditMode && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.staffBagian}</p>}
                  </div>
                )}
                
                {/* No Telp */}
                <div>
                   <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Nomor Telepon</label>
                   <input type="text" value={guruData.noTelp} onChange={(e) => { handleFieldChange('noTelp', e.target.value); validateField('noTelp', e.target.value); }} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: formErrors.noTelp ? '2px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'text' : 'not-allowed', boxSizing: 'border-box' }} />
                   {formErrors.noTelp && isEditMode && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.noTelp}</p>}
                </div>

                {/* Email */}
                <div>
                   <label style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>Email</label>
                   <input type="email" value={guruData.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} disabled={!isEditMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', backgroundColor: '#FFFFFF', color: '#1F2937', outline: 'none', cursor: isEditMode ? 'text' : 'not-allowed', boxSizing: 'border-box' }} />
                </div>
                
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}