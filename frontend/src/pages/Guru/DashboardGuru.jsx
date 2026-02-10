import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaClock,
  FaCalendarAlt,
  FaBook,
  FaCheckCircle,
  FaChevronRight,
  FaArrowRight,
  FaBell,
  FaInfoCircle
} from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';
import CustomAlert from '../../components/Common/CustomAlert';
import apiClient from '../../services/api';
import DummyJadwal from '../../assets/images/DummyJadwal.png';
import { STORAGE_BASE_URL } from '../../utils/constants';
import PageWrapper from '../../components/ui/PageWrapper';

function DashboardGuru() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  /* userProfile removed */
  const [allJadwal, setAllJadwal] = useState([]);
  const [completedAbsensi, setCompletedAbsensi] = useState(new Set());
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [qrVerified, setQrVerified] = useState(false);
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [jadwalImage, setJadwalImage] = useState(null);
  const [alertState, setAlertState] = useState({ show: false, type: 'confirm', title: '', message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load profile and schedule data
  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) { /* setUserProfile removed */ }

        const response = await apiClient.get('/guru/dashboard', { signal: controller.signal });
        const { schedules, attendance_settings } = response.data;

        setAllJadwal(schedules || []);
        /* if (profile) setUserProfile(profile); */
        if (attendance_settings?.schedule_image) {
          setJadwalImage(attendance_settings.schedule_image);
        }

        const completed = schedules
          .filter(s => s.is_completed)
          .map(s => s.id);
        setCompletedAbsensi(new Set(completed));
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching guru dashboard:", error);
          setError("Gagal memuat data dashboard. Silakan coba lagi.");
          setAllJadwal([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();

    return () => controller.abort();
  }, []);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    }, 1000);
    return () => {
      clearInterval(timer);
      // Ensure any scanner is cleared on unmount
      if (window.scannerInstance) {
        window.scannerInstance.clear().catch(console.error);
      }
    };
  }, []);

  /* handleLogoutClick removed */

  const handleConfirmLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    sessionStorage.clear();
    navigate('/login');
  };

  const handleIconClick = (jadwal) => {
    if (completedAbsensi.has(jadwal.id)) {
      navigate(`/guru/presensi-siswa/${jadwal.id}`);
      return;
    }
    setSelectedSchedule(jadwal);
    setQrVerified(false);

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      });
      window.scannerInstance = scanner;
      scanner.render(() => {
        scanner.clear();
        setQrVerified(true);
        window.scannerInstance = null;
      }, () => { });
    }, 100);
  };

  const handleCloseScanner = () => {
    if (window.scannerInstance) {
      window.scannerInstance.clear().catch(console.error);
      window.scannerInstance = null;
    }
    setSelectedSchedule(null);
  };

  return (
    <PageWrapper className="flex min-h-[calc(100vh-80px)] bg-transparent font-sans">

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="p-6 md:p-10 lg:p-12 max-w-[1400px] mx-auto space-y-10">

          {/* HEADER SECTION */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-white/50">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-1.5 bg-blue-600 rounded-full"></span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">Portal Guru</h1>
              </div>
              <p className="text-gray-500 font-medium ml-11">Selamat datang kembali, mari kelola presensi hari ini.</p>
            </div>

            <div className="flex items-center gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-inner ml-auto lg:ml-0">
              <div className="text-right">
                <div className="text-3xl font-black text-blue-600 font-mono tracking-tighter leading-none mb-1">
                  {currentTime || '--:--:--'}
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {currentDate}
                </div>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-gray-100"><FaClock /></div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 h-32 rounded-[2rem]"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
              <FaInfoCircle className="shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard title="Kelas Hari Ini" value={allJadwal.length} icon={<FaBook />} color="emerald" />
              <StatsCard title="Selesai Presensi" value={completedAbsensi.size} icon={<FaCheckCircle />} color="blue" />

              <button
                onClick={() => setShowJadwalModal(true)}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-xl p-8 text-white flex items-center gap-6 hover:scale-[1.02] active:scale-[0.98] transition-all group relative overflow-hidden"
              >
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm group-hover:scale-110 transition-transform relative z-10 shadow-lg">
                  <FaCalendarAlt />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-xl font-black leading-tight tracking-tight uppercase">Jadwal<br />Pelajaran</div>
                  <div className="text-blue-100 text-[9px] mt-2 font-black uppercase tracking-[0.2em] opacity-80">Lihat Detail &rarr;</div>
                </div>
                <FaCalendarAlt size={100} className="absolute -right-4 -bottom-4 text-white opacity-[0.05] transform -rotate-12" />
              </button>
            </div>
          )}

          {/* SCHEDULE SECTION */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 px-4">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase italic">Jadwal Mengajar</h2>
              <div className="h-px flex-1 bg-gray-200"></div>
              <div className="p-2 bg-amber-50 text-amber-500 rounded-full animate-pulse border border-amber-100 shadow-sm">
                <FaBell size={14} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {allJadwal.length > 0 ? (
                allJadwal.map((jadwal) => (
                  <div key={jadwal.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all group relative">
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-8">
                        <div className="bg-blue-50 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-blue-100 shadow-sm">
                          {jadwal.waktu}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-4 border-white shadow-md ${completedAbsensi.has(jadwal.id) ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></div>
                      </div>

                      <div className="space-y-2 mb-10">
                        <h3 className="text-2xl font-black text-gray-800 leading-tight group-hover:text-blue-700 transition-colors">
                          {jadwal.mataPelajaran}
                        </h3>
                        <p className="text-gray-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                          <span className="w-6 h-0.5 bg-blue-500 rounded-full"></span>
                          {jadwal.kelas}
                        </p>
                      </div>

                      <button
                        onClick={() => handleIconClick(jadwal)}
                        className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg
                                ${completedAbsensi.has(jadwal.id)
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                          }`}
                      >
                        {completedAbsensi.has(jadwal.id) ? (
                          <><FaCheckCircle /> Hasil Presensi</>
                        ) : (
                          <><FaQrcode /> Scan QR Siswa</>
                        )}
                      </button>
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[5rem] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white/50 backdrop-blur shadow-inner rounded-[3rem] border-2 border-dashed border-gray-200">
                  <div className="text-gray-300 mb-4 flex justify-center"><FaBook size={60} /></div>
                  <p className="text-gray-500 font-black uppercase tracking-widest text-sm italic">Tidak ada jadwal hari ini</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Jadwal Image */}
      {showJadwalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowJadwalModal(false)}>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase italic">Master Jadwal Pelajaran</h3>
              <button className="text-gray-400 hover:text-red-500 text-4xl leading-none transition-colors" onClick={() => setShowJadwalModal(false)}>&times;</button>
            </div>
            <div className="p-10 flex justify-center bg-gray-100 max-h-[75vh] overflow-auto">
              <img
                src={jadwalImage ? `${STORAGE_BASE_URL}/${jadwalImage}` : DummyJadwal}
                alt="Jadwal Pelajaran"
                className="max-w-full h-auto rounded-[2rem] shadow-2xl border-[12px] border-white"
                onError={(e) => { e.target.src = DummyJadwal; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Scanner */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={handleCloseScanner}>
          <div
            className={`bg-white rounded-[3rem] shadow-2xl w-full ${qrVerified ? 'max-w-xl' : 'max-w-md'} overflow-hidden animate-in fade-in zoom-in duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            {!qrVerified ? (
              <>
                <div className="p-10 bg-white flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight italic flex items-center gap-3">
                      <FaQrcode className="text-blue-600" /> Scan QR Siswa
                    </h3>
                    <button className="text-gray-300 hover:text-gray-600 text-3xl leading-none" onClick={handleCloseScanner}>&times;</button>
                  </div>

                  <div className="w-full bg-gray-900 p-4 rounded-[2rem] shadow-2xl overflow-hidden ring-[12px] ring-blue-500/10">
                    <div id="reader" className="w-full overflow-hidden rounded-2xl"></div>
                  </div>

                  <div className="mt-10 text-center">
                    <p className="text-gray-800 font-black uppercase tracking-widest text-sm mb-2">Arahkan Kamera</p>
                    <p className="text-xs text-gray-400 font-bold max-w-[250px] mx-auto leading-relaxed italic">Presensi akan tercatat otomatis setelah QR Code terverifikasi oleh sistem.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-10 text-white text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner ring-4 ring-white/10">
                    <FaCheckCircle size={48} className="text-emerald-300" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">{selectedSchedule.mataPelajaran}</h2>
                  <div className="inline-block px-6 py-1.5 bg-white/10 rounded-full text-xs font-black backdrop-blur-sm uppercase tracking-[0.3em]">
                    {selectedSchedule.kelas}
                  </div>
                </div>

                <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-center shadow-inner">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Jam Ke</span>
                      <span className="text-lg font-black text-blue-700">{selectedSchedule.jamKe}</span>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-center shadow-inner">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Waktu</span>
                      <span className="text-lg font-black text-gray-800">{selectedSchedule.waktu.split(' ')[0]}</span>
                    </div>
                  </div>

                  <button
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-[0.98] uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    onClick={() => navigate(`/guru/presensi-siswa/${selectedSchedule.id}`)}
                  >
                    Buka Daftar Hadir <FaArrowRight />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <CustomAlert
        isOpen={alertState.show}
        onClose={() => setAlertState({ ...alertState, show: false })}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={handleConfirmLogout}
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
      />
    </PageWrapper>
  );
}

function StatsCard({ title, value, icon, color }) {
  const configs = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50",
    blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50",
  };
  const config = configs[color];

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
      <div className="relative z-10 flex items-center gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all group-hover:scale-110 shadow-lg shrink-0 ${config}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-3xl font-black text-gray-800 tracking-tighter mb-0.5">{value}</h3>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">{title}</p>
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${config.split(' ')[0]}`}></div>
    </div>
  );
}

export default DashboardGuru;