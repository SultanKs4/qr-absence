import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/Admin/NavbarAdmin';
// import './ProfileSekolah.css';
import './Profilesekolah.css'
import defaultLogo from '../../assets/logo.png';

// ==================== DUMMY DATA SERVICE (NO BACKEND) ====================
const dummyDataService = {
  // Get school profile from localStorage or return default dummy data
  getSchoolProfile() {
    const savedData = localStorage.getItem('schoolProfile');
    if (savedData) {
      return JSON.parse(savedData);
    }

    // Default dummy data
    return {
      namaSekolah: 'SMKN 2 SINGOSARI',
      npsn: '20517748',
      akreditasi: 'A',
      jenisSekolah: 'SMK',
      kepalaSekolah: 'SUMIJAH, S.Pd., M,Si',
      nipKepalaSekolah: '97002101998022009',
      jalan: 'Jl. Perusahaan No.20, Tanjungtirto',
      kelurahan: 'Tanjungtirto',
      kecamatan: 'Singosari',
      kabupatenKota: 'Kab. Malang',
      provinsi: 'Jawa Timur',
      kodePos: '65153',
      nomorTelepon: '(0341) 458823',
      email: 'smkn2.singosari@yahoo.co.id'
    };
  },

  // Save school profile to localStorage
  updateSchoolProfile(data) {
    const currentData = this.getSchoolProfile();
    const updatedData = { ...currentData, ...data };
    localStorage.setItem('schoolProfile', JSON.stringify(updatedData));
    return updatedData;
  },

  // Save logo URL to localStorage
  uploadLogo(base64Image) {
    const currentData = this.getSchoolProfile();
    currentData.logoUrl = base64Image;
    localStorage.setItem('schoolProfile', JSON.stringify(currentData));
    return currentData;
  },

  // Save mascot URL to localStorage
  uploadMascot(base64Image) {
    const currentData = this.getSchoolProfile();
    currentData.mascotUrl = base64Image;
    localStorage.setItem('schoolProfile', JSON.stringify(currentData));
    return currentData;
  },

  // Reset logo to default
  resetLogo() {
    const currentData = this.getSchoolProfile();
    currentData.logoUrl = null;
    localStorage.setItem('schoolProfile', JSON.stringify(currentData));
    return currentData;
  },

  // Delete mascot
  deleteMascot() {
    const currentData = this.getSchoolProfile();
    currentData.mascotUrl = null;
    localStorage.setItem('schoolProfile', JSON.stringify(currentData));
    return currentData;
  }
};

function ProfileSekolah() {
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const maskotInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    namaSekolah: '',
    npsn: '',
    akreditasi: '',
    jenisSekolah: '',
    kepalaSekolah: '',
    nipKepalaSekolah: '',
    jalan: '',
    kelurahan: '',
    kecamatan: '',
    kabupatenKota: '',
    provinsi: '',
    kodePos: '',
    nomorTelepon: '',
    email: ''
  });

  const [originalData, setOriginalData] = useState(null);
  const [logo, setLogo] = useState(defaultLogo);
  const [maskot, setMaskot] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [maskotFile, setMaskotFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSchoolProfile();
  }, []);

  const fetchSchoolProfile = () => {
    try {
      setLoading(true);

      // Simulate API delay
      setTimeout(() => {
        const data = dummyDataService.getSchoolProfile();

        const profileData = {
          namaSekolah: data.namaSekolah || '',
          npsn: data.npsn || '',
          akreditasi: data.akreditasi || 'A',
          jenisSekolah: data.jenisSekolah || '',
          kepalaSekolah: data.kepalaSekolah || '',
          nipKepalaSekolah: data.nipKepalaSekolah || '',
          jalan: data.jalan || '',
          kelurahan: data.kelurahan || '',
          kecamatan: data.kecamatan || '',
          kabupatenKota: data.kabupatenKota || '',
          provinsi: data.provinsi || '',
          kodePos: data.kodePos || '',
          nomorTelepon: data.nomorTelepon || '',
          email: data.email || ''
        };

        setFormData(profileData);
        setOriginalData(profileData);
        setLogo(data.logoUrl || defaultLogo);
        setMaskot(data.mascotUrl || null);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error('Error fetching school profile:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar!');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMaskotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar!');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
      }

      setMaskotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMaskot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    if (!window.confirm('Kembalikan logo ke default?')) return;

    try {
      setSaving(true);

      // Simulate API delay
      setTimeout(() => {
        dummyDataService.resetLogo();
        setLogo(defaultLogo);
        setLogoFile(null);
        if (logoInputRef.current) {
          logoInputRef.current.value = '';
        }
        alert('Logo berhasil direset ke default!');
        setSaving(false);
      }, 300);
    } catch (error) {
      console.error('Error resetting logo:', error);
      alert('Gagal mereset logo. Silakan coba lagi.');
      setSaving(false);
    }
  };

  const handleRemoveMaskot = () => {
    if (!window.confirm('Hapus maskot?')) return;

    try {
      setSaving(true);

      // Simulate API delay
      setTimeout(() => {
        dummyDataService.deleteMascot();
        setMaskot(null);
        setMaskotFile(null);
        if (maskotInputRef.current) {
          maskotInputRef.current.value = '';
        }
        alert('Maskot berhasil dihapus!');
        setSaving(false);
      }, 300);
    } catch (error) {
      console.error('Error deleting mascot:', error);
      alert('Gagal menghapus maskot. Silakan coba lagi.');
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!window.confirm('Apakah Anda yakin ingin menyimpan perubahan?')) return;

    try {
      setSaving(true);

      // Simulate API delay
      setTimeout(() => {
        // Upload logo jika ada perubahan
        if (logoFile && logo !== defaultLogo) {
          dummyDataService.uploadLogo(logo);
        }

        // Upload maskot jika ada perubahan
        if (maskotFile) {
          dummyDataService.uploadMascot(maskot);
        }

        // Update profile data
        dummyDataService.updateSchoolProfile(formData);

        alert('Data berhasil diperbarui!');
        setIsEditing(false);
        setLogoFile(null);
        setMaskotFile(null);

        // Refresh data
        fetchSchoolProfile();
        setSaving(false);
      }, 800);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal memperbarui data. Silakan coba lagi.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!window.confirm('Batalkan perubahan?')) return;

    // Reset to original data
    if (originalData) {
      setFormData(originalData);
    }

    // Reset images
    fetchSchoolProfile();

    // Reset file inputs
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
    if (maskotInputRef.current) {
      maskotInputRef.current.value = '';
    }

    setLogoFile(null);
    setMaskotFile(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="profil-sekolah-wrapper">
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

  return (
    <div className="profil-sekolah-wrapper">
      <NavbarAdmin />

      <div className="profil-sekolah-konten">
        <h1 className="profil-judul-halaman">Profil Sekolah</h1>

        <div className="profil-kontainer">
          {/* Logo & Maskot Section */}
          <div className="profil-media-section">
            <div className="profil-media-kartu">
              <h3 className="profil-media-judul">Logo Sekolah</h3>
              <div className="profil-media-preview">
                <img src={logo} alt="Logo Sekolah" className="profil-preview-gambar profil-logo-preview" />
              </div>

              {logo === defaultLogo && (
                <div className="profil-logo-info">
                  <i className="fas fa-info-circle"></i>
                  <span>Logo Default</span>
                </div>
              )}
              <div className="profil-media-tombol">
                <label htmlFor="logo-upload" className={`profil-btn-upload ${!isEditing || saving ? 'disabled' : ''}`}>
                  <i className="fas fa-upload"></i>
                  Ubah Logo
                </label>
                <input
                  ref={logoInputRef}
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  disabled={!isEditing || saving}
                />
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="profil-btn-reset"
                  disabled={!isEditing || saving}
                >
                  <i className="fas fa-undo"></i>
                  {saving ? 'Processing...' : 'Reset'}
                </button>
              </div>
            </div>

            <div className="profil-media-kartu">
              <h3 className="profil-media-judul">Maskot Sekolah</h3>
              <div className="profil-media-preview">
                {maskot ? (
                  <img src={maskot} alt="Maskot Sekolah" className="profil-preview-gambar profil-maskot-preview" />
                ) : (
                  <div className="profil-no-gambar">
                    <i className="fas fa-image"></i>
                    <p>Belum ada maskot</p>
                  </div>
                )}
              </div>
              <div className="profil-media-tombol">
                <label htmlFor="maskot-upload" className={`profil-btn-upload ${!isEditing || saving ? 'disabled' : ''}`}>
                  <i className="fas fa-upload"></i>
                  {maskot ? 'Ubah Maskot' : 'Unggah Maskot'}
                </label>
                <input
                  ref={maskotInputRef}
                  id="maskot-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleMaskotChange}
                  style={{ display: 'none' }}
                  disabled={!isEditing || saving}
                />
                {maskot && (
                  <button
                    type="button"
                    onClick={handleRemoveMaskot}
                    className="profil-btn-hapus"
                    disabled={!isEditing || saving}
                  >
                    <i className="fas fa-trash"></i>
                    {saving ? 'Processing...' : 'Hapus'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Data Sekolah */}
          <form onSubmit={handleSubmit} className="profil-form-data">
            <div className="profil-form-bagian">
              <h3 className="profil-bagian-judul">Informasi Umum</h3>

              <div className="profil-form-baris">
                <div className="profil-form-grup">
                  <label className="profil-form-label">Nama Sekolah</label>
                  <input
                    type="text"
                    name="namaSekolah"
                    value={formData.namaSekolah}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profil-form-grup">
                  <label className="profil-form-label">NPSN</label>
                  <input
                    type="text"
                    name="npsn"
                    value={formData.npsn}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="profil-form-baris">
                <div className="profil-form-grup">
                  <label className="profil-form-label">Akreditasi</label>
                  <select
                    name="akreditasi"
                    value={formData.akreditasi}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                  </select>
                </div>

                <div className="profil-form-grup">
                  <label className="profil-form-label">Jenis Sekolah</label>
                  <input
                    type="text"
                    name="jenisSekolah"
                    value={formData.jenisSekolah}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="profil-form-bagian">
              <h3 className="profil-bagian-judul">Kepala Sekolah</h3>

              <div className="profil-form-baris">
                <div className="profil-form-grup">
                  <label className="profil-form-label">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    name="kepalaSekolah"
                    value={formData.kepalaSekolah}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profil-form-grup">
                  <label className="profil-form-label">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    name="nipKepalaSekolah"
                    value={formData.nipKepalaSekolah}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="profil-form-bagian">
              <h3 className="profil-bagian-judul">Alamat & Kontak</h3>

              <div className="profil-form-grup lebar-penuh">
                <label className="profil-form-label">Alamat Jalan</label>
                <input
                  type="text"
                  name="jalan"
                  value={formData.jalan}
                  onChange={handleInputChange}
                  className="profil-form-input"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profil-form-baris">
                <div className="profil-form-grup">
                  <label className="profil-form-label">Kelurahan</label>
                  <input
                    type="text"
                    name="kelurahan"
                    value={formData.kelurahan}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profil-form-grup">
                  <label className="profil-form-label">Kecamatan</label>
                  <input
                    type="text"
                    name="kecamatan"
                    value={formData.kecamatan}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="profil-form-baris">
                <div className="profil-form-grup">
                  <label className="profil-form-label">Kabupaten/Kota</label>
                  <input
                    type="text"
                    name="kabupatenKota"
                    value={formData.kabupatenKota}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profil-form-grup">
                  <label className="profil-form-label">Provinsi</label>
                  <input
                    type="text"
                    name="provinsi"
                    value={formData.provinsi}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="profil-form-baris">
                <div className="profil-form-grup">
                  <label className="profil-form-label">Kode Pos</label>
                  <input
                    type="text"
                    name="kodePos"
                    value={formData.kodePos}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profil-form-grup">
                  <label className="profil-form-label">Nomor Telepon</label>
                  <input
                    type="text"
                    name="nomorTelepon"
                    value={formData.nomorTelepon}
                    onChange={handleInputChange}
                    className="profil-form-input"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="profil-form-grup lebar-penuh">
                <label className="profil-form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="profil-form-input"
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="profil-form-aksi">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="profil-btn-edit"
                  disabled={saving}
                >
                  <i className="fas fa-edit"></i>
                  Edit Profil
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="profil-btn-batal"
                    disabled={saving}
                  >
                    <i className="fas fa-times"></i>
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="profil-btn-simpan"
                    disabled={saving}
                  >
                    <i className="fas fa-save"></i>
                    {saving ? 'Menyimpan...' : 'Perbarui'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileSekolah;