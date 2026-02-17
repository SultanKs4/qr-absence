import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Konfigurasi untuk setiap role
  const roleConfig = {
    'admin': { 
      title: 'Admin',
      showWelcome: true,
      fields: [
        { name: 'identifier', label: 'Nama Pengguna', placeholder: 'Masukkan username', type: 'text' },
        { name: 'password', label: 'Kata Sandi', placeholder: 'Masukkan kata sandi', type: 'password' }
      ],
      dashboard: '/admin/dashboard'
    },
    'waka': { 
      title: 'Waka',
      showWelcome: true,
      fields: [
        { name: 'identifier', label: 'Kode Guru', placeholder: 'Masukkan kode guru', type: 'text' },
        { name: 'password', label: 'Kata Sandi', placeholder: 'Masukkan kata sandi', type: 'password' }
      ],
      dashboard: '/waka/dashboard'
    },
    'peserta-didik': { 
      title: 'Peserta Didik',
      showWelcome: true,
      fields: [
        { name: 'identifier', label: 'NISN', placeholder: 'Masukkan NISN', type: 'text' }
      ],
      dashboard: '/siswa/dashboard'
    },
    'guru': { 
      title: 'Guru',
      showWelcome: true,
      fields: [
        { name: 'identifier', label: 'Kode Guru', placeholder: 'Masukkan kode guru', type: 'text' },
        { name: 'password', label: 'Kata Sandi', placeholder: 'Masukkan password', type: 'password' }
      ],
      dashboard: '/guru/dashboard'
    },
    'wali-kelas': { 
      title: 'Wali Kelas',
      showWelcome: true,
      fields: [
        { name: 'identifier', label: 'Kode Guru', placeholder: 'Masukkan kode guru', type: 'text' },
        { name: 'password', label: 'Kata Sandi', placeholder: 'Masukkan password', type: 'password' }
      ],
      dashboard: '/walikelas/dashboard'
    },
    'pengurus-kelas': { 
      title: 'Pengurus Kelas',
      showWelcome: true,
      fields: [
        { name: 'identifier', label: 'NISN', placeholder: 'Masukkan NISN', type: 'text' }
      ],
      dashboard: '/pengurus-kelas/dashboard'
    }
  };

  const config = roleConfig[role] || roleConfig['admin'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    

    // Validasi field kosong
    const emptyFields = config.fields.filter(field => !formData[field.name]);
    if (emptyFields.length > 0) {
      setError('Mohon isi semua field!');
      return;
    }

    try {
      setLoading(true);

      // Define API Base URL
      const baseURL = import.meta.env.VITE_API_URL;
      const API_BASE_URL = baseURL ? baseURL : 'http://localhost:8000/api';

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          login: formData.identifier, // Map identifier to login
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      // Simpan token dan data user ke localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Navigate ke dashboard sesuai role yang dikembalikan backend
      // Backend returns role logic, but purely navigating based on requested role is safer for now if compatible
      // Or better yet, allow the user to navigate to the role they selected if successful
      navigate(config.dashboard);

    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleInputChange = (fieldName, value) => {
    setFormData({...formData, [fieldName]: value});
    setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-container">
      {/* Header diluar box */}
      {config.showWelcome && (
        <div className="login-header">
          <h1 className="welcome-title">Selamat Datang</h1>
          <h1 className="welcome-subtitle">di Presensi Pembelajaran Digital</h1>
        </div>
      )}

      {/* Box form */}
      <div className="login-box">
        {/* Role Title */}
        <h3 className="role-title">{config.title}</h3>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Tampilkan error jika ada */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {config.fields.map((field, index) => (
            <div key={index} className="form-group">
              <label className="form-label">{field.label}</label>
              <div className="input-wrapper">
                <input 
                  type={field.type === 'password' && showPassword ? 'text' : field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="form-input"
                  disabled={loading}
                  required
                />
                {/* Toggle password visibility hanya untuk field password */}
                {field.type === 'password' && (
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      // Eye slash icon (hide)
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      // Eye icon (show)
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className="button-group">
            <button 
              type="button" 
              onClick={handleBack} 
              className="back-button"
              disabled={loading}
            >
              Kembali
            </button>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;