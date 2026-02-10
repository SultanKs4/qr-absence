import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import './DataSiswa.css';
import {
    FaUserPlus, FaFileImport, FaFileExport, FaSearch,
    FaFilter, FaEllipsisV, FaEdit, FaTrash, FaCheck,
    FaFilePdf, FaFileExcel, FaEye, FaTimes, FaSpinner,
    FaUserGraduate, FaDownload
} from 'react-icons/fa';
import TambahSiswa from '../../components/Admin/TambahSiswa';
import PageWrapper from '../../components/ui/PageWrapper';
import {
    getStudents, createStudent, updateStudent, deleteStudent, importStudents
} from '../../services/student';
import { getClasses } from '../../services/class';
import { getMajors } from '../../services/major';
import { STORAGE_BASE_URL } from '../../utils/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import apiClient from '../../services/api';

function DataSiswa() {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJurusan, setFilterJurusan] = useState('Semua Jurusan');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    // Missing states for history modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [studentHistory, setStudentHistory] = useState([]);

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsData, classesData, majorsData] = await Promise.all([
                getStudents(),
                getClasses(),
                getMajors()
            ]);
            setStudents(studentsData);
            setClasses(classesData);
            setMajors(majorsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal mengambil data dari server.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrUpdate = async (formData) => {
        try {
            setLoading(true);
            const payload = {
                name: formData.namaSiswa,
                nisn: formData.nisn,
                class_id: formData.classId,
                // Add other fields as per API if needed (address, gender, etc.)
                gender: 'L', // Default or add to form
                address: '-'
            };

            if (editData) {
                await updateStudent(editData.id, payload);
            } else {
                await createStudent(payload);
            }

            await fetchData();
            setIsModalOpen(false);
            setEditData(null);
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Gagal menyimpan data siswa: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (id) => {
        if (window.confirm('Yakin ingin menghapus data siswa ini?')) {
            try {
                setLoading(true);
                await deleteStudent(id);
                await fetchData();
            } catch (error) {
                console.error('Error deleting student:', error);
                alert('Gagal menghapus data siswa.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEdit = (student) => {
        setEditData({
            id: student.id,
            nama: student.user?.name || student.name,
            nisn: student.nisn,
            jurusan: student.class_room?.major?.name || '-',
            kelas: student.class_room?.name || '-',
            classId: student.class_id
        });
        setIsModalOpen(true);
    };

    const handleImport = () => {
        fileInputRef.current.click();
    };

    const handleExportToExcel = () => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(filteredStudents.map((s, i) => ({
                No: i + 1,
                Nama: s.user?.name || s.name,
                NISN: s.nisn,
                Jurusan: s.class_room?.major?.name || '-',
                Kelas: s.class_room?.name || '-'
            })));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");
            XLSX.writeFile(workbook, `Data_Siswa_${new Date().toLocaleDateString()}.xlsx`);
            setShowExportMenu(false);
        } catch (error) {
            console.error('Excel Export failed:', error);
            alert('Gagal mengekspor Excel');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split('\n').filter(row => row.trim() !== '');
                if (rows.length < 2) {
                    alert('File CSV tidak memiliki data.');
                    return;
                }

                const headers = rows[0].split(',').map(h => h.trim());
                const data = rows.slice(1).map(row => {
                    const values = row.split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((header, i) => {
                        obj[header.toLowerCase()] = values[i];
                    });
                    return obj;
                });

                // Backend expects { items: [...] }
                await importStudents(data);
                alert('Data berhasil diimpor!');
                await fetchData();
            } catch (error) {
                console.error('Import failed:', error);
                alert('Gagal impor data. Pastikan format CSV benar (nama, nisn, class_id).');
            } finally {
                setIsImporting(false);
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsText(file);
    };

    const handleExportToPdf = () => {
        try {
            const doc = jsPDF();
            doc.text(`Data Siswa - ${new Date().toLocaleDateString()}`, 14, 15);

            const tableData = filteredStudents.map((s, i) => [
                i + 1,
                s.user?.name || s.name,
                s.nisn,
                s.class_room?.major?.name || '-',
                s.class_room?.name || '-'
            ]);

            autoTable(doc, {
                startY: 25,
                head: [['No', 'Nama', 'NISN', 'Jurusan', 'Kelas']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }
            });

            doc.save(`Data_Siswa_${new Date().toLocaleDateString()}.pdf`);
            setShowExportMenu(false);
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('Gagal mengekspor PDF');
        }
    };

    const handleViewSurat = async (student) => {
        try {
            setSelectedStudent(student);
            setShowHistoryModal(true);
            setIsLoadingHistory(true);

            // Fetch student attendance summary or history
            const response = await apiClient.get(`/me/attendance`, {
                params: { student_id: student.id }
            });
            setStudentHistory(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching student history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const name = (s.user?.name || s.name).toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || s.nisn.includes(searchTerm);
        const matchesJurusan = filterJurusan === 'Semua Jurusan' || (s.class_room?.major?.name === filterJurusan);
        return matchesSearch && matchesJurusan;
    });

    return (
        <PageWrapper className="data-siswa-container">
            <div className="data-siswa-header">
                <div className="header-left">
                    <h1 className="title">Data Siswa</h1>
                    <p className="subtitle">Mengelola informasi data siswa sekolah</p>
                </div>
                <div className="header-right">
                    <button className="btn-add" onClick={() => { setEditData(null); setIsModalOpen(true); }}>
                        <FaUserPlus /> Tambah Siswa
                    </button>
                    <div className="action-buttons">
                        <button className="btn-action btn-import" onClick={handleImport} disabled={isImporting}>
                            {isImporting ? <FaSpinner className="animate-spin" /> : <FaFileImport />} Impor CSV
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".csv"
                            onChange={handleFileChange}
                        />

                        <div className="export-container" style={{ position: 'relative' }}>
                            <button className="btn-action btn-export" onClick={() => setShowExportMenu(!showExportMenu)}>
                                <FaFileExport /> Ekspor
                            </button>
                            {showExportMenu && (
                                <div className="export-menu">
                                    <button onClick={handleExportToExcel}><FaFileExcel /> Excel (.xlsx)</button>
                                    <button onClick={handleExportToPdf}><FaFilePdf /> PDF (.pdf)</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="filter-search-container">
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Cari nama atau NISN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <FaFilter className="filter-icon" />
                    <select
                        value={filterJurusan}
                        onChange={(e) => setFilterJurusan(e.target.value)}
                    >
                        <option value="Semua Jurusan">Semua Jurusan</option>
                        {majors.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                {loading && <div className="loading-overlay"><FaSpinner className="animate-spin" /> Memuat...</div>}
                <table className="siswa-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Siswa</th>
                            <th>NISN</th>
                            <th>Jurusan</th>
                            <th>Kelas</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((siswa, index) => (
                                <tr key={siswa.id}>
                                    <td>{index + 1}</td>
                                    <td className="font-bold">{siswa.user?.name || siswa.name}</td>
                                    <td>{siswa.nisn}</td>
                                    <td>{siswa.class_room?.major?.name || '-'}</td>
                                    <td><span className="badge-kelas">{siswa.class_room?.name || '-'}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn view" title="Lihat Riwayat" onClick={() => handleViewSurat(siswa)}>
                                                <FaEye />
                                            </button>
                                            <button className="action-btn edit" title="Edit" onClick={() => handleEdit(siswa)}>
                                                <FaEdit />
                                            </button>
                                            <button className="action-btn delete" title="Hapus" onClick={() => handleDeleteStudent(siswa.id)}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="empty-state">
                                    <div className="empty-content">
                                        <FaUserPlus size={48} className="empty-icon" />
                                        <p>Data siswa tidak ditemukan.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <TambahSiswa
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditData(null); }}
                onSubmit={handleAddOrUpdate}
                editData={editData}
            />

            {/* HISTORY MODAL */}
            {showHistoryModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="history-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="student-info">
                                <FaUserGraduate className="student-icon" />
                                <div>
                                    <h3>{selectedStudent.user?.name || selectedStudent.name}</h3>
                                    <p>NISN: {selectedStudent.nisn} | Kelas: {selectedStudent.class_room?.name}</p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            {isLoadingHistory ? (
                                <div className="loading-state"><FaSpinner className="animate-spin" /> Memuat riwayat...</div>
                            ) : studentHistory.length > 0 ? (
                                <div className="history-list">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Tanggal</th>
                                                <th>Mata Pelajaran</th>
                                                <th>Status</th>
                                                <th>Lampiran</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentHistory.map((h, idx) => (
                                                <tr key={idx}>
                                                    <td>{h.date}</td>
                                                    <td>{h.schedule?.subject_name || '-'}</td>
                                                    <td><span className={`status-badge ${h.status}`}>{h.status}</span></td>
                                                    <td>
                                                        {h.attachments?.length > 0 ? (
                                                            <button
                                                                className="btn-download"
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await apiClient.get(`/attendance/${h.id}/document`);
                                                                        if (res.data.url) window.open(res.data.url, '_blank');
                                                                    } catch {
                                                                        alert('Gagal memuat dokumen');
                                                                    }
                                                                }}
                                                            >
                                                                <FaDownload />
                                                            </button>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="empty-history">Belum ada riwayat kehadiran.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}

export default DataSiswa;