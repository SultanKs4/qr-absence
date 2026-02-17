// FILE: FormModal.tsx
import { type ReactNode } from "react";

// Props untuk komponen FormModal
interface FormModalProps {
  isOpen: boolean; // Apakah modal terbuka
  onClose: () => void; // Fungsi untuk menutup modal
  title: string; // Judul modal
  children: ReactNode; // Konten form
  onSubmit?: () => void; // Fungsi saat submit
  submitLabel?: string; // Label tombol submit
  isSubmitting?: boolean; // Status loading submit
  onReset?: () => void; // Fungsi untuk reset form
  resetLabel?: string; // Label tombol reset
  titleStyle?: React.CSSProperties; // Style khusus untuk judul
  showSubmitButton?: boolean; // Tampilkan tombol submit?
  style?: React.CSSProperties; // Style tambahan untuk modal
  contentStyle?: React.CSSProperties; // Style tambahan untuk konten form
  maxHeight?: string; // Tinggi maksimal modal
  topOffset?: string; // Jarak dari atas viewport
  bottomMargin?: string; // Margin bawah modal
}

// Komponen modal generik untuk form
export function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Tambahkan",
  isSubmitting = false,
  onReset,
  resetLabel = "Reset",
  titleStyle = {},
  showSubmitButton = true,
  style,
  contentStyle = {},
  // Jarak dari atas viewport
  topOffset = "14vh",
  // Tinggi maksimal modal
  maxHeight = "83vh", // Modal lebih tinggi
  // Margin bawah untuk ruang ekstra
  bottomMargin = "20px",
}: FormModalProps) {
  // Handler submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  // Jangan render jika modal tidak terbuka
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        backgroundColor: "rgba(0, 0, 0, 0.7)", // Overlay gelap
        display: "flex",
        alignItems: "flex-start", // Modal di-align ke atas
        justifyContent: "center",
        zIndex: 9999, // Pastikan modal di atas semua
        // Tambah padding bawah untuk ruang ekstra
        padding: `${topOffset} 20px ${bottomMargin} 20px`,
        overflowY: "auto", // Biarkan scroll jika konten panjang
      }}
      onClick={onClose} // Tutup modal saat klik overlay
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px", // Lebar maksimal modal
          // Modal lebih tinggi
          maxHeight: maxHeight,
          display: "flex",
          flexDirection: "column",
          border: "3px solid #1e40af", // Border biru tebal
          borderRadius: "16px",
          overflow: "hidden", // Biar border radius kerja
          backgroundColor: "white",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", // Shadow tebal
          ...style, // Style tambahan dari props
        }}
        onClick={(e) => e.stopPropagation()} // Jangan tutup modal saat klik konten
      >
        {/* Header modal */}
        <div
          style={{
            backgroundColor: "#0f172a", // Warna biru gelap
            color: "white",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0, // Jangan shrink header
            borderBottom: "3px solid #1e40af", // Border bawah biru
          }}
        >
          {/* Judul modal */}
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              margin: 0,
              ...titleStyle, // Style khusus untuk judul
            }}
          >
            {title}
          </h2>
          {/* Tombol close (X) */}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            type="button"
            aria-label="Tutup modal"
          >
            ×
          </button>
        </div>

        {/* Konten form yang bisa di-scroll */}
        <div
          style={{
            flex: 1, // Ambil sisa space
            overflowY: "auto", // Scroll jika konten terlalu panjang
            // Tinggi konten disesuaikan dengan tinggi modal
            maxHeight: `calc(${maxHeight} - 130px)`, // Kurangi tinggi header + footer
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ 
              padding: "24px", 
              backgroundColor: "white",
              // Tinggi minimal untuk konten
              minHeight: "350px",
              ...contentStyle,
            }}>
              {children} {/* Render konten form dari props */}
            </div>
          </form>
        </div>

        {/* Footer modal dengan tombol aksi */}
        <div
          style={{
            padding: "16px 24px",
            backgroundColor: "white",
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            borderTop: "1px solid #e5e7eb", // Border atas tipis
            flexShrink: 0, // Jangan shrink footer
          }}
        >
          {/* Tombol Batal */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "2px solid #1e40af", // Border biru
              backgroundColor: "white",
              color: "#1e40af", // Warna teks biru
              fontWeight: "600",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "14px",
              minWidth: "100px",
              opacity: isSubmitting ? 0.5 : 1, // Transparan jika loading
            }}
            aria-label="Batal"
          >
            Batal
          </button>

          {/* Tombol Reset (opsional) */}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={isSubmitting}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "2px solid #e2e8f0", // Border abu-abu terang
                backgroundColor: "#f8fafc",
                color: "#64748b", // Warna teks abu-abu biru
                fontWeight: "600",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "14px",
                minWidth: "100px",
                opacity: isSubmitting ? 0.5 : 1,
              }}
              aria-label={resetLabel}
            >
              {resetLabel}
            </button>
          )}
          
          {/* Tombol Submit (opsional) */}
          {showSubmitButton && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#1e40af", // Background biru
                color: "white", // Warna teks putih
                fontWeight: "600",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "14px",
                minWidth: "100px",
                opacity: isSubmitting ? 0.7 : 1, // Sedikit transparan jika loading
              }}
              aria-label={isSubmitting ? "Menyimpan..." : submitLabel}
            >
              {isSubmitting ? "Menyimpan..." : submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}