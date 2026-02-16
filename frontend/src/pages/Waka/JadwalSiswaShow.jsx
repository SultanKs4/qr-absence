import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './JadwalSiswaShow.css';
import NavbarWaka from '../../components/Waka/NavbarWaka';
import {
  FaCalendarAlt,
  FaArrowLeft,
  FaPrint,
  FaEdit,
} from 'react-icons/fa';

function JadwalSiswaShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/schedules/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        console.error('Gagal memuat data jadwal');
        alert('Gagal memuat data jadwal');
        navigate('/waka/jadwal-siswa');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      alert('Terjadi kesalahan saat memuat data');
      navigate('/waka/jadwal-siswa');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Memuat jadwal...</div>
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  // Helper to sort days if needed, though usually backend handles it or we map manually
  const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
  const sortedDays = schedule.daily_schedules?.sort((a, b) => dayOrder[a.day] - dayOrder[b.day]) || [];

  return (
    <div className="jadwal-siswa-show-root">
      <NavbarWaka />

      <div className="page-offset">
        {/* BREADCRUMB */}
        <div className="jadwal-siswa-show-breadcrumb">
          <Link to="/waka/jadwal-siswa" className="jadwal-siswa-show-breadcrumb-link">
            <FaCalendarAlt />
            <span>Jadwal Kelas</span>
          </Link>
          <span className="mx-2">/</span>
          <span>{schedule.class?.name}</span>
        </div>

        {/* HEADER */}
        <div className="jadwal-siswa-show-header">
          <div>
            <h1 className="text-2xl font-bold">Jadwal Pelajaran {schedule.class?.name}</h1>
            <p className="text-gray-600">
              Tahun Ajaran {schedule.year} - Semester {schedule.semester == 1 ? 'Ganjil' : 'Genap'}
            </p>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {schedule.is_active ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
            >
              <FaPrint /> Cetak
            </button>
            <Link
              to={`/waka/jadwal-siswa/${id}/edit`}
              className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-yellow-600"
            >
              <FaEdit /> Edit
            </Link>
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {sortedDays.map((day) => (
            <div key={day.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-lg text-gray-800 uppercase">
                {day.day}
              </div>
              <div className="divide-y divide-gray-100">
                {day.schedule_items?.length > 0 ? (
                  day.schedule_items.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-800">
                          {item.subject?.name || 'Unknown Subject'}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          {item.room || '-'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {item.teacher?.user?.name || item.teacher?.kode_guru || 'Unknown Teacher'}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 italic">
                    Tidak ada pelajaran
                  </div>
                )}
              </div>
            </div>
          ))}

          {sortedDays.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">Belum ada jadwal yang diatur untuk kelas ini.</p>
              <Link to={`/waka/jadwal-siswa/${id}/edit`} className="text-blue-600 hover:underline mt-2 inline-block">
                Atur Jadwal Sekarang
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default JadwalSiswaShow;