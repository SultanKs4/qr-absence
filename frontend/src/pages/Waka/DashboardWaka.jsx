import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { FaUser } from "react-icons/fa";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import "./DashboardWaka.css";
import { useNavigate } from "react-router-dom";
import NavbarWaka from "../../components/Waka/NavbarWaka";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// API Service (Inline for simplicity, or move to separate file)
const API_BASE_URL = 'http://localhost:8000/api';

const apiService = {
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }),

  async getSemesters() {
    const response = await fetch(`${API_BASE_URL}/semesters`, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch semesters');
    return response.json();
  },

  async getDashboardSummary(semesterId = null) {
    const url = new URL(`${API_BASE_URL}/waka/dashboard/summary`);
    if (semesterId) url.searchParams.append('semester_id', semesterId);

    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  }
};

export default function DashboardWaka() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  // Data State
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [statistik, setStatistik] = useState({
    hadir: 0, izin: 0, sakit: 0, alpha: 0, pulang: 0
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch Semesters on Mount
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const data = await apiService.getSemesters();
        // Assuming response is paged or list. Check structure.
        // Usually /api/semesters returns { data: [...], ... } or [...]
        const list = Array.isArray(data) ? data : (data.data || []);
        setSemesters(list);

        // Default to active semester or first one
        const active = list.find(s => s.is_active) || list[0];
        if (active) setSelectedSemesterId(active.id);
      } catch (error) {
        console.error("Error fetching semesters:", error);
      }
    };
    fetchSemesters();
  }, []);

  // Fetch Dashboard Data when Semester Changes
  useEffect(() => {
    if (!selectedSemesterId) return;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getDashboardSummary(selectedSemesterId);

        // Update Stats
        if (data.statistik) {
          setStatistik({
            hadir: data.statistik.hadir || 0,
            izin: data.statistik.izin || 0,
            sakit: data.statistik.sakit || 0,
            alpha: data.statistik.alpha || 0,
            pulang: data.statistik.pulang || 0
          });
        }

        // Update Chart
        if (data.trend) {
          const labels = data.trend.map(item => item.month);
          const presentData = data.trend.map(item => item.present);
          const absentData = data.trend.map(item => item.absent);

          setChartData({
            labels: labels,
            datasets: [
              {
                label: 'Hadir',
                data: presentData,
                backgroundColor: '#4ade80', // Green
              },
              {
                label: 'Alpha',
                data: absentData,
                backgroundColor: '#f87171', // Red
              }
            ]
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedSemesterId]);


  const tanggal = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const jam = now.toLocaleTimeString("id-ID");

  return (
    <div className="dashboard-page">
      <NavbarWaka />
      <div className="dashboard-containerr">
        {/* SIDEBAR */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-profile">
            <div className="dashboard-avatar">
              <FaUser />
            </div>
            <p>
              WAKA
              <br />
              KESISWAAN
            </p>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Keluar
          </button>
        </aside>

        {/* CONTENT */}
        <main className="dashboard-content">
          {/* TOP ROW */}
          <div className="dashboard-top">
            {/* DATE BOX */}
            <div className="dashboard-datebox">
              <div className="dashboard-date">{tanggal}</div>
              <div className="dashboard-clock">{jam}</div>
            </div>

            {/* MINI STATS */}
            <div className="dashboard-mini-wrapper">
              <Mini title="Hadir" value={statistik.hadir} cls="hadir" />
              <Mini title="Izin" value={statistik.izin} cls="izin" />
              <Mini title="Sakit" value={statistik.sakit} cls="sakit" />
              <Mini title="Alfa" value={statistik.alpha} cls="alfa" />
              <Mini title="Pulang" value={statistik.pulang} cls="pulang" />
            </div>
          </div>

          {/* CHART */}
          <div className="dashboard-chart">
            {/* Dropdown Semester */}
            <div className="chart-header">
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="semester-dropdown-chart"
                disabled={isLoading}
              >
                <option value="">Pilih Semester</option>
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>
                    {sem.academic_year} - {sem.type} ({sem.is_active ? 'Aktif' : 'Non-Aktif'})
                  </option>
                ))}
              </select>
            </div>

            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 5,
                    },
                  },
                },
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function Mini({ title, value, cls }) {
  return (
    <div className={`dashboard-mini ${cls}`}>
      <span>{title}</span>
      <b>{value}</b>
    </div>
  );
}