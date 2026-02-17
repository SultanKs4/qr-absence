import { useState, useEffect } from "react";
import SiswaLayout from "../../component/Siswa/SiswaLayout";
import { scheduleService } from "../../services/scheduleService";
import { authService } from "../../services/authService";

type SiswaPage = "dashboard" | "jadwal-anda" | "notifikasi";

interface JadwalSiswaProps {
    user: { name: string; phone: string };
    currentPage: SiswaPage;
    onMenuClick: (page: string) => void;
    onLogout: () => void;
}

export default function JadwalSiswa({
    user,
    currentPage,
    onMenuClick,
    onLogout,
}: JadwalSiswaProps) {
    const [profile, setProfile] = useState<any>(user); // Use passed user initially
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Profile
                const me = await authService.me();
                if (me) {
                    setProfile(me);
                }

                const scheduleData = await scheduleService.getMySchedule();
                setSchedules(scheduleData.items || []);
            } catch (error) {
                console.error("Error loading schedule or profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Group items by day
    const dayOrder: any = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    const groupedSchedules = schedules.reduce((acc: any, item: any) => {
        const day = item.day || 'Unknown';
        if (!acc[day]) acc[day] = [];
        acc[day].push(item);
        return acc;
    }, {});

    const sortedDays = Object.keys(groupedSchedules).sort((a, b) => (dayOrder[a] || 8) - (dayOrder[b] || 8));

    return (
        <SiswaLayout
            pageTitle="Jadwal Kelas"
            currentPage={currentPage}
            onMenuClick={onMenuClick}
            user={user}
            onLogout={onLogout}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Box Informasi Kelas */}
                <div
                    style={{
                        background: "#0B2948",
                        borderRadius: 12,
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        color: "white"
                    }}
                >
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            background: "rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: 24
                        }}
                    >
                        📅
                    </div>

                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                marginBottom: 4,
                            }}
                        >
                            {profile?.student_profile?.class?.name || "Memuat Kelas..."}
                        </div>
                        <div
                            style={{
                                color: "rgba(255, 255, 255, 0.8)",
                                fontSize: "14px",
                                fontWeight: 500,
                            }}
                        >
                            Wali Kelas: {profile?.student_profile?.class?.homeroom_teacher?.user?.name || "Belum ditentukan"}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 20 }}>Memuat jadwal...</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {sortedDays.map(day => (
                            <div key={day} style={{
                                background: "#FFFFFF",
                                borderRadius: 12,
                                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    background: "#F1F5F9",
                                    padding: "12px 20px",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#334155",
                                    borderBottom: "1px solid #E2E8F0"
                                }}>
                                    {day}
                                </div>
                                <div style={{ padding: "0 10px" }}>
                                    {groupedSchedules[day]
                                        .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
                                        .map((item: any, idx: number) => (
                                            <div key={idx} style={{
                                                padding: "16px 10px",
                                                borderBottom: idx === groupedSchedules[day].length - 1 ? "none" : "1px solid #F1F5F9",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between"
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: 16, fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>
                                                        {item.subject}
                                                    </div>
                                                    <div style={{ fontSize: 14, color: "#64748B" }}>
                                                        Pengajar: {item.teacher}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: "#2563EB",
                                                        marginBottom: 4,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "flex-end",
                                                        gap: 4
                                                    }}>
                                                        🕒 {item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 12,
                                                        background: "#F1F5F9",
                                                        padding: "2px 8px",
                                                        borderRadius: 4,
                                                        color: "#475569",
                                                        display: "inline-block"
                                                    }}>
                                                        Ruang: {item.room || "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}

                        {sortedDays.length === 0 && (
                            <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                                Belum ada jadwal yang tersedia.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </SiswaLayout>
    );
}
