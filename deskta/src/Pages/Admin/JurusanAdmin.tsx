// JurusanAdmin.tsx - Halaman admin untuk mengelola data konsentrasi keahlian (jurusan) - Refactored
import { masterService, type Major } from "../../services/masterService";
import React, { useState, useEffect } from "react";
import AdminLayout from "../../component/Admin/AdminLayout";
import { Button } from "../../component/Shared/Button";
import { SearchBox } from "../../component/Shared/Search";
import AWANKIRI from "../../assets/Icon/AWANKIRI.png";
import AwanBawahkanan from "../../assets/Icon/AwanBawahkanan.png";
import { MoreVertical, Edit, Trash2, X } from "lucide-react";

interface User {
  role: string;
  name: string;
}

interface KonsentrasiKeahlianAdminProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
}

/* ===================== DUMMY DATA REMOVED ===================== */

/* ===================== COMPONENT ===================== */
export default function KonsentrasiKeahlianAdmin({
  user,
  onLogout,
  currentPage,
  onMenuClick,
}: KonsentrasiKeahlianAdminProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [konsentrasiKeahlianList, setKonsentrasiKeahlianList] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKonsentrasiKeahlian, setEditingKonsentrasiKeahlian] = useState<Major | null>(null);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", category: "" });
  const [errorMessage, setErrorMessage] = useState("");

  /* ===================== FETCH DATA ===================== */
  useEffect(() => {
    fetchJurusans();
  }, []);

  const fetchJurusans = async () => {
    setIsLoading(true);
    try {
      const data = await masterService.getMajors();
      setKonsentrasiKeahlianList(data);
    } catch (error) {
      console.error("Failed to fetch majors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===================== FILTER ===================== */
  const filteredData = konsentrasiKeahlianList.filter(
    (k) =>
      k.code.toLowerCase().includes(searchValue.toLowerCase()) ||
      k.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  /* ===================== VALIDASI UNIK ===================== */
  const checkDuplicate = (code: string, name: string, excludeId?: number) => {
    return konsentrasiKeahlianList.some(
      (k) =>
        (k.code.toLowerCase() === code.toLowerCase() || 
         k.name.toLowerCase() === name.toLowerCase()) &&
        k.id !== excludeId
    );
  };

  /* ===================== HANDLER FUNCTIONS ===================== */
  const handleDelete = async (row: Major) => {
    if (confirm(`Hapus "${row.name}"?`)) {
      try {
        await masterService.deleteMajor(row.id);
        setKonsentrasiKeahlianList((prev) => prev.filter((k) => k.id !== row.id));
        setOpenActionId(null);
      } catch (error) {
        console.error("Failed to delete major:", error);
        alert("Gagal menghapus jurusan");
      }
    }
  };

  const handleEditKonsentrasi = (konsentrasi: Major) => {
    setEditingKonsentrasiKeahlian(konsentrasi);
    setIsEditMode(true);
    setFormData({
      name: konsentrasi.name,
      code: konsentrasi.code,
      category: konsentrasi.category || ""
    });
    setShowPopup(true);
    setErrorMessage("");
    setOpenActionId(null);
  };

  const handleTambahKonsentrasi = () => {
    setEditingKonsentrasiKeahlian(null);
    setIsEditMode(false);
    setFormData({ name: "", code: "", category: "" });
    setShowPopup(true);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!formData.name.trim() || !formData.code.trim() || !formData.category.trim()) {
      setErrorMessage("Nama, kode, dan kategori harus diisi");
      return;
    }

    // Validasi format kode (huruf dan angka saja, maks 20 karakter)
    const kodeRegex = /^[a-zA-Z0-9]{1,20}$/;
    if (!kodeRegex.test(formData.code)) {
      setErrorMessage("Kode hanya boleh berisi huruf dan angka, maksimal 20 karakter");
      return;
    }

    // Validasi duplikasi
    const isDuplicate = checkDuplicate(
      formData.code, 
      formData.name, 
      editingKonsentrasiKeahlian?.id
    );

    if (isDuplicate) {
      setErrorMessage("Kode atau nama konsentrasi keahlian sudah ada. Harap gunakan yang berbeda.");
      return;
    }

    if (isEditMode && editingKonsentrasiKeahlian) {
      // Mode edit
      try {
        const updated = await masterService.updateMajor(editingKonsentrasiKeahlian.id, formData);
        setKonsentrasiKeahlianList((prev) =>
          prev.map((k) => (k.id === editingKonsentrasiKeahlian.id ? updated : k))
        );
        alert(`Konsentrasi keahlian "${formData.name}" berhasil diperbarui!`);
      } catch (error) {
        console.error("Failed to update major:", error);
        setErrorMessage("Gagal memperbarui data");
        return;
      }
    } else {
      // Mode tambah
      try {
        const newItem = await masterService.addMajor(formData);
        setKonsentrasiKeahlianList((prev) => [...prev, newItem]);
        alert(`Konsentrasi keahlian "${formData.name}" berhasil ditambahkan!`);
      } catch (error) {
        console.error("Failed to add major:", error);
        setErrorMessage("Gagal menambahkan data");
        return;
      }
    }
    
    handleClosePopup();
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setEditingKonsentrasiKeahlian(null);
    setIsEditMode(false);
    setFormData({ name: "", code: "", category: "" });
    setErrorMessage("");
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  useEffect(() => {
    if (editingKonsentrasiKeahlian && isEditMode) {
      setFormData({
        name: editingKonsentrasiKeahlian.name,
        code: editingKonsentrasiKeahlian.code,
        category: editingKonsentrasiKeahlian.category || ""
      });
    }
  }, [editingKonsentrasiKeahlian, isEditMode]);

  return (
    <AdminLayout
      pageTitle="Data Konsentrasi Keahlian"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
      hideBackground
    >
      {/* Background images */}
      <img src={AWANKIRI} style={bgLeft} alt="Background awan kiri" />
      <img src={AwanBawahkanan} style={bgRight} alt="Background awan kanan bawah" />

      {/* Container utama untuk konten */}
      <div
        style={{
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
        }}
      >
        {/* HEADER dengan search dan tombol tambah */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ width: 300 }}>
            <SearchBox
              placeholder="Cari Konsentrasi Keahlian.."
              value={searchValue}
              onChange={setSearchValue}
            />
          </div>
          <Button label="Tambahkan" onClick={handleTambahKonsentrasi} />
        </div>

        {/* TABLE WRAPPER */}
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 0 0 1px #E5E7EB",
          }}
        >
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#FFFFFF',
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#F3F4F6',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  borderRight: '1px solid #E5E7EB',
                }}>No</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  borderRight: '1px solid #E5E7EB',
                }}>Kode Konsentrasi Keahlian</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  borderRight: '1px solid #E5E7EB',
                }}>Konsentrasi Keahlian</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  borderRight: '1px solid #E5E7EB',
                }}>Bidang/Kategori</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id} style={{
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F0F4FF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                  }}>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#374151',
                      textAlign: 'center',
                      borderRight: '1px solid #E5E7EB',
                    }}>{index + 1}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#374151',
                      textAlign: 'center',
                      borderRight: '1px solid #E5E7EB',
                    }}>{row.code}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#374151',
                      textAlign: 'center',
                      borderRight: '1px solid #E5E7EB',
                    }}>{row.name}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#374151',
                      textAlign: 'center',
                      borderRight: '1px solid #E5E7EB',
                    }}>{row.category || '-'}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#374151',
                      textAlign: 'center',
                      position: 'relative',
                    }}>
                      <button
                        onClick={() => setOpenActionId(openActionId === row.id ? null : row.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MoreVertical size={20} strokeWidth={1.5} />
                      </button>

                      {openActionId === row.id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 6,
                            background: '#FFFFFF',
                            borderRadius: 8,
                            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                            minWidth: 180,
                            zIndex: 10,
                            overflow: 'hidden',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <button
                            onClick={() => handleEditKonsentrasi(row)}
                            style={actionItemStyle}
                          >
                            <Edit size={16} strokeWidth={2} />
                            Ubah
                          </button>

                          <button
                            onClick={() => handleDelete(row)}
                            style={{ ...actionItemStyle, borderBottom: "none" }}
                          >
                            <Trash2 size={16} strokeWidth={2} />
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP FORM - Header dengan warna #1e293b */}
      {showPopup && (
        <div style={popupOverlayStyle}>
          <div style={popupStyle}>
            {/* Header popup dengan background #1e293b */}
            <div style={popupHeaderStyle}>
              <div style={headerContentStyle}>
                <h2 style={popupTitleStyle}>
                  {isEditMode ? "Ubah Konsentrasi Keahlian" : "Tambah Konsentrasi Keahlian"}
                </h2>
              </div>
              <button
                onClick={handleClosePopup}
                style={closeButtonStyle}
              >
                <X size={20} color="#FFFFFF" />
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={handleSubmit}>
              <div style={popupContentStyle}>
                {/* Nama Konsentrasi Keahlian */}
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    Nama Konsentrasi Keahlian<span style={requiredStarStyle}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Masukan nama konsentrasi keahlian"
                    style={inputStyle}
                    autoFocus
                  />
                </div>

                {/* Kode Konsentrasi Keahlian */}
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    Kode Konsentrasi Keahlian<span style={requiredStarStyle}>*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    placeholder="Masukan kode konsentrasi keahlian"
                    style={inputStyle}
                    maxLength={20}
                  />
                  <div style={characterInfoStyle}>
                    <span style={characterHintStyle}>Huruf dan angka saja, maks. 20 karakter</span>
                    <span style={characterCounterStyle}>
                      {formData.code.length}/20
                    </span>
                  </div>
                </div>

                {/* Kategori */}
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    Bidang/Kategori<span style={requiredStarStyle}>*</span>
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    placeholder="Masukan bidang atau kategori"
                    style={inputStyle}
                  />
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div style={errorStyle}>
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Footer popup */}
              <div style={popupFooterStyle}>
                <button
                  type="button"
                  onClick={handleClosePopup}
                  style={cancelButtonStyle}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={submitButtonStyle}
                >
                  {isEditMode ? "Perbarui" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        ${closeButtonStyle}:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        ${cancelButtonStyle}:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        ${submitButtonStyle}:hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </AdminLayout>
  );
}

/* ===================== STYLE ===================== */
const actionItemStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  border: "none",
  background: "none",
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#0F172A",
  fontSize: 14,
  fontWeight: 500,
  transition: "all 0.2s ease",
  borderBottom: "1px solid #F1F5F9",
};

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

/* ===================== POPUP STYLE ===================== */
const popupOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const popupStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  width: "500px",
  maxWidth: "90%",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
  overflow: "hidden",
  animation: "fadeIn 0.2s ease-out",
  border: "1px solid #e5e7eb",
};

const popupHeaderStyle: React.CSSProperties = {
  padding: "24px 32px",
  backgroundColor: "#1e293b",
  color: "#FFFFFF",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "relative",
};

const headerContentStyle: React.CSSProperties = {
  flex: 1,
};

const popupTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "600",
  color: "#FFFFFF",
  letterSpacing: "0.5px",
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "6px",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  marginLeft: "16px",
};

const popupContentStyle: React.CSSProperties = {
  padding: "32px",
  backgroundColor: "#FFFFFF",
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: "28px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "10px",
  fontWeight: "600",
  fontSize: "14px",
  color: "#374151",
  fontFamily: "'Inter', sans-serif",
};

const requiredStarStyle: React.CSSProperties = {
  color: "#ef4444",
  marginLeft: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "2px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  color: "#1f2937",
  boxSizing: "border-box",
  transition: "all 0.2s ease",
  backgroundColor: "#FFFFFF",
  fontFamily: "'Inter', sans-serif",
};

const characterInfoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "8px",
  fontSize: "13px",
  color: "#6b7280",
  fontFamily: "'Inter', sans-serif",
};

const characterHintStyle: React.CSSProperties = {
  color: "#6b7280",
};

const characterCounterStyle: React.CSSProperties = {
  color: "#6b7280",
  fontWeight: "500",
};

const errorStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  color: "#dc2626",
  padding: "12px 16px",
  borderRadius: "8px",
  fontSize: "14px",
  marginTop: "16px",
  border: "1px solid #fecaca",
  fontFamily: "'Inter', sans-serif",
};

const popupFooterStyle: React.CSSProperties = {
  padding: "24px 32px",
  backgroundColor: "#FFFFFF",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: "16px",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "12px 28px",
  backgroundColor: "#FFFFFF",
  color: "#374151",
  border: "2px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontFamily: "'Inter', sans-serif",
  minWidth: "100px",
};

const submitButtonStyle: React.CSSProperties = {
  padding: "12px 28px",
  backgroundColor: "#2563eb",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontFamily: "'Inter', sans-serif",
  minWidth: "120px",
  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
};