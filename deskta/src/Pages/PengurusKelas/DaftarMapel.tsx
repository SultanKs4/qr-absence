import { useMemo, useState, useEffect } from "react";
import { CalendarDays, School, BookOpen, QrCode, Plus, Loader2 } from "lucide-react";
import { Modal } from "../../component/Shared/Modal";
import classService from "../../services/classService";
import { attendanceService } from "../../services/attendanceService";

function formatDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

export default function DaftarMapel() {
  const today = useMemo(() => new Date(), []);
  const todayStr = formatDDMMYYYY(today);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMapel, setSelectedMapel] = useState<any | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cls, sch] = await Promise.all([
          classService.getMyClass(),
          classService.getMyClassSchedules()
        ]);
        setClassInfo(cls);
        setSchedules(sch);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateQr = async (m: any) => {
    try {
      setIsGeneratingQr(true);
      setSelectedMapel(m);
      const res = await attendanceService.generateQrCode(m.id);
      setQrSvg(res.qr_svg);
      setIsQrModalOpen(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal membuat QR Code");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        <Loader2 className="animate-spin" size={32} color="#062A4A" />
      </div>
    );
  }

  return (
    <div style={{ padding: "22px 24px 28px" }}>
      {/* Tanggal */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 10,
          background: "#D1D5DB",
          color: "#0F172A",
          fontWeight: 800,
          boxShadow: "0 2px 0 rgba(0,0,0,0.10)",
        }}
      >
        <CalendarDays size={22} />
        <span>{todayStr}</span>
      </div>

      {/* Box Kelas */}
      <div
        style={{
          marginTop: 12,
          width: 330,
          background: "#062A4A",
          borderRadius: 10,
          padding: "14px 14px",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(255,255,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <School size={20} color="#fff" />
        </div>

        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{classInfo?.name || "-"}</div>
          <div style={{ fontWeight: 600, opacity: 0.9, marginTop: 4 }}>
            {classInfo?.homeroom_teacher?.user?.name || "Belum ada Wali Kelas"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
        {schedules.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px", color: "#64748B" }}>
            Tidak ada jadwal untuk hari ini.
          </div>
        )}
        {schedules.map((m) => (
          <div
            key={m.id}
            style={{
              background: "#FFFFFF",
              borderRadius: 10,
              border: "2px solid #D1D5DB",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 3px 0 rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* icon kiri */}
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 10,
                  background: "#2F80ED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BookOpen size={22} color="#fff" />
              </div>

              {/* text */}
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>
                  {m.subject?.name || "Mapel"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", opacity: 0.8, marginTop: 4 }}>
                {m.kelas?.name || "Kelas"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", opacity: 0.8, marginTop: 4 }}>
                  {m.teacher?.user?.name || "Guru"}
                </div>
              </div>
            </div>

            {/* icon QR + plus kanan */}
            <button
              type="button"
              onClick={() => handleGenerateQr(m)}
              disabled={isGeneratingQr}
              aria-label="Generate QR"
              style={{
                width: 54,
                height: 54,
                borderRadius: 12,
                border: "none",
                background: "transparent",
                cursor: isGeneratingQr ? "not-allowed" : "pointer",
                display: "grid",
                placeItems: "center",
                opacity: isGeneratingQr ? 0.5 : 1
              }}
            >
              <span style={{ position: "relative", width: 26, height: 26, display: "inline-block" }}>
                {isGeneratingQr && selectedMapel?.id === m.id ? (
                  <Loader2 className="animate-spin" size={26} color="#0F172A" />
                ) : (
                  <>
                    <QrCode size={26} color="#0F172A" />
                    <span style={{ position: "absolute", right: -8, bottom: -8 }}>
                      <Plus size={16} color="#0F172A" />
                    </span>
                  </>
                )}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Modal QR - DENGAN BACKGROUND PUTIH */}
      <Modal 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)}
        maxWidth="380px"
      >
        <div style={{ 
          padding: "24px",
          background: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 800, 
              color: "#0F172A", 
              marginBottom: 8
            }}>
              KODE QR UNTUK PRESENSI
            </h3>
            
            <div style={{ 
              fontSize: 14, 
              color: "#64748B",
              marginBottom: 4
            }}>
              {selectedMapel?.name}
            </div>
            
            <div style={{ 
              fontSize: 13, 
              color: "#64748B",
              fontWeight: 600
            }}>
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <div style={{ 
            padding: 20,
            marginBottom: 24,
            textAlign: "center",
            background: "#F8FAFC",
            borderRadius: "12px",
            border: "1px solid #E5E7EB"
          }}>
            {qrSvg && (
              <img 
                src={`data:image/svg+xml;base64,${qrSvg}`} 
                alt="QR Code Presensi" 
                style={{ 
                  width: 250, 
                  height: 250, 
                  display: "block", 
                  margin: "0 auto"
                }} 
              />
            )}
          </div>

          {/* Tombol Tutup */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => setIsQrModalOpen(false)}
              style={{
                padding: "12px 40px",
                background: "#0F172A",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 15,
                width: "100%",
                maxWidth: "200px"
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}