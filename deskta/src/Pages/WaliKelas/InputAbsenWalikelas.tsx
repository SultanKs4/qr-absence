import { useState } from 'react';
import WalikelasLayout from '../../component/Walikelas/layoutwakel';

import CalendarIcon from '../../assets/Icon/calender.png';
import { Modal } from '../../component/Shared/Modal';

interface InputAbsenWalikelasProps {
  user: { name: string; role: string };
  onLogout: () => void;
  currentPage: string;
  onMenuClick: (page: string) => void;
}

interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpha' | 'pulang' | null;
  keterangan?: string;
}

// Icon mata untuk lihat detail
function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Icon X untuk tombol close
function XIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Icon check untuk status hadir
function CheckIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Icon time untuk waktu hadir


export function InputAbsenWalikelas({
  user,
  onLogout,
  currentPage,
  onMenuClick,
}: InputAbsenWalikelasProps) {
  const [selectedKelas] = useState('X Mekatronika 1');
  const [selectedMapel] = useState('Matematika (1-4)');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [siswaList, setSiswaList] = useState<Siswa[]>([
    { id: '1', nisn: '0074182519', nama: 'Laura Lavida Loca', status: null },
    { id: '2', nisn: '0074320819', nama: 'Lely Sagita', status: null },
    { id: '3', nisn: '0078658367', nama: 'Maya Melinda', status: null },
    { id: '4', nisn: '0079292238', nama: 'Moch Abyl Gustian', status: null },
    { id: '5', nisn: '0084421457', nama: 'Muhammad Aminullah', status: null },
    { id: '6', nisn: '0089104721', nama: 'Muhammad Azka Fadli Attaya', status: null },
  ]);

  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStatusChange = (id: string, status: Siswa['status']) => {
    setSiswaList(siswaList.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  // DIBALIK: SEKARANG HANYA UNTUK LIHAT DETAIL
  const handleStatusClick = (siswa: Siswa, e: React.MouseEvent) => {
    e.stopPropagation();
    if (siswa.status === null) return;
    
    setSelectedSiswa(siswa);
    setIsModalOpen(true);
  };

  const handleSimpan = () => {
    const siswaWithStatus = siswaList.filter((s) => s.status !== null);
    if (siswaWithStatus.length === 0) {
      alert('Pilih status untuk minimal satu siswa!');
      return;
    }
    alert(`Data kehadiran berhasil disimpan untuk ${siswaWithStatus.length} siswa!`);
    onMenuClick('Beranda');
  };

  // Warna sesuai permintaan
  const statusColors = {
    hadir: '#1FA83D',
    izin: '#ACA40D',
    pulang: '#2F85EB',
    alpha: '#D90000',
    sakit: '#520C8F',
  };

  // Fungsi untuk mendapatkan teks status
  const getStatusText = (status: string) => {
    switch (status) {
      case "alpha":
        return "Siswa tidak hadir tanpa keterangan";
      case "izin":
        return "Siswa izin dengan keterangan";
      case "sakit":
        return "Siswa sakit dengan surat dokter";
      case "hadir":
        return "Siswa hadir tepat waktu";
      case "pulang":
        return "Siswa pulang lebih awal karena ada kepentingan";
      default:
        return status;
    }
  };

  // Custom Status Renderer - DIBALIK: SEKARANG UNTUK LIHAT DETAIL
  const StatusButton = ({ siswa }: { siswa: Siswa }) => {
    if (!siswa.status) {
      return <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>;
    }

    const statusConfig = {
      hadir: { label: 'Hadir', color: statusColors.hadir, textColor: '#FFFFFF' },
      sakit: { label: 'Sakit', color: statusColors.sakit, textColor: '#FFFFFF' },
      izin: { label: 'Izin', color: statusColors.izin, textColor: '#FFFFFF' },
      alpha: { label: 'Tidak Hadir', color: statusColors.alpha, textColor: '#FFFFFF' },
      pulang: { label: 'Pulang', color: statusColors.pulang, textColor: '#FFFFFF' },
    };

    const config = statusConfig[siswa.status];

    return (
      <div
        onClick={(e) => handleStatusClick(siswa, e)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          minWidth: "100px",
          padding: "8px 14px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 600,
          color: config.textColor,
          backgroundColor: config.color,
          cursor: "pointer",
          transition: "all 0.2s ease",
          border: "none",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          minHeight: "36px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.9";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        }}
      >
        <EyeIcon size={14} />
        <span>{config.label}</span>
      </div>
    );
  };

  // Fungsi helper untuk DetailRow di modal
  function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid #E5E7EB",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <div style={{ fontWeight: 600, color: "#374151" }}>{label} :</div>
        </div>
        <div style={{ fontWeight: 500, color: "#1F2937", textAlign: 'right' }}>
          {value}
        </div>
      </div>
    );
  }

  return (
    <>
      <WalikelasLayout
        pageTitle="Masukkan Kehadiran Siswa"
        currentPage={currentPage as any}
        onMenuClick={onMenuClick}
        user={user}
        onLogout={onLogout}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* Top Section: Date & Class Info + Save Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Date Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                padding: '6px 12px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 600,
                width: 'fit-content',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                position: 'relative',
                cursor: 'pointer'
              }}>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <img src={CalendarIcon} alt="Date" style={{ width: 14, height: 14, marginRight: 6, opacity: 0.7 }} />
                {currentDate.split('-').reverse().join('-')}
              </div>

              {/* Class Info Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                minWidth: '240px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '50px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '0 0 0 100%'
                }} />
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: 4, letterSpacing: '-0.025em' }}>{selectedKelas}</div>
                <div style={{ fontSize: '13px', opacity: 0.8, fontWeight: 500 }}>{selectedMapel}</div>
              </div>
            </div>

            {/* Simpan Button */}
            <button
              onClick={handleSimpan}
              style={{
                background: 'linear-gradient(to right, #2563EB, #1D4ED8)',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s ease',
                height: 'fit-content',
                marginBottom: '2px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.3)';
              }}
            >
              Simpan
            </button>
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              border: '1px solid #E5E7EB',
              marginBottom: '24px',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px' }}>No</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px' }}>NISN</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px' }}>Nama Siswa</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px', width: '80px' }}>Hadir</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px', width: '80px' }}>Sakit</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px', width: '80px' }}>Izin</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px', width: '90px' }}>Tidak Hadir</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px', width: '80px' }}>Pulang</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px', width: '120px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {siswaList.map((siswa, idx) => (
                    <tr
                      key={siswa.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        transition: 'background-color 0.2s',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F3F4F6'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'; }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>{idx + 1}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '400' }}>{siswa.nisn}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>{siswa.nama}</td>
                      
                      {/* Radio Button Hadir */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="radio" 
                          name={`status-${siswa.id}`} 
                          checked={siswa.status === 'hadir'} 
                          onChange={() => handleStatusChange(siswa.id, 'hadir')} 
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            cursor: 'pointer', 
                            accentColor: statusColors.hadir,
                            border: '2px solid #D1D5DB',
                            borderRadius: '50%',
                          }} 
                        />
                      </td>
                      
                      {/* Radio Button Sakit */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="radio" 
                          name={`status-${siswa.id}`} 
                          checked={siswa.status === 'sakit'} 
                          onChange={() => handleStatusChange(siswa.id, 'sakit')} 
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            cursor: 'pointer', 
                            accentColor: statusColors.sakit,
                            border: '2px solid #D1D5DB',
                            borderRadius: '50%',
                          }} 
                        />
                      </td>
                      
                      {/* Radio Button Izin */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="radio" 
                          name={`status-${siswa.id}`} 
                          checked={siswa.status === 'izin'} 
                          onChange={() => handleStatusChange(siswa.id, 'izin')} 
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            cursor: 'pointer', 
                            accentColor: statusColors.izin,
                            border: '2px solid #D1D5DB',
                            borderRadius: '50%',
                          }} 
                        />
                      </td>
                      
                      {/* Radio Button Tidak Hadir (Alpha) */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="radio" 
                          name={`status-${siswa.id}`} 
                          checked={siswa.status === 'alpha'} 
                          onChange={() => handleStatusChange(siswa.id, 'alpha')} 
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            cursor: 'pointer', 
                            accentColor: statusColors.alpha,
                            border: '2px solid #D1D5DB',
                            borderRadius: '50%',
                          }} 
                        />
                      </td>
                      
                      {/* Radio Button Pulang */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="radio" 
                          name={`status-${siswa.id}`} 
                          checked={siswa.status === 'pulang'} 
                          onChange={() => handleStatusChange(siswa.id, 'pulang')} 
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            cursor: 'pointer', 
                            accentColor: statusColors.pulang,
                            border: '2px solid #D1D5DB',
                            borderRadius: '50%',
                          }} 
                        />
                      </td>
                      
                      {/* Kolom Status */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <StatusButton siswa={siswa} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </WalikelasLayout>

      {/* Modal Detail Status */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedSiswa && selectedSiswa.status && (
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Header Modal */}
            <div style={{
              backgroundColor: "#0B2948",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#FFFFFF",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <EyeIcon size={24} />
                <h3 style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                }}>
                  Detail Kehadiran
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <XIcon size={24} />
              </button>
            </div>

            {/* Content Modal */}
            <div style={{ 
              padding: 24,
              overflowY: "auto",
              flex: 1,
            }}>
              {/* Row Nama Siswa */}
              <DetailRow label="Nama Siswa" value={selectedSiswa.nama} />
              
              {/* Row NISN */}
              <DetailRow label="NISN" value={selectedSiswa.nisn} />

              {/* Row Tanggal */}
              <DetailRow 
                label="Tanggal" 
                value={currentDate.split('-').reverse().join('-')} 
              />

              {/* Row Kelas */}
              <DetailRow label="Kelas" value={selectedKelas} />

              {/* Row Mata Pelajaran */}
              <DetailRow label="Mata Pelajaran" value={selectedMapel} />

              {/* Status Display */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
                paddingBottom: 12,
                borderBottom: "1px solid #E5E7EB",
              }}>
                <div style={{ fontWeight: 600, color: "#374151", display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedSiswa.status === 'hadir' && <CheckIcon size={18} color="#1FA83D" />}
                  Status :
                </div>
                <div>
                  <span style={{
                    backgroundColor: statusColors[selectedSiswa.status],
                    color: "#FFFFFF",
                    padding: "4px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {selectedSiswa.status === 'alpha' ? 'Tidak Hadir' : 
                     selectedSiswa.status === 'pulang' ? 'Pulang' : 
                     selectedSiswa.status.charAt(0).toUpperCase() + selectedSiswa.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div style={{
                backgroundColor: selectedSiswa.status === 'hadir' ? '#F0FDF4' : 
                                selectedSiswa.status === 'pulang' ? '#EFF6FF' : '#FEF3C7',
                border: `1px solid ${selectedSiswa.status === 'hadir' ? '#BBF7D0' : 
                         selectedSiswa.status === 'pulang' ? '#BFDBFE' : '#FDE68A'}`,
                borderRadius: 8,
                padding: 16,
                textAlign: "center",
                marginBottom: 24,
              }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: selectedSiswa.status === 'hadir' ? '#166534' : 
                         selectedSiswa.status === 'pulang' ? '#1E40AF' : '#92400E',
                }}>
                  {getStatusText(selectedSiswa.status)}
                </div>
              </div>

              {/* Keterangan untuk semua status yang memiliki keterangan */}
              {selectedSiswa.keterangan && (
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 12,
                  }}>
                    Keterangan :
                  </div>
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: "#F9FAFB",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#6B7280",
                      lineHeight: 1.5,
                    }}>
                      {selectedSiswa.keterangan}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div style={{
                display: "flex",
                gap: "12px",
                marginTop: 24,
              }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: statusColors[selectedSiswa.status] || "#2563EB",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}