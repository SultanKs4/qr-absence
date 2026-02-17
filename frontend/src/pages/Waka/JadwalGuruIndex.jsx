import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './JadwalGuruIndex.css';
import NavbarWaka from '../../components/Waka/NavbarWaka';
import {
  FaEye,
  FaEdit,
  FaIdCard,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaSearch,
} from "react-icons/fa";

function JadwalGuruIndex() {
  const navigate = useNavigate();
  const [dataGuru, setDataGuru] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setDataGuru(data);
        setFilteredData(data);
      } else {
        console.error('Gagal memuat data guru');
        // alert('Gagal memuat data guru');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      // alert('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = dataGuru;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(guru =>
        (guru.kode_guru?.toLowerCase() || '').includes(lower) ||
        (guru.user?.name?.toLowerCase() || '').includes(lower) ||
        (guru.nip?.toLowerCase() || '').includes(lower)
      );
    }

    setFilteredData(filtered);
  }, [searchTerm, dataGuru]);

  const handleView = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/waka/jadwal-guru/${id}`);
  };

  const handleEdit = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to specialized schedule edit for teacher if needed, or just view
    navigate(`/waka/jadwal-guru/${id}`);
  };

  return (
    <>
      <NavbarWaka />

      <div className="jadwal-guru-index-root">
        <div className="jadwal-guru-index-header">
          <h1 className="jadwal-guru-index-title">
            Jadwal Pembelajaran Guru
          </h1>
          <p className="jadwal-guru-index-subtitle">
            Lihat jadwal mengajar per guru
          </p>
        </div>

        <div className="jadwal-guru-index-filter-card">
          <div className="search-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Cari Nama / Kode / NIP Guru..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  width: '100%'
                }}
              />
            </div>
          </div>
        </div>

        <div className="jadwal-guru-index-table-card">
          <div className="jadwal-guru-index-table-header">
            <h3>Daftar Guru ({filteredData.length})</h3>
          </div>

          <div className="jadwal-guru-index-table-wrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Memuat data...
              </div>
            ) : filteredData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                Tidak ada data guru yang ditemukan
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kode Guru</th>
                    <th>Nama Guru</th>
                    <th>NIP</th>
                    <th>Kontak</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((guru, index) => (
                    <tr key={guru.id}>
                      <td>{index + 1}</td>

                      <td>
                        <span className="jadwal-guru-index-badge-blue">
                          {guru.kode_guru || '-'}
                        </span>
                      </td>

                      <td>
                        <div className="font-semibold">{guru.user?.name || guru.nama_guru}</div>
                        <div className="text-xs text-gray-500">{guru.user?.email}</div>
                      </td>
                      <td>{guru.nip || '-'}</td>

                      <td>
                        {guru.no_hp ? <div><FaPhone /> {guru.no_hp}</div> : '-'}
                      </td>

                      <td>
                        <div className="jadwal-guru-index-action">
                          <button
                            onClick={(e) => handleView(e, guru.id)}
                            className="jadwal-guru-index-btn-view"
                            title="Lihat Jadwal"
                          >
                            <FaEye /> Lihat Jadwal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default JadwalGuruIndex;