import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../component/Admin/AdminLayout';
import AWANKIRI from "../../assets/Icon/AWANKIRI.png";
import AwanBawahkanan from "../../assets/Icon/AwanBawahkanan.png";
import { settingService } from '../../services/settingService';

interface User {
  role: string;
  name: string;
}

interface ProfilSekolahProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
}

interface SchoolData {
  nama_sekolah: string;
  npsn: string;
  jenis_sekolah: string;
  akreditasi: string;
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  kode_pos: string;
  email: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  nomor_telepon: string;
  logo_sekolah: string;
  maskot_sekolah: string;
}

const DEFAULT_SCHOOL_DATA: SchoolData = {
  nama_sekolah: 'SMKN 2 SINGOSARI',
  npsn: '20517748',
  jenis_sekolah: 'SMK',
  akreditasi: 'A',
  jalan: 'Jl. Perusahaan No.20',
  kelurahan: 'Tanjungtirto',
  kecamatan: 'Singosari',
  kabupaten_kota: 'Kab. Malang',
  provinsi: 'Jawa Timur',
  kode_pos: '65154',
  email: 'smkn2.singosari@yahoo.co.id',
  kepala_sekolah: 'SUMIJAH, S.Pd., M.Si',
  nip_kepala_sekolah: '97002101998022009',
  nomor_telepon: '(0341) 458823',
  logo_sekolah: '',
  maskot_sekolah: '',
};

export default function ProfilSekolah({
  user,
  onLogout,
  currentPage,
  onMenuClick,
}: ProfilSekolahProps) {
  const [schoolData, setSchoolData] = useState<SchoolData>(DEFAULT_SCHOOL_DATA);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<SchoolData>(schoolData);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [maskotPreview, setMaskotPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [maskotFile, setMaskotFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const maskotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSchoolData = async () => {
      setIsLoading(true);
      try {
        const response = await settingService.getSettings();
        const settings = response.data; // Response is { status: 'success', data: { ... } }
        
        const mappedData: SchoolData = {
          nama_sekolah: settings.school_name || DEFAULT_SCHOOL_DATA.nama_sekolah,
          npsn: settings.school_npsn || DEFAULT_SCHOOL_DATA.npsn,
          jenis_sekolah: settings.school_type || DEFAULT_SCHOOL_DATA.jenis_sekolah,
          akreditasi: settings.school_accreditation || DEFAULT_SCHOOL_DATA.akreditasi,
          jalan: settings.school_address || DEFAULT_SCHOOL_DATA.jalan,
          kelurahan: settings.school_subdistrict || settings.village || DEFAULT_SCHOOL_DATA.kelurahan, // Backend might use school_subdistrict or village
          kecamatan: settings.school_district || settings.district || DEFAULT_SCHOOL_DATA.kecamatan,
          kabupaten_kota: settings.school_city || settings.city || DEFAULT_SCHOOL_DATA.kabupaten_kota,
          provinsi: settings.school_province || settings.province || DEFAULT_SCHOOL_DATA.provinsi,
          kode_pos: settings.school_postal_code || settings.postal_code || DEFAULT_SCHOOL_DATA.kode_pos,
          email: settings.school_email || DEFAULT_SCHOOL_DATA.email,
          kepala_sekolah: settings.school_headmaster || settings.school_principal_name || DEFAULT_SCHOOL_DATA.kepala_sekolah,
          nip_kepala_sekolah: settings.school_headmaster_nip || settings.school_principal_nip || DEFAULT_SCHOOL_DATA.nip_kepala_sekolah,
          nomor_telepon: settings.school_phone || DEFAULT_SCHOOL_DATA.nomor_telepon,
          logo_sekolah: settings.school_logo_url || '',
          maskot_sekolah: settings.school_mascot_url || '',
        };
        setSchoolData(mappedData);
        setEditFormData(mappedData);
      } catch (error) {
        console.error('Error fetching school data:', error);
        setErrorMessage('Gagal memuat data sekolah dari server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolData();
  }, []);

  const validateFile = (file: File): { valid: boolean; message: string } => {
    const validTypes = ['image/png', 'image/jpeg'];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Format file hanya boleh PNG atau JPG',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'Ukuran file maksimal 2MB',
      };
    }

    return { valid: true, message: '' };
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setEditFormData(schoolData);
    setLogoPreview('');
    setMaskotPreview('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setLogoPreview('');
    setMaskotPreview('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);

      if (!validation.valid) {
        setErrorMessage(validation.message);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setLogoPreview(base64String);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMaskotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);

      if (!validation.valid) {
        setErrorMessage(validation.message);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      setMaskotFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setMaskotPreview(base64String);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setEditFormData({ ...editFormData, logo_sekolah: '' });
    setLogoPreview('');
    setLogoFile(null);

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleDeleteMaskot = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setEditFormData({ ...editFormData, maskot_sekolah: '' });
    setMaskotPreview('');
    setMaskotFile(null);

    if (maskotInputRef.current) {
      maskotInputRef.current.value = '';
    }
  };

  const handleSaveChanges = async () => {
    if (!editFormData.nama_sekolah.trim()) {
      setErrorMessage('Nama sekolah tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        school_name: editFormData.nama_sekolah,
        school_npsn: editFormData.npsn,
        school_type: editFormData.jenis_sekolah,
        school_accreditation: editFormData.akreditasi,
        school_address: editFormData.jalan,
        village: editFormData.kelurahan,
        district: editFormData.kecamatan,
        city: editFormData.kabupaten_kota,
        province: editFormData.provinsi,
        school_postal_code: editFormData.kode_pos,
        school_email: editFormData.email,
        school_headmaster: editFormData.kepala_sekolah,
        school_headmaster_nip: editFormData.nip_kepala_sekolah,
        school_phone: editFormData.nomor_telepon,
      };

      if (logoFile) {
        payload.school_logo = logoFile;
      }
      if (maskotFile) {
        payload.school_mascot = maskotFile;
      }

      await settingService.updateSettings(payload);

      // Refresh data
      const response = await settingService.getSettings();
      const settings = response.data;
      
      const updatedData: SchoolData = {
        nama_sekolah: settings.school_name || editFormData.nama_sekolah,
        npsn: settings.school_npsn || editFormData.npsn,
        jenis_sekolah: settings.school_type || editFormData.jenis_sekolah,
        akreditasi: settings.school_accreditation || editFormData.akreditasi,
        jalan: settings.school_address || editFormData.jalan,
        kelurahan: settings.school_subdistrict || settings.village || editFormData.kelurahan,
        kecamatan: settings.school_district || settings.district || editFormData.kecamatan,
        kabupaten_kota: settings.school_city || settings.city || editFormData.kabupaten_kota,
        provinsi: settings.school_province || settings.province || editFormData.provinsi,
        kode_pos: settings.school_postal_code || settings.postal_code || editFormData.kode_pos,
        email: settings.school_email || editFormData.email,
        kepala_sekolah: settings.school_headmaster || settings.school_principal_name || editFormData.kepala_sekolah,
        nip_kepala_sekolah: settings.school_headmaster_nip || settings.school_principal_nip || editFormData.nip_kepala_sekolah,
        nomor_telepon: settings.school_phone || editFormData.nomor_telepon,
        logo_sekolah: settings.school_logo_url || '',
        maskot_sekolah: settings.school_mascot_url || '',
      };

      setSchoolData(updatedData);
      setIsEditMode(false);
      setSuccessMessage('Data sekolah berhasil diperbarui!');
      setLogoPreview('');
      setMaskotPreview('');
      setLogoFile(null);
      setMaskotFile(null);
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);

      window.dispatchEvent(new Event('schoolDataUpdated'));
    } catch (error) {
      console.error('Error saving school data:', error);
      setErrorMessage('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout pageTitle="Profil Sekolah" currentPage={currentPage} onMenuClick={onMenuClick} user={user} onLogout={onLogout} hideBackground>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#001F3E' }}>
          <span>Loading profil sekolah...</span>
        </div>
      </AdminLayout>
    );
  }


  if (!isEditMode) {
    return (
      <AdminLayout
        pageTitle="Profil Sekolah"
        currentPage={currentPage}
        onMenuClick={onMenuClick}
        user={user}
        onLogout={onLogout}
        hideBackground
      >
        <img src={AWANKIRI} style={bgLeft} alt="Background awan kiri" />
        <img src={AwanBawahkanan} style={bgRight} alt="Background awan kanan bawah" />

        <div style={mainContainerStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>{schoolData.nama_sekolah}</h1>
              <p style={npsnStyle}>NPSN: {schoolData.npsn}</p>
            </div>
            <button onClick={handleEditClick} style={editButtonStyle}>
              ✏️ Ubah Data
            </button>
          </div>

          <div style={contentGridStyle}>
            <div style={leftColumnStyle}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Logo Sekolah</h3>
                <div style={imageContainerStyle}>
                  {schoolData.logo_sekolah ? (
                    <img src={schoolData.logo_sekolah} alt="Logo Sekolah" style={imageStyle} />
                  ) : (
                    <div style={placeholderStyle}>
                      <div style={placeholderIconStyle}>📷</div>
                      <div style={placeholderTextStyle}>Belum ada logo</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Maskot Sekolah</h3>
                <div style={imageContainerStyle}>
                  {schoolData.maskot_sekolah ? (
                    <img src={schoolData.maskot_sekolah} alt="Maskot Sekolah" style={imageStyle} />
                  ) : (
                    <div style={placeholderStyle}>
                      <div style={placeholderIconStyle}>🎭</div>
                      <div style={placeholderTextStyle}>Belum ada maskot</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <tbody>
                    <TableRow label="Nama Sekolah" value={schoolData.nama_sekolah} />
                    <TableRow label="NPSN" value={schoolData.npsn} />
                    <TableRow label="Jenis Sekolah" value={schoolData.jenis_sekolah} />
                    <TableRow label="Akreditasi" value={schoolData.akreditasi} />
                    <TableRow label="Kepala Sekolah" value={schoolData.kepala_sekolah} />
                    <TableRow label="NIP Kepala Sekolah" value={schoolData.nip_kepala_sekolah} />
                    <TableRow label="Email" value={schoolData.email} />
                    <TableRow label="Nomor Telepon" value={schoolData.nomor_telepon} />
                    <TableRow label="Jalan" value={schoolData.jalan} />
                    <TableRow label="Kelurahan" value={schoolData.kelurahan} />
                    <TableRow label="Kecamatan" value={schoolData.kecamatan} />
                    <TableRow label="Kabupaten/Kota" value={schoolData.kabupaten_kota} />
                    <TableRow label="Provinsi" value={schoolData.provinsi} />
                    <TableRow label="Kode Pos" value={schoolData.kode_pos} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Ubah Profil Sekolah"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
      hideBackground
    >
      <img src={AWANKIRI} style={bgLeft} alt="Background awan kiri" />
      <img src={AwanBawahkanan} style={bgRight} alt="Background awan kanan bawah" />

      <div style={mainContainerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Ubah Profil Sekolah</h1>
            <p style={npsnStyle}>Ubah informasi sekolah, logo, dan maskot</p>
          </div>
        </div>

        {successMessage && (
          <div style={successMessageStyle}>
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div style={errorMessageStyle}>
            ✗ {errorMessage}
          </div>
        )}

        <div style={contentGridStyle}>
          <div style={leftColumnStyle}>
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Logo Sekolah</h3>
              <div
                style={uploadContainerStyle}
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.backgroundColor = '#E0E7FF';
                  e.currentTarget.style.borderColor = '#001F3E';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const input = logoInputRef.current;
                    if (input) {
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(file);
                      input.files = dataTransfer.files;
                      handleLogoUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }
                }}
              >
                {logoPreview || editFormData.logo_sekolah ? (
                  <img src={logoPreview || editFormData.logo_sekolah} alt="Logo Preview" style={imageStyle} />
                ) : (
                  <div style={placeholderStyle}>
                    <div style={placeholderIconStyle}>📷</div>
                    <div style={placeholderTextStyle}>Klik atau drag untuk upload logo</div>
                    <div style={uploadHintStyle}>PNG, JPG (Max 2MB)</div>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              {(logoPreview || editFormData.logo_sekolah) && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  style={{
                    ...deleteButtonStyle,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FECACA';
                    e.currentTarget.style.color = '#991B1B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEE2E2';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                >
                  🗑️ Hapus Logo
                </button>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Maskot Sekolah</h3>
              <div
                style={uploadContainerStyle}
                onClick={() => maskotInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.backgroundColor = '#E0E7FF';
                  e.currentTarget.style.borderColor = '#001F3E';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const input = maskotInputRef.current;
                    if (input) {
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(file);
                      input.files = dataTransfer.files;
                      handleMaskotUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }
                }}
              >
                {maskotPreview || editFormData.maskot_sekolah ? (
                  <img src={maskotPreview || editFormData.maskot_sekolah} alt="Maskot Preview" style={imageStyle} />
                ) : (
                  <div style={placeholderStyle}>
                    <div style={placeholderIconStyle}>🎭</div>
                    <div style={placeholderTextStyle}>Klik atau drag untuk upload maskot</div>
                    <div style={uploadHintStyle}>PNG, JPG (Max 2MB)</div>
                  </div>
                )}
              </div>
              <input
                ref={maskotInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleMaskotUpload}
                style={{ display: 'none' }}
              />
              {(maskotPreview || editFormData.maskot_sekolah) && (
                <button
                  type="button"
                  onClick={handleDeleteMaskot}
                  style={{
                    ...deleteButtonStyle,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FECACA';
                    e.currentTarget.style.color = '#991B1B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEE2E2';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                >
                  🗑️ Hapus Maskot
                </button>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={formGridStyle}>
              <FormInput
                label="Nama Sekolah *"
                name="nama_sekolah"
                value={editFormData.nama_sekolah}
                onChange={handleInputChange}
                required
              />
              <FormInput
                label="NPSN"
                name="npsn"
                value={editFormData.npsn}
                onChange={handleInputChange}
              />
              <FormSelect
                label="Jenis Sekolah"
                name="jenis_sekolah"
                value={editFormData.jenis_sekolah}
                onChange={handleInputChange}
                options={['SMK', 'SMA', 'SMP', 'SD']}
              />
              <FormSelect
                label="Akreditasi"
                name="akreditasi"
                value={editFormData.akreditasi}
                onChange={handleInputChange}
                options={['A', 'B', 'C']}
              />
              <FormInput
                label="Kepala Sekolah"
                name="kepala_sekolah"
                value={editFormData.kepala_sekolah}
                onChange={handleInputChange}
              />
              <FormInput
                label="NIP Kepala Sekolah"
                name="nip_kepala_sekolah"
                value={editFormData.nip_kepala_sekolah}
                onChange={handleInputChange}
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleInputChange}
              />
              <FormInput
                label="Nomor Telepon"
                name="nomor_telepon"
                value={editFormData.nomor_telepon}
                onChange={handleInputChange}
              />
              <FormInput
                label="Jalan"
                name="jalan"
                value={editFormData.jalan}
                onChange={handleInputChange}
              />
              <FormInput
                label="Kelurahan"
                name="kelurahan"
                value={editFormData.kelurahan}
                onChange={handleInputChange}
              />
              <FormInput
                label="Kecamatan"
                name="kecamatan"
                value={editFormData.kecamatan}
                onChange={handleInputChange}
              />
              <FormInput
                label="Kabupaten/Kota"
                name="kabupaten_kota"
                value={editFormData.kabupaten_kota}
                onChange={handleInputChange}
              />
              <FormInput
                label="Provinsi"
                name="provinsi"
                value={editFormData.provinsi}
                onChange={handleInputChange}
              />
              <FormInput
                label="Kode Pos"
                name="kode_pos"
                value={editFormData.kode_pos}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div style={actionButtonsStyle}>
          <button onClick={handleCancelEdit} disabled={isSaving} style={cancelButtonStyle}>
            Batal
          </button>
          <button onClick={handleSaveChanges} disabled={isSaving} style={saveButtonStyle}>
            {isSaving ? '⏳ Menyimpan...' : '✓ Simpan Perubahan'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

const TableRow = ({ label, value }: { label: string; value: string }) => (
  <tr style={tableRowStyle}>
    <td style={tableLabelStyle}>{label}</td>
    <td style={tableValueStyle}>{value}</td>
  </tr>
);

const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) => (
  <div>
    <label style={formLabelStyle}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      style={formInputStyle}
    />
  </div>
);

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) => (
  <div>
    <label style={formLabelStyle}>{label}</label>
    <select name={name} value={value} onChange={onChange} style={formInputStyle}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const bgLeft: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: 220,
  zIndex: 0,
  pointerEvents: "none",
};

const bgRight: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  right: 0,
  width: 220,
  zIndex: 0,
  pointerEvents: "none",
};

const mainContainerStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(6px)",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.6)",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  position: "relative",
  zIndex: 1,
  minHeight: "70vh",
};

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #001F3E 0%, #0C4A6E 100%)',
  borderRadius: '16px',
  padding: '32px 40px',
  boxShadow: '0 8px 32px rgba(0, 31, 62, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'white',
};

const titleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  margin: 0,
  color: 'white',
};

const npsnStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'rgba(255, 255, 255, 0.9)',
  margin: '8px 0 0 0',
};

const editButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  border: '2px solid rgba(255, 255, 255, 0.4)',
  borderRadius: '8px',
  color: 'white',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const contentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '32px',
};

const leftColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  border: '1px solid #E5E7EB',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#001F3E',
  margin: '0 0 16px 0',
};

const imageContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '200px',
  border: '2px dashed #CBD5E1',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#F8FAFC',
  overflow: 'hidden',
};

const uploadContainerStyle: React.CSSProperties = {
  ...imageContainerStyle,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const imageStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
};

const placeholderStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#94A3B8',
};

const placeholderIconStyle: React.CSSProperties = {
  fontSize: '32px',
  marginBottom: '8px',
};

const placeholderTextStyle: React.CSSProperties = {
  fontSize: '14px',
};

const uploadHintStyle: React.CSSProperties = {
  fontSize: '12px',
  marginTop: '4px',
  color: '#CBD5E1',
};

const deleteButtonStyle: React.CSSProperties = {
  marginTop: '12px',
  width: '100%',
  padding: '8px',
  backgroundColor: '#FEE2E2',
  border: '1px solid #FECACA',
  borderRadius: '8px',
  color: '#DC2626',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #E5E7EB',
};

const tableLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '12px 0',
  width: '40%',
};

const tableValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#001F3E',
  padding: '12px 0 12px 16px',
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '20px',
};

const formLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#001F3E',
  display: 'block',
  marginBottom: '8px',
};

const formInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#001F3E',
  boxSizing: 'border-box',
  transition: 'all 0.3s ease',
};

const successMessageStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  borderRadius: '12px',
  padding: '16px 20px',
  color: 'white',
  fontSize: '14px',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
};

const errorMessageStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  borderRadius: '12px',
  padding: '16px 20px',
  color: 'white',
  fontSize: '14px',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
};

const actionButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'flex-end',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  backgroundColor: '#F3F4F6',
  border: '2px solid #E5E7EB',
  borderRadius: '8px',
  color: '#1F2937',
  fontWeight: 600,
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  backgroundColor: '#001F3E',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  fontWeight: 600,
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 31, 62, 0.3)',
};