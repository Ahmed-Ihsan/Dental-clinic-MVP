# DentalCare Frontend Documentation

**Version:** 2.0.0  
**Last Updated:** May 2026  
**System:** Dental Clinic Management System (MVP)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Design System](#design-system)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [Component Reference](#component-reference)
8. [API Integration](#api-integration)
9. [Development Guide](#development-guide)
10. [Build & Deployment](#build--deployment)

---

## Architecture Overview

DentalCare frontend is a **React 18** single-page application built with **Vite**. It features:

- **Arabic-first RTL interface** with full Arabic localization
- **Dark/Light theme support** with CSS custom properties
- **Modular component architecture** organized by feature
- **Real-time dashboard** with live KPIs and charts
- **Typeahead patient search** for quick navigation
- **Quick Visit Wizard** for streamlined patient visits

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React Application                       │
├─────────────────────────────────────────────────────────────┤
│  Context Providers                                           │
│  ├── ThemeProvider (dark/light mode)                        │
│  └── AuthProvider (session management)                     │
├─────────────────────────────────────────────────────────────┤
│  App Shell                                                   │
│  ├── Sidebar (navigation)                                  │
│  ├── TopBar (search, quick actions, theme toggle)          │
│  └── Main Content (route-based page rendering)             │
├─────────────────────────────────────────────────────────────┤
│  Page Components                                             │
│  ├── Dashboard (KPIs, charts, alerts)                       │
│  ├── PatientManagement (CRUD)                             │
│  ├── PatientCaseSheet (tabbed patient view)                │
│  ├── AppointmentManagement (calendar)                     │
│  ├── BillManagement (invoicing)                          │
│  ├── FinancePage (Revenue + Expenses tabs)                 │
│  └── StaffPage (Professionals + Salaries + Installments)  │
├─────────────────────────────────────────────────────────────┤
│  Shared Components                                           │
│  ├── QuickEntryModal (global fast entry)                  │
│  ├── QuickVisitWizard (4-step visit flow)                 │
│  ├── FormBuilder (dynamic forms)                          │
│  └── DetailModals (view/edit entities)                    │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                               │
│  └── api.js (Axios instance + endpoint wrappers)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
frontend/
├── index.html                    # HTML entry point with FOUC prevention
├── package.json                  # Dependencies & scripts
├── vite.config.js               # Vite configuration
├── eslint.config.js             # ESLint rules
├── public/                      # Static assets
│   └── favicon.svg
└── src/
    ├── main.jsx                 # React application entry
    ├── App.jsx                  # Root component (router + shell)
    ├── App.css                  # App-level styles
    ├── index.css                # Global design system (CSS variables)
    ├── styles.css               # Additional utilities
    ├── AuthContext.jsx          # Authentication state
    ├── ThemeContext.jsx         # Theme (dark/light) state
    ├── services/
    │   └── api.js               # Axios API client
    ├── components/              # React components
    │   ├── Dashboard.jsx
    │   ├── Login.jsx
    │   ├── PatientManagement.jsx
    │   ├── AppointmentManagement.jsx
    │   ├── BillManagement.jsx
    │   ├── FinancePage.jsx
    │   ├── StaffPage.jsx
    │   ├── SearchPage.jsx
    │   ├── TopBar.jsx (in App.jsx)
    │   ├── Sidebar.jsx (in App.jsx)
    │   ├── TypeaheadSearch.jsx (in App.jsx)
    │   ├── QuickEntryModal.jsx
    │   ├── GlobalModal.jsx
    │   ├── DataList.jsx
    │   ├── FormBuilder.jsx
    │   ├── DetailModal.jsx
    │   ├── PatientForm.jsx
    │   ├── PatientList.jsx
    │   ├── PatientDetailModal.jsx
    │   ├── AppointmentForm.jsx
    │   ├── AppointmentsCalendar.jsx
    │   ├── AppointmentDetailModal.jsx
    │   ├── TreatmentForm.jsx
    │   ├── TreatmentDetailModal.jsx
    │   ├── BillForm.jsx
    │   ├── BillList.jsx
    │   ├── BillDetailModal.jsx
    │   ├── ProfessionalForm.jsx
    │   ├── ProfessionalList.jsx
    │   ├── ProfessionalDetailModal.jsx
    │   ├── SalaryManagement.jsx
    │   ├── PaymentInstallmentForm.jsx
    │   ├── PaymentInstallmentList.jsx
    │   ├── MedicalHistoryRoutes.jsx
    │   ├── CaseSheet/             # Patient case sheet module
    │   │   ├── PatientCaseSheet.jsx
    │   │   ├── PatientHeader.jsx
    │   │   ├── CaseSheetTabs.jsx
    │   │   ├── CaseSheetSkeleton.jsx
    │   │   ├── OverviewTab.jsx
    │   │   ├── MedicalHistoryTab.jsx
    │   │   ├── TreatmentsTab.jsx
    │   │   ├── AppointmentsTab.jsx
    │   │   ├── BillingTab.jsx
    │   │   ├── DentalChartTab.jsx
    │   │   ├── InteractiveDentalChart.jsx
    │   │   ├── FormModal.jsx
    │   │   └── useCaseSheetData.js
    │   ├── Expenses/              # Expense management module
    │   │   ├── ExpensesDashboard.jsx
    │   │   ├── AddExpenseModal.jsx
    │   │   ├── ExpenseStatCard.jsx
    │   │   ├── ExpenseTable.jsx
    │   │   └── mockData.js
    │   ├── Revenue/               # Revenue analytics module
    │   │   ├── RevenueDashboard.jsx
    │   │   ├── QuickPaymentModal.jsx
    │   │   ├── RevenueStatCard.jsx
    │   │   └── RevenueTable.jsx
    │   └── QuickVisitWizard/      # 4-step wizard module
    │       ├── QuickVisitWizard.jsx
    │       ├── QuickVisitWizard.css
    │       ├── Step1Patient.jsx
    │       ├── Step2Treatment.jsx
    │       ├── Step3Billing.jsx
    │       ├── Step4Review.jsx
    │       └── SuccessToast.jsx
    └── styles/                   # Additional CSS modules
        └── casesheet.css
```

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | ^19.2.4 | UI library |
| **Build Tool** | Vite | ^8.0.4 | Dev server & bundler |
| **Routing** | React Router DOM | ^7.14.0 | Client-side routing |
| **HTTP Client** | Axios | ^1.15.0 | API requests |
| **Charts** | Recharts | ^3.8.1 | Data visualization |
| **Icons** | Lucide React | ^1.8.0 | Icon library |
| **Notifications** | react-hot-toast | ^2.6.0 | Toast messages |
| **Additional Icons** | react-icons | ^5.6.0 | Extended icon set |
| **Linting** | ESLint | ^9.39.4 | Code quality |

### Fonts

- **Primary:** Cairo ( weights: 300-900 )
- **Secondary:** Tajawal ( weights: 300-800 )
- **Source:** Google Fonts CDN

---

## Design System

### CSS Custom Properties

The design system uses CSS variables for theming, defined in `src/index.css`:

#### Colors

**Primary Palette:**
```css
--primary: #1e8e7b;           /* Teal primary */
--primary-dark: #166e5c;
--primary-light: rgba(30, 142, 123, 0.15);
--primary-glow: rgba(30, 142, 123, 0.3);
--accent: #818CF8;            /* Indigo accent */
--accent-dark: #6366F1;
```

**Status Colors:**
```css
--success: #34D399;
--warning: #FBBF24;
--danger: #F87171;
--info: #60A5FA;
```

**Dark Theme (Default):**
```css
--bg-base: #080B14;
--bg-surface: #0D1117;
--bg-card: #111827;
--bg-elevated: #1C2438;
--text-primary: #F1F5F9;
--text-secondary: #94A3B8;
--border: rgba(255, 255, 255, 0.06);
```

**Light Theme:**
```css
--bg-base: #F8FAFC;
--bg-surface: #FFFFFF;
--bg-card: #FFFFFF;
--text-primary: #0F172A;
--text-secondary: #475569;
--border: rgba(15, 23, 42, 0.08);
```

### Spacing Scale

| Token | Value |
|-------|-------|
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 24px |
| `--radius-full` | 9999px |

### Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 20px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.5);
--shadow-primary: 0 0 30px rgba(45, 212, 191, 0.15);
```

### Transitions

```css
--transition-fast: all 0.15s ease;
--transition: all 0.25s ease;
--transition-slow: all 0.4s ease;
```

### RTL Support

The application is RTL-first (Arabic interface):

```css
html {
  direction: rtl;
  scroll-behavior: smooth;
}
```

---

## State Management

### AuthContext

Simple authentication state management.

```javascript
// AuthContext.jsx
const AuthContext = createContext();

// Usage
const { isAuthenticated, login, logout } = useAuth();
```

**State:**
- `isAuthenticated` (boolean): User login status

**Methods:**
- `login()`: Set authenticated state
- `logout()`: Clear authenticated state

### ThemeContext

Dark/Light theme management with localStorage persistence.

```javascript
// ThemeContext.jsx
const ThemeContext = createContext();

// Usage
const { theme, toggleTheme } = useTheme();
```

**State:**
- `theme` ('dark' | 'light'): Current theme

**Methods:**
- `toggleTheme()`: Switch between themes

**Persistence:**
- Theme saved to `localStorage` as 'dc-theme'
- System preference detection via `prefers-color-scheme`
- FOUC prevention script in `index.html`

---

## Routing

### Route Configuration (`App.jsx`)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Main dashboard with KPIs |
| `/patients` | `PatientManagement` | Patient CRUD |
| `/patients/:patientId/case-sheet` | `PatientCaseSheet` | Patient detail view |
| `/appointments` | `AppointmentManagement` | Calendar & scheduling |
| `/bills` | `BillManagement` | Invoicing |
| `/finance` | `FinancePage` | Revenue & Expenses tabs |
| `/staff` | `StaffPage` | Team management |
| `/login` | `Login` | Authentication (when logged out) |

### Legacy Redirects

Old routes redirect to new consolidated pages:
- `/revenue` → `/finance`
- `/expenses` → `/finance`
- `/salaries` → `/staff`
- `/professionals` → `/staff`

### Navigation Items (Sidebar)

```javascript
const navItems = [
  { path: '/',             label: 'لوحة التحكم',    icon: '◈' },
  { path: '/patients',     label: 'إدارة المرضى',   icon: '👤' },
  { path: '/appointments', label: 'إدارة المواعيد',  icon: '📅' },
  { path: '/bills',        label: 'المحاسبة',         icon: '💰' },
  { path: '/finance',      label: 'المالية',          icon: '💹' },
  { path: '/staff',        label: 'إدارة الفريق',     icon: '👥' },
];
```

---

## Component Reference

### Layout Components

#### AppShell
Root application layout containing sidebar, top bar, and main content area.

**Features:**
- Renders `Sidebar` and `TopBar` components
- Hosts global modals (`QuickEntryModal`, `QuickVisitWizard`)
- Renders route-based page content

#### Sidebar
Navigation sidebar with logo, nav links, and user info.

**Features:**
- Active route highlighting
- Logout functionality
- Collapsible on mobile (responsive)

#### TopBar
Header bar with page title and actions.

**Features:**
- Dynamic page title
- `TypeaheadSearch` integration
- Quick action buttons (Quick Visit, Quick Entry)
- Theme toggle button
- System status badge

#### TypeaheadSearch
Patient search with debounced API calls.

**Features:**
- Debounced search (260ms)
- Keyboard navigation (Arrow keys, Enter, Escape)
- Click-outside-to-close
- Avatar + name + phone display
- Direct navigation to case sheet

**Implementation:**
```javascript
const fetchPatients = useCallback(async (q) => {
  const res = await api.get('/patients', { params: { search: q } });
  // Filter and limit to 8 results
}, []);

const handleChange = (e) => {
  clearTimeout(debouncer.current);
  debouncer.current = setTimeout(() => fetchPatients(val), 260);
};
```

---

### Page Components

#### Dashboard
Main dashboard with KPIs, charts, and alerts.

**Features:**
- Greeting banner (time-based)
- KPI Cards: Today's revenue, Monthly revenue, Outstanding balances, Active patients
- Today's appointment timeline
- Smart alerts (overdue bills, tomorrow's appointments, pending advances)
- Quick action grid
- 7-day Revenue vs Expenses area chart (Recharts)

**Data Fetching:**
```javascript
const [raw, setRaw] = useState({
  appointments: [],
  patients: [],
  bills: [],
  expenses: [],
  professionals: []
});

// Parallel API calls on mount
Promise.all([
  api.get('/appointments'),
  api.get('/patients'),
  api.get('/bills'),
  api.get('/expenses'),
  api.get('/professionals')
]);
```

#### PatientCaseSheet
Comprehensive patient detail view with tabs.

**URL:** `/patients/:patientId/case-sheet`

**Tabs:**
| Tab | Component | Content |
|-----|-----------|---------|
| overview | `OverviewTab` | KPI summary, recent activity |
| history | `MedicalHistoryTab` | Medical conditions |
| treatments | `TreatmentsTab` | Treatment records |
| appointments | `AppointmentsTab` | Appointment history |
| billing | `BillingTab` | Bills and payments |
| dental-chart | `DentalChartTab` | Interactive dental chart |

**Custom Hook:** `useCaseSheetData(patientId)`

**Features:**
- Sticky patient header
- Tab counts badge
- Skeleton loading state
- Error handling with navigation

#### FinancePage
Consolidated finance management with tabs.

**Tabs:**
1. **الإيرادات والأرباح** (Revenue & Profit) — `RevenueDashboard`
2. **إدارة المصروفات** (Expense Management) — `ExpensesDashboard`

#### StaffPage
Staff management with 3 tabs.

**Tabs:**
1. **الفريق الطبي** (Medical Team) — `ProfessionalManagement`
2. **الرواتب والمدفوعات** (Salaries & Payroll) — `SalaryManagement`
3. **الأقساط والسلف** (Installments & Advances) — `PaymentInstallmentForm` + `PaymentInstallmentList`

---

### Feature Components

#### QuickVisitWizard
4-step guided workflow for recording complete visits.

**Steps:**
1. **Patient** — Select existing or register new patient
2. **Treatment** — Record treatment type, date, doctor, notes
3. **Billing** — Enter costs, payments, discounts
4. **Review** — Confirm all data before saving

**Features:**
- Step validation
- Progress indicator
- API orchestration log
- Success toast with links
- Error handling per step

**State Flow:**
```
Patient Selection → Treatment Entry → Billing Details → Review → Submit
     ↓                      ↓                ↓            ↓        ↓
  validateStep(1)      validateStep(2)  validateStep(3)  review   API calls
```

#### QuickEntryModal
Global floating modal for fast data entry.

**Entries:**
- New patient
- New appointment
- New treatment

#### InteractiveDentalChart
SVG-based interactive dental chart.

**Features:**
- 32 teeth (universal numbering)
- Condition mapping (healthy, cavity, filled, etc.)
- Click-to-mark interaction
- Visual state persistence

---

### Reusable Components

#### FormBuilder
Dynamic form generation utility.

**Usage:**
```jsx
<FormBuilder
  fields={[
    { name: 'first_name', label: 'First Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
  ]}
  onSubmit={handleSubmit}
/>
```

#### ExpenseStatCard / RevenueStatCard
Statistic display cards with icons and variants.

**Props:**
- `label` (string)
- `value` (number)
- `icon` (string/emoji)
- `variant` ('success' | 'danger' | 'primary' | 'accent')
- `sub` (string) — subtitle text

#### DataList
Generic list component with actions.

---

## API Integration

### Axios Configuration (`services/api.js`)

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,  // For session cookies
});
```

### API Modules

The `salaryAPI` export contains organized endpoint wrappers:

```javascript
export const salaryAPI = {
  // Salaries
  getSalaries: (params = {}) => api.get('/salaries', { params }),
  createSalary: (data) => api.post('/salaries', data),
  updateSalary: (id, data) => api.put(`/salaries/${id}`, data),
  deleteSalary: (id) => api.delete(`/salaries/${id}`),
  
  // Salary Components
  getSalaryComponents: (salaryId) => api.get(`/salaries/${salaryId}/components`),
  createSalaryComponent: (salaryId, data) => api.post(`/salaries/${salaryId}/components`, data),
  
  // Payroll
  getPayrolls: (params = {}) => api.get('/payrolls', { params }),
  generatePayroll: (data) => api.post('/payrolls/generate', data),
  processPayroll: (id) => api.post(`/payrolls/${id}/process`),
  payPayroll: (id, data) => api.post(`/payrolls/${id}/pay`, data),
  
  // Payment Installments
  getInstallments: (params = {}) => api.get('/installments', { params }),
  createInstallmentPayment: (installmentId, data) => 
    api.post(`/installments/${installmentId}/payments`, data),
  
  // Expenses
  getExpenses: (params = {}) => api.get('/expenses', { params }),
  getExpensesSummary: (params = {}) => api.get('/expenses/summary', { params }),
};
```

### Default Export

`api` can be used directly for other endpoints:

```javascript
import api from './services/api';

// Patients
api.get('/patients', { params: { search: 'ahmed' } });
api.post('/patients', patientData);

// Bills
api.get('/bills');
api.put('/bills/123', updatedBill);
```

---

## Development Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running on `localhost:5000`

### Installation

```bash
cd frontend
npm install
```

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Development Server

```bash
npm run dev
```

**URL:** `http://localhost:5173`

**Features:**
- Hot Module Replacement (HMR)
- Source maps
- Fast refresh

### Environment Variables

Create `.env` file for configuration:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Access in code:
```javascript
const baseURL = import.meta.env.VITE_API_BASE_URL;
```

---

## Build & Deployment

### Production Build

```bash
npm run build
```

**Output:** `dist/` directory containing:
- Optimized JS bundles
- Minified CSS
- Asset files with hashed filenames
- `index.html` with injected assets

### Build Configuration

**Vite Config (`vite.config.js`):**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
```

### Deployment Options

#### Static Hosting

Upload `dist/` contents to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static web server

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Performance Considerations

- **Code Splitting:** Routes are automatically split by Vite
- **Tree Shaking:** Dead code elimination
- **Asset Optimization:** Images/fonts optimized at build
- **Gzip/Brotli:** Enable compression on server
- **Caching:** Static assets have hashed filenames for long-term caching

---

## Component Hierarchy

```
App
├── ThemeProvider
│   └── AuthProvider
│       └── Router
│           └── AppShell (when authenticated)
│               ├── Toaster (react-hot-toast)
│               ├── Sidebar
│               ├── main.main-content
│               │   ├── TopBar
│               │   │   ├── TypeaheadSearch
│               │   │   ├── Quick Visit Button
│               │   │   ├── Quick Entry Button
│               │   │   └── Theme Toggle
│               │   └── div.page-content
│               │       └── Routes
│               │           ├── Dashboard
│               │           ├── PatientManagement
│               │           │   ├── PatientForm
│               │           │   └── PatientList
│               │           ├── PatientCaseSheet
│               │           │   ├── PatientHeader
│               │           │   ├── CaseSheetTabs
│               │           │   └── Tab Components...
│               │           ├── AppointmentManagement
│               │           │   └── AppointmentsCalendar
│               │           ├── BillManagement
│               │           │   ├── BillForm
│               │           │   ├── BillList
│               │           │   └── BillDetailModal
│               │           ├── FinancePage
│               │           │   ├── RevenueDashboard
│               │           │   └── ExpensesDashboard
│               │           └── StaffPage
│               │               ├── ProfessionalManagement
│               │               ├── SalaryManagement
│               │               └── PaymentInstallment components
│               ├── QuickEntryModal
│               └── QuickVisitWizard
│                   ├── Step1Patient
│                   ├── Step2Treatment
│                   ├── Step3Billing
│                   ├── Step4Review
│                   └── SuccessToast
│           └── Login (when not authenticated)
```

---

## Toast Notifications

React Hot Toast configuration (in `App.jsx`):

```javascript
<Toaster
  position="top-center"
  toastOptions={{
    duration: 3500,
    style: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-hover)',
      borderRadius: '12px',
      fontFamily: 'Cairo, Tajawal, sans-serif',
      fontSize: '14px',
      direction: 'rtl',
    },
    success: { iconTheme: { primary: '#34D399', secondary: 'transparent' } },
    error: { iconTheme: { primary: '#F87171', secondary: 'transparent' } },
  }}
/>
```

**Usage:**
```javascript
import toast from 'react-hot-toast';

toast.success('تم الحفظ بنجاح');
toast.error('حدث خطأ');
```

---

## File Naming Conventions

| Pattern | Usage |
|---------|-------|
| `PascalCase.jsx` | React components |
| `camelCase.js` | Utilities, hooks |
| `kebab-case.css` | Stylesheets |
| `useCamelCase.js` | Custom hooks |

---

## Arabic Localization Notes

- All UI text is in Arabic
- Numbers formatted with `toLocaleString('ar-SA')`
- Currency displayed as "IQD" (Iraqi Dinar)
- Dates formatted with `toLocaleDateString('ar-SA')`
- RTL layout throughout

---

*Documentation generated for DentalCare MVP v2.0.0*
