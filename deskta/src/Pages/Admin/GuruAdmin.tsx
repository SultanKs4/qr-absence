// FILE: GuruAdmin.tsx - Halaman Admin untuk mengelola data guru
import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../component/Admin/AdminLayout';
import { Button } from '../../component/Shared/Button';
import { Select } from '../../component/Shared/Select';
import { 
  MoreVertical,
  Trash2,
  Eye,
  FileDown,
  Upload,
  Download,
  X,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { teacherService } from '../../services/teacherService';
import { masterService, type Subject, type ClassRoom } from '../../services/masterService';

/* ============ IMPORT GAMBAR AWAN ============ */
import AWANKIRI from '../../assets/Icon/AWANKIRI.png';
import AwanBawahkanan from '../../assets/Icon/AwanBawahkanan.png';

/* ===================== INTERFACE DEFINITIONS ===================== */
interface User {
  role: string;
  name: string;
}

interface Guru {
  id: string;
  nip: string; // kodeGuru
  name: string; // namaGuru
  role: string; // jabatan
  phone?: string; // noTelp
  subject?: string; // keterangan for Guru
  waka_field?: string; // keterangan for Staff
  homeroom_class?: {
    id: number;
    name: string;
  }; // keterangan for Wali Kelas
  keterangan: string; // Computed for display
  email?: string;
  gender?: string; // Not in resource yet, but form has it
}

interface GuruAdminProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
  onNavigateToDetail?: (guruId: string) => void;
}

/* ===================== MAIN COMPONENT ===================== */
export default function GuruAdmin({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  onNavigateToDetail,
}: GuruAdminProps) {
  // ==================== STATE MANAGEMENT ====================
  const [searchValue, setSearchValue] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedKeterangan, setSelectedKeterangan] = useState('');
  const [isEksporDropdownOpen, setIsEksporDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  
  // Pagination State
  const [pageIndex, setPageIndex] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    namaGuru: '',
    kodeGuru: '',
    jenisKelamin: 'Laki-Laki',
    role: '',
    keterangan: '',
    noTelp: '',
    waliKelasDari: '',
    email: '',
    password: ''
  });
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== FETCH DATA ====================
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // Fetch teachers
      const response = await teacherService.getTeachers({
        page: pageIndex,
        per_page: itemsPerPage,
        search: searchValue
      });
      
      const mappedGuru = response.data.map((t: any) => ({
        id: t.id.toString(),
        nip: t.nip,
        name: t.name,
        role: t.role || 'Guru',
        phone: t.phone,
        subject: t.subject,
        homeroom_class: t.homeroom_class,
        waka_field: t.waka_field,
        email: t.email,
        // Compute keterangan based on role
        keterangan: t.role === 'Wali Kelas' && t.homeroom_class 
          ? t.homeroom_class.name 
          : t.role === 'Staff' ? (t.waka_field || '-') 
          : (t.subject || '-'),
        gender: 'Laki-Laki' // Default or fetch if available
      }));

      setGuruList(mappedGuru);
      setTotalPages(response.meta.last_page);
      
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
      setError('Gagal memuat data guru.');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    // Debounce search if needed, but for now direct effect
    const timeoutId = setTimeout(() => {
      fetchTeachers();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [pageIndex, searchValue]);

  // ==================== DYNAMIC OPTIONS BERDASARKAN ROLE ====================
  
  const allKeteranganOptions = Array.from(new Set(guruList.map((g) => g.keterangan)))
    .filter(Boolean)
    .sort()
    .map((m) => ({ value: m, label: m }));

  const getFilteredKeteranganOptions = () => {
    if (!selectedRole) return allKeteranganOptions;
    
    // If role is Guru, show subjects
    if (selectedRole === 'Guru') {
      return subjects.map(s => ({ value: s.name, label: s.name }));
    }
    // If role is Wali Kelas, show classes
    if (selectedRole === 'Wali Kelas') {
      return classes.map(c => ({ value: c.name, label: c.name }));
    }
    
    // Fallback based on current list
    const filtered = guruList
      .filter(g => g.role === selectedRole)
      .map(g => g.keterangan)
      .filter(Boolean);
    
    const unique = Array.from(new Set(filtered)).sort();
    return unique.map(m => ({ value: m, label: m }));
  };

  const roleOptions = [
    { label: 'Guru', value: 'Guru' },
    { label: 'Wali Kelas', value: 'Wali Kelas' },
    { label: 'Staff', value: 'Staff' },
  ];

  // ==================== OPTIONS UNTUK FORM MODAL ====================
  
  const mataPelajaranOptions = subjects.map(s => ({ label: s.name, value: s.name }));

  const bagianStaffOptions = [
    { label: 'Tata Usaha', value: 'Tata Usaha' },
    { label: 'Administrasi', value: 'Administrasi' },
    { label: 'Perpustakaan', value: 'Perpustakaan' },
    { label: 'Laboratorium', value: 'Laboratorium' },
    { label: 'Keuangan', value: 'Keuangan' },
  ];
  
  const kelasOptions = classes.map(c => c.name);

  // ==================== FORM VALIDATION ====================
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.namaGuru.trim()) errors.namaGuru = 'Nama guru harus diisi';
    if (!formData.kodeGuru.trim()) errors.kodeGuru = 'NIP harus diisi';
    if (!formData.role) errors.role = 'Peran harus dipilih';
    
    if (formData.role === 'Guru' && !formData.keterangan) {
      errors.keterangan = 'Mata pelajaran harus dipilih';
    }
    
    if (formData.role === 'Wali Kelas' && !formData.waliKelasDari) {
      errors.waliKelasDari = 'Wali kelas dari harus dipilih';
    }
    
    if (formData.role === 'Staff' && !formData.keterangan) {
      errors.keterangan = 'Bagian staff harus dipilih';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== FILTERING DATA ====================
  const filteredData = guruList.filter((item) => {
    const matchRole = selectedRole ? item.role === selectedRole : true;
    const matchKeterangan = selectedKeterangan ? item.keterangan === selectedKeterangan : true;
    return matchRole && matchKeterangan;
  });

  // ==================== EVENT HANDLERS ====================
  
  const handleNavigateToDetail = (guruId: string) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(guruId);
    } else {
      // Store ID in localStorage or just navigate
      localStorage.setItem('selectedGuruId', guruId);
      onMenuClick('detail-guru');
    }
  };

  const handleTambahGuru = () => {
    setFormData({
      namaGuru: '',
      kodeGuru: '',
      jenisKelamin: 'Laki-Laki',
      role: '',
      keterangan: '',
      noTelp: '',
      waliKelasDari: '',
      email: '',
      password: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Build payload
      const payload: any = {
        name: formData.namaGuru,
        username: formData.kodeGuru, // Use NIP as username default
        nip: formData.kodeGuru,
        jabatan: formData.role,
        phone: formData.noTelp,
        email: formData.email || undefined,
        password: formData.password || 'password123',
      };

      if (formData.role === 'Guru') {
        payload.subject = formData.keterangan;
      } else if (formData.role === 'Wali Kelas') {
        const selectedClass = classes.find(c => c.name === formData.waliKelasDari);
        if (selectedClass) {
          payload.homeroom_class_id = selectedClass.id;
        }
      } else if (formData.role === 'Staff') {
        // Or create a new field in API for 'bagian'? TeacherController uses 'subject' or 'bidang'
        payload.bidang = formData.keterangan;
        payload.waka_field = formData.keterangan; // Just to be safe if backend changes name
      }

      await teacherService.createTeacher(payload);
      alert('✓ Data guru berhasil ditambahkan!');
      handleCloseModal();
      fetchTeachers();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menambahkan guru: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteGuru = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
      try {
        await teacherService.deleteTeacher(id);
        alert('✓ Data guru berhasil dihapus!');
        setOpenActionId(null);
        fetchTeachers();
      } catch (err: any) {
        console.error(err);
        alert('Gagal menghapus guru: ' + err.message);
      }
    }
  };

  // ==================== DOWNLOAD FORMAT EXCEL ====================
  const handleDownloadFormatExcel = () => {
    const link = document.createElement('a');
    link.href = '/Template_Import_Data_Guru.xlsx'; // Ensure this file exists
    link.download = 'Template_Import_Data_Guru.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==================== IMPORT ====================
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
        alert('Format file tidak didukung. Gunakan Excel atau CSV.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);

          if (data.length === 0) {
            alert('File kosong atau format tidak sesuai.');
            return;
          }

          const mappedItems = data.map(row => ({
            name: row.Nama || row.name,
            username: row.Username || row.username,
            email: row.Email || row.email || null,
            password: row.Password || row.password || 'password123',
            nip: String(row.NIP || row.nip),
            phone: row.Telepon || row.phone || null,
            contact: row.Kontak || row.contact || null,
            homeroom_class_id: row.WaliKelasID || row.homeroom_class_id || null,
            subject: row.MataPelajaran || row.subject || null,
          }));

          setLoading(true);
          const result = await teacherService.importTeachers(mappedItems);
          alert(`Berhasil mengimpor ${result.created} guru.`);
          fetchTeachers();
        } catch (error: any) {
          console.error('Import failed:', error);
          alert('Gagal mengimpor data: ' + (error.message || 'Lengkapi data wajib.'));
        } finally {
          setLoading(false);
          e.target.value = '';
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // ==================== EXPORT ====================
  const handleExportPDF = () => {
    // Reuse existing logic with filteredData
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Guru Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #1E3A8A; }
          .date { text-align: center; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #2563EB; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f5f7fa; }
        </style>
      </head>
      <body>
        <h1>Laporan Data Guru</h1>
        <div class="date">Tanggal: ${new Date().toLocaleDateString('id-ID')}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NIP/Kode</th>
              <th>Nama Guru</th>
              <th>Peran</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((guru, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${guru.nip}</td>
                <td>${guru.name}</td>
                <td>${guru.role}</td>
                <td>${guru.keterangan}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const newWindow = window.open('', '', 'width=900,height=600');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      setTimeout(() => newWindow.print(), 250);
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <AdminLayout
      pageTitle="Data Guru"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
      hideBackground
    >
      {/*... Background Images reuse ...*/}
      <img src={AWANKIRI} style={{ position: "fixed", top: 0, left: 0, width: 220, zIndex: 0, pointerEvents: "none" }} alt="cloud" />
      <img src={AwanBawahkanan} style={{ position: "fixed", bottom: 0, right: 0, width: 220, zIndex: 0, pointerEvents: "none" }} alt="cloud" />

      <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", borderRadius: 16, padding: '16px',
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.6)",
          display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1, minHeight: "70vh",
      }}>
        
        {/* FILTERS & ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 1fr auto auto auto auto', gap: '12px', alignItems: 'flex-end' }}>
          <Select label="Peran" value={selectedRole} onChange={(v) => { setSelectedRole(v); setSelectedKeterangan(''); }} options={roleOptions} placeholder="Semua" />
          <Select 
            label={selectedRole === 'Guru' ? 'Mata Pelajaran' : selectedRole === 'Wali Kelas' ? 'Kelas' : 'Keterangan'}
            value={selectedKeterangan} 
            onChange={setSelectedKeterangan} 
            options={getFilteredKeteranganOptions()} 
            placeholder="Semua" 
          />
          
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Cari Guru..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '6px', border: '1px solid #E2E8F0', outline: 'none' }}
            />
          </div>
          
          <Button label="Tambahkan" onClick={handleTambahGuru} variant="primary" />
          
          <button onClick={handleDownloadFormatExcel} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#10B981', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={14}/> Format Excel</button>
          <button onClick={handleImport} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#0B1221', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Upload size={14}/> Impor</button>
          <div style={{ position: 'relative' }}>
             <button onClick={() => setIsEksporDropdownOpen(!isEksporDropdownOpen)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#0B1221', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><FileDown size={14}/> Ekspor</button>
             {isEksporDropdownOpen && (
               <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'white', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 20 }}>
                 <button onClick={() => { setIsEksporDropdownOpen(false); handleExportPDF(); }} style={{ padding: '8px 12px', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>PDF</button>
               </div>
             )}
          </div>
        </div>

        {/* LOADING / ERROR / TABLE */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'red', padding: '40px' }}>{error}</div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>No</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Kode Guru / NIP</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Nama Guru</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Peran</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Keterangan</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0', width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((guru, index) => (
                    <tr key={guru.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{(pageIndex - 1) * itemsPerPage + index + 1}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{guru.nip}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{guru.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                          backgroundColor: guru.role === 'Wali Kelas' ? '#DBEAFE' : guru.role === 'Staff' ? '#F3E8FF' : '#DCFCE7',
                          color: guru.role === 'Wali Kelas' ? '#1E40AF' : guru.role === 'Staff' ? '#6B21A8' : '#166534',
                        }}>
                          {guru.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{guru.keterangan}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <button onClick={() => setOpenActionId(openActionId === guru.id ? null : guru.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <MoreVertical size={16} color="#64748B" />
                          </button>
                          {openActionId === guru.id && (
                            <div style={{ position: 'absolute', right: '100%', top: 0, background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', zIndex: 50, minWidth: '120px', overflow: 'hidden' }}>
                              <button onClick={() => handleNavigateToDetail(guru.id)} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={14} /> Detail
                              </button>
                              <button onClick={() => handleDeleteGuru(guru.id)} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trash2 size={14} /> Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>Tidak ada data guru.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          {/* Simple pagination controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button label="Previous" onClick={() => setPageIndex(Math.max(1, pageIndex - 1))} disabled={pageIndex === 1} variant="secondary" />
            <span style={{ display: 'flex', alignItems: 'center' }}>Page {pageIndex} of {totalPages}</span>
            <Button label="Next" onClick={() => setPageIndex(Math.min(totalPages, pageIndex + 1))} disabled={pageIndex === totalPages} variant="secondary" />
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH GURU */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Tambah Guru Baru</h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Nama Guru</label>
                <input type="text" value={formData.namaGuru} onChange={e => setFormData({ ...formData, namaGuru: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                {formErrors.namaGuru && <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.namaGuru}</span>}
              </div>
              
              <div>
                <label>NIP / Kode Guru</label>
                <input type="text" value={formData.kodeGuru} onChange={e => setFormData({ ...formData, kodeGuru: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                {formErrors.kodeGuru && <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.kodeGuru}</span>}
              </div>

              <div>
                <label>Peran</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="">Pilih Peran</option>
                  {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {formErrors.role && <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.role}</span>}
              </div>

              {formData.role === 'Guru' && (
                <div>
                  <label>Mata Pelajaran</label>
                  <select value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                     <option value="">Pilih Mapel</option>
                     {mataPelajaranOptions.map(opt => <option key={opt.value} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
              )}

              {formData.role === 'Wali Kelas' && (
                <div>
                  <label>Wali Kelas Dari</label>
                  <select value={formData.waliKelasDari} onChange={e => setFormData({ ...formData, waliKelasDari: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                     <option value="">Pilih Kelas</option>
                     {kelasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {formErrors.waliKelasDari && <span style={{ color: 'red', fontSize: '12px' }}>{formErrors.waliKelasDari}</span>}
                </div>
              )}

               {formData.role === 'Staff' && (
                <div>
                  <label>Bagian</label>
                  <select value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                     <option value="">Pilih Bagian</option>
                     {bagianStaffOptions.map(opt => <option key={opt.value} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label>Nomor Telepon</label>
                <input type="text" value={formData.noTelp} onChange={e => setFormData({ ...formData, noTelp: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div>
                <label>Email (untuk Login)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div>
                <label>Password (Default: password123)</label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Kosongkan untuk default" style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <Button label="Batal" onClick={handleCloseModal} variant="secondary" type="button" />
                <Button label="Simpan" type="submit" variant="primary" />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN INPUT IMPORT */}
      <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept=".xlsx,.xls,.csv" />
    </AdminLayout>
  );
}