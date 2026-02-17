import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './JadwalGuruShow.css';
import NavbarWaka from '../../components/Waka/NavbarWaka';
import {
  FaArrowLeft,
  FaChalkboardTeacher,
  FaPrint,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';

function JadwalGuruShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Fetch Teacher Profile and Schedule Items in parallel
      const [teacherRes, scheduleRes] = await Promise.all([
        fetch(`http://localhost:8000/api/teachers/${id}`, { headers }),
        fetch(`http://localhost:8000/api/teachers/${id}/schedules`, { headers })
      ]);

      if (teacherRes.ok) {
        const teacherData = await teacherRes.json();
        setTeacher(teacherData.data || teacherData);
      } else {
        throw new Error('Gagal memuat data guru');
      }

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setSchedules(scheduleData); // Assuming simple list of items
      } else {
        console.warn('Gagal memuat jadwal guru or empty');
        setSchedules([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Terjadi kesalahan saat memuat data');
      navigate('/waka/jadwal-guru');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Memuat jadwal guru...</div>
      </div>
    );
  }

  if (!teacher) return null;

  // Group items by day
  const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
  const groupedSchedules = schedules.reduce((acc, item) => {
    const day = item.daily_schedule?.day || item.day || 'Unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  // Sort days
  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => (dayOrder[a] || 8) - (dayOrder[b] || 8));

  return (
    <div className="jadwal-guru-show-root">
      <NavbarWaka />

      <div className="page-offset">
        {/* BREADCRUMB */}
        <div className="jadwal-guru-show-breadcrumb">
          <Link to="/waka/jadwal-guru" className="jadwal-guru-show-breadcrumb-link">
            <FaChalkboardTeacher />
            <span>Jadwal Guru</span>
          </Link>
          <span className="mx-2">/</span>
          <span>{teacher.user?.name || teacher.nama_guru}</span>
        </div>

        {/* HEADER */}
        <div className="jadwal-guru-show-header">
          <div>
            <h1 className="text-2xl font-bold">{teacher.user?.name || teacher.nama_guru}</h1>
            <p className="text-gray-600">
              {teacher.kode_guru} - {teacher.nip || 'NIP Tidak Ada'}
            </p>
            <div className="mt-2 text-sm text-gray-500 flex gap-4">
              <span className="flex items-center gap-1"><FaEnvelope /> {teacher.user?.email || '-'}</span>
              <span className="flex items-center gap-1"><FaPhone /> {teacher.no_hp || '-'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
            >
              <FaPrint /> Cetak Jadwal
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {sortedDays.map((day) => (
            <div key={day} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-lg text-gray-800 uppercase">
                {day}
              </div>
              <div className="divide-y divide-gray-100">
                {groupedSchedules[day].length > 0 ? (
                  groupedSchedules[day].sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold text-gray-800">
                          {item.daily_schedule?.class_schedule?.class?.name || item.class_name || 'Unknown Class'}
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          {item.room || '-'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {item.subject?.name || 'Unknown Subject'}
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
              <p className="text-gray-500">Guru ini belum memiliki jadwal mengajar.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default JadwalGuruShow;