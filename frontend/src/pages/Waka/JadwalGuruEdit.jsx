import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './JadwalGuruEdit.css';
import NavbarWaka from '../../components/Waka/NavbarWaka';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';

function JadwalGuruEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    kode_guru: '',
    nama_guru: '',
    mata_pelajaran: '',
    email: '',
    no_hp: '',
    gambar_jadwal: null
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJadwalGuru();
  }, [id]);

  const fetchJadwalGuru = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/teachers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Handle potential wrapped data
        const user = data.user || {};

        setFormData({
          kode_guru: data.kode_guru || '',
          nama_guru: user.name || '',
          mata_pelajaran: data.subject || '', // Mapped from subject
          email: user.email || '',
          no_hp: user.phone || '',
          gambar_jadwal: null
        });

        if (data.schedule_image_path) {
          // Check if it's a full URL or relative path
          const imageUrl = data.schedule_image_path.startsWith('http')
            ? data.schedule_image_path
            : `http://localhost:8000/storage/${data.schedule_image_path}`;
          setPreviewImage(imageUrl);
        }
      } else {
        console.error('Gagal memuat data guru');
      }
    } catch (error) {
      console.error('Error fetching jadwal guru:', error);
      alert('Gagal memuat data jadwal guru');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, gambar_jadwal: 'Format file harus JPG, PNG, atau GIF' }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, gambar_jadwal: 'Ukuran file maksimal 5MB' }));
      return;
    }

    setFormData(prev => ({ ...prev, gambar_jadwal: file }));

    const reader = new FileReader();
    reader.onload = e => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // 1. Update Profile Data
      const profileData = {
        kode_guru: formData.kode_guru,
        name: formData.nama_guru, // Mapped to user.name
        subject: formData.mata_pelajaran, // Mapped to teacher_profile.subject
        email: formData.email,
        phone: formData.no_hp,
      };

      const response = await fetch(`http://localhost:8000/api/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui data guru');
      }

      // 2. Upload Image if exists
      if (formData.gambar_jadwal) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.gambar_jadwal);

        const imageResponse = await fetch(`http://localhost:8000/api/teachers/${id}/schedule-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData
        });

        if (!imageResponse.ok) {
          const imageError = await imageResponse.json();
          console.error('Image upload failed:', imageError);
          // Warning but success overall
          alert('Data berhasil disimpan, tetapi gagal mengupload gambar.');
        } else {
          alert('Jadwal guru dan gambar berhasil diperbarui');
        }
      } else {
        alert('Jadwal guru berhasil diperbarui');
      }

      navigate('/waka/jadwal-guru');

    } catch (error) {
      console.error('Error updating jadwal guru:', error);
      alert(error.message || 'Terjadi kesalahan saat memperbarui jadwal guru');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jadwal-guru-edit-container">
      <NavbarWaka />
      <div className="jadwal-guru-edit-header">
        <div>
          <h1 className="jadwal-guru-edit-title">
            <FaEdit /> Ubah Jadwal Guru
          </h1>
          <p className="jadwal-guru-edit-subtitle">
            Perbarui jadwal guru
          </p>
        </div>

        <Link to="/waka/jadwal-guru" className="jadwal-guru-edit-back">
          <FaArrowLeft /> Kembali
        </Link>
      </div>

      <div className="jadwal-guru-edit-card">
        <form onSubmit={handleSubmit}>

          {Object.keys(errors).length > 0 && (
            <div className="jadwal-guru-edit-error">
              <strong>Perhatian!</strong>
              <ul>
                {Object.values(errors).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {[
            ['kode_guru', 'Kode Guru'],
            ['nama_guru', 'Nama Guru'],
            ['mata_pelajaran', 'Mata Pelajaran'],
            ['email', 'Email'],
            ['no_hp', 'No. HP'],
          ].map(([name, label]) => (
            <div className="jadwal-guru-edit-group" key={name}>
              <label>{label}</label>
              <input
                type={name === 'email' ? 'email' : 'text'}
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
              />
            </div>
          ))}

          <div className="jadwal-guru-edit-upload">
            <label htmlFor="gambar_jadwal">
              {previewImage ? (
                <img src={previewImage} alt="upload jadwal gambar" />
              ) : (
                <span>Klik untuk tambah jadwal</span>
              )}
            </label>
            <input
              type="file"
              id="gambar_jadwal"
              hidden
              onChange={handleFileChange}
            />
          </div>

          <div className="jadwal-guru-edit-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>

            <Link to="/waka/jadwal-guru" className="jadwal-guru-edit-cancel">
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JadwalGuruEdit;