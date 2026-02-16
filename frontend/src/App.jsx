import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Auth/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import Dashboard from './pages/Admin/Dashboard';
import DataSiswa from './pages/Admin/DataSiswa';
import DataGuru from './pages/Admin/DataGuru';
import DataKelas from './pages/Admin/DataKelas';
import DataJurusan from './pages/Admin/DataJurusan';
import ProfileSekolah from './pages/Admin/Profilesekolah';

import DashboardGuru from './pages/Guru/DashboardGuru';
import Jadwal from './pages/Guru/Jadwal';
import PresensiSiswa from './pages/Guru/PresensiSiswa';

import DashboardSiswa from './pages/Siswa/DashboardSiswa';
import Riwayat from './pages/Siswa/Riwayat';

import DashboardKelas from './pages/PengurusKelas/DashboardKelas';
import RiwayatKelas from './pages/PengurusKelas/RiwayatKelas';
import PresensiKelas from './pages/PengurusKelas/PresensiKelas';

import DashboardWakel from './pages/WaliKelas/DashboardWakel';
import Data from './pages/WaliKelas/Data';
import RiwayatKehadiran from './pages/WaliKelas/RiwayatKehadiran';
import JadwalWakel from './pages/WaliKelas/JadwalWakel';
import Presensi from './pages/WaliKelas/Presensi';

import DashboardWaka from './pages/Waka/DashboardWaka';
import JadwalGuruIndex from './pages/Waka/JadwalGuruIndex';
import JadwalGuruShow from './pages/Waka/JadwalGuruShow';
import JadwalGuruEdit from './pages/Waka/JadwalGuruEdit';
import JadwalSiswaIndex from './pages/Waka/JadwalSiswaIndex';
import JadwalSiswaShow from './pages/Waka/JadwalSiswaShow';
import JadwalSiswaEdit from './pages/Waka/JadwalSiswaEdit';
import KehadiranSiswaIndex from './pages/Waka/KehadiranSiswaIndex';
import KehadiranSiswaShow from './pages/Waka/KehadiranSiswaShow';
import KehadiranSiswaRekap from './pages/Waka/KehadiranSiswaRekap';
import KehadiranGuruIndex from './pages/Waka/KehadiranGuruIndex';
import KehadiranGuruShow from './pages/Waka/KehadiranGuruShow';

function App() {
  return (
    <Routes>
      {/* Halaman utama */}
      <Route path="/" element={<LandingPage />} />

      {/* Login dengan parameter role */}
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/siswa" element={<DataSiswa />} />
      <Route path="/admin/guru" element={<DataGuru />} />
      <Route path="/admin/kelas" element={<DataKelas />} />
      <Route path="/admin/jurusan" element={<DataJurusan />} />
      <Route path="/admin/profil-sekolah" element={<ProfileSekolah />} />

      {/* Guru Routes */}
      <Route path="/guru/dashboard" element={<DashboardGuru />} />
      <Route path="/guru/jadwal" element={<Jadwal />} />
      <Route path="/guru/presensi" element={<PresensiSiswa />} />

      {/* Siswa Routes */}
      <Route path="/siswa/dashboard" element={<DashboardSiswa />} />
      <Route path="/siswa/riwayat" element={<Riwayat />} />

      {/* Pengurus Kelas Routes */}
      <Route path="/pengurus-kelas/dashboard" element={<DashboardKelas />} />
      <Route path="/pengurus-kelas/riwayat" element={<RiwayatKelas />} />
      <Route path="/pengurus-kelas/presensi" element={<PresensiKelas />} />

      {/* Wali Kelas Routes */}
      <Route path="/walikelas/dashboard" element={<DashboardWakel />} />
      <Route path="/walikelas/datasiswa" element={<Data />} />
      <Route path="/walikelas/riwayatkehadiran" element={<RiwayatKehadiran />} />
      <Route path="/walikelas/jadwalwakel" element={<JadwalWakel />} />
      <Route path="/walikelas/presensi" element={<Presensi />} />

      {/* Waka Routes */}
      <Route path="/waka/dashboard" element={<DashboardWaka />} />
      <Route path="/waka/jadwal-guru" element={<JadwalGuruIndex />} />
      <Route path="/waka/jadwal-guru/:id" element={<JadwalGuruShow />} />
      <Route path="/waka/jadwal-guru/:id/edit" element={<JadwalGuruEdit />} />
      <Route path="/waka/jadwal-siswa" element={<JadwalSiswaIndex />} />
      <Route path="/waka/jadwal-siswa/create" element={<JadwalSiswaEdit />} /> {/* Reusing Edit component for Create for now, or make a new one */}
      <Route path="/waka/jadwal-siswa/:id" element={<JadwalSiswaShow />} />
      <Route path="/waka/jadwal-siswa/:id/edit" element={<JadwalSiswaEdit />} />
      <Route path="/waka/kehadiran-siswa" element={<KehadiranSiswaIndex />} />
      <Route path="/waka/kehadiran-siswa/rekap" element={<KehadiranSiswaRekap />} />
      <Route path="/waka/kehadiran-siswa/:id" element={<KehadiranSiswaShow />} />
      <Route path="/waka/kehadiran-guru" element={<KehadiranGuruIndex />} />
      <Route path="/waka/kehadiran-guru/:id" element={<KehadiranGuruShow />} />


      {/* Route lain yang nggak ada, balik ke landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;