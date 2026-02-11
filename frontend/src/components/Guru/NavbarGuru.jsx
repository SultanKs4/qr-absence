import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import './NavbarGuru.css';  // pastikan nama CSS sesuai
import logo from '../../assets/logo.png';  // PERBAIKAN PENTING: path gambar

function NavbarGuru() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      authService.logout();
      navigate('/login');
    }
  };
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Logo SMK" className="logo" />
        <span className="school-name">SMKN 2 SINGOSARI</span>
      </div>

      <div className="nav-right">
        {/* Sementara arahkan ke dashboard Guru */}
        <NavLink to="/guru/dashboard" activeClassName="active">
          Beranda
        </NavLink>
        <NavLink to="/guru/jadwal" activeClassName="active">
          Jadwal
        </NavLink>
        <NavLink to="/guru/presensi" activeClassName="active">
        Kehadiran Siswa
        </NavLink>
        
        <button onClick={handleLogout} className="btn-logoutt">
          <span>Keluar</span>
        </button>
      </div>
    </nav>
  );
}

export default NavbarGuru;