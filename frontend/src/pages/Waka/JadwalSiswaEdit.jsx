import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './JadwalSiswaEdit.css';
import NavbarWaka from '../../components/Waka/NavbarWaka';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';

function JadwalSiswaEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [headerData, setHeaderData] = useState({
    class_id: '',
    year: '2024/2025',
    semester: '1',
    is_active: true,
  });

  const [days, setDays] = useState([]);

  // Master Data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (id && initialLoading === false) {
      fetchExistingSchedule();
    }
  }, [id, initialLoading]);

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [classRes, subjectRes, teacherRes] = await Promise.all([
        fetch('http://localhost:8000/api/classes', { headers }),
        fetch('http://localhost:8000/api/subjects', { headers }),
        fetch('http://localhost:8000/api/teachers', { headers })
      ]);

      if (classRes.ok && subjectRes.ok && teacherRes.ok) {
        const classData = await classRes.json();
        const subjectData = await subjectRes.json();
        const teacherData = await teacherRes.json();

        setClasses(classData.data || classData);
        setSubjects(subjectData.data || subjectData);
        setTeachers(teacherData.data || teacherData);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchExistingSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/schedules/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        setHeaderData({
          class_id: data.class_id,
          year: data.year,
          semester: data.semester,
          is_active: data.is_active,
        });

        // Map existing daily schedules and items
        const mappedDays = data.daily_schedules.map(day => ({
          day: day.day,
          items: day.schedule_items.map(item => ({
            subject_id: item.subject_id,
            teacher_id: item.teacher_id,
            start_time: item.start_time?.substring(0, 5), // HH:mm
            end_time: item.end_time?.substring(0, 5),
            room: item.room || ''
          }))
        }));

        setDays(mappedDays);

      } else {
        alert('Gagal memuat data jadwal');
        navigate('/waka/jadwal-siswa');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHeaderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addDay = () => {
    setDays([...days, { day: 'Monday', items: [] }]);
  };

  const removeDay = (index) => {
    if (!window.confirm('Hapus hari ini beserta isinya?')) return;
    const newDays = [...days];
    newDays.splice(index, 1);
    setDays(newDays);
  };

  const updateDayId = (index, value) => {
    const newDays = [...days];
    newDays[index].day = value;
    setDays(newDays);
  }

  const addItem = (dayIndex) => {
    const newDays = [...days];
    newDays[dayIndex].items.push({
      subject_id: '',
      teacher_id: '',
      start_time: '07:00',
      end_time: '08:00',
      room: ''
    });
    setDays(newDays);
  };

  const removeItem = (dayIndex, itemIndex) => {
    const newDays = [...days];
    newDays[dayIndex].items.splice(itemIndex, 1);
    setDays(newDays);
  };

  const updateItem = (dayIndex, itemIndex, field, value) => {
    const newDays = [...days];
    newDays[dayIndex].items[itemIndex][field] = value;
    setDays(newDays);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headerData.class_id) {
      alert('Pilih kelas terlebih dahulu');
      return;
    }

    setLoading(true);

    const payload = {
      ...headerData,
      days: days
    };

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode
        ? `http://localhost:8000/api/schedules/${id}`
        : 'http://localhost:8000/api/schedules';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`Jadwal berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}`);
        navigate('/waka/jadwal-siswa');
      } else {
        const errorData = await response.json();
        console.error('Submission error:', errorData);
        alert('Gagal menyimpan jadwal: ' + (errorData.message || 'Validation error'));
      }
    } catch (error) {
      console.error('Error submitting schedule:', error);
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-4 text-center">Memuat data master...</div>;
  }

  return (
    <div className="jadwal-siswa-edit-container">
      <NavbarWaka />

      <div className="page-offset">
        <div className="jadwal-siswa-edit-header">
          <div>
            <h1 className="jadwal-siswa-edit-title">
              {isEditMode ? 'Edit Jadwal Kelas' : 'Buat Jadwal Kelas Baru'}
            </h1>
          </div>
          <Link to="/waka/jadwal-siswa" className="jadwal-siswa-edit-back">
            <FaArrowLeft /> Kembali
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="jadwal-form">
          {/* Header Section */}
          <div className="card mb-6">
            <div className="grid-cols-2">
              <div className="form-group">
                <label>Kelas</label>
                <select
                  name="class_id"
                  value={headerData.class_id}
                  onChange={handleHeaderChange}
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.grade} {c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tahun Ajaran</label>
                <input
                  type="text"
                  name="year"
                  value={headerData.year}
                  onChange={handleHeaderChange}
                  placeholder="Contoh: 2024/2025"
                />
              </div>

              <div className="form-group">
                <label>Semester</label>
                <select
                  name="semester"
                  value={headerData.semester}
                  onChange={handleHeaderChange}
                >
                  <option value="1">Ganjil</option>
                  <option value="2">Genap</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={headerData.is_active}
                    onChange={handleHeaderChange}
                  />
                  Set sebagai Jadwal Aktif
                </label>
              </div>
            </div>
          </div>

          {/* Days Section */}
          <div className="days-container">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="day-card">
                <div className="day-header">
                  <select
                    value={day.day}
                    onChange={(e) => updateDayId(dayIndex, e.target.value)}
                    className="day-select"
                  >
                    {dayOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeDay(dayIndex)} className="btn-delete-light">
                    <FaTrash /> Hapus Hari
                  </button>
                </div>

                <div className="items-list">
                  {day.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="item-row">
                      <div className="item-field item-time">
                        <input
                          type="time"
                          value={item.start_time}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'start_time', e.target.value)}
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={item.end_time}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'end_time', e.target.value)}
                        />
                      </div>

                      <div className="item-field item-subject">
                        <select
                          value={item.subject_id}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'subject_id', e.target.value)}
                          required
                        >
                          <option value="">Pilih Mapel</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>

                      <div className="item-field item-teacher">
                        <select
                          value={item.teacher_id}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'teacher_id', e.target.value)}
                          required
                        >
                          <option value="">Pilih Guru</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.user?.name || t.kode_guru}</option>
                          ))}
                        </select>
                      </div>

                      <div className="item-field item-room">
                        <input
                          type="text"
                          placeholder="Ruang"
                          value={item.room}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'room', e.target.value)}
                          style={{ width: '80px' }}
                        />
                      </div>

                      <button type="button" onClick={() => removeItem(dayIndex, itemIndex)} className="btn-icon-delete">
                        <FaTrash />
                      </button>
                    </div>
                  ))}

                  <button type="button" onClick={() => addItem(dayIndex)} className="btn-add-item">
                    <FaPlus /> Tambah Pelajaran
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" onClick={addDay} className="btn-add-day">
              <FaPlus /> Tambah Hari
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              <FaSave /> {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default JadwalSiswaEdit;