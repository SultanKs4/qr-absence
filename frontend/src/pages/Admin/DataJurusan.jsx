import React, { useState, useEffect } from 'react';
import './DataJurusan.css';
import NavbarAdmin from '../../components/Admin/NavbarAdmin';

function DataJurusan() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jurusans, setJurusans] = useState([]);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    kodeJurusan: '',
    namaJurusan: ''
  });
  const [errors, setErrors] = useState({});

  // API Configuration
  const baseURL = import.meta.env.VITE_API_URL;
  const API_BASE_URL = baseURL ? baseURL : 'http://localhost:8000/api';

  useEffect(() => {
    fetchJurusans();
  }, []);

  const fetchJurusans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/majors?per_page=-1`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch majors');
      const result = await response.json();
      // Resource returns data in 'data' field or directly if per_page=-1 depending on implementation
      // Our MajorController index returns wrapped in Resource response which has .data
      setJurusans(result.data || result);
      setLoading(false);
    } catch (err) {
      console.error('Error loading jurusan:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editData) {
        setFormData({
          id: editData.id,
          kodeJurusan: editData.kodeJurusan || editData.code,
          namaJurusan: editData.namaJurusan || editData.name
        });
      } else {
        setFormData({
          kodeJurusan: '',
          namaJurusan: ''
        });
      }
      setErrors({});
    }
  }, [editData, isModalOpen]);

  const checkKodeExists = (kode) => {
    if (editData && (editData.kodeJurusan || editData.code).toUpperCase() === kode.toUpperCase()) {
      return false;
    }
    return jurusans.some(j => (j.kodeJurusan || j.code).toUpperCase() === kode.toUpperCase());
  };

  const checkNamaExists = (nama) => {
    if (editData && (editData.namaJurusan || editData.name).toLowerCase() === nama.toLowerCase()) {
      return false;
    }
    return jurusans.some(j => (j.namaJurusan || j.name).toLowerCase() === nama.toLowerCase());
  };

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

  const validate = () => {
    const newErrors = {};

    if (!formData.kodeJurusan.trim()) {
      newErrors.kodeJurusan = 'Kode jurusan harus diisi';
    } else if (formData.kodeJurusan.trim().length > 10) {
      newErrors.kodeJurusan = 'Kode jurusan maksimal 10 karakter';
    } else if (checkKodeExists(formData.kodeJurusan.trim())) {
      newErrors.kodeJurusan = `Kode jurusan "${formData.kodeJurusan.toUpperCase()}" sudah terdaftar`;
    }

    if (!formData.namaJurusan.trim()) {
      newErrors.namaJurusan = 'Nama jurusan harus diisi';
    } else if (checkNamaExists(formData.namaJurusan.trim())) {
      newErrors.namaJurusan = `Jurusan "${formData.namaJurusan}" sudah terdaftar`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddJurusan = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        code: formData.kodeJurusan.trim().toUpperCase(),
        name: formData.namaJurusan.trim(),
        category: 'Umum' // Default category
      };

      const response = await fetch(`${API_BASE_URL}/majors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to add major');

      await fetchJurusans();
      setIsModalOpen(false);
      setEditData(null);
      alert('Data konsentrasi keahlian berhasil ditambahkan!');
    } catch (error) {
      console.error('Error adding jurusan:', error);
      alert('Gagal menambahkan data. ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditJurusan = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        code: formData.kodeJurusan.trim().toUpperCase(),
        name: formData.namaJurusan.trim(),
        category: editData.category || 'Umum'
      };

      const response = await fetch(`${API_BASE_URL}/majors/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to update major');

      await fetchJurusans();
      setEditData(null);
      setIsModalOpen(false);
      alert('Data konsentrasi keahlian berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating jurusan:', error);
      alert('Gagal memperbarui data. ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJurusan = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data konsentrasi keahlian ini?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/majors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete major');

      await fetchJurusans();
      alert('Data konsentrasi keahlian berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting jurusan:', error);
      alert('Gagal menghapus data. ' + error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editData) {
      handleEditJurusan();
    } else {
      handleAddJurusan();
    }
  };

  const filteredJurusans = jurusans.filter(jurusan => {
    const nama = jurusan.namaJurusan || jurusan.name || '';
    const kode = jurusan.kodeJurusan || jurusan.code || '';
    return nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
           kode.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleResetSearch = () => {
    setSearchTerm('');
  };

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
      <div className="jurusan-container">
        <NavbarAdmin />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jurusan-container">
        <NavbarAdmin />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          gap: '16px'
        }}>
          <div style={{ fontSize: '18px', color: '#ef4444' }}>Error: {error}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jurusan-container">
      <NavbarAdmin />
      <h1 className="jurusan-page-title">Data Konsentrasi Keahlian</h1>

      <div className="jurusan-table-wrapper">
        <div className="jurusan-filter-box">
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Cari berdasarkan kode atau nama jurusan..."
              className="jurusan-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={handleResetSearch}
                className="jurusan-clear-btn"
                title="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>
          <div className="jurusan-select-group">
            <button
              className="jurusan-btn-tambah"
              onClick={() => {
                setEditData(null);
                setIsModalOpen(true);
              }}
            >
              Tambahkan
            </button>
          </div>
        </div>

        {searchTerm && (
          <div className="jurusan-search-info">
            <strong>Hasil Pencarian:</strong> {filteredJurusans.length} dari {jurusans.length} data
            <span> | Kata kunci: "{searchTerm}"</span>
          </div>
        )}

        <table className="jurusan-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kode Konsentrasi Keahlian</th>
              <th>Nama Konsentrasi Keahlian</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredJurusans.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  {searchTerm
                    ? 'Tidak ada data yang sesuai dengan pencarian'
                    : 'Belum ada data konsentrasi keahlian'}
                </td>
              </tr>
            ) : (
              filteredJurusans.map((jurusan, index) => (
                <tr key={jurusan.id}>
                  <td style={{ fontWeight: '700' }}>{index + 1}</td>
                  <td><strong>{jurusan.kodeJurusan || jurusan.code}</strong></td>
                  <td>{jurusan.namaJurusan || jurusan.name}</td>
                  <td className="jurusan-aksi-cell">
                    <button
                      className="jurusan-aksi jurusan-edit"
                      onClick={() => {
                        setEditData(jurusan);
                        setIsModalOpen(true);
                      }}
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="jurusan-aksi jurusan-hapus"
                      onClick={() => handleDeleteJurusan(jurusan.id)}
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

      {isModalOpen && (
        <div className="jurusan-modal-overlay" onClick={() => {
          if (!saving) {
            setIsModalOpen(false);
            setEditData(null);
          }
        }}>
          <div className="jurusan-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="jurusan-modal-header">
              <h2>{editData ? 'Edit Data Konsentrasi Keahlian' : 'Tambah Data Konsentrasi Keahlian'}</h2>
              <button 
                className="jurusan-modal-close" 
                onClick={() => {
                  if (!saving) {
                    setIsModalOpen(false);
                    setEditData(null);
                  }
                }}
                disabled={saving}
              >×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="jurusan-form-group">
                <label>Kode Konsentrasi Keahlian <span className="jurusan-required">*</span></label>
                <input
                  type="text"
                  name="kodeJurusan"
                  value={formData.kodeJurusan}
                  onChange={handleChange}
                  placeholder="Contoh: RPL"
                  className={errors.kodeJurusan ? 'jurusan-error' : ''}
                  maxLength="5"
                  style={{ textTransform: 'uppercase' }}
                  disabled={saving}
                />
                {errors.kodeJurusan && <span className="jurusan-error-message">{errors.kodeJurusan}</span>}
                {!errors.kodeJurusan && (
                  <small className="jurusan-helper-text">
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
                    Maksimal 5 karakter, akan otomatis diubah ke huruf besar
                  </small>
                )}
              </div>

              <div className="jurusan-form-group">
                <label>Nama Konsentrasi Keahlian <span className="jurusan-required">*</span></label>
                <input
                  type="text"
                  name="namaJurusan"
                  value={formData.namaJurusan}
                  onChange={handleChange}
                  placeholder="Contoh: Rekayasa Perangkat Lunak"
                  className={errors.namaJurusan ? 'jurusan-error' : ''}
                  disabled={saving}
                />
                {errors.namaJurusan && <span className="jurusan-error-message">{errors.namaJurusan}</span>}
                {!errors.namaJurusan && (
                  <small className="jurusan-helper-text">
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
                    Nama lengkap konsentrasi keahlian
                  </small>
                )}
              </div>

              <div className="jurusan-modal-actions">
                <button 
                  type="button" 
                  className="jurusan-btn-cancel" 
                  onClick={() => {
                    if (!saving) {
                      setIsModalOpen(false);
                      setEditData(null);
                    }
                  }}
                  disabled={saving}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="jurusan-btn-submit"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : (editData ? 'Perbarui' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataJurusan;