import React, { useState, useEffect } from 'react';
import './DataKelas.css';
import NavbarAdmin from '../../components/Admin/NavbarAdmin';

// API Configuration
const baseURL = import.meta.env.VITE_API_URL;
const API_BASE_URL = baseURL ? baseURL : 'http://localhost:8000/api';

// API Service
const apiService = {
  // Get all classes
  getClasses: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching classes:', error);
      return { data: [] };
    }
  },

  // Get available teachers (only with role 'Guru' or 'Wali Kelas')
  getAvailableTeachers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers/available`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch teachers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return { data: [] };
    }
  },

  // Add class
  addClass: async (classData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(classData)
      });
      if (!response.ok) throw new Error('Failed to add class');
      return await response.json();
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  },

  // Update class
  updateClass: async (id, classData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(classData)
      });
      if (!response.ok) throw new Error('Failed to update class');
      return await response.json();
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  },

  // Delete class
  deleteClass: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to delete class');
      return await response.json();
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }
};

function DataKelas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kelas, setKelas] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [searchKelas, setSearchKelas] = useState('');
  const [searchJurusan, setSearchJurusan] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    namaKelas: '',
    jurusan: '',
    kelas: '',
    waliKelas: ''
  });
  const [errors, setErrors] = useState({});

  // Load classes from API
  useEffect(() => {
    loadClasses();
  }, []);

  // Load teachers when modal opens
  useEffect(() => {
    if (isModalOpen) {
      loadTeachers();
    }
  }, [isModalOpen]);

  const loadClasses = async () => {
    setLoading(true);
    const result = await apiService.getClasses();
    if (result.data) {
      setKelas(result.data);
    }
    setLoading(false);
  };

  const loadTeachers = async () => {
    const result = await apiService.getAvailableTeachers();
    if (result.data) {
      setAvailableTeachers(result.data);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      if (editData) {
        setFormData({
          namaKelas: editData.class_name,
          jurusan: editData.major,
          kelas: editData.grade,
          waliKelas: editData.homeroom_teacher_id
        });
      } else {
        setFormData({
          namaKelas: '',
          jurusan: '',
          kelas: '',
          waliKelas: ''
        });
      }
      setErrors({});
    }
  }, [editData, isModalOpen]);

  // Check if teacher is already assigned
  const getTeacherAssignment = (teacherId) => {
    if (editData && editData.homeroom_teacher_id === teacherId) {
      return null;
    }
    const assignedClass = kelas.find(k => k.homeroom_teacher_id === teacherId);
    return assignedClass ? assignedClass.class_name : null;
  };

  // Reset Filter
  const handleResetFilter = () => {
    setSearchKelas('');
    setSearchJurusan('');
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Check if class already has a teacher
  const checkClassHasTeacher = (namaKelas) => {
    if (editData && editData.class_name === namaKelas) {
      return null;
    }
    const existingClass = kelas.find(k => k.class_name === namaKelas);
    return existingClass ? existingClass.homeroom_teacher_name : null;
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.kelas) {
      newErrors.kelas = 'Tingkat kelas harus dipilih';
    }

    if (!formData.jurusan) {
      newErrors.jurusan = 'Konsentrasi keahlian harus dipilih';
    }

    if (!formData.namaKelas.trim()) {
      newErrors.namaKelas = 'Nama kelas harus diisi';
    } else {
      const existingTeacher = checkClassHasTeacher(formData.namaKelas);
      if (existingTeacher) {
        newErrors.namaKelas = `Kelas ${formData.namaKelas} sudah memiliki wali kelas: ${existingTeacher}`;
      }
    }

    if (!formData.waliKelas) {
      newErrors.waliKelas = 'Wali kelas harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add Class
  const handleAddKelas = async () => {
    if (!validate()) return;

    try {
      const classData = {
        class_name: formData.namaKelas,
        major: formData.jurusan,
        grade: formData.kelas,
        homeroom_teacher_id: formData.waliKelas
      };

      await apiService.addClass(classData);
      alert('Data kelas berhasil ditambahkan!\nJabatan guru telah diubah menjadi Wali Kelas.');
      
      await loadClasses();
      setIsModalOpen(false);
      setEditData(null);
    } catch (error) {
      alert('Gagal menambahkan data kelas!');
    }
  };

  // Edit Class
  const handleEditKelas = async () => {
    if (!validate()) return;

    try {
      const classData = {
        class_name: formData.namaKelas,
        major: formData.jurusan,
        grade: formData.kelas,
        homeroom_teacher_id: formData.waliKelas
      };

      await apiService.updateClass(editData.id, classData);
      alert('Data kelas berhasil diperbarui!\nData guru juga telah diperbarui.');
      
      await loadClasses();
      setEditData(null);
      setIsModalOpen(false);
    } catch (error) {
      alert('Gagal memperbarui data kelas!');
    }
  };

  // Delete Class
  const handleDeleteKelas = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data kelas ini?')) {
      try {
        await apiService.deleteClass(id);
        alert('Data kelas berhasil dihapus!\nJabatan guru telah dikembalikan ke Guru.');
        await loadClasses();
      } catch (error) {
        alert('Gagal menghapus data kelas!');
      }
    }
  };

  // Submit Form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editData) {
      handleEditKelas();
    } else {
      handleAddKelas();
    }
  };

  // Filter
  const filteredKelas = kelas.filter(k => {
    const matchKelas = searchKelas === '' || k.grade === searchKelas;
    const matchJurusan = searchJurusan === '' || k.major === searchJurusan;
    return matchKelas && matchJurusan;
  });

  // Icon Edit SVG
  const EditIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  // Icon Delete SVG
  const DeleteIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );

  if (loading) {
    return (
      <div className="kelas-data-container">
        <NavbarAdmin />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Memuat data kelas...
        </div>
      </div>
    );
  }

  return (
    <div className="kelas-data-container">
      <NavbarAdmin />
      <h1 className="kelas-page-title">Data Kelas</h1>

      <div className="kelas-table-wrapper">
        <div className="kelas-filter-box">
          <div className="kelas-select-group">
            <label>Pilih Kelas :</label>
            <select value={searchKelas} onChange={(e) => setSearchKelas(e.target.value)}>
              <option value="">Semua Kelas</option>
              <option value="X">X</option>
              <option value="XI">XI</option>
              <option value="XII">XII</option>
            </select>

            <label>Pilih Konsentrasi Keahlian :</label>
            <select value={searchJurusan} onChange={(e) => setSearchJurusan(e.target.value)}>
              <option value="">Semua Jurusan</option>
              <option value="RPL">RPL</option>
              <option value="TKJ">TKJ</option>
              <option value="DKV">DKV</option>
              <option value="AV">AV</option>
              <option value="MT">MT</option>
              <option value="BC">BC</option>
              <option value="AN">AN</option>
              <option value="EI">EI</option>
            </select>

            {(searchKelas || searchJurusan) && (
              <button 
                className="kelas-btn-reset-filter" 
                onClick={handleResetFilter}
                title="Reset Filter"
              >
                Reset Filter
              </button>
            )}

            <button
              className="kelas-btn-tambah"
              onClick={() => {
                setEditData(null);
                setIsModalOpen(true);
              }}
            >
              Tambahkan
            </button>
          </div>
        </div>

        {(searchKelas || searchJurusan) && (
          <div style={{ 
            padding: '10px 20px', 
            backgroundColor: '#e3f2fd', 
            borderLeft: '4px solid #2196f3',
            marginBottom: '15px',
            borderRadius: '4px'
          }}>
            <strong>Hasil Filter:</strong> {filteredKelas.length} dari {kelas.length} kelas
            {searchKelas && <span> | Tingkat: {searchKelas}</span>}
            {searchJurusan && <span> | Jurusan: {searchJurusan}</span>}
          </div>
        )}

        <table className="kelas-tabel">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Kelas</th>
              <th>Konsentrasi Keahlian</th>
              <th>Wali Kelas</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredKelas.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  {searchKelas || searchJurusan 
                    ? 'Tidak ada data yang sesuai dengan filter' 
                    : 'Tidak ada data kelas'}
                </td>
              </tr>
            ) : (
              filteredKelas.map((k, index) => (
                <tr key={k.id}>
                  <td>{index + 1}</td>
                  <td>{k.class_name}</td>
                  <td>{k.major}</td>
                  <td>{k.homeroom_teacher_name}</td>
                  <td className="kelas-aksi-cell">
                    <button
                      className="kelas-aksi kelas-edit"
                      onClick={() => {
                        setEditData(k);
                        setIsModalOpen(true);
                      }}
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="kelas-aksi kelas-hapus"
                      onClick={() => handleDeleteKelas(k.id)}
                      title="Hapus"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="kelas-modal-overlay" onClick={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}>
          <div className="kelas-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="kelas-modal-header">
              <h2>{editData ? 'Edit Data Kelas' : 'Tambah Data Kelas'}</h2>
              <button className="kelas-modal-close" onClick={() => {
                setIsModalOpen(false);
                setEditData(null);
              }}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="kelas-form">
              {formData.namaKelas && checkClassHasTeacher(formData.namaKelas) && (
                <div style={{
                  padding: '12px 15px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderLeft: '4px solid #ffc107',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '10px'
                }}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#856404" 
                    strokeWidth="2"
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#856404', display: 'block', marginBottom: '4px' }}>Peringatan!</strong>
                    <span style={{ color: '#856404', fontSize: '13px' }}>
                      Kelas <strong>{formData.namaKelas}</strong> sudah memiliki wali kelas: <strong>{checkClassHasTeacher(formData.namaKelas)}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="kelas-form-group">
                <label>Tingkat Kelas <span className="kelas-required">*</span></label>
                <select
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleChange}
                  className={errors.kelas ? 'kelas-error' : ''}
                >
                  <option value="">Pilih Tingkat Kelas</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
                {errors.kelas && <span className="kelas-error-message">{errors.kelas}</span>}
              </div>

              <div className="kelas-form-group">
                <label>Konsentrasi Keahlian <span className="kelas-required">*</span></label>
                <select
                  name="jurusan"
                  value={formData.jurusan}
                  onChange={handleChange}
                  className={errors.jurusan ? 'kelas-error' : ''}
                >
                  <option value="">Pilih Konsentrasi Keahlian</option>
                  <option value="RPL">RPL - Rekayasa Perangkat Lunak</option>
                  <option value="TKJ">TKJ - Teknik Komputer dan Jaringan</option>
                  <option value="DKV">DKV - Desain Komunikasi Visual</option>
                  <option value="AV">AV - Animasi Video</option>
                  <option value="MT">MT - Mekatronika</option>
                  <option value="BC">BC - Broadcasting</option>
                  <option value="AN">AN - Animasi</option>
                  <option value="EI">EI - Elektronika Industri</option>
                </select>
                {errors.jurusan && <span className="kelas-error-message">{errors.jurusan}</span>}
              </div>

              <div className="kelas-form-group">
                <label>Nama Kelas <span className="kelas-required">*</span></label>
                <input
                  type="text"
                  name="namaKelas"
                  value={formData.namaKelas}
                  onChange={handleChange}
                  placeholder="Contoh: XII RPL 1"
                  className={errors.namaKelas ? 'kelas-error' : ''}
                />
                {errors.namaKelas && <span className="kelas-error-message">{errors.namaKelas}</span>}
                {!errors.namaKelas && (
                  <small className="kelas-helper-text">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{ marginRight: '5px', verticalAlign: 'middle' }}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Satu kelas hanya boleh memiliki satu wali kelas
                  </small>
                )}
              </div>

              <div className="kelas-form-group">
                <label>Wali Kelas <span className="kelas-required">*</span></label>
                <select
                  name="waliKelas"
                  value={formData.waliKelas}
                  onChange={handleChange}
                  className={errors.waliKelas ? 'kelas-error' : ''}
                >
                  <option value="">Pilih Wali Kelas</option>
                  {availableTeachers.length === 0 ? (
                    <option value="" disabled>Tidak ada guru yang tersedia</option>
                  ) : (
                    availableTeachers.map((teacher) => {
                      const assignedClass = getTeacherAssignment(teacher.id);
                      const isDisabled = assignedClass !== null;
                      
                      return (
                        <option 
                          key={teacher.id} 
                          value={teacher.id}
                          disabled={isDisabled}
                          style={isDisabled ? { 
                            color: '#999',
                            fontStyle: 'italic'
                          } : {}}
                        >
                          {teacher.name}
                          {isDisabled && ` (Wali Kelas ${assignedClass})`}
                        </option>
                      );
                    })
                  )}
                </select>
                {errors.waliKelas && <span className="kelas-error-message">{errors.waliKelas}</span>}
                
                <small className="kelas-helper-text">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ marginRight: '5px', verticalAlign: 'middle' }}
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Hanya guru dengan jabatan 'Guru' yang bisa menjadi wali kelas. Waka dan Kapro tidak bisa.
                </small>
              </div>

              <div className="kelas-modal-actions">
                <button type="button" className="kelas-btn-cancel" onClick={() => {
                  setIsModalOpen(false);
                  setEditData(null);
                }}>
                  Batal
                </button>
                <button type="submit" className="kelas-btn-submit">
                  {editData ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataKelas;