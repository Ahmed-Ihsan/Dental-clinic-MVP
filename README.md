# 🦷 DentalCare — Dental Clinic Management System

A full-featured, Arabic-first dental clinic management system built with **Flask** (backend) and **React + Vite** (frontend). Designed for real clinic workflows with an RTL interface, role-based access, and comprehensive financial tracking.

---

## ✨ Features

### 🏠 Dashboard
- Live KPI cards: today's revenue, monthly revenue, outstanding balances, active patients
- Today's appointment timeline with patient avatars and status badges
- Smart alerts: overdue bills, tomorrow's appointments, pending doctor advances
- 7-day revenue vs. expenses area chart
- Quick action buttons for fast navigation

### 👤 Patient Management
- Full patient profiles with personal and contact information
- Patient case sheet with tabbed views:
  - **Overview** — KPI summary, recent activity
  - **Medical History** — conditions, diagnoses, notes
  - **Treatments** — procedure records with cost tracking
  - **Appointments** — appointment history per patient
  - **Billing** — per-patient bill list with payment progress

### 📅 Appointment Management
- Full calendar view with day/week navigation
- Appointment creation with doctor assignment, time slots, and status tracking
- Status flow: Scheduled → Confirmed → Completed / Cancelled

### 💰 Billing (محاسبة)
- Create bills linked to patients and appointments
- Auto-calculated balance (total − paid)
- Status tracking: Pending / Paid / Overdue
- Bill detail modal with edit support

### 💹 Finance Page (merged)
Two tabs in one page:
- **Revenue & Profit Analysis** — profitability by treatment category, payment ledger, trend indicators, CSV export
- **Expense Management** — categorized expense tracking, doctor advance (debt) management, summary KPIs

### 👥 Staff Page (merged)
Three tabs in one page:
- **Medical Team** — add/edit/view dental professionals with specialties and contact info
- **Salaries & Payroll** — salary structures, payroll generation, payment processing
- **Installments & Advances** — loan/advance management for staff, payment tracking

### 🦷 Quick Visit Wizard
4-step guided modal for recording a complete visit in one flow:
1. Select existing patient or register new one
2. Record treatment type, date, and doctor
3. Enter billing details with auto-calculated balance and payment breakdown bar
4. Review all data before saving — creates patient/appointment/treatment/bill in one action

### 📝 Quick Entry Modal
Global floating modal (top bar) for fast entry of:
- New patient
- New appointment
- New treatment

### 🔍 Typeahead Patient Search
Top-bar search with debounced patient lookup — press Enter to open the patient's case sheet directly.

---

## 🛠 Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Flask | REST API framework |
| SQLAlchemy + Flask-Migrate | ORM + database migrations |
| Flask-CORS | Cross-origin requests |
| Flask-Login | Session-based authentication |
| SQLite | Embedded database (upgradable to PostgreSQL) |

### Frontend
| Package | Purpose |
|---|---|
| React 18 + Vite | UI framework + dev server |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Revenue/expense area charts |
| Lucide React | Icon set |
| react-hot-toast | Toast notifications |

---

## 📁 Project Structure

```
Dental/
├── backend/
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # Blueprint route handlers
│   ├── migrations/      # Alembic DB migrations
│   ├── database.py      # db instance
│   └── app.py           # Flask app entry point
└── frontend/
    └── src/
        ├── components/
        │   ├── CaseSheet/       # Patient case sheet tabs
        │   ├── Expenses/        # Expense dashboard + cards
        │   ├── Revenue/         # Revenue dashboard + cards
        │   ├── QuickVisitWizard/# 4-step visit wizard
        │   ├── FinancePage.jsx  # Revenue + Expenses tabs
        │   ├── StaffPage.jsx    # Professionals + Salaries + Installments tabs
        │   └── Dashboard.jsx    # Main dashboard
        ├── services/api.js      # Axios instance + salary API
        ├── AuthContext.jsx      # Auth state provider
        └── App.jsx              # Router + sidebar + top bar
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1 — Clone

```bash
git clone https://github.com/<your-username>/Dental.git
cd Dental
```

### 2 — Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
flask db upgrade
python app.py
```

Backend runs at **http://localhost:5000**

### 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## 🔌 API Reference

All endpoints are prefixed with `/api` unless noted.

| Resource | Endpoints |
|---|---|
| Patients | `GET/POST /patients` · `GET/PUT/DELETE /patients/:id` |
| Appointments | `GET/POST /appointments` · `GET/PUT/DELETE /appointments/:id` |
| Treatments | `GET/POST /treatments` · `GET/PUT/DELETE /treatments/:id` |
| Medical History | `GET/POST /medical-histories` · `PUT/DELETE /medical-histories/:id` |
| Bills | `GET/POST /bills` · `GET/PUT/DELETE /bills/:id` |
| Professionals | `GET/POST /professionals` · `GET/PUT/DELETE /professionals/:id` |
| Salaries | `GET/POST /salaries` · full payroll sub-routes |
| Payroll | `POST /payrolls/generate` · `POST /payrolls/:id/pay` |
| Installments | `GET/POST /installments` · payment sub-routes |
| Expenses | `GET/POST /api/expenses` · `GET /api/expenses/summary` |
| Revenue | `GET /api/revenue/summary` · `/categories` · `/payments` |
| Search | `GET /api/search?q=` |
| Auth | `POST /api/login` · `POST /api/logout` · `GET /api/me` |

---

## 🔄 Changelog

### v2.0.0 — Current
- Premium SaaS dashboard with live KPIs, smart alerts, and trend chart
- Patient case sheet with full medical/billing history
- Finance page: Revenue analytics + Expense management (merged)
- Staff page: Professionals + Payroll + Installments (merged, 3 tabs)
- Quick Visit Wizard (4-step guided flow)
- Quick Entry Modal (global fast entry)
- Typeahead patient search in top bar
- Auto-calculated bill balance (server + client side)
- Legacy route redirects (`/expenses` → `/finance`, etc.)

### v1.0.0 — Initial MVP
- Patient registration and management
- Appointment scheduling
- Treatment record tracking
- Basic REST API

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
