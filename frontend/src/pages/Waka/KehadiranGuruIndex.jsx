import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './KehadiranGuruIndex.css';
import NavbarWaka from '../../components/Waka/NavbarWaka';
import { FaCalendar, FaClock, FaFileExport, FaFilePdf, FaFileExcel, FaEye, FaTrash } from 'react-icons/fa';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function KehadiranGuruIndex() {
  const navigate = useNavigate();
  const [kehadirans, setKehadirans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  const [filterTanggal, setFilterTanggal] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, namaGuru: '' });
  const [showExport, setShowExport] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const statusConfig = {
    present: { label: 'Hadir', bg: 'status-hadir', icon: 'fa-check-circle' },
    late: { label: 'Terlambat', bg: 'status-terlambat', icon: 'fa-clock' },
    excused: { label: 'Izin', bg: 'status-izin', icon: 'fa-info-circle' },
    sick: { label: 'Sakit', bg: 'status-sakit', icon: 'fa-heartbeat' },
    absent: { label: 'Alfa', bg: 'status-alfa', icon: 'fa-times-circle' },
    return: { label: 'Pulang', bg: 'status-pulang', icon: 'fas fa-sign-out-alt' },
    dinas: { label: 'Dinas', bg: 'status-dinas', icon: 'fa-briefcase' },
  };

  useEffect(() => {
    if (filterTanggal) {
      fetchKehadiranGuru();
    }
  }, [filterTanggal]);

  const fetchKehadiranGuru = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/attendance/teachers/daily?date=${filterTanggal}&per_page=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Backend returns: { date: "...", items: { data: [...], ... } }
        setKehadirans(result.items.data || []);
        setPagination(result.items); // Store pagination meta if needed
      } else {
        console.error('Gagal memuat data kehadiran guru');
        alert('Gagal memuat data kehadiran guru');
      }
    } catch (error) {
      console.error('Error fetching kehadiran guru:', error);
      alert('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      // Using void endpoint to delete/cancel attendance
      const response = await fetch(`http://localhost:8000/api/attendance/${id}/void`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state to reflect removal (status becomes absent or null)
        setKehadirans(prev => prev.map(item => {
          if (item.attendance && item.attendance.id === id) {
            return { ...item, attendance: null, status: 'absent' };
          }
          return item;
        }));
        alert('Data kehadiran berhasil dibatalkan');
      } else {
        const err = await response.json();
        alert(err.message || 'Gagal membatalkan kehadiran');
      }
    } catch (error) {
      console.error('Error deleting kehadiran:', error);
      alert('Terjadi kesalahan saat menghapus data');
    } finally {
      setDeleteModal({ show: false, id: null, namaGuru: '' });
    }
  };

  // --- FUNGSI EKSPOR PDF ---
  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const title = `Laporan Kehadiran Guru - ${filterTanggal}`;

    doc.setFontSize(14);
    doc.text(title, 14, 15);

    const headers = [["No", "Kode Guru", "Nama Guru", "Status", "Waktu Check-in"]];
    const data = kehadirans.map((k, i) => [
      i + 1,
      k.teacher.kode_guru || '-',
      k.teacher.user?.name || '-',
      statusConfig[k.status]?.label || k.status,
      k.attendance ? new Date(k.attendance.checked_in_at).toLocaleTimeString() : '-'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 22,
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center' },
      headStyles: { fillColor: [44, 62, 80] },
      columnStyles: { 2: { halign: 'left' } }
    });

    doc.save(`Kehadiran_Guru_${filterTanggal}.pdf`);
    setShowExport(false);
  };

  // --- FUNGSI EKSPOR EXCEL ---
  const handleExportExcel = () => {
    const dataExcel = kehadirans.map((k, i) => ({
      No: i + 1,
      'Kode Guru': k.teacher.kode_guru || '-',
      'Nama Guru': k.teacher.user?.name || '-',
      'Status': statusConfig[k.status]?.label || k.status,
      'Waktu Check-in': k.attendance ? new Date(k.attendance.checked_in_at).toLocaleTimeString() : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kehadiran");
    XLSX.writeFile(workbook, `Kehadiran_Guru_${filterTanggal}.xlsx`);
    setShowExport(false);
  };

  return (
    <div className="kehadiran-guru-index-container">
      <NavbarWaka />
      <div className="kehadiran-guru-index-header">
        <div>
          <h1>Kehadiran Guru</h1>
          <p>Kelola dan monitor kehadiran harian guru</p>
        </div>

        <div className="kehadiran-guru-index-export-wrapper">
          <button
            className="kehadiran-guru-index-export-btn"
            onClick={() => setShowExport(prev => !prev)}
          >
            <FaFileExport />
            Ekspor
          </button>

          {showExport && (
            <div className="kehadiran-guru-index-export-menu">
              <div className="export-divider"></div>
              <button className="export-item pdf" onClick={handleExportPDF}>
                <FaFilePdf /> PDF
              </button>
              <button className="export-item excel" onClick={handleExportExcel}>
                <FaFileExcel /> Excel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="kehadiran-guru-index-filter-wrapper">
        <div className="kehadiran-guru-index-filter-grid">
          <div className="kehadiran-guru-index-filter-item">
            <label className="kehadiran-guru-index-filter-label">
              <FaCalendar className='kehadiran-guru-index-filter-icon' />
              Tanggal
            </label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="kehadiran-guru-index-filter-input"
            />
          </div>
        </div>
      </div>

      <div className="kehadiran-guru-index-table-container">
        <div className="kehadiran-guru-index-table-header">
          <div className="kehadiran-guru-index-table-header-inner">
            <h3 className="kehadiran-guru-index-table-title">
              Daftar Kehadiran ({kehadirans.length})
            </h3>
          </div>
        </div>

        <div className="kehadiran-guru-legend">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div className="legend-item" key={key}>
              <span className={`legend-dot ${config.bg}`}></span>
              <span className="legend-text">{config.label}</span>
            </div>
          ))}
        </div>

        <div className="kehadiran-guru-index-table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Memuat data...
            </div>
          ) : kehadirans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Tidak ada data kehadiran guru untuk tanggal {filterTanggal}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode Guru</th>
                  <th>Nama Guru</th>
                  <th>Status</th>
                  <th>Waktu</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kehadirans.map((k, i) => {
                  const statusInfo = statusConfig[k.status] || { label: k.status, bg: 'status-belum' };

                  return (
                    <tr key={k.teacher.id}>
                      <td>{i + 1}</td>
                      <td><span className="kehadiran-guru-index-badge">{k.teacher.kode_guru || '-'}</span></td>
                      <td>{k.teacher.user?.name}</td>
                      <td>
                        <span className={`status-badge ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        {k.attendance ? (
                          <span className="time-badge">
                            <FaClock style={{ marginRight: '4px' }} />
                            {new Date(k.attendance.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {k.attendance && (
                          <button
                            className="kehadiran-guru-delete-btn"
                            onClick={() => setDeleteModal({ show: true, id: k.attendance.id, namaGuru: k.teacher.user?.name })}
                            title="Batalkan Kehadiran"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Konfirmasi Pembatalan</h3>
            <p>Apakah Anda yakin ingin membatalkan kehadiran untuk <strong>{deleteModal.namaGuru}</strong>?</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteModal({ show: false, id: null, namaGuru: '' })}
              >
                Batal
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(deleteModal.id)}
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KehadiranGuruIndex;