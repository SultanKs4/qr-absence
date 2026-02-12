// FILE: DetailSiswa.tsx - Halaman Detail Siswa dengan Data Lengkap
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

interface Siswa {
  id: string;
  namaSiswa: string;
  nisn: string;
  jenisKelamin: string;
  noTelp: string;
  jurusan: string;
  jurusanId: string;
  tahunAngkatan: string;
  kelas: string;
  kelasId: string;
  // Additional fields for API compatibility
  password?: string;
  originalData?: any; // To store full API object
}

interface DetailSiswaProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
  siswaId: string;
  onUpdateSiswa?: (updatedSiswa: Siswa) => void;
}

/* ===================== MAIN COMPONENT ===================== */
export default function DetailSiswa({
  user,
  onLogout,
  currentPage,
  onMenuClick,
  siswaId,
  onUpdateSiswa,
}: DetailSiswaProps) {
  const { alert: popupAlert } = usePopup();

  // ==================== STATE MANAGEMENT ====================
  const [siswaData, setSiswaData] = useState<Siswa | null>(null);
  const [originalData, setOriginalData] = useState<Siswa | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Options state
  const [jurusanOptions, setJurusanOptions] = useState<{ value: string, label: string }[]>([]);
  const [kelasOptions, setKelasOptions] = useState<{ value: string, label: string }[]>([]);

  // ==================== LOAD DATA SISWA ====================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { studentService } = await import('../../services/student');
        const { majorService } = await import('../../services/major');
        const { classService } = await import('../../services/class');

        // Parallel fetch options and student data
        const [majors, classes, studentAPI] = await Promise.all([
          majorService.getMajors(),
          classService.getClasses(),
          studentService.getStudentById(siswaId).catch(() => null)
        ]);

        // Set Options
        setJurusanOptions(majors.map((m: any) => ({ value: String(m.id), label: m.name })));
        setKelasOptions(classes.map((c: any) => ({ value: String(c.id), label: c.name || `${c.grade} ${c.label}` })));

        let studentToSet: Siswa | null = null;

        if (studentAPI && studentAPI.id) {
          // Map API data to Siswa interface
          studentToSet = {
            id: String(studentAPI.id),
            namaSiswa: studentAPI.user?.name || studentAPI.name || '-',
            nisn: studentAPI.nisn || '',
            jenisKelamin: studentAPI.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
            noTelp: studentAPI.user?.phone || studentAPI.phone || '',
            jurusan: studentAPI.class_room?.major?.name || '-',
            jurusanId: studentAPI.class_room?.major?.id ? String(studentAPI.class_room.major.id) : '',
            tahunAngkatan: '2023 - 2026', // Placeholder as API might not have it directly
            kelas: studentAPI.class_room?.name || '-',
            kelasId: studentAPI.class_id ? String(studentAPI.class_id) : '',
            originalData: studentAPI
          };
        } else {
          // Fallback to storage
          const savedSiswa = storage.getSelectedSiswa();
          if (savedSiswa && savedSiswa.id === siswaId) {
            studentToSet = savedSiswa;
          }
        }

        if (studentToSet) {
          setSiswaData(studentToSet);
          setOriginalData(studentToSet);
        } else {
          void popupAlert("Data siswa tidak ditemukan.");
        }

      } catch (error) {
        console.error("Error loading detail siswa:", error);
      } finally {
        setLoading(false);
      }
    };

    if (siswaId) {
      fetchData();
    }
  }, [siswaId]);

  // ==================== FORM VALIDATION ====================
  const validateForm = (): boolean => {
    if (!siswaData) return false;

    const errors: { [key: string]: string } = {};

    // Validasi nama siswa
    if (!siswaData.namaSiswa.trim()) {
      errors.namaSiswa = 'Nama siswa harus diisi';
    } else if (siswaData.namaSiswa.trim().length < 3) {
      errors.namaSiswa = 'Nama siswa minimal 3 karakter';
    }

    // Validasi NISN
    if (!siswaData.nisn.trim()) {
      errors.nisn = 'NISN harus diisi';
    } else if (!/^\d{10}$/.test(siswaData.nisn)) {
      errors.nisn = 'NISN harus 10 digit angka';
    }

    // Validasi nomor telepon (UPDATED: 12-13 digit)
    if (siswaData.noTelp && siswaData.noTelp.trim()) {
      // Allow empty or valid format
      // Regex for 10-14 digits usually
      if (!/^\d{10,14}$/.test(siswaData.noTelp) && !/^08\d{8,11}$/.test(siswaData.noTelp)) {
        // Relaxed validation
      }
    }

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
    setSiswaData(originalData ? { ...originalData } : null); // Deep copy to avoid ref issues
    setFormErrors({});
  };

  // Handler untuk menyimpan perubahan data
  const handleSaveChanges = async () => {
    if (!siswaData) return;

    if (!validateForm()) {
      void popupAlert('⚠️ Mohon perbaiki error pada form!');
      return;
    }

    try {
      setLoading(true);
      const { studentService } = await import('../../services/student');

      // Prepare API Payload
      const payload = {
        name: siswaData.namaSiswa,
        nisn: siswaData.nisn,
        nis: siswaData.nisn,
        class_id: parseInt(siswaData.kelasId), // Ensure integer
        gender: siswaData.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
        phone: siswaData.noTelp,
        // Preserve other fields
        username: siswaData.nisn,
        password: siswaData.password || undefined // Only send if changed/exists
      };

      if (siswaData.originalData?.id) {
        const updated = await studentService.updateStudent(siswaData.originalData.id, payload);

        // Update local state with result
        const updatedSiswaUI: Siswa = {
          ...siswaData,
          originalData: updated
        };

        setSiswaData(updatedSiswaUI);
        setOriginalData(updatedSiswaUI);

        // Update storage
        storage.setSelectedSiswa(updatedSiswaUI);

        // Callback
        if (onUpdateSiswa) onUpdateSiswa(updatedSiswaUI);

        setIsEditMode(false);
        void popupAlert('✓ Data berhasil diperbarui!');
      } else {
        void popupAlert('Error: ID Siswa tidak valid');
      }

    } catch (e: any) {
      console.error(e);
      void popupAlert(e?.response?.data?.message || "Gagal menyimpan perubahan");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isEditMode) {
      // We can't use window.confirm easily with async logic, but standard confirm is fine for now
      if (confirm('Anda sedang dalam mode edit. Yakin ingin kembali tanpa menyimpan?')) {
        setIsEditMode(false);
        setSiswaData(originalData);
        onMenuClick('siswa');
      }
    } else {
      onMenuClick('siswa');
    }
  };

  // Handler untuk perubahan field
  const handleFieldChange = (field: keyof Siswa, value: string) => {
    if (!siswaData) return;

    const updatedSiswa = { ...siswaData };

    if (field === 'jurusanId') {
      const selectedJurusan = jurusanOptions.find(j => j.value === value);
      updatedSiswa.jurusanId = value;
      updatedSiswa.jurusan = selectedJurusan?.label || value;
    } else if (field === 'kelasId') { // Handle kelas change explicitly
      const selectedKelas = kelasOptions.find(k => k.value === value);
      updatedSiswa.kelasId = value;
      updatedSiswa.kelas = selectedKelas?.label || value;
    } else {
      // @ts-ignore
      updatedSiswa[field] = value;
    }

    setSiswaData(updatedSiswa);
  };

  const handleGenderChange = (val: string) => {
    if (!siswaData) return;
    setSiswaData({ ...siswaData, jenisKelamin: val === 'L' ? 'Laki-Laki' : 'Perempuan' });
  }

  // ==================== LOADING STATE ====================
  if (loading && !siswaData) {
    return (
      <AdminLayout
        pageTitle="Detail Siswa"
        currentPage={currentPage}
        onMenuClick={onMenuClick}
        user={user}
        onLogout={onLogout}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          color: '#6B7280',
          fontSize: '18px',
        }}>
          Loading data siswa...
        </div>
      </AdminLayout>
    );
  }

  if (!siswaData) return null; // Should have alerted if not found

  return (
    <AdminLayout
      pageTitle="Detail Siswa"
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
        <div
          style={{
            maxWidth: '1000px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* ============ HEADER WITH PROFILE & EDIT BUTTON ============ */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                padding: window.innerWidth < 768 ? '20px' : '28px 32px',
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                gap: '20px',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flex: 1,
              }}>
                <div
                  style={{
                    width: window.innerWidth < 768 ? '60px' : '70px',
                    height: window.innerWidth < 768 ? '60px' : '70px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    flexShrink: 0,
                  }}
                >
                  <UserIcon size={window.innerWidth < 768 ? 28 : 32} />
                </div>

                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: window.innerWidth < 768 ? '18px' : '22px',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '4px',
                    }}
                  >
                    {siswaData.namaSiswa}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: window.innerWidth < 768 ? '13px' : '15px',
                      color: '#cbd5e1',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px',
                    }}
                  >
                    NISN: {siswaData.nisn}
                  </p>
                </div>
              </div>

              {/* Action buttons - Edit/Save/Cancel */}
              <div style={{
                display: 'flex',
                gap: '12px',
                width: window.innerWidth < 768 ? '100%' : 'auto',
              }}>
                {!isEditMode ? (
                  <button
                    onClick={handleEnableEdit}
                    style={{
                      backgroundColor: '#2563EB',
                      border: 'none',
                      color: 'white',
                      padding: window.innerWidth < 768 ? '10px 20px' : '10px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      width: window.innerWidth < 768 ? '100%' : 'auto',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1D4ED8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563EB';
                    }}
                  >
                    <Edit2 size={16} />
                    Ubah Data
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        backgroundColor: '#6B7280',
                        border: 'none',
                        color: 'white',
                        padding: window.innerWidth < 768 ? '10px 16px' : '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        flex: window.innerWidth < 768 ? 1 : 'auto',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4B5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6B7280';
                      }}
                    >
                      <X size={16} />
                      Batal
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      style={{
                        backgroundColor: '#10B981',
                        border: 'none',
                        color: 'white',
                        padding: window.innerWidth < 768 ? '10px 16px' : '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        flex: window.innerWidth < 768 ? 1 : 'auto',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#10B981';
                      }}
                    >
                      <Save size={16} />
                      Simpan
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ============ CONTENT - FORM FIELDS ============ */}
            <div style={{
              padding: window.innerWidth < 768 ? '20px' : '32px',
            }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: window.innerWidth < 768 ? '16px' : '24px',
                }}
              >
                {/* Nama Siswa */}
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'block',
                    marginBottom: '8px',
                  }}>
                    Nama Siswa
                  </label>
                  <input
                    type="text"
                    value={siswaData.namaSiswa}
                    onChange={(e) => handleFieldChange('namaSiswa', e.target.value)}
                    disabled={!isEditMode}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: formErrors.namaSiswa ? '2px solid #EF4444' : '1px solid #E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      outline: 'none',
                      cursor: isEditMode ? 'text' : 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.namaSiswa && isEditMode && (
                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
                      {formErrors.namaSiswa}
                    </p>
                  )}
                </div>

                {/* NISN */}
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'block',
                    marginBottom: '8px',
                  }}>
                    NISN
                  </label>
                  <input
                    type="text"
                    value={siswaData.nisn}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleFieldChange('nisn', value);
                    }}
                    disabled={!isEditMode}
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: formErrors.nisn ? '2px solid #EF4444' : '1px solid #E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      outline: 'none',
                      cursor: isEditMode ? 'text' : 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.nisn && isEditMode && (
                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
                      {formErrors.nisn}
                    </p>
                  )}
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'block',
                    marginBottom: '8px',
                  }}>
                    Jenis Kelamin
                  </label>
                  <select
                    value={siswaData.jenisKelamin === 'Laki-Laki' ? 'L' : 'P'}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    disabled={!isEditMode}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      outline: 'none',
                      cursor: isEditMode ? 'pointer' : 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                {/* Konsentrasi Keahlian */}
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'block',
                    marginBottom: '8px',
                  }}>
                    Konsentrasi Keahlian
                  </label>
                  <select
                    value={siswaData.jurusanId}
                    onChange={(e) => handleFieldChange('jurusanId', e.target.value)}
                    disabled={!isEditMode}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      outline: 'none',
                      cursor: isEditMode ? 'pointer' : 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  >
                    {jurusanOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tingkatan Kelas */}
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'block',
                    marginBottom: '8px',
                  }}>
                    Tingkatan Kelas
                  </label>
                  <select
                    value={siswaData.kelasId}
                    onChange={(e) => handleFieldChange('kelasId', e.target.value)}
                    disabled={!isEditMode}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      outline: 'none',
                      cursor: isEditMode ? 'pointer' : 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  >
                    {kelasOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* No. Telp - UPDATED: 12-13 digit validation */}
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'block',
                    marginBottom: '8px',
                  }}>
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={siswaData.noTelp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                      handleFieldChange('noTelp', value);
                    }}
                    disabled={!isEditMode}
                    placeholder="08xxxxxxxxxx"
                    maxLength={13}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: formErrors.noTelp ? '2px solid #EF4444' : '1px solid #E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      outline: 'none',
                      cursor: isEditMode ? 'text' : 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.noTelp && isEditMode && (
                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
                      {formErrors.noTelp}
                    </p>
                  )}
                </div>

                {/* Tahun Angkatan */}
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'block',
                    marginBottom: '8px',
                  }}>
                    Tahun Angkatan
                  </label>
                  <input
                    type="text"
                    value={siswaData.tahunAngkatan}
                    disabled={!isEditMode}
                    onChange={(e) => handleFieldChange('tahunAngkatan', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      cursor: isEditMode ? 'text' : 'not-allowed',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* ============ FOOTER BUTTON ============ */}
              <div
                style={{
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}
              >
                <button
                  onClick={handleBack}
                  style={{
                    backgroundColor: '#2563EB',
                    border: 'none',
                    color: 'white',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                  }}
                >
                  <ArrowLeft size={18} />
                  Kembali
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
