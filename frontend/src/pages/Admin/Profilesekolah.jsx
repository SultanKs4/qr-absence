import React, { useState, useRef, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/Admin/NavbarAdmin';
import './Profilesekolah.css';
import defaultLogo from '../../assets/logo.png';
import { useSettings } from '../../context/SettingContext';

function ProfileSekolah() {
  const { settings, refreshSettings } = useSettings();
  const logoInputRef = useRef(null);
  const maskotInputRef = useRef(null);

  const [formData, setFormData] = useState({
    school_name: '',
    school_npsn: '',
    school_accreditation: 'A',
    school_type: '',
    school_headmaster: '',
    school_headmaster_nip: '',
    school_address: '',
    school_subdistrict: '',
    school_district: '',
    school_city: '',
    school_province: '',
    school_postal_code: '',
    school_phone: '',
    school_email: ''
  });

  const [logo, setLogo] = useState(defaultLogo);
  const [maskot, setMaskot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        school_name: settings.school_name || '',
        school_npsn: settings.school_npsn || '',
        school_accreditation: settings.school_accreditation || 'A',
        school_type: settings.school_type || '',
        school_headmaster: settings.school_headmaster || '',
        school_headmaster_nip: settings.school_headmaster_nip || '',
        school_address: settings.school_address || '',
        school_subdistrict: settings.school_subdistrict || '',
        school_district: settings.school_district || '',
        school_city: settings.school_city || '',
        school_province: settings.school_province || '',
        school_postal_code: settings.school_postal_code || '',
        school_phone: settings.school_phone || '',
        school_email: settings.school_email || ''
      });

      if (settings.school_logo_url) {
        setLogo(settings.school_logo_url);
      } else {
        setLogo(defaultLogo);
      }

      if (settings.school_mascot_url) {
        setMaskot(settings.school_mascot_url);
      } else {
        setMaskot(null);
      }
    }
  }, [settings]);



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
      const reader = new FileReader();
      reader.onloadend = () => {
        setMaskot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    if (window.confirm('Kembalikan logo ke default?')) {
      setLogo(defaultLogo);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMaskot = () => {
    if (window.confirm('Hapus maskot?')) {
      setMaskot(null);
      if (maskotInputRef.current) {
        maskotInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (window.confirm('Apakah Anda yakin ingin menyimpan perubahan?')) {
      try {
        setLoading(true);
        const data = new FormData();

        // Append all text fields
        Object.keys(formData).forEach(key => {
          data.append(key, formData[key] || '');
        });

        // Append files if changed (checked by ref presence or explicit logic needed?)
        // The simple way: check if refs have files. 
        // Better way: use state to track files directly since previews are just strings.

        if (logoInputRef.current && logoInputRef.current.files[0]) {
          data.append('school_logo', logoInputRef.current.files[0]);
        }

        if (maskotInputRef.current && maskotInputRef.current.files[0]) {
          data.append('school_mascot', maskotInputRef.current.files[0]);
        }

        // Handle case where we want to clear them? Backend needs a way to clear. 
        // The current backend doesn't seem to have explicit "delete" for logo/mascot unless replaced.
        // We might need to modify backend if we want to support "remove mascot entirely via API".
        // For now, let's just upload what we have.

        await settingService.updateSettings(data);

        alert('Data berhasil diperbarui!');
        setIsEditing(false);
        refreshSettings(); // Refresh context data

        // Optional: Trigger global event or context update if navbar needs it
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('Gagal menyimpan perubahan.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (window.confirm('Batalkan perubahan?')) {
      setIsEditing(false);
      // Revert logic is handled by useEffect dependency on settings
      // Trigger re-render with existing settings by just disabling edit mode

      // Reset inputs
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (maskotInputRef.current) maskotInputRef.current.value = '';
    }
  };

  if (loading && !formData.school_name) {
    return (
      <div className="profil-sekolah-wrapper">
        <NavbarAdmin />
        <div className="profil-sekolah-konten">
          <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
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
                <img src={logo} alt="Logo Sekolah" className="profil-preview-gambar profil-logo-preview" onError={(e) => { e.target.onerror = null; e.target.src = defaultLogo; }} />
              </div>

              {logo === defaultLogo && (
                <div className="profil-logo-info">
                  <i className="fas fa-info-circle"></i>
                  <span>Logo Default</span>
                </div>
              )}
              <div className="profil-media-tombol">
                <label htmlFor="logo-upload" className={`profil-btn-upload ${!isEditing ? 'disabled' : ''}`}>
                  <i className="fas fa-upload"></i>
                  Ubah Logo
                </label>
                <input
                  ref={logoInputRef}
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  disabled={!isEditing}
                />
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="profil-btn-reset"
                  disabled={!isEditing}
                >
                  <i className="fas fa-undo"></i>
                  Reset
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
                <label htmlFor="maskot-upload" className={`profil-btn-upload ${!isEditing ? 'disabled' : ''}`}>
                  <i className="fas fa-upload"></i>
                  {maskot ? 'Ubah Maskot' : 'Upload Maskot'}
                </label>
                <input
                  ref={maskotInputRef}
                  id="maskot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleMaskotChange}
                  style={{ display: 'none' }}
                  disabled={!isEditing}
                />
                {maskot && (
                  <button
                    type="button"
                    onClick={handleRemoveMaskot}
                    className="profil-btn-hapus"
                    disabled={!isEditing}
                  >
                    <i className="fas fa-trash"></i>
                    Hapus
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
                    name="school_name"
                    value={formData.school_name}
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
                    name="school_npsn"
                    value={formData.school_npsn}
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
                    name="school_accreditation"
                    value={formData.school_accreditation}
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
                    name="school_type"
                    value={formData.school_type}
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
                    name="school_headmaster"
                    value={formData.school_headmaster}
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
                    name="school_headmaster_nip"
                    value={formData.school_headmaster_nip}
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
                  name="school_address"
                  value={formData.school_address}
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
                    name="school_subdistrict"
                    value={formData.school_subdistrict}
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
                    name="school_district"
                    value={formData.school_district}
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
                    name="school_city"
                    value={formData.school_city}
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
                    name="school_province"
                    value={formData.school_province}
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
                    name="school_postal_code"
                    value={formData.school_postal_code}
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
                    name="school_phone"
                    value={formData.school_phone}
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
                  name="school_email"
                  value={formData.school_email}
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
                  >
                    <i className="fas fa-times"></i>
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="profil-btn-simpan"
                    disabled={loading}
                  >
                    <i className="fas fa-save"></i>
                    {loading ? 'Menyimpan...' : 'Perbarui'}
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
