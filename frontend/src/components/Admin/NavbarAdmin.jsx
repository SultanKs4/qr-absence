import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import './NavbarAdmin.css';
import logo from '../../assets/logo.png';

function NavbarAdmin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Konfirmasi logout
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar?');
    
    if (confirmLogout) {
      authService.logout();
      
      // Redirect ke halaman login
      navigate('/login');
      
      // Optional: tampilkan pesan
      alert('Anda telah berhasil logout');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Logo SMK" className="logo" />
        <span className="school-name">SMKN 2 SINGOSARI</span>
      </div>

      <div className="nav-right">
        <NavLink to="/admin/dashboard" activeClassName="active">
          Beranda
        </NavLink>
        <NavLink to="/admin/siswa" activeClassName="active">
          Data Siswa
        </NavLink>
        <NavLink to="/admin/guru" activeClassName="active">
          Data Guru
        </NavLink>
        <NavLink to="/admin/kelas" activeClassName="active">
          Data Kelas
        </NavLink>
        <NavLink to="/admin/jurusan" activeClassName="active">
          Data Konsentrasi Keahlian
        </NavLink>
        
        {/* Button Logout */}
        <button onClick={handleLogout} className="btn-logoutt">
          <i className="fas fa-sign-out-alt"></i>
          <span>Keluar</span>
        </button>
      </div>
    </nav>
  );
}

export default NavbarAdmin;