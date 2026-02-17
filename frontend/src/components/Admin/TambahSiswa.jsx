// Tambah.jsx
import React, { useState, useEffect } from 'react';
import './TambahSiswa.css';

function Tambah({ isOpen, onClose, onSubmit, editData }) {
  const [formData, setFormData] = useState({
    namaSiswa: '',
    nisn: '',
    jurusan: '',
    kelas: ''
  });

  // Data jurusan dan kelas yang sesuai
  const jurusanKelasData = {
    'RPL': ['X RPL 1', 'X RPL 2', 'XI RPL 1', 'XI RPL 2', 'XII RPL 1', 'XII RPL 2'],
    'TKJ': ['X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2'],
    'DKV': ['X DKV 1', 'X DKV 2', 'XI DKV 1', 'XI DKV 2', 'XII DKV 1', 'XII DKV 2'],
    'AV': ['X AV 1', 'X AV 2', 'XI AV 1', 'XI AV 2', 'XII AV 1', 'XII AV 2'],
    'MT': ['X MT 1', 'X MT 2', 'XI MT 1', 'XI MT 2', 'XII MT 1', 'XII MT 2'],
    'BC': ['X BC 1', 'X BC 2', 'XI BC 1', 'XI BC 2', 'XII BC 1', 'XII BC 2'],
    'AN': ['X AN 1', 'X AN 2', 'XI AN 1', 'XI AN 2', 'XII AN 1', 'XII AN 2'],
    'EI': ['X EI 1', 'X EI 2', 'XI EI 1', 'XI EI 2', 'XII EI 1', 'XII EI 2']
  };

  // Dapatkan daftar kelas berdasarkan jurusan yang dipilih
  const availableKelas = formData.jurusan ? jurusanKelasData[formData.jurusan] : [];

  // Auto isi saat edit
  useEffect(() => {
    if (editData) {
      setFormData({
        namaSiswa: editData.nama,
        nisn: editData.nisn,
        jurusan: editData.jurusan,
        kelas: editData.kelas
      });
    } else {
      setFormData({ namaSiswa: '', nisn: '', jurusan: '', kelas: '' });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Jika yang diubah adalah jurusan, reset pilihan kelas
    if (name === 'jurusan') {
      setFormData({
        ...formData,
        jurusan: value,
        kelas: '' // Reset kelas ketika jurusan berubah
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);   // kirim data balik ke DataSiswa.jsx
    setFormData({ namaSiswa: '', nisn: '', jurusan: '', kelas: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title" style={{ fontFamily: 'Poppins, sans-serif', color: 'whitesmoke' }}>
          {editData ? "Ubah Data Siswa" : "Tambah Siswa"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nama Siswa</label>
            <input
              type="text"
              name="namaSiswa"
              placeholder="Masukkan nama siswa..."
              value={formData.namaSiswa}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>NISN</label>
            <input
              type="text"
              name="nisn"
              placeholder="Masukkan NISN siswa..."
              value={formData.nisn}
              onChange={handleChange}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) e.preventDefault();
              }}
              required
            />
          </div>

          <div className="input-group">
            <label>Konsentrasi Keahlian</label>
            <select
              name="jurusan"
              value={formData.jurusan}
              onChange={handleChange}
              required
            >
              <option value="">Pilih Konsentrasi Keahlian...</option>
              <option value="RPL">RPL</option>
              <option value="TKJ">TKJ</option>
              <option value="DKV">DKV</option>
              <option value="AV">AV</option>
              <option value="MT">MT</option>
              <option value="BC">BC</option>
              <option value="AN">AN</option>
              <option value="EI">EI</option>
            </select>
          </div>

          <div className="input-group">
            <label>Kelas</label>
            <select
              name="kelas"
              value={formData.kelas}
              onChange={handleChange}
              disabled={!formData.jurusan}
              required
            >
              <option value="">
                {formData.jurusan ? 'Pilih Kelas...' : 'Pilih Konsentrasi Keahlian Terlebih Dahulu'}
              </option>
              {availableKelas.map((kelas, index) => (
                <option key={index} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>

          <div className="form-buttons">
            <button type="button" className="btn-batal" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-submit">
              {editData ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Tambah;