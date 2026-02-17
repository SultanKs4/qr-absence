import { useState, useEffect } from 'react';
import StaffLayout from '../../component/WakaStaff/StaffLayout';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  BookOpen, 
  MapPin,
  Calendar
} from 'lucide-react';
import { masterService } from '../../services/masterService';
import { scheduleService } from '../../services/scheduleService';
import { teacherService } from '../../services/teacherService';

interface JadwalHeader {
  class_id: string;
  year: string;
  semester: string;
  is_active: boolean;
}

interface ScheduleItemDraft {
  subject_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  room: string;
}

interface ScheduleDay {
  day: string;
  items: ScheduleItemDraft[];
}

const DAY_OPTIONS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const SEMESTER_OPTIONS = [
  { label: 'Ganjil', value: '1' },
  { label: 'Genap', value: '2' }
];

export default function JadwalSiswaEdit({ user, onLogout, onMenuClick, id }: any) {
  const isEditMode = !!id;

  const [headerData, setHeaderData] = useState<JadwalHeader>({
    class_id: '',
    year: '2024/2025',
    semester: '1',
    is_active: true,
  });

  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (id && !initialLoading) {
      fetchExistingSchedule();
    }
  }, [id, initialLoading]);

  const fetchMasterData = async () => {
    try {
      const [classRes, subjectRes, teacherRes] = await Promise.all([
        masterService.getClasses(),
        masterService.getSubjects(),
        teacherService.getTeachers()
      ]);

      setClasses(classRes.data || classRes);
      setSubjects(subjectRes.data || subjectRes);
      setTeachers(teacherRes.data || teacherRes);
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchExistingSchedule = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getSchedule(id);

      setHeaderData({
        class_id: data.class_id,
        year: data.year,
        semester: data.semester,
        is_active: data.is_active,
      });

      // Map existing daily schedules and items
      const mappedDays = data.daily_schedules.map((day: any) => ({
        day: day.day,
        items: day.schedule_items.map((item: any) => ({
          subject_id: item.subject_id,
          teacher_id: item.teacher_id,
          start_time: item.start_time?.substring(0, 5),
          end_time: item.end_time?.substring(0, 5),
          room: item.room || ''
        }))
      }));

      setDays(mappedDays);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setHeaderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addDay = () => {
    setDays([...days, { day: 'Monday', items: [] }]);
  };

  const removeDay = (index: number) => {
    if (!window.confirm('Hapus hari ini beserta isinya?')) return;
    const newDays = [...days];
    newDays.splice(index, 1);
    setDays(newDays);
  };

  const updateDayId = (index: number, value: string) => {
    const newDays = [...days];
    newDays[index].day = value;
    setDays(newDays);
  }

  const addItem = (dayIndex: number) => {
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

  const removeItem = (dayIndex: number, itemIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].items.splice(itemIndex, 1);
    setDays(newDays);
  };

  const updateItem = (dayIndex: number, itemIndex: number, field: keyof ScheduleItemDraft, value: string) => {
    const newDays = [...days];
    newDays[dayIndex].items[itemIndex][field] = value;
    setDays(newDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (isEditMode) {
        await scheduleService.updateSchedule(id, payload);
      } else {
        await scheduleService.createSchedule(payload);
      }
      alert(`Jadwal berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}`);
      onMenuClick('jadwal-kelas');
    } catch (error) {
      console.error('Error submitting schedule:', error);
      alert('Gagal menyimpan jadwal');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <StaffLayout pageTitle="Loading..." currentPage="jadwal-kelas" onMenuClick={onMenuClick} user={user} onLogout={onLogout}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout 
      pageTitle={isEditMode ? 'Edit Jadwal' : 'Buat Jadwal Baru'} 
      currentPage="jadwal-kelas" 
      onMenuClick={onMenuClick} 
      user={user} 
      onLogout={onLogout}
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            type="button"
            onClick={() => onMenuClick('jadwal-kelas')}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft size={20} /> Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="text-emerald-600" size={20} /> Informasi Dasar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kelas</label>
                <select
                  name="class_id"
                  value={headerData.class_id}
                  onChange={handleHeaderChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.grade} {c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                <input
                  type="text"
                  name="year"
                  value={headerData.year}
                  onChange={handleHeaderChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="2024/2025"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                <select
                  name="semester"
                  value={headerData.semester}
                  onChange={handleHeaderChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  {SEMESTER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={headerData.is_active}
                    onChange={handleHeaderChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-sm font-bold text-slate-700 select-none">Jadwal Aktif</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md animate-fadeIn">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Calendar size={18} />
                    </span>
                    <select
                      value={day.day}
                      onChange={(e) => updateDayId(dayIndex, e.target.value)}
                      className="bg-transparent font-bold text-slate-800 outline-none focus:text-emerald-600 cursor-pointer text-lg"
                    >
                      {DAY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeDay(dayIndex)}
                    className="text-slate-400 hover:text-rose-500 transition-all p-2 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {day.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex flex-wrap items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-emerald-200 hover:bg-emerald-50/30">
                      <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-xl">
                        <Clock size={16} className="text-slate-400" />
                        <input
                          type="time"
                          value={item.start_time}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'start_time', e.target.value)}
                          className="w-20 bg-transparent border-none outline-none text-sm font-medium text-slate-700"
                        />
                        <span className="text-slate-300 font-bold">-</span>
                        <input
                          type="time"
                          value={item.end_time}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'end_time', e.target.value)}
                          className="w-20 bg-transparent border-none outline-none text-sm font-medium text-slate-700"
                        />
                      </div>

                      <div className="flex-1 min-w-[200px] space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1 ml-1">
                           <BookOpen size={12} /> Mata Pelajaran
                        </div>
                        <select
                          value={item.subject_id}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'subject_id', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all cursor-pointer"
                          required
                        >
                          <option value="">Pilih Mapel</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 min-w-[200px] space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1 ml-1">
                           <User size={12} /> Guru Pengajar
                        </div>
                        <select
                          value={item.teacher_id}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'teacher_id', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all cursor-pointer"
                          required
                        >
                          <option value="">Pilih Guru</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.user?.name || t.kode_guru}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-32 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1 ml-1">
                           <MapPin size={12} /> Ruangan
                        </div>
                        <input
                          type="text"
                          placeholder="Ex: A1"
                          value={item.room}
                          onChange={(e) => updateItem(dayIndex, itemIndex, 'room', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        />
                      </div>

                      <button 
                        type="button" 
                        onClick={() => removeItem(dayIndex, itemIndex)}
                        className="p-2.5 text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-xl mt-5"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    onClick={() => addItem(dayIndex)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2 text-sm font-bold mt-2"
                  >
                    <Plus size={18} /> Tambah Jam Pelajaran
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 pb-12">
            <button 
              type="button" 
              onClick={addDay}
              className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" /> Tambah Hari
            </button>
            
            <button 
              type="submit" 
              className="flex items-center gap-3 bg-emerald-600 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:shadow-none active:scale-95"
              disabled={loading}
            >
              <Save size={22} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </StaffLayout>
  );
}
