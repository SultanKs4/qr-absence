import WalikelasLayout from '../../component/Walikelas/layoutwakel';
import DummyJadwal from "../../assets/Icon/DummyJadwal.png";
import { User } from "lucide-react";

interface JadwalPengurusProps {
    user: { name: string; role: string; phone: string };
    currentPage: string;
    onMenuClick: (page: string) => void;
    onLogout: () => void;
    namaKelas?: string;
    waliKelas?: string;
    jadwalImage?: string;
    onBack?: () => void;
}

export default function JadwalPengurus({
    user,
    currentPage,
    onMenuClick,
    onLogout,
    namaKelas,
    waliKelas,
    jadwalImage,
    onBack,
}: JadwalPengurusProps) {
    // Data default jika tidak ada props
    const kelasInfo = {
        namaKelas: namaKelas || "XII RPL 2",
        waliKelas: waliKelas || "Triana Ardiane S.pd",
        jadwalImage: jadwalImage || DummyJadwal
    };

    return (
        <WalikelasLayout
            pageTitle="Jadwal Kelas"
            currentPage={currentPage}
            onMenuClick={onMenuClick}
            user={user}
            onLogout={onLogout}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Tombol Kembali */}
                {onBack && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            onClick={onBack}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: "1px solid #E2E8F0",
                                background: "#FFFFFF",
                                fontWeight: 600,
                                cursor: "pointer",
                                color: "#0B2948",
                            }}
                        >
                            ← Kembali
                        </button>
                    </div>
                )}

                {/* Card Informasi Kelas */}
                <div
                    style={{
                        background: "#0B2948",
                        borderRadius: 20,
                        padding: "22px 28px",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        fontWeight: 700,
                        fontSize: 18,
                    }}
                >
                    <User size={22} />
                    <div>
                        <div>{kelasInfo.namaKelas}</div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            {kelasInfo.waliKelas}
                        </div>
                    </div>
                </div>

                {/* Keterangan */}
                <div style={{ fontSize: 13, color: "#64748B" }}>
                    Jadwal ditampilkan sebagai gambar (PNG / JPG / JPEG).
                </div>

                {/* Jadwal Image */}
                <div style={{ 
                    background: "#FFFFFF", 
                    borderRadius: 14, 
                    padding: 16,
                    border: "1px solid #E2E8F0",
                }}>
                    <img
                        src={kelasInfo.jadwalImage}
                        alt={`Jadwal ${kelasInfo.namaKelas}`}
                        style={{
                            width: "100%",
                            maxWidth: 1200,
                            margin: "0 auto",
                            display: "block",
                        }}
                    />
                </div>

                {/* Tombol Download/View Full */}
                {kelasInfo.jadwalImage !== DummyJadwal && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <a
                            href={kelasInfo.jadwalImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: "8px 16px",
                                background: "#0B2948",
                                color: "white",
                                borderRadius: 8,
                                textDecoration: "none",
                                fontWeight: 600,
                                fontSize: 14,
                            }}
                        >
                            Buka Gambar Penuh
                        </a>
                    </div>
                )}
            </div>
        </WalikelasLayout>
    );
}