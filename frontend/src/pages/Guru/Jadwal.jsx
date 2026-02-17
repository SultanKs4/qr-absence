import React, { useState, useEffect } from 'react';
import './Jadwal.css';
import NavbarGuru from '../../components/Guru/NavbarGuru';
import { FaUser, FaIdCard, FaChalkboardTeacher, FaCalendarAlt, FaClock } from 'react-icons/fa';

const Jadwal = () => {
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      const [meRes, scheduleRes] = await Promise.all([
        fetch('http://localhost:8000/api/me', { headers }),
        fetch('http://localhost:8000/api/me/schedules', { headers })
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        // The /me endpoint usually returns the user object, which might have teacherProfile loaded or we need to access it
        // Phase 2 implementation of AuthController::me returns user with relationships.
        setProfile(meData.data || meData);
      }

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setSchedules(scheduleData.items || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Memuat jadwal...</div>;
  }

  // Group items by day
  const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
  const groupedSchedules = schedules.reduce((acc, item) => {
    const day = item.day || 'Unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => (dayOrder[a] || 8) - (dayOrder[b] || 8));

  return (
    <div className="jadwal-container">
      <NavbarGuru />

      <div className="jadwal-wrapper">
        <div className="md:flex gap-6 p-6">
          {/* Sidebar Profile */}
          <div className="md:w-1/4 mb-6 md:mb-0">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-500">
                <FaUser size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{profile?.name}</h2>
              <p className="text-gray-500 mb-4">{profile?.email}</p>

              <div className="text-left border-t border-gray-100 pt-4 mt-4">
                <div className="mb-2 flex items-center gap-2 text-gray-600">
                  <FaIdCard />
                  <span className="font-semibold">NIP:</span>
                  {profile?.teacher_profile?.nip || '-'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaChalkboardTeacher />
                  <span className="font-semibold">Kode:</span>
                  {profile?.teacher_profile?.kode_guru || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <FaCalendarAlt className="text-blue-600 text-xl" />
                <h1 className="text-2xl font-bold text-gray-800">Jadwal Mengajar Saya</h1>
              </div>

              <div className="space-y-6">
                {sortedDays.map(day => (
                  <div key={day} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 uppercase border-b">
                      {day}
                    </div>
                    <div className="divide-y">
                      {groupedSchedules[day].sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item, idx) => (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50">
                          <div className="mb-2 sm:mb-0">
                            <div className="font-semibold text-lg text-gray-800">{item.class}</div>
                            <div className="text-gray-600">{item.subject}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-blue-600 font-medium justify-end">
                              <FaClock />
                              {item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}
                            </div>
                            <div className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                              Ruang: {item.room || '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {sortedDays.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    Belum ada jadwal mengajar yang aktif.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jadwal;