import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import './NavbarSiswa.css';  
import logo from '../../assets/logo.png';  

function NavbarSiswa() {
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
        <NavLink to="/siswa/dashboard" activeClassName="active">
          Beranda
        </NavLink>
        <NavLink to="/siswa/riwayat" activeClassName="active">
          Riwayat Kehadiran
        </NavLink>

        <button onClick={handleLogout} className="btn-logoutt">
          <span>Keluar</span>
        </button>
      </div>
    </nav>
  );
}

export default NavbarSiswa;