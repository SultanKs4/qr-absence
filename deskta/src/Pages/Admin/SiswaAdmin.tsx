import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../component/Admin/AdminLayout';
import { 
  Users, 
  Search,
  Plus, 
  MoreVertical, 
  Upload, 
  X, 
  Trash2,
  Eye,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { masterService, type Major, type ClassRoom } from '../../services/masterService';
import * as XLSX from 'xlsx';
import { studentService } from '../../services/studentService';

// Interface helpers
interface Siswa {
  id: string;
  namaSiswa: string;
  nisn: string;
  nis: string;
  jurusan: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  // Optional extras for detail/edit
  phone?: string;
  address?: string;
  email?: string;
  username?: string;
  tahunMulai?: string;
  tahunAkhir?: string;
}

interface SiswaAdminProps {
  user?: any;
  onLogout?: () => void;
  currentPage?: string;
  onMenuClick?: (page: string) => void;
  onNavigateToDetail?: (id: string) => void;
}

const SiswaAdmin: React.FC<SiswaAdminProps> = ({ 
  user, 
  onLogout, 
  currentPage, 
  onMenuClick, 
  onNavigateToDetail 
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [students, setStudents] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Master Data State
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);

  // Search
  const [searchValue, setSearchValue] = useState('');

  // Dropdown & Modal State
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [isEksporDropdownOpen, setIsEksporDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // For Edit

  // Form State
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    namaSiswa: '',
    nisn: '',
    nis: '',
    username: '',
    password: '',
    email: '',
    address: '',
    jenisKelamin: 'L',
    jurusanId: '',
    kelas: '', // This will store class_id now
    noTelp: '',
    tahunMulai: currentYear.toString(),
    tahunAkhir: (currentYear + 3).toString()
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Pagination
  const [pageIndex, setPageIndex] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1); // Keep totalPages for API response


  const paginate = (pageNumber: number) => setPageIndex(pageNumber);


  // Initial Data Fetch
  useEffect(() => {
    fetchMasterData();
  }, []);

  // Fetch students when search or page changes
  useEffect(() => {
    fetchStudents();
  }, [searchValue, pageIndex]); // Changed currentPage to pageIndex

  const fetchMasterData = async () => {
    try {
      const [majorsRes, classesRes] = await Promise.all([
        masterService.getMajors(),
        masterService.getClasses()
      ]);
      setMajors(majorsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch master data:', err);
      // Not blocking UI, but dropdowns will be empty
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // API call with params
      // Note: studentService needs to handle pagination response structure if standard Laravel API
      const params = {
        page: pageIndex, // Use pageIndex
        per_page: itemsPerPage, // Use itemsPerPage
        search: searchValue
      };
      
      const response = await studentService.getStudents(params as any);
      
      // Map API response to local Siswa interface
      const data = response.data || [];
      const mappedStudents: Siswa[] = data.map((s: any) => ({
        id: s.id.toString(),
        namaSiswa: s.name,
        nisn: s.nisn,
        nis: s.nis || '-',
        jurusan: s.major || '-', // Use code
        kelas: s.class_name || '-',
        jenisKelamin: s.gender,
        phone: s.parent_phone,
        address: s.address,
        email: s.email,
        username: s.username
      }));

      setStudents(mappedStudents);
      
      // Update pagination info if available in response
      if (response.meta) {
        setTotalPages(response.meta.last_page);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  };

  // Form Validation
  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'namaSiswa' && !value.trim()) error = 'Nama Siswa wajib diisi';
    if (name === 'nisn' && !value.trim()) error = 'NISN wajib diisi';
    if (name === 'nisn' && value && !/^\d+$/.test(value)) error = 'NISN harus berupa angka';
    if (name === 'nis' && !value.trim()) error = 'NIS wajib diisi';
    if (name === 'username' && !value.trim()) error = 'Username wajib diisi';
    if (name === 'password' && !editingId && !value.trim()) error = 'Password wajib diisi';
    if (name === 'address' && !value.trim()) error = 'Alamat wajib diisi';
    if (name === 'jurusanId' && !value) error = 'Jurusan wajib dipilih';
    if (name === 'kelas' && !value) error = 'Kelas wajib dipilih';
    
    setFormErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    if (!formData.namaSiswa.trim()) errors.namaSiswa = 'Nama Siswa wajib diisi';
    if (!formData.nisn.trim()) errors.nisn = 'NISN wajib diisi';
    if (!formData.nis.trim()) errors.nis = 'NIS wajib diisi';
    if (!formData.username.trim()) errors.username = 'Username wajib diisi';
    if (!editingId && !formData.password.trim()) errors.password = 'Password wajib diisi';
    if (!formData.address.trim()) errors.address = 'Alamat wajib diisi';
    if (!formData.jurusanId) errors.jurusanId = 'Jurusan wajib dipilih';
    if (!formData.kelas) errors.kelas = 'Kelas wajib dipilih';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers
  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      namaSiswa: '',
      nisn: '',
      nis: '',
      username: '',
      password: '',
      email: '',
      address: '',
      jenisKelamin: 'L',
      jurusanId: '',
      kelas: '',
      noTelp: '',
      tahunMulai: currentYear.toString(),
      tahunAkhir: (currentYear + 3).toString()
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (student: Siswa) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(student.id);
    } else {
      // Fallback to modal editing if onNavigateToDetail is not provided
      setEditingId(student.id);
      
      const selectedClass = classes.find(c => c.name === student.kelas);
      const selectedMajor = majors.find(m => m.code === student.jurusan);

      setFormData({
        namaSiswa: student.namaSiswa,
        nisn: student.nisn,
        nis: student.nis,
        username: student.username || '',
        password: '', // Don't show password
        email: student.email || '',
        address: student.address || '',
        jenisKelamin: student.jenisKelamin,
        jurusanId: selectedMajor ? selectedMajor.id.toString() : '',
        kelas: selectedClass ? selectedClass.id.toString() : '',
        noTelp: student.phone || '',
        tahunMulai: student.tahunMulai || '2023',
        tahunAkhir: student.tahunAkhir || '2026'
      });
      setIsModalOpen(true);
      setOpenActionId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload: any = {
        name: formData.namaSiswa,
        nisn: formData.nisn,
        nis: formData.nis,
        username: formData.username,
        email: formData.email || undefined,
        address: formData.address,
        gender: formData.jenisKelamin,
        class_id: formData.kelas,
        parent_phone: formData.noTelp,
      };

      if (!editingId || formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await studentService.updateStudent(editingId, payload);
      } else {
        await studentService.addStudent(payload);
      }
      
      handleCloseModal();
      fetchStudents(); // Refresh list
    } catch (err: any) {
      console.error('Failed to save student:', err);
      alert('Gagal menyimpan data siswa: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSiswa = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      try {
        await studentService.deleteStudent(id);
        fetchStudents();
        setOpenActionId(null);
      } catch (err) {
        console.error('Failed to delete student:', err);
        alert('Gagal menghapus siswa.');
      }
    }
  };

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
            nisn: String(row.NISN || row.nisn),
            nis: String(row.NIS || row.nis),
            gender: row.Gender || row.gender || 'L',
            address: row.Alamat || row.address,
            class_id: row.ClassID || row.class_id || row.KelasID,
            is_class_officer: row.PengurusKelas || row.is_class_officer || false,
            phone: row.Telepon || row.phone || null,
            contact: row.Kontak || row.contact || null,
          }));

          setLoading(true);
          const result = await studentService.importStudents(mappedItems);
          alert(`Berhasil mengimpor ${result.created} siswa.`);
          fetchStudents();
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

  const handleNavigateToDetail = (id: string) => {
    navigate(`/admin/siswa/${id}`);
  };

  // UI Helpers
  // Filter majors/classes for dropdowns
  // Major options: use majors state
  // Class options: filter classes based on selected major if possible, or show all
  const availableClasses = formData.jurusanId 
    ? classes.filter(c => c.major_id.toString() === formData.jurusanId)
    : classes;

    if (loading) {
      return (
        <AdminLayout
          pageTitle="Data Siswa"
          currentPage={currentPage || "siswa"}
          onMenuClick={onMenuClick || (() => {})}
          user={user}
          onLogout={onLogout || (() => {})}
          hideBackground={false}
        >
          <div style={{ padding: '24px', color: 'white', textAlign: 'center' }}>Loading...</div>
        </AdminLayout>
      );
    }
  
    return (
      <AdminLayout
        pageTitle="Data Siswa"
        currentPage={currentPage || "siswa"}
        onMenuClick={onMenuClick || (() => {})}
        user={user}
        onLogout={onLogout || (() => {})}
        hideBackground={false}
      >
      <div style={{ padding: '24px' }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '4px'
            }}>
              Data Siswa
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6B7280'
            }}>
              Kelola data siswa, kelas, dan jurusan
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 16px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <Users size={20} color="#2563EB" style={{ marginRight: '8px' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Total Siswa</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                  {students.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleOpenModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <Plus size={18} />
              Tambah Siswa
            </button>
            <button
              onClick={handleImport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Upload size={18} />
              Import
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              onChange={handleFileSelect} 
              accept=".csv,.xlsx"
            />
          </div>

          <div style={{
            position: 'relative',
            width: '300px'
          }}>
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                outline: 'none',
                fontSize: '14px',
                backgroundColor: '#FFFFFF'
              }}
            />
            <Search 
              size={18} 
              color="#9CA3AF" 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        {/* Table Section */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid #E5E7EB'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
              Memuat data...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
              {error}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>No</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Nama Siswa</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>NISN</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Jurusan</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Kelas</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>L/P</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                        Tidak ada data siswa
                      </td>
                    </tr>
                  ) : (
                    students.map((student, index) => (
                      <tr 
                        key={student.id} 
                        style={{ 
                          borderBottom: '1px solid #E5E7EB',
                          transition: 'background-color 0.1s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                          {(pageIndex - 1) * itemsPerPage + index + 1}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {student.namaSiswa}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6B7280' }}>
                          {student.nisn}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6B7280' }}>
                          <span style={{
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {student.jurusan}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6B7280' }}>
                          {student.kelas}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6B7280' }}>
                          {student.jenisKelamin}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setOpenActionId(openActionId === student.id ? null : student.id)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                color: '#6B7280'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F3F4F6';
                                e.currentTarget.style.color = '#111827';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openActionId === student.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '4px',
                                width: '160px',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                border: '1px solid #E5E7EB',
                                zIndex: 50,
                                overflow: 'hidden'
                              }}>
                                <button
                                  onClick={() => handleNavigateToDetail(student.id)}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    color: '#374151',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Eye size={14} /> Detail
                                </button>
                                <button
                                  onClick={() => handleEdit(student)}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    color: '#374151',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Edit size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSiswa(student.id)}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    color: '#DC2626',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Trash2 size={14} /> Hapus
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls could go here */}
          <div style={{
             padding: '12px 24px',
             borderTop: '1px solid #E5E7EB',
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center'
          }}>
             <button
                onClick={() => paginate(pageIndex - 1)}
                disabled={pageIndex === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: pageIndex === 1 ? '#F3F4F6' : '#FFFFFF',
                  color: pageIndex === 1 ? '#9CA3AF' : '#374151',
                  cursor: pageIndex === 1 ? 'not-allowed' : 'pointer',
               }}
             >
               Previous
             </button>
             <span style={{ fontSize: '14px', color: '#6B7280' }}>
               Page {pageIndex} of {totalPages}
             </span>
             <button
                onClick={() => paginate(pageIndex + 1)}
                disabled={pageIndex >= totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: pageIndex >= totalPages ? '#F3F4F6' : '#FFFFFF',
                  color: pageIndex >= totalPages ? '#9CA3AF' : '#374151',
                  cursor: pageIndex >= totalPages ? 'not-allowed' : 'pointer',
               }}
             >
               Next
             </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit Siswa */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '24px'
        }} onClick={handleCloseModal}>
          <div style={{
             backgroundColor: '#FFFFFF',
             borderRadius: '16px',
             width: '100%',
             maxWidth: '600px',
             maxHeight: '90vh',
             overflowY: 'auto',
             boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                {editingId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
              </h2>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Nama Lengkap <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.namaSiswa}
                    onChange={e => {
                      setFormData({...formData, namaSiswa: e.target.value});
                      validateField('namaSiswa', e.target.value);
                    }}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.namaSiswa ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       boxSizing: 'border-box' // Fix width issue
                    }}
                    placeholder="Masukkan nama lengkap"
                  />
                  {formErrors.namaSiswa && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.namaSiswa}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    NISN <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={e => {
                      setFormData({...formData, nisn: e.target.value});
                      validateField('nisn', e.target.value);
                    }}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.nisn ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       boxSizing: 'border-box'
                    }}
                    placeholder="Nomor Induk Siswa"
                  />
                  {formErrors.nisn && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.nisn}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    NIS <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={e => {
                      setFormData({...formData, nis: e.target.value});
                      validateField('nis', e.target.value);
                    }}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.nis ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       boxSizing: 'border-box'
                    }}
                    placeholder="Nomor Induk Siswa"
                  />
                  {formErrors.nis && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.nis}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Username <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => {
                      setFormData({...formData, username: e.target.value});
                      validateField('username', e.target.value);
                    }}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.username ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       boxSizing: 'border-box'
                    }}
                    placeholder="Username untuk login"
                  />
                  {formErrors.username && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.username}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Password {!editingId && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => {
                      setFormData({...formData, password: e.target.value});
                      validateField('password', e.target.value);
                    }}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.password ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       boxSizing: 'border-box'
                    }}
                    placeholder={editingId ? "Kosongkan jika tidak ingin mengubah" : "Minimal 6 karakter"}
                  />
                  {formErrors.password && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.password}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       boxSizing: 'border-box'
                    }}
                    placeholder="email@sekolah.sch.id"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Alamat <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={e => {
                      setFormData({...formData, address: e.target.value});
                      validateField('address', e.target.value);
                    }}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.address ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       minHeight: '80px',
                       boxSizing: 'border-box'
                    }}
                    placeholder="Masukkan alamat lengkap"
                  />
                  {formErrors.address && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.address}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Jenis Kelamin <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={e => setFormData({...formData, jenisKelamin: e.target.value})}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       backgroundColor: 'white',
                       boxSizing: 'border-box'
                    }}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Jurusan <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.jurusanId}
                    onChange={e => {
                      setFormData({...formData, jurusanId: e.target.value, kelas: ''}); // Reset class when major changes
                      validateField('jurusanId', e.target.value);
                    }}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.jurusanId ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       backgroundColor: 'white',
                       boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Pilih Jurusan</option>
                    {majors.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                    ))}
                  </select>
                  {formErrors.jurusanId && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.jurusanId}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Kelas <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={e => {
                      setFormData({...formData, kelas: e.target.value});
                      validateField('kelas', e.target.value);
                    }}
                    disabled={!formData.jurusanId}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: formErrors.kelas ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       backgroundColor: formData.jurusanId ? 'white' : '#F3F4F6',
                       boxSizing: 'border-box',
                       cursor: formData.jurusanId ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Pilih Kelas</option>
                    {availableClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option> // Use c.name which includes grade usually
                    ))}
                  </select>
                  {formErrors.kelas && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{formErrors.kelas}</p>}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    No. Telepon Orang Tua
                  </label>
                  <input
                    type="text"
                    value={formData.noTelp}
                    onChange={e => setFormData({...formData, noTelp: e.target.value})}
                    style={{
                       width: '100%',
                       padding: '10px 14px',
                       borderRadius: '8px',
                       border: '1px solid #D1D5DB',
                       fontSize: '14px',
                       outline: 'none',
                       boxSizing: 'border-box'
                    }}
                    placeholder="Contoh: 08123456789"
                  />
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SiswaAdmin;