import React, { useState, useRef, useEffect } from 'react';
import './DataGuru.css';
import NavbarAdmin from '../../components/Admin/NavbarAdmin';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// API Configuration
const baseURL = import.meta.env.VITE_API_URL;
const API_BASE_URL = baseURL ? baseURL : 'http://localhost:8000/api';

// API Service
const apiService = {
  // Get all teachers
  getTeachers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers`, {
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

  // Get available classes for homeroom teacher
  getAvailableClasses: async (teacherId = null) => {
    try {
      const url = teacherId 
        ? `${API_BASE_URL}/classes/available?teacher_id=${teacherId}`
        : `${API_BASE_URL}/classes/available`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch available classes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching available classes:', error);
      return { data: [] };
    }
  },

  // Add teacher
  addTeacher: async (teacherData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(teacherData)
      });
      if (!response.ok) throw new Error('Failed to add teacher');
      return await response.json();
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw error;
    }
  },

  // Update teacher
  updateTeacher: async (id, teacherData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(teacherData)
      });
      if (!response.ok) throw new Error('Failed to update teacher');
      return await response.json();
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to delete teacher');
      return await response.json();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  },

  // Import teachers (bulk)
  importTeachers: async (teachersData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ teachers: teachersData })
      });
      if (!response.ok) throw new Error('Failed to import teachers');
      return await response.json();
    } catch (error) {
      console.error('Error importing teachers:', error);
      throw error;
    }
  }
};

function DataGuru() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  const fileInputRef = useRef(null);
  const exportButtonRef = useRef(null);

  // Daftar mata pelajaran
  const mataPelajaranOptions = [
    'Bahasa Indonesia',
    'Bahasa Jawa',
    'Matematika',
    'Bahasa Inggris',
    'PPKN',
    'PAI',
    'MPKK',
    'MPP',
    'PKDK',
    'BK'
  ];

  // Daftar jabatan
  const jabatanOptions = ['Guru', 'Waka', 'Kapro', 'Wali Kelas'];

  // Daftar bidang Waka
  const bidangWakaOptions = [
    'Waka Kurikulum',
    'Waka Kesiswaan',
    'Waka Humas'
  ];

  // Daftar konsentrasi keahlian untuk Kapro
  const konsentrasiKeahlianOptions = [
    'Teknik Komputer dan Jaringan',
    'Rekayasa Perangkat Lunak',
    'Desain Komunikasi Visual',
    'Elektronika Industri',
    'Audio Video',
    'Mekatronika',
    'Animasi',
    'Broadcasting'
  ];

  // Daftar kelas
  const kelasOptions = ['X', 'XI', 'XII'];

  // Daftar jurusan
  const jurusanOptions = ['TKJ', 'RPL', 'DKV', 'EI', 'AV', 'MT', 'AN', 'BC'];

  const [formData, setFormData] = useState({
    kodeGuru: '',
    namaGuru: '',
    jabatan: 'Guru',
    mataPelajaran: 'Bahasa Indonesia',
    bidangWaka: 'Waka Kurikulum',
    konsentrasiKeahlian: 'Teknik Komputer dan Jaringan',
    kelas: 'X',
    jurusan: 'TKJ'
  });

  // Load teachers from API
  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    const result = await apiService.getTeachers();
    if (result.data) {
      setTeachers(result.data);
    }
    setLoading(false);
  };

  // Load available classes when modal opens for homeroom teacher
  const loadAvailableClasses = async () => {
    const teacherId = editingTeacher?.id || null;
    const result = await apiService.getAvailableClasses(teacherId);
    if (result.data) {
      setAvailableClasses(result.data);
    }
  };

  // Filter & Search
  const getFilteredTeachers = () => {
    return teachers.filter(teacher => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = searchTerm === '' || 
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.code?.toLowerCase().includes(searchLower) ||
        teacher.role?.toLowerCase().includes(searchLower) ||
        (teacher.subject_name && teacher.subject_name.toLowerCase().includes(searchLower)) ||
        (teacher.waka_field && teacher.waka_field.toLowerCase().includes(searchLower)) ||
        (teacher.major_expertise && teacher.major_expertise.toLowerCase().includes(searchLower)) ||
        (teacher.homeroom_class?.name && teacher.homeroom_class.name.toLowerCase().includes(searchLower));

      return matchSearch;
    });
  };

  const filteredTeachers = getFilteredTeachers();

  // Reset Filter
  const handleResetFilter = () => {
    setSearchTerm('');
  };

  // Add or Update Teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    if (!formData.kodeGuru.trim()) {
      alert('Kode Guru harus diisi!');
      return;
    }
    if (!formData.namaGuru.trim()) {
      alert('Nama Guru harus diisi!');
      return;
    }

    try {
      let teacherData = {
        code: formData.kodeGuru,
        name: formData.namaGuru,
        role: formData.jabatan
      };

      if (formData.jabatan === 'Guru') {
        teacherData.subject = formData.mataPelajaran;
      } else if (formData.jabatan === 'Waka') {
        teacherData.waka_field = formData.bidangWaka;
      } else if (formData.jabatan === 'Kapro') {
        teacherData.major_expertise = formData.konsentrasiKeahlian;
      } else if (formData.jabatan === 'Wali Kelas') {
        teacherData.grade = formData.kelas;
        teacherData.major = formData.jurusan;
      }

      if (editingTeacher) {
        await apiService.updateTeacher(editingTeacher.id, teacherData);
        alert('Data guru berhasil diperbarui!');
      } else {
        await apiService.addTeacher(teacherData);
        alert('Data guru berhasil ditambahkan!');
      }

      await loadTeachers();
      handleCloseModal();
    } catch (error) {
      alert('Gagal menyimpan data guru!');
    }
  };

  // Edit Teacher
  const handleEditTeacher = async (teacher) => {
    setEditingTeacher(teacher);
    
    let kelasValue = teacher.grade || 'X';
    let jurusanValue = teacher.major || 'TKJ';
    
    setFormData({
      kodeGuru: teacher.code,
      namaGuru: teacher.name,
      jabatan: teacher.role,
      mataPelajaran: teacher.subject || 'Bahasa Indonesia',
      bidangWaka: teacher.waka_field || 'Waka Kurikulum',
      konsentrasiKeahlian: teacher.major_expertise || 'Teknik Komputer dan Jaringan',
      kelas: kelasValue,
      jurusan: jurusanValue
    });
    
    setIsModalOpen(true);
    
    // Load available classes if role is Wali Kelas
    if (teacher.role === 'Wali Kelas') {
      await loadAvailableClasses();
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
      try {
        await apiService.deleteTeacher(id);
        alert('Data guru berhasil dihapus!');
        await loadTeachers();
      } catch (error) {
        alert('Gagal menghapus data guru!');
      }
    }
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
    setFormData({
      kodeGuru: '',
      namaGuru: '',
      jabatan: 'Guru',
      mataPelajaran: 'Bahasa Indonesia',
      bidangWaka: 'Waka Kurikulum',
      konsentrasiKeahlian: 'Teknik Komputer dan Jaringan',
      kelas: 'X',
      jurusan: 'TKJ'
    });
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get Available Classes from State
  const getAvailableKelas = () => {
    return availableClasses;
  };

  // Get Available Jurusan for Selected Kelas
  const getAvailableJurusan = () => {
    return availableClasses
      .filter(k => k.grade === formData.kelas)
      .map(k => k.major);
  };

  // Load available classes when jabatan changes to Wali Kelas
  useEffect(() => {
    if (formData.jabatan === 'Wali Kelas' && isModalOpen) {
      loadAvailableClasses();
    }
  }, [formData.jabatan, isModalOpen]);

  // Set first available class when available classes loaded
  useEffect(() => {
    if (formData.jabatan === 'Wali Kelas' && !editingTeacher && availableClasses.length > 0) {
      setFormData(prev => ({
        ...prev,
        kelas: availableClasses[0].grade,
        jurusan: availableClasses[0].major
      }));
    }
  }, [availableClasses, formData.jabatan, editingTeacher]);

  // Export to Excel
  const handleExportToExcel = () => {
    const dataToExport = filteredTeachers.length > 0 ? filteredTeachers : teachers;
    
    if (dataToExport.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }
    
    const excelData = dataToExport.map((teacher, index) => {
      let data = {
        'No': index + 1,
        'Kode Guru': teacher.code,
        'Nama Guru': teacher.name,
        'Jabatan': teacher.role
      };

      if (teacher.role === 'Guru') {
        data['Mata Pelajaran'] = teacher.subject || '';
      } else if (teacher.role === 'Waka') {
        data['Bidang Waka'] = teacher.waka_field || '';
      } else if (teacher.role === 'Kapro') {
        data['Konsentrasi Keahlian'] = teacher.major_expertise || '';
      } else if (teacher.role === 'Wali Kelas') {
        data['Kelas'] = teacher.grade || '';
        data['Jurusan'] = teacher.major || '';
      }

      return data;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru');

    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 30 },
      { wch: 15 }
    ];

    const fileName = `data-guru-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    alert('Data berhasil diekspor ke Excel!');
    setShowExportMenu(false);
  };

  // Export to PDF
  const handleExportToPDF = () => {
    const dataToExport = filteredTeachers.length > 0 ? filteredTeachers : teachers;
    
    if (dataToExport.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Data Guru', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

    const tableData = dataToExport.map((teacher, index) => {
      let detail = '';
      if (teacher.role === 'Guru') {
        detail = teacher.subject || '';
      } else if (teacher.role === 'Waka') {
        detail = teacher.waka_field || '';
      } else if (teacher.role === 'Kapro') {
        detail = teacher.major_expertise || '';
      } else if (teacher.role === 'Wali Kelas') {
        detail = `${teacher.grade || ''} ${teacher.major || ''}`;
      }

      return [
        index + 1,
        teacher.code,
        teacher.name,
        teacher.role,
        detail
      ];
    });

    autoTable(doc, {
      head: [['No', 'Kode Guru', 'Nama Guru', 'Jabatan', 'Detail']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 50 },
        3: { cellWidth: 30 },
        4: { cellWidth: 45 }
      }
    });

    const fileName = `data-guru-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    alert('Data berhasil diekspor ke PDF!');
    setShowExportMenu(false);
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kode Guru': 'GR001',
        'Nama Guru': 'Contoh Nama Guru',
        'Jabatan': 'Guru/Waka/Kapro/Wali Kelas',
        'Keterangan': 'Mapel/Bidang Waka/Konsentrasi/Kelas'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Format Data Guru');

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 25 },
      { wch: 20 }
    ];

    const fileName = 'format-data-guru.xlsx';
    XLSX.writeFile(workbook, fileName);
    alert('Format Excel berhasil diunduh!');
  };

  // Import from Excel
  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('File Excel kosong!');
          return;
        }

        const importedTeachers = jsonData
          .map((row, index) => {
            const kodeGuru = String(
              row['Kode Guru'] || row['kodeGuru'] || row['Kode'] || ''
            ).trim();

            const namaGuru = String(
              row['Nama Guru'] || row['namaGuru'] || row['Nama'] || ''
            ).trim();

            const mataPelajaran = String(
              row['Mata Pelajaran'] || row['mataPelajaran'] || row['Mapel'] || ''
            ).trim();

            const jabatan = String(
              row['Jabatan'] || row['jabatan'] || row['Role'] || ''
            ).trim();

            if (!kodeGuru || !namaGuru || !jabatan) {
              throw new Error(`Baris ${index + 2}: Data tidak lengkap (Kode Guru, Nama Guru, dan Jabatan wajib diisi)`);
            }

            return {
              code: kodeGuru,
              name: namaGuru,
              role: jabatan,
              subject: jabatan === 'Guru' ? mataPelajaran : undefined
            };
          });

        const result = await apiService.importTeachers(importedTeachers);
        
        if (result.data) {
          const { imported, duplicates } = result.data;
          
          let message = `✅ Berhasil mengimpor ${imported} data guru.`;
          
          if (duplicates && duplicates.length > 0) {
            message += `\n\n❌ ${duplicates.length} data ditolak karena Kode Guru sudah ada:\n${duplicates.join(', ')}`;
          }
          
          alert(message);
          await loadTeachers();
        }

      } catch (error) {
        alert('❌ Gagal membaca file Excel!\n\n' + error.message);
        console.error(error);
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // Icon Components
  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );

  const ExcelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="9" y1="15" x2="15" y2="15"></line>
      <line x1="9" y1="12" x2="15" y2="12"></line>
      <line x1="9" y1="18" x2="15" y2="18"></line>
    </svg>
  );

  const PDFIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M9 13h6"></path>
      <path d="M9 17h6"></path>
    </svg>
  );

  const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

  if (loading) {
    return (
      <div className="guru-data-container">
        <NavbarAdmin />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Memuat data guru...
        </div>
      </div>
    );
  }

  return (
    <div className="guru-data-container">
      <NavbarAdmin />
      <h1 className="guru-page-title">Data Guru</h1>

      <div className="guru-table-wrapper">
        <div className="guru-filter-box">
          <input 
            type="text" 
            placeholder="Cari Guru (Nama/Kode/Jabatan)..." 
            className="guru-search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="guru-select-group">
            {searchTerm && (
              <button 
                className="guru-btn-reset-filter" 
                onClick={handleResetFilter}
                title="Reset Filter"
              >
                Reset
              </button>
            )}

            <button 
              className="guru-btn-tambah" 
              onClick={() => {
                setEditingTeacher(null);
                setIsModalOpen(true);
              }}
            >
              Tambahkan
            </button>
            
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button 
                ref={exportButtonRef}
                className="guru-btn-export" 
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Ekspor ▼
              </button>
              
              {showExportMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '170px',
                  marginTop: '5px'
                }}>
                  <button
                    onClick={handleExportToExcel}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: 'none',
                      background: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <ExcelIcon /> Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportToPDF}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: 'none',
                      background: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderTop: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <PDFIcon /> PDF (.pdf)
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleImportFromExcel}
              style={{ display: 'none' }}
            />
            <button 
              className="guru-btn-import" 
              onClick={() => fileInputRef.current?.click()}
            >
              Impor
            </button>

            <button 
              className="guru-btn-download-template" 
              onClick={handleDownloadTemplate}
            >
              <DownloadIcon /> Format Excel
            </button>
          </div>
        </div>

        {searchTerm && (
          <div style={{ 
            padding: '10px 20px', 
            backgroundColor: '#e3f2fd', 
            borderLeft: '4px solid #2196f3',
            marginBottom: '15px',
            borderRadius: '4px'
          }}>
            <strong>Hasil Pencarian:</strong> {filteredTeachers.length} dari {teachers.length} guru
            {searchTerm && <span> | Kata kunci: "{searchTerm}"</span>}
          </div>
        )}

        <table className="guru-tabel">
          <thead>
            <tr>
              <th>No</th>
              <th>Kode Guru</th>
              <th>Nama Guru</th>
              <th>Jabatan</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher, index) => {
                let detail = '';
                if (teacher.role === 'Guru') {
                  detail = teacher.subject || '';
                } else if (teacher.role === 'Waka') {
                  detail = teacher.waka_field || '';
                } else if (teacher.role === 'Kapro') {
                  detail = teacher.major_expertise || '';
                } else if (teacher.role === 'Wali Kelas') {
                  detail = `${teacher.grade || ''} ${teacher.major || ''}`;
                }

                return (
                  <tr key={teacher.id}>
                    <td>{index + 1}</td>
                    <td>{teacher.code}</td>
                    <td>{teacher.name}</td>
                    <td>{teacher.role}</td>
                    <td>{detail}</td>
                    <td className="guru-aksi-cell">
                      <button 
                        className="guru-aksi guru-edit" 
                        onClick={() => handleEditTeacher(teacher)}
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button 
                        className="guru-aksi guru-hapus" 
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        title="Hapus"
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  {searchTerm 
                    ? 'Tidak ada data yang sesuai dengan pencarian' 
                    : 'Tidak ada data guru'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="guru-modal-overlay" onClick={handleCloseModal}>
          <div className="guru-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="guru-modal-header">
              <h2>{editingTeacher ? 'Ubah Data Guru' : 'Tambah Data Guru'}</h2>
              <button className="guru-close-button" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleAddTeacher}>
              <div className="guru-form-group">
                <label htmlFor="kodeGuru">Kode Guru <span className="guru-required">*</span></label>
                <input
                  type="text"
                  id="kodeGuru"
                  name="kodeGuru"
                  value={formData.kodeGuru}
                  onChange={handleChange}
                  placeholder="Contoh: GR001"
                  required
                />
              </div>

              <div className="guru-form-group">
                <label htmlFor="namaGuru">Nama Guru <span className="guru-required">*</span></label>
                <input
                  type="text"
                  id="namaGuru"
                  name="namaGuru"
                  value={formData.namaGuru}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap guru"
                  required
                />
              </div>

              <div className="guru-form-group">
                <label htmlFor="jabatan">Jabatan <span className="guru-required">*</span></label>
                <select
                  id="jabatan"
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleChange}
                  required
                >
                  {jabatanOptions.map((jabatan, index) => (
                    <option key={index} value={jabatan}>{jabatan}</option>
                  ))}
                </select>
              </div>

              {formData.jabatan === 'Guru' && (
                <div className="guru-form-group">
                  <label htmlFor="mataPelajaran">Mata Pelajaran <span className="guru-required">*</span></label>
                  <select
                    id="mataPelajaran"
                    name="mataPelajaran"
                    value={formData.mataPelajaran}
                    onChange={handleChange}
                    required
                  >
                    {mataPelajaranOptions.map((mapel, index) => (
                      <option key={index} value={mapel}>{mapel}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.jabatan === 'Waka' && (
                <div className="guru-form-group">
                  <label htmlFor="bidangWaka">Bidang Waka <span className="guru-required">*</span></label>
                  <select
                    id="bidangWaka"
                    name="bidangWaka"
                    value={formData.bidangWaka}
                    onChange={handleChange}
                    required
                  >
                    {bidangWakaOptions.map((bidang, index) => (
                      <option key={index} value={bidang}>{bidang}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.jabatan === 'Kapro' && (
                <div className="guru-form-group">
                  <label htmlFor="konsentrasiKeahlian">Konsentrasi Keahlian <span className="guru-required">*</span></label>
                  <select
                    id="konsentrasiKeahlian"
                    name="konsentrasiKeahlian"
                    value={formData.konsentrasiKeahlian}
                    onChange={handleChange}
                    required
                  >
                    {konsentrasiKeahlianOptions.map((konsentrasi, index) => (
                      <option key={index} value={konsentrasi}>{konsentrasi}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.jabatan === 'Wali Kelas' && (
                <div className="guru-form-group">
                  <label htmlFor="kelasJurusan">Kelas & Jurusan <span className="guru-required">*</span></label>
                  <select
                    id="kelasJurusan"
                    name="kelasJurusan"
                    value={`${formData.kelas}-${formData.jurusan}`}
                    onChange={(e) => {
                      const [kelas, jurusan] = e.target.value.split('-');
                      setFormData(prev => ({
                        ...prev,
                        kelas,
                        jurusan
                      }));
                    }}
                    required
                  >
                    {getAvailableKelas().length === 0 ? (
                      <option value="">Semua kelas sudah memiliki wali kelas</option>
                    ) : (
                      getAvailableKelas().map((item, index) => (
                        <option key={index} value={`${item.grade}-${item.major}`}>
                          {item.grade} {item.major}
                        </option>
                      ))
                    )}
                  </select>
                  {getAvailableKelas().length === 0 && (
                    <small style={{ color: '#dc3545', fontSize: '13px', marginTop: '5px', display: 'block' }}>
                      Tidak ada kelas yang tersedia
                    </small>
                  )}
                </div>
              )}

              <div className="guru-modal-footer">
                <button type="button" className="guru-btn-cancel" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className="guru-btn-submit">
                  {editingTeacher ? 'Ubah' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataGuru;