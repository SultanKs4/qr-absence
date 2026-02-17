import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../component/Admin/AdminLayout";
import { Button } from "../../component/Shared/Button";
import AWANKIRI from "../../assets/Icon/AWANKIRI.png";
import AwanBawahkanan from "../../assets/Icon/AwanBawahkanan.png";
import { MoreVertical, Edit, Trash2, X } from "lucide-react";
import { masterService, type ClassRoom, type Major } from "../../services/masterService";
import { teacherService, type Teacher } from "../../services/teacherService";

interface User {
  role: string;
  name: string;
}

interface KelasAdminProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
}

/* ===================== DUMMY DATA REMOVED ===================== */
const tingkatKelasOptions = [
  "Semua Tingkat",
  "10",
  "11",
  "12"
];

export default function KelasAdmin({
  user,
  onLogout,
  currentPage,
  onMenuClick,
}: KelasAdminProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kelasList, setKelasList] = useState<ClassRoom[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKelas, setEditingKelas] = useState<ClassRoom | null>(null);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [selectedKonsentrasi, setSelectedKonsentrasi] = useState("Semua Konsentrasi Keahlian");
  const [selectedTingkat, setSelectedTingkat] = useState("Semua Tingkat");
  const [validationError, setValidationError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    label: "",
    major_id: "",
    grade: "",
    homeroom_teacher_id: "",
  });

  /* ===================== FETCH DATA ===================== */
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [dataClasses, dataMajors, dataTeachers] = await Promise.all([
        masterService.getClasses(),
        masterService.getMajors(),
        teacherService.getTeachers()
      ]);
      setKelasList(dataClasses);
      setMajors(dataMajors);
      setTeachers(dataTeachers);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Daftar wali kelas yang sudah digunakan (ID nya)
  const usedWaliKelasIds = useMemo(() => {
    return new Set(kelasList.map(k => k.homeroom_teacher_id).filter(Boolean));
  }, [kelasList]);

  // Wali kelas yang TERSEDIA untuk mode TAMBAH (yang belum dipakai)
  const availableTeachers = useMemo(() => {
    return teachers.filter(t => !usedWaliKelasIds.has(Number(t.id)));
  }, [teachers, usedWaliKelasIds]);

  // Wali kelas yang TERSEDIA untuk mode EDIT
  const availableTeachersForEdit = useMemo(() => {
    if (!editingKelas) return availableTeachers;
    const currentTeacher = teachers.find(t => t.namaGuru === editingKelas.homeroom_teacher_name);
    if (currentTeacher && !availableTeachers.find(t => Number(t.id) === Number(currentTeacher.id))) {
      return [...availableTeachers, currentTeacher];
    }
    return availableTeachers;
  }, [availableTeachers, editingKelas, teachers]);

  // Konsentrasi options for filter
  const konsentrasiKeahlianOptions = useMemo(() => {
    return ["Semua Konsentrasi Keahlian", ...majors.map(m => m.name)];
  }, [majors]);

  // Statistik
  const stats = useMemo(() => ({
    totalKelas: kelasList.length,
    totalGuru: teachers.length,
    totalWaliKelas: usedWaliKelasIds.size,
  }), [kelasList.length, teachers.length, usedWaliKelasIds.size]);

  /* ===================== VALIDASI ===================== */
  const validateKelasData = (data: any, isEditMode: boolean, excludeId?: number): { isValid: boolean; message: string } => {
    setValidationError("");

    const inputLabel = data.label?.trim() || "";
    const inputMajorId = data.major_id || "";
    const inputGrade = data.grade || "";
    const inputTeacherId = data.homeroom_teacher_id || "";

    if (!inputLabel) {
      return { isValid: false, message: "Label kelas harus diisi!" };
    }

    if (!inputMajorId) {
      return { isValid: false, message: "Konsentrasi keahlian harus dipilih!" };
    }

    if (!inputGrade) {
      return { isValid: false, message: "Tingkat kelas harus dipilih!" };
    }

    if (!inputTeacherId) {
      return { isValid: false, message: "Wali kelas harus dipilih!" };
    }

    const duplicateCombination = kelasList.find((k) => {
      if (isEditMode && k.id === excludeId) return false;
      
      const kelasLabel = k.label.trim().toLowerCase();
      const kelasMajorId = k.major_id.toString();
      const kelasGrade = k.grade;
      
      return kelasMajorId === inputMajorId && 
             kelasGrade === inputGrade && 
             kelasLabel === inputLabel.toLowerCase();
    });

    if (duplicateCombination) {
      return {
        isValid: false,
        message: `Kelas "${inputLabel}" untuk konsentrasi tersebut tingkat ${inputGrade} sudah ada!`
      };
    }

    const duplicateWaliKelas = kelasList.find((k) => {
      if (isEditMode && k.id === excludeId) return false;
      return k.homeroom_teacher_id?.toString() === inputTeacherId;
    });

    if (duplicateWaliKelas) {
      const teacherName = teachers.find(t => t.id.toString() === inputTeacherId)?.namaGuru || "Guru";
      return {
        isValid: false,
        message: `Wali kelas "${teacherName}" sudah mengajar kelas lain!`
      };
    }

    return { isValid: true, message: "" };
  };

  const filteredData = kelasList.filter((k) => {
    const konsentrasiMatch = 
      selectedKonsentrasi === "Semua Konsentrasi Keahlian" || 
      k.major_name === selectedKonsentrasi;
    
    const tingkatMatch = 
      selectedTingkat === "Semua Tingkat" || 
      k.grade === selectedTingkat;
    
    return konsentrasiMatch && tingkatMatch;
  });

  const handleDelete = async (row: ClassRoom) => {
    if (confirm(`Hapus kelas "${row.name}"?`)) {
      try {
        await masterService.deleteClass(row.id);
        setKelasList((prev) => prev.filter((k) => k.id !== row.id));
        setOpenActionId(null);
        setValidationError("");
      } catch (error) {
        console.error("Failed to delete class:", error);
        alert("Gagal menghapus kelas.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const isEditMode = !!editingKelas;
    
    const validation = validateKelasData(formData, isEditMode, editingKelas?.id);
    
    if (!validation.isValid) {
      setValidationError(validation.message);
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingKelas) {
        const updated = await masterService.updateClass(editingKelas.id, {
          label: formData.label,
          major_id: parseInt(formData.major_id),
          grade: formData.grade,
          homeroom_teacher_id: parseInt(formData.homeroom_teacher_id)
        });
        setKelasList(prev => prev.map(k => k.id === editingKelas.id ? updated : k));
        alert("✓ Kelas berhasil diperbarui!");
      } else {
        const newClass = await masterService.addClass({
          label: formData.label,
          major_id: parseInt(formData.major_id),
          grade: formData.grade,
          homeroom_teacher_id: parseInt(formData.homeroom_teacher_id)
        });
        setKelasList(prev => [...prev, newClass]);
        alert("✓ Kelas berhasil ditambahkan!");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save class:", error);
      setValidationError("Gagal menyimpan data kelas. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setEditingKelas(null);
    setFormData({
      label: "",
      major_id: "",
      grade: "",
      homeroom_teacher_id: "",
    });
    setValidationError("");
    setIsModalOpen(true);
  };

  const handleEditModal = (kelas: ClassRoom) => {
    setEditingKelas(kelas);
    setFormData({
      label: kelas.label,
      major_id: kelas.major_id.toString(),
      grade: kelas.grade,
      homeroom_teacher_id: kelas.homeroom_teacher_id?.toString() || "",
    });
    setValidationError("");
    setOpenActionId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKelas(null);
    setFormData({
      label: "",
      major_id: "",
      grade: "",
      homeroom_teacher_id: "",
    });
    setValidationError("");
    setIsSubmitting(false);
  };

  return (
    <AdminLayout
      pageTitle="Data Kelas"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
      hideBackground
    >
      <img src={AWANKIRI} style={bgLeft} alt="Background awan kiri" />
      <img src={AwanBawahkanan} style={bgRight} alt="Background awan kanan bawah" />

      <div style={containerStyle}>
        <div style={statsContainerStyle}>
          <div style={statCardStyle} className="stat-card">
            <div style={statIconContainerStyle}>
              <div style={iconCircleStyle} className="icon-circle">
                <span style={iconTextStyle}>🏫</span>
              </div>
            </div>
            
            <div style={statContentStyle}>
              <div style={statNumberStyle}>{stats.totalKelas}</div>
              <div style={statLabelStyle}>Total Kelas</div>
            </div>
          </div>

          <div style={statCardStyle} className="stat-card">
            <div style={statIconContainerStyle}>
              <div style={iconCircleStyle} className="icon-circle">
                <span style={iconTextStyle}>👨‍🏫</span>
              </div>
            </div>
            
            <div style={statContentStyle}>
              <div style={statNumberStyle}>{stats.totalGuru}</div>
              <div style={statLabelStyle}>Total Guru</div>
            </div>
          </div>

          <div style={statCardStyle} className="stat-card">
            <div style={statIconContainerStyle}>
              <div style={iconCircleStyle} className="icon-circle">
                <span style={iconTextStyle}>📚</span>
              </div>
            </div>
            
            <div style={statContentStyle}>
              <div style={statNumberStyle}>{stats.totalWaliKelas}</div>
              <div style={statLabelStyle}>Total Wali Kelas</div>
            </div>
          </div>
        </div>

        <div style={headerStyle}>
          <div style={filterContainerStyle}>
            <div style={{ minWidth: "200px", maxWidth: "250px" }}>
              <select
                value={selectedKonsentrasi}
                onChange={(e) => setSelectedKonsentrasi(e.target.value)}
                style={dropdownStyle}
              >
                {konsentrasiKeahlianOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ minWidth: "120px", maxWidth: "150px" }}>
              <select
                value={selectedTingkat}
                onChange={(e) => setSelectedTingkat(e.target.value)}
                style={dropdownStyle}
              >
                {tingkatKelasOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={buttonContainerStyle}>
            <Button 
              label="Tambahkan" 
              onClick={handleOpenModal}
              style={buttonStyle}
            />
          </div>
        </div>

        {validationError && (
          <div style={errorBannerStyle}>
            ⚠️ {validationError}
          </div>
        )}

        <div style={tableWrapperStyle}>
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
                }}>Konsentrasi Keahlian</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  borderRight: '1px solid #E5E7EB',
                }}>Tingkat Kelas</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  borderRight: '1px solid #E5E7EB',
                }}>Kelas</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  borderRight: '1px solid #E5E7EB',
                }}>Wali Kelas</th>
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
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : filteredData.map((row, index) => (
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
                  }}>{row.major_name || "-"}</td>
                  <td style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    color: '#374151',
                    textAlign: 'center',
                    borderRight: '1px solid #E5E7EB',
                  }}>{row.grade}</td>
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
                  }}>{row.homeroom_teacher_name || "-"}</td>
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
                        color: '#666',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <MoreVertical size={20} strokeWidth={1.5} />
                    </button>

                    {openActionId === row.id && (
                      <div style={dropdownMenuStyle}>
                        <button
                          onClick={() => handleEditModal(row)}
                          style={actionItemStyle}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F0F4FF';
                            e.currentTarget.style.color = '#2563EB';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.color = '#0F172A';
                          }}
                        >
                          <Edit size={16} strokeWidth={2} />
                          Ubah
                        </button>

                        <button
                          onClick={() => handleDelete(row)}
                          style={{ ...actionItemStyle, borderBottom: "none" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEF2F2';
                            e.currentTarget.style.color = '#DC2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.color = '#0F172A';
                          }}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                          Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM - IMPROVED STYLING */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          padding: '20px',
          paddingTop: '100px',
          overflowY: 'auto',
          paddingBottom: '40px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            overflow: 'auto',
            maxHeight: '75vh',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 28px',
              backgroundColor: '#1e293b',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '16px 16px 0 0',
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                letterSpacing: '-0.3px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}>
                {editingKelas ? 'Ubah Kelas' : 'Tambah Kelas'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} style={{
              padding: '24px',
            }}>
              {/* Nama Kelas */}
              <div style={{
                marginBottom: '18px',
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: '#1e293b',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}>
                  Nama Kelas<span style={{
                    color: '#ef4444',
                    marginLeft: '6px',
                    fontWeight: '700',
                  }}>*</span>
                </label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  placeholder="Contoh: A, B, atau 1, 2"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f8fafc',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Konsentrasi Keahlian */}
              <div style={{
                marginBottom: '18px',
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1e293b',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}>
                  Konsentrasi Keahlian<span style={{
                    color: '#ef4444',
                    marginLeft: '6px',
                    fontWeight: '700',
                  }}>*</span>
                </label>
                <select
                  value={formData.major_id}
                  onChange={(e) => setFormData({...formData, major_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Pilih Konsentrasi Keahlian</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Tingkat Kelas */}
              <div style={{
                marginBottom: '18px',
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1e293b',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}>
                  Tingkat Kelas<span style={{
                    color: '#ef4444',
                    marginLeft: '6px',
                    fontWeight: '700',
                  }}>*</span>
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Pilih Tingkat Kelas</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
              </div>

              {/* Wali Kelas */}
              <div style={{
                marginBottom: '24px',
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1e293b',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}>
                  Wali Kelas<span style={{
                    color: '#ef4444',
                    marginLeft: '6px',
                    fontWeight: '700',
                  }}>*</span>
                </label>
                <select
                  value={formData.homeroom_teacher_id}
                  onChange={(e) => setFormData({...formData, homeroom_teacher_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Pilih Wali Kelas</option>
                  {(editingKelas ? availableTeachersForEdit : availableTeachers).map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.namaGuru}</option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {validationError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '18px',
                  border: '1px solid #fecaca',
                  fontWeight: '500',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}>
                  {validationError}
                </div>
              )}

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    opacity: isSubmitting ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  {editingKelas ? 'Perbarui' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ===== STYLE OBJECTS =====

const containerStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  position: "relative",
  zIndex: 1,
  minHeight: "calc(100vh - 180px)",
};

const statsContainerStyle: React.CSSProperties = {
  display: "flex",
  gap: 20,
  justifyContent: "space-between",
  marginBottom: 8,
};

const statCardStyle: React.CSSProperties = {
  flex: 1,
  background: "linear-gradient(135deg, #001F3E 0%, #0C4A6E 100%)",
  borderRadius: 16,
  padding: "24px",
  display: "flex",
  alignItems: "center",
  gap: 16,
  boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
  border: "1px solid #1e40af",
  minHeight: "120px",
  transition: "all 0.2s ease",
  cursor: "pointer",
};

const statIconContainerStyle: React.CSSProperties = {
  flexShrink: 0,
};

const iconCircleStyle: React.CSSProperties = {
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255, 255, 255, 0.15)",
  border: "2px solid rgba(255, 255, 255, 0.3)",
  transition: "all 0.2s ease",
};

const iconTextStyle: React.CSSProperties = {
  fontSize: "28px",
  lineHeight: 1,
  color: "#FFFFFF",
};

const statContentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
};

const statNumberStyle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "36px",
  fontWeight: 800,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  lineHeight: 1.2,
  marginBottom: "6px",
  textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
};

const statLabelStyle: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  letterSpacing: "0.3px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginTop: 8,
  paddingBottom: 16,
  borderBottom: "1px solid #F3F4F6",
};

const filterContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flex: 1,
};

const buttonContainerStyle: React.CSSProperties = {
  height: "40px",
  display: "flex",
  alignItems: "center",
};

const buttonStyle: React.CSSProperties = {
  height: "100%",
  padding: "0 20px",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#001F3E",
  color: "#FFFFFF",
  fontWeight: 600,
  fontSize: "14px",
  border: "none",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
};

const tableWrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  overflow: "hidden",
  border: "1px solid #E5E7EB",
  backgroundColor: "#FFFFFF",
  marginTop: 8,
};

const dropdownStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  backgroundColor: "#FFFFFF",
  color: "#374151",
  outline: "none",
  cursor: "pointer",
  height: "40px",
  boxSizing: "border-box",
  transition: "all 0.2s ease",
};

const dropdownMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  marginTop: 4,
  background: "#FFFFFF",
  borderRadius: 6,
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  minWidth: 140,
  zIndex: 1000,
  overflow: "hidden",
  border: "1px solid #E5E7EB",
};

const actionItemStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "none",
  background: "none",
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#374151",
  fontSize: 14,
  fontWeight: 400,
  transition: "all 0.2s ease",
  borderBottom: "1px solid #F3F4F6",
};

const errorBannerStyle: React.CSSProperties = {
  backgroundColor: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#DC2626",
  padding: "12px 16px",
  borderRadius: "6px",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: 500,
  margin: "8px 0",
};

const bgLeft: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: 200,
  zIndex: 0,
  opacity: 0.9,
};

const bgRight: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  right: 0,
  width: 220,
  zIndex: 0,
  opacity: 0.9,
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    .stat-card:hover {
      box-shadow: 0 8px 20px rgba(30, 58, 138, 0.4) !important;
      transform: translateY(-3px);
      background: linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%) !important;
      border-color: #3b82f6 !important;
    }
    
    .stat-card:hover .icon-circle {
      background-color: rgba(255, 255, 255, 0.2) !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
      transform: scale(1.05);
    }
  `;
  if (!document.getElementById('stat-card-hover-styles')) {
    styleSheet.id = 'stat-card-hover-styles';
    document.head.appendChild(styleSheet);
  }
}