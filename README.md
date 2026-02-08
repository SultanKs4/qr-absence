# 🚀 QR Absence Ecosystem

A professional, real-time attendance ecosystem designed for modern educational institutions. This project integrates a high-performance Laravel API, a responsive React web portal, a dedicated Desktop client, and a Node.js WhatsApp gateway.

## 🏗 System Architecture

The ecosystem consists of four main components:

1.  **Backend (`/backend`)**: Built with **Laravel 12** and **Octane**. Manages core logic, RBAC, and real-time broadcasting via **Reverb**.
2.  **Frontend (`/frontend`)**: A **React 19** web application powered by **Vite** and **Tailwind CSS 4**. Runs on port **5173**.
3.  **Desktop Client (`/deskta`)**: A specialized **React + TypeScript** desktop version for classroom-specific usage. Runs on port **5174**.
4.  **WhatsApp Gateway (`/whatekster`)**: A **Node.js** service that handles automated notifications to parents and teachers using the WhatsApp Web API.

---

## 🌟 Key Capabilities

- **Minimalist Modern UI**: A completely overhauled design system using Tailwind 4, focusing on high-contrast data visualization and smooth user experience.
- **Dynamic QR Sessions**: Secure attendance sessions with configurable timeouts and secure token generation.
- **Real-time Synchronization**: Instant updates on teacher dashboards when students scan, powered by **Laravel Reverb**.
- **Automated Alerts**: Queued notifications for scan success, absence requests, and daily summaries via WhatsApp.
- **Unified Multi-Platform Access**: Secure authentication shared between Web and Desktop versions via Sanctum stateful domains.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **API** | Laravel 12, Octane (FrankenPHP), Sanctum, Reverb, Telescope |
| **Frontend/Web** | React 19, Vite, Laravel Echo, Chart.js, Tailwind 4 |
| **Desktop** | React 19, TypeScript, Vite, Framer Motion |
| **Messaging** | Node.js, Baileys (WA), Redis/Database Queue |
| **Database** | SQLite (Development) / MySQL (Production) |

---

## 🚦 Quick Start

### 1. One-Step Setup
Run the master script to install dependencies, configure environments, and initialize broadcasting for all services (including the desktop version):
```bash
./setup-all.sh
```

### 2. Launch Development Environment
Start all services (API, Web, Desktop, Queue, WebSockets, WA Gateway) simultaneously:
```bash
./run-dev.sh
```

### 3. Link WhatsApp
Scan the QR code displayed in your terminal by `whatekster` using your WhatsApp mobile app (**Linked Devices**) to enable automated notifications.

---

## 🧪 Maintenance & Health
- **Automated Tests**: `cd backend && ./test.sh`
- **System Check**: `cd backend && php artisan app:check`
- **API Inspection**: Access `http://localhost:8000/telescope` for deep observability.

---

## 📖 Documentation Links
- [Backend Deep-Dive](backend/README.md)
- [API Reference (Endpoints)](backend/API_DOCS.md)
- [Web Frontend Guide](frontend/README.md)
- [Desktop Client Guide](deskta/README.md)
*   [WhatsApp Gateway Setup](whatekster/README.md)

*Developed with ❤️ for educational efficiency.*
