import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import './NavbarWaka.css';
import logo from '../../assets/logo.png';

function NavbarWaka() {
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
        <NavLink 
          to="/waka/dashboard" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Beranda
        </NavLink>
        <NavLink 
          to="/waka/jadwal-siswa" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Jadwal Siswa
        </NavLink>
        <NavLink 
          to="/waka/jadwal-guru" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Jadwal Guru
        </NavLink>
        <NavLink 
          to="/waka/kehadiran-guru" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Kehadiran Guru
        </NavLink>
        <NavLink 
          to="/waka/kehadiran-siswa" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Kehadiran Siswa
        </NavLink>
        
        <button onClick={handleLogout} className="btn-logoutt">
          <span>Keluar</span>
        </button>
      </div>
    </nav>
  );
}

export default NavbarWaka;