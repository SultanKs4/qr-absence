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
import { authService } from '../../services/auth';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function DashboardWaka() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const statistik = {
    hadir: 120,
    izin: 15,
    sakit: 10,
    alpha: 5,
    pulang: 8,
  };

  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
    datasets: [
      {
        label: "Hadir",
        data: [30, 35, 28, 27, 26, 29, 31, 30, 28, 27, 26, 25],
        backgroundColor: "#1FA83D",
      },
      {
        label: "Izin",
        data: [5, 4, 3, 3, 4, 3, 2, 3, 4, 3, 2, 2],
        backgroundColor: "#d8bf1a",
      },
      {
        label: "Sakit",
        data: [4, 3, 2, 1, 2, 2, 3, 2, 1, 2, 1, 1],
        backgroundColor: "#9A0898",
      },
      {
        label: "Alpha",
        data: [2, 1, 2, 0, 1, 1, 0, 1, 2, 1, 0, 1],
        backgroundColor: "#D90000",
      },
      {
        label: "Pulang",
        data: [3, 2, 1, 2, 3, 2, 2, 3, 2, 1, 2, 1],
        backgroundColor: "#FF5F1A",
      },
    ],
  };

  const tanggal = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLogout = () => {
    // Konfirmasi logout
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar?');
    
    if (confirmLogout) {
      // Redirect ke halaman login
      authService.logout();
      navigate('/login');
      
      // Optional: tampilkan pesan
      alert('Anda telah berhasil logout');
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
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
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
              <div className="dashboard-semester">Semester Genap</div>
            </div>

            {/* MINI STATS */}
            <div className="dashboard-mini-wrapper">
              <Mini title="Hadir" value={statistik.hadir} cls="hadir" />
              <Mini title="Izin" value={statistik.izin} cls="izin" />
              <Mini title="Sakit" value={statistik.sakit} cls="sakit" />
              <Mini title="Alpha" value={statistik.alpha} cls="alpha" />
              <Mini title="Pulang" value={statistik.pulang} cls="pulang" />
            </div>
          </div>

          {/* CHART */}
          <div className="dashboard-chart">
            <Bar
              data={data}
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