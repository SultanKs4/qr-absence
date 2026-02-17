import { useState, useEffect } from "react";
import { scheduleService } from "../../services/scheduleService";
import GuruLayout from "../../component/Guru/GuruLayout";


interface DataJadwalGuruProps {
  user: { name: string; role: string };
  currentPage: string;
  onMenuClick: (page: string) => void;
  onLogout: () => void;
}

interface ScheduleItem {
  id: string;
  subject: string;
  className: string;
  active: boolean;
  jam: string;
  room: string;
  day: string;
  start_time: string;
}

export default function DetailJadwalGuru({
  user,
  currentPage,
  onMenuClick,
  onLogout,
}: DataJadwalGuruProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await scheduleService.getMySchedule();
      const items = response.items || [];

      const mappedItems = items.map((item: any) => ({
        id: item.id.toString(),
        subject: item.subject,
        className: item.class,
        active: true, // Assuming active if returned
        jam: `${item.start_time?.substring(0, 5)} - ${item.end_time?.substring(0, 5)}`,
        room: item.room || "-",
        day: item.day,
        start_time: item.start_time
      }));

      setSchedules(mappedItems);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group by Day
  // Use Indonesian day names if backend returns English, we map them
  // But wait, the previous code in GuruDashboard assumed English from backend for filtering.
  // Actually, let's assume backend returns English day names (e.g. "Monday") or Indonesian?
  // The new seeder uses 'Monday', 'Tuesday' etc. or indices?
  // Let's assume English day names are returned by the API as per `ScheduleController`.
  // I will map them to Indonesian for display.

  const dayMap: Record<string, string> = {
    'Monday': 'Senin',
    'Tuesday': 'Selasa',
    'Wednesday': 'Rabu',
    'Thursday': 'Kamis',
    'Friday': 'Jumat',
    'Saturday': 'Sabtu',
    'Sunday': 'Minggu'
  };

  const dayOrder: Record<string, number> = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
  };

  const groupedSchedules = schedules.reduce((acc: any, item) => {
    const day = item.day || 'Unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => (dayOrder[a] || 8) - (dayOrder[b] || 8));


  return (
    <GuruLayout
      pageTitle="Jadwal Mengajar"
      currentPage={currentPage}
      onMenuClick={onMenuClick}
      user={user}
      onLogout={onLogout}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header simple */}
        <div style={{
          backgroundColor: "#0B2948",
          color: "white",
          padding: "20px 24px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24
          }}>
            📅
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Jadwal Mengajar Anda</h2>
            <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 14 }}>
              Semester Genap 2024/2025
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
            Memuat jadwal...
          </div>
        ) : sortedDays.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
            Belum ada jadwal mengajar.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {sortedDays.map(day => (
              <div key={day} style={{
                backgroundColor: "white",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: "1px solid #E2E8F0"
              }}>
                <div style={{
                  backgroundColor: "#F1F5F9",
                  padding: "12px 16px",
                  borderBottom: "1px solid #E2E8F0",
                  fontWeight: 700,
                  color: "#0F172A",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>{dayMap[day] || day}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B", background: "white", padding: "2px 8px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    {groupedSchedules[day].length} Kelas
                  </span>
                </div>

                <div style={{ padding: 0 }}>
                  {groupedSchedules[day]
                    .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
                    .map((item: any, idx: number) => (
                      <div key={idx} style={{
                        padding: "16px",
                        borderBottom: idx === groupedSchedules[day].length - 1 ? "none" : "1px solid #F1F5F9",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>
                              {item.subject}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                              {item.className}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "4px 8px", borderRadius: 6 }}>
                            {item.jam}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#475569", marginTop: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>📍 Ruang: {item.room}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </GuruLayout>
  );
}