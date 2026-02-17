import React, { useState } from 'react';
import { Modal } from './Modal';
import QRCodeIcon from '../../../assets/Icon/qr_code.png';

interface MetodeGuruProps {
  isOpen: boolean;
  onClose: () => void;
  onPilihQR: () => void;
  onPilihManual: () => void;
  onTidakBisaMengajar?: () => void;
  onSubmitDispensasi?: (data: { alasan: string; tanggal?: string; jamMulai?: string; jamSelesai?: string; keterangan?: string; bukti?: File; }) => void;
}

export function MetodeGuru({
  isOpen,
  onClose,
  onPilihQR,
  onPilihManual,
  onSubmitDispensasi,
}: MetodeGuruProps) {
  const [showDispensasi, setShowDispensasi] = useState(false);
  // const [liveMode, setLiveMode] = useState(true);

  // Dispensasi inputs
  const [dispAlasan, setDispAlasan] = useState("");
  const [dispTanggal, setDispTanggal] = useState<string>("");
  const [dispMulai, setDispMulai] = useState<string>("");
  const [dispSelesai, setDispSelesai] = useState<string>("");
  const [dispKeterangan, setDispKeterangan] = useState("");
  const [dispBukti, setDispBukti] = useState<File | null>(null);



  const handleClose = () => {
    onClose();
  };

  const closeDispensasi = () => setShowDispensasi(false);

  const handleDispBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setDispBukti(e.target.files[0]);
  };

  const handleSubmitDispensasi = () => {
    if (!dispAlasan) { alert("Isi alasan terlebih dahulu"); return; }
    const payload = { alasan: dispAlasan, tanggal: dispTanggal, jamMulai: dispMulai, jamSelesai: dispSelesai, keterangan: dispKeterangan, bukti: dispBukti || undefined };
    if (onSubmitDispensasi) onSubmitDispensasi(payload); else alert("Pengajuan dispensasi dikirim ke Waka/Pengurus Kelas untuk validasi.");
    setDispAlasan(""); setDispTanggal(""); setDispMulai(""); setDispSelesai(""); setDispKeterangan(""); setDispBukti(null);
    closeDispensasi();
  };

  // const simpleScanMode = true; // Removed as per new structure

  const handleScan = () => {
    onPilihQR();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 28,
            maxWidth: 420,
            width: "100%",
            margin: "0 auto",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
                margin: 0,
                textAlign: "center"
              }}
            >
              PRESENTASI PEMBELAJARAN DIGITAL
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4, textTransform: 'uppercase', fontWeight: 600 }}>
              KODE QR UNTUK PRESENSI
            </p>
          </div>

          <div
            style={{
              border: "1px dashed #D1D5DB",
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleScan}
          >
            <img
              src={QRCodeIcon}
              alt="Kode QR"
              style={{ width: 200, height: 200, objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onPilihManual}
                style={{
                  border: "1px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: "#1F2937",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                Input Manual
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              style={{
                border: "none",
                background: "#EF4444",
                color: "white",
                padding: "12px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDispensasi} onClose={closeDispensasi}>
        <div style={{
          backgroundColor: '#F3F4F6',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: '0 auto',
          border: '1px solid #E5E7EB',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Background Blob */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            backgroundColor: '#DBEAFE',
            borderRadius: '50%',
            opacity: 0.5,
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header Title */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#1F2937',
                margin: '0 0 8px 0',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                Pengajuan Dispensasi
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Isi form untuk mengajukan dispensasi ke Waka/Pengurus Kelas.
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
              border: '2px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <input
                value={dispAlasan}
                onChange={(e) => setDispAlasan(e.target.value)}
                placeholder="Alasan"
                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #D1D5DB', width: '100%', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <input
                  type="date"
                  value={dispTanggal}
                  onChange={(e) => setDispTanggal(e.target.value)}
                  style={{ padding: '12px', borderRadius: '12px', border: '1px solid #D1D5DB', width: '100%', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="time"
                    value={dispMulai}
                    onChange={(e) => setDispMulai(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #D1D5DB', width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    type="time"
                    value={dispSelesai}
                    onChange={(e) => setDispSelesai(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #D1D5DB', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <textarea
                value={dispKeterangan}
                onChange={(e) => setDispKeterangan(e.target.value)}
                placeholder="Keterangan (opsional)"
                rows={3}
                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #D1D5DB', width: '100%', boxSizing: 'border-box', resize: 'none' }}
              />
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '12px', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Bukti Pendukung (Opsional)</label>
                <input type="file" onChange={handleDispBuktiChange} style={{ fontSize: '12px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSubmitDispensasi} className="btn-3d" style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 5px 0 #1D4ED8'
              }}>
                Kirim
              </button>
              <button onClick={closeDispensasi} className="btn-3d" style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 5px 0 #6B7280'
              }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}