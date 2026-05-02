# DentalCare Backend & Database Documentation

**Version:** 2.0.0  
**Last Updated:** May 2026  
**System:** Dental Clinic Management System (MVP)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Authentication & Security](#authentication--security)
5. [Configuration](#configuration)
6. [Development Guide](#development-guide)
7. [Testing](#testing)

---

## Architecture Overview

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Flask | Latest |
| ORM | SQLAlchemy + Flask-Migrate | Latest |
| Database | SQLite (Development) / PostgreSQL (Production) | 3.x |
| Authentication | Flask-Login | Latest |
| CORS | Flask-CORS | Latest |
| Testing | pytest | Latest |

### Project Structure

```
backend/
├── app.py                    # Application entry point
├── database.py              # Database instance configuration
├── requirements.txt         # Python dependencies
├── config/                  # Configuration modules
├── controllers/             # Business logic controllers
├── middleware/              # Request/response middleware
├── migrations/              # Alembic database migrations
│   ├── alembic.ini
│   ├── env.py
│   └── versions/            # Migration scripts
├── models/                  # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── appointment.py
│   ├── bill.py
│   ├── communication.py
│   ├── expense.py
│   ├── installment_payment.py
│   ├── insurance.py
│   ├── medical_history.py
│   ├── patient.py
│   ├── payment_installment.py
│   ├── payroll.py
│   ├── professional.py
│   ├── salary.py
│   ├── salary_component.py
│   ├── salary_payment.py
│   ├── treatment.py
│   └── user.py
├── routes/                  # API route blueprints
│   ├── appointment_routes.py
│   ├── auth_routes.py
│   ├── bill_routes.py
│   ├── expense_routes.py
│   ├── installment_routes.py
│   ├── medical_history_routes.py
│   ├── patient_routes.py
│   ├── payroll_routes.py
│   ├── professional_routes.py
│   ├── revenue_routes.py
│   ├── salary_routes.py
│   ├── search_routes.py
│   └── treatment_routes.py
├── tests/                   # Test suite
│   ├── conftest.py
│   ├── test_appointment.py
│   ├── test_auth.py
│   ├── test_bill.py
│   ├── test_medical_history.py
│   ├── test_models.py
│   ├── test_patient.py
│   └── test_treatment.py
└── utils/                   # Utility functions
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Patient     │────<│   Appointment    │>────│   Treatment     │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)          │     │ id (PK)         │
│ first_name      │     │ patient_id (FK)  │     │ patient_id (FK) │
│ last_name       │     │ appointment_date │     │ appointment_id│
│ date_of_birth   │     │ start_time       │     │ treatment_type  │
│ gender          │     │ end_time         │     │ cost            │
│ address         │     │ dentist_id       │     │ treatment_date  │
│ phone           │     │ status           │     │ notes           │
│ email           │     │ notes            │     └─────────────────┘
│ emergency_contact│    └──────────────────┘             │
│ created_at      │              │                      │
│ updated_at      │              │                      │
└─────────────────┘              │                      │
         │                     │                      │
         │                     │                      │
         ▼                     ▼                      ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ MedicalHistory  │     │      Bill        │────<│ Communication   │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)          │     │ id (PK)         │
│ patient_id (FK) │     │ patient_id (FK)  │     │ patient_id (FK) │
│ condition       │     │ appointment_id   │     │ type            │
│ diagnosis_date  │     │ total_amount     │     │ subject         │
│ notes           │     │ paid_amount      │     │ message         │
│ created_at      │     │ discount_amount  │     │ date_sent       │
│ updated_at      │     │ direct_cost      │     │ status          │
└─────────────────┘     │ balance          │     └─────────────────┘
                        │ due_date         │
                        │ status           │
                        └──────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Professional   │────<│     Salary       │>────│ SalaryComponent │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)          │     │ id (PK)         │
│ first_name      │     │ professional_id  │     │ salary_id (FK)  │
│ last_name       │     │ base_salary      │     │ component_type  │
│ specialty       │     │ currency         │     │ name            │
│ phone           │     │ salary_type      │     │ amount          │
│ email           │     │ effective_date   │     │ percentage      │
│ license_number  │     │ is_active        │     │ is_taxable      │
│ created_at      │     │ commission_pct   │     │ is_fixed        │
│ updated_at      │     └──────────────────┘     │ description     │
└─────────────────┘              │              │ effective_date  │
         │                     │              │ end_date        │
         │                     ▼              └─────────────────┘
         │            ┌──────────────────┐
         │            │     Payroll      │
         │            ├──────────────────┤
         │            │ id (PK)          │
         │            │ payroll_period   │
         └───────────<│ professional_id  │
                      │ salary_id (FK)   │
                      │ base_salary      │
                      │ total_allowances │
                      │ total_commission │
                      │ total_deductions │
                      │ gross_salary     │
                      │ net_salary       │
                      │ status           │
                      └──────────────────┘
                              │
                              ▼
                      ┌──────────────────┐
                      │  SalaryPayment   │
                      ├──────────────────┤
                      │ id (PK)          │
                      │ payroll_id (FK)  │
                      │ professional_id  │
                      │ amount           │
                      │ payment_method   │
                      │ payment_date     │
                      │ status           │
                      └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│PaymentInstallment│────<│InstallmentPayment│
├─────────────────┤     ├──────────────────┤
│ id (PK)         │     │ id (PK)          │
│ professional_id │     │ installment_id   │
│ installment_type│     │ professional_id  │
│ title           │     │ installment_num  │
│ total_amount    │     │ amount           │
│ installment_amt │     │ payment_date     │
│ total_installs  │     │ due_date         │
│ completed_insts │     │ payment_method   │
│ remaining_amt   │     │ status           │
│ frequency       │     └──────────────────┘
│ start_date      │
│ next_due_date   │
│ status          │
└─────────────────┘

┌─────────────────┐
│    Expense      │
├─────────────────┤
│ id (PK)         │
│ category        │
│ description     │
│ amount          │
│ paid_amount     │
│ balance         │
│ doctor_id (FK)  │
│ patient_id (FK) │
│ payment_method  │
│ receipt_id      │
│ status          │
│ date            │
└─────────────────┘

┌─────────────────┐
│  Insurance      │
├─────────────────┤
│ id (PK)         │
│ patient_id (FK) │
│ provider        │
│ policy_number   │
│ coverage_details│
│ expiry_date     │
└─────────────────┘

┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ username (UQ)   │
│ password_hash   │
│ created_at      │
└─────────────────┘
```

### Table Specifications

#### `patients`
Core patient demographic information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| first_name | VARCHAR(50) | NOT NULL | Patient first name |
| last_name | VARCHAR(50) | NOT NULL | Patient last name |
| date_of_birth | DATE | NOT NULL | Birth date (ISO format) |
| gender | VARCHAR(10) | | Gender identifier |
| address | VARCHAR(200) | | Physical address |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(100) | | Email address |
| emergency_contact | VARCHAR(100) | | Emergency contact info |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Relationships:**
- One-to-Many: `medical_histories`, `appointments`, `treatments`, `bills`, `insurances`, `communications`, `expenses`

---

#### `appointments`
Appointment scheduling records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| patient_id | INTEGER | FK → patients.id, NOT NULL | Linked patient |
| appointment_date | DATE | NOT NULL | Scheduled date |
| start_time | TIME | NOT NULL | Start time |
| end_time | TIME | NOT NULL | End time |
| dentist_id | INTEGER | | Assigned professional ID |
| status | VARCHAR(20) | DEFAULT 'scheduled' | Status enum |
| notes | TEXT | | Additional notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Status Values:** `scheduled`, `confirmed`, `completed`, `cancelled`

**Relationships:**
- Many-to-One: `patient`
- One-to-Many: `treatments`, `bills`

---

#### `treatments`
Dental treatment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| patient_id | INTEGER | FK → patients.id, NOT NULL | Linked patient |
| appointment_id | INTEGER | FK → appointments.id | Linked appointment |
| treatment_type | VARCHAR(100) | NOT NULL | Type of procedure |
| cost | FLOAT | NOT NULL | Treatment cost |
| notes | TEXT | | Clinical notes |
| treatment_date | DATE | NOT NULL | Date performed |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Relationships:**
- Many-to-One: `patient`, `appointment`

---

#### `bills`
Financial billing records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| patient_id | INTEGER | FK → patients.id, NOT NULL | Linked patient |
| appointment_id | INTEGER | FK → appointments.id | Linked appointment |
| total_amount | FLOAT | NOT NULL | Bill total |
| paid_amount | FLOAT | DEFAULT 0 | Amount paid |
| discount_amount | FLOAT | DEFAULT 0 | Discount applied |
| direct_cost | FLOAT | DEFAULT 0 | Direct treatment cost |
| balance | FLOAT | NOT NULL | Remaining balance |
| due_date | DATE | | Payment due date |
| status | VARCHAR(20) | DEFAULT 'unpaid' | Payment status |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Status Values:** `unpaid`, `partial`, `paid`, `pending`, `overdue`

**Relationships:**
- Many-to-One: `patient`, `appointment`

---

#### `medical_history`
Patient medical condition records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| patient_id | INTEGER | FK → patients.id, NOT NULL | Linked patient |
| condition | VARCHAR(200) | NOT NULL | Medical condition |
| diagnosis_date | DATE | NOT NULL | Date diagnosed |
| notes | TEXT | | Additional notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Relationships:**
- Many-to-One: `patient`

---

#### `professionals`
Dental staff/doctor records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| first_name | VARCHAR(50) | NOT NULL | First name |
| last_name | VARCHAR(50) | NOT NULL | Last name |
| specialty | VARCHAR(100) | | Medical specialty |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(100) | | Email address |
| license_number | VARCHAR(50) | | Professional license |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Relationships:**
- One-to-Many: `salaries`, `payrolls`, `salary_payments`, `payment_installments`, `installment_payments`, `expenses`

---

#### `salaries`
Salary structure definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| professional_id | INTEGER | FK → professionals.id, NOT NULL | Linked professional |
| base_salary | FLOAT | NOT NULL | Base salary amount |
| currency | VARCHAR(3) | DEFAULT 'SAR' | Currency code |
| salary_type | VARCHAR(20) | DEFAULT 'monthly' | Payment frequency |
| effective_date | DATE | NOT NULL | Effective start date |
| end_date | DATE | | End date (null = current) |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| commission_percentage | FLOAT | DEFAULT 0 | Revenue share % |
| notes | TEXT | | Additional notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Salary Types:** `monthly`, `hourly`, `daily`

**Relationships:**
- Many-to-One: `professional`
- One-to-Many: `components` (SalaryComponent), `payrolls`

---

#### `salary_components`
Salary additions/deductions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| salary_id | INTEGER | FK → salaries.id, NOT NULL | Linked salary |
| component_type | VARCHAR(20) | NOT NULL | Type enum |
| name | VARCHAR(100) | NOT NULL | Component name |
| amount | FLOAT | NOT NULL | Monetary value |
| percentage | FLOAT | | Percentage if applicable |
| is_taxable | BOOLEAN | DEFAULT TRUE | Tax status |
| is_fixed | BOOLEAN | DEFAULT TRUE | Fixed vs variable |
| description | TEXT | | Description |
| effective_date | DATE | NOT NULL | Start date |
| end_date | DATE | | End date |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Component Types:** `allowance`, `deduction`, `bonus`

**Relationships:**
- Many-to-One: `salary`

---

#### `payrolls`
Payroll processing records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| payroll_period | VARCHAR(7) | NOT NULL | Format: YYYY-MM |
| professional_id | INTEGER | FK → professionals.id, NOT NULL | Linked professional |
| salary_id | INTEGER | FK → salaries.id, NOT NULL | Linked salary |
| base_salary | FLOAT | NOT NULL | Base salary for period |
| total_allowances | FLOAT | DEFAULT 0 | Sum of allowances |
| total_commission | FLOAT | DEFAULT 0 | Commission earned |
| total_deductions | FLOAT | DEFAULT 0 | Sum of deductions |
| debt_deductions | FLOAT | DEFAULT 0 | Debt repayments |
| deducted_expense_ids | TEXT | DEFAULT '[]' | JSON array of cleared debts |
| gross_salary | FLOAT | NOT NULL | Pre-deduction total |
| net_salary | FLOAT | NOT NULL | Final payable amount |
| working_days | INTEGER | DEFAULT 30 | Expected work days |
| actual_days_worked | INTEGER | DEFAULT 30 | Actual days worked |
| overtime_hours | FLOAT | DEFAULT 0 | OT hours |
| overtime_rate | FLOAT | DEFAULT 0 | OT rate |
| overtime_amount | FLOAT | DEFAULT 0 | OT total |
| tax_amount | FLOAT | DEFAULT 0 | Tax withheld |
| social_insurance | FLOAT | DEFAULT 0 | Insurance deduction |
| status | VARCHAR(20) | DEFAULT 'draft' | Processing status |
| processed_date | DATETIME | | Date processed |
| payment_date | DATETIME | | Date paid |
| notes | TEXT | | Notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Status Values:** `draft`, `processed`, `paid`, `cancelled`

**Relationships:**
- Many-to-One: `professional`, `salary`
- One-to-Many: `payments` (SalaryPayment)

---

#### `salary_payments`
Individual salary payment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| payroll_id | INTEGER | FK → payrolls.id, NOT NULL | Linked payroll |
| professional_id | INTEGER | FK → professionals.id, NOT NULL | Linked professional |
| amount | FLOAT | NOT NULL | Payment amount |
| payment_method | VARCHAR(20) | NOT NULL | Method enum |
| payment_date | DATE | NOT NULL | Payment date |
| reference_number | VARCHAR(100) | | Bank reference |
| bank_name | VARCHAR(100) | | Bank name |
| account_number | VARCHAR(50) | | Account number |
| status | VARCHAR(20) | DEFAULT 'completed' | Payment status |
| transaction_id | VARCHAR(100) | | External reference |
| notes | TEXT | | Notes |
| processed_by | VARCHAR(100) | | Processor name |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Payment Methods:** `bank_transfer`, `cash`, `check`

**Relationships:**
- Many-to-One: `payroll`, `professional`

---

#### `payment_installments`
Installment plan definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| professional_id | INTEGER | FK → professionals.id, NOT NULL | Linked professional |
| installment_type | VARCHAR(20) | NOT NULL | Type enum |
| title | VARCHAR(100) | NOT NULL | Plan title |
| total_amount | FLOAT | NOT NULL | Total to repay |
| installment_amount | FLOAT | NOT NULL | Per-payment amount |
| total_installments | INTEGER | NOT NULL | Total payments |
| completed_installments | INTEGER | DEFAULT 0 | Payments made |
| remaining_amount | FLOAT | NOT NULL | Balance remaining |
| frequency | VARCHAR(20) | NOT NULL | Payment frequency |
| start_date | DATE | NOT NULL | Plan start date |
| next_due_date | DATE | NOT NULL | Next payment due |
| end_date | DATE | | Plan end date |
| payment_method | VARCHAR(20) | NOT NULL | Default method |
| bank_name | VARCHAR(100) | | Bank name |
| account_number | VARCHAR(50) | | Account number |
| reference_info | VARCHAR(200) | | Reference info |
| status | VARCHAR(20) | DEFAULT 'active' | Plan status |
| auto_process | BOOLEAN | DEFAULT FALSE | Auto-process flag |
| priority | VARCHAR(20) | DEFAULT 'normal' | Priority level |
| description | TEXT | | Description |
| notes | TEXT | | Notes |
| created_by | VARCHAR(100) | | Creator name |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Installment Types:** `loan_repayment`, `salary_installment`, `bonus_schedule`, `deduction_schedule`, `advance_repayment`

**Frequencies:** `daily`, `weekly`, `monthly`

**Relationships:**
- Many-to-One: `professional`
- One-to-Many: `payments` (InstallmentPayment)

---

#### `installment_payments`
Individual installment payment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| installment_id | INTEGER | FK → payment_installments.id, NOT NULL | Linked plan |
| professional_id | INTEGER | FK → professionals.id, NOT NULL | Linked professional |
| installment_number | INTEGER | NOT NULL | Payment sequence |
| amount | FLOAT | NOT NULL | Payment amount |
| payment_date | DATE | NOT NULL | Actual payment date |
| due_date | DATE | NOT NULL | Scheduled due date |
| payment_method | VARCHAR(20) | NOT NULL | Method used |
| reference_number | VARCHAR(100) | | Reference |
| bank_name | VARCHAR(100) | | Bank name |
| account_number | VARCHAR(50) | | Account number |
| transaction_id | VARCHAR(100) | | External ref |
| status | VARCHAR(20) | DEFAULT 'completed' | Payment status |
| is_overdue | BOOLEAN | DEFAULT FALSE | Overdue flag |
| days_overdue | INTEGER | DEFAULT 0 | Days overdue |
| notes | TEXT | | Notes |
| processed_by | VARCHAR(100) | | Processor |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Relationships:**
- Many-to-One: `payment_installment`, `professional`

---

#### `expenses`
Clinic expense tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| category | VARCHAR(50) | NOT NULL | Expense category |
| description | VARCHAR(255) | NOT NULL | Description |
| amount | FLOAT | NOT NULL | Total amount |
| paid_amount | FLOAT | DEFAULT 0 | Amount paid |
| balance | FLOAT | DEFAULT 0 | Remaining balance |
| doctor_id | INTEGER | FK → professionals.id | Linked doctor |
| patient_id | INTEGER | FK → patients.id | Linked patient |
| payment_method | VARCHAR(50) | | Payment method |
| receipt_id | VARCHAR(100) | | Receipt reference |
| status | VARCHAR(20) | DEFAULT 'debt' | Payment status |
| date | DATE | NOT NULL | Expense date |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Categories:** `clinic`, `doctor`, `patient`, `lab`, `payroll`

**Relationships:**
- Many-to-One: `doctor` (Professional), `patient`

---

#### `insurance`
Patient insurance records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| patient_id | INTEGER | FK → patients.id, NOT NULL | Linked patient |
| provider | VARCHAR(100) | NOT NULL | Insurance provider |
| policy_number | VARCHAR(50) | NOT NULL | Policy identifier |
| coverage_details | TEXT | | Coverage info |
| expiry_date | DATE | | Policy expiry |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Relationships:**
- Many-to-One: `patient`

---

#### `communications`
Patient communication logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| patient_id | INTEGER | FK → patients.id, NOT NULL | Linked patient |
| type | VARCHAR(20) | NOT NULL | Communication type |
| subject | VARCHAR(200) | | Message subject |
| message | TEXT | NOT NULL | Message content |
| date_sent | DATETIME | DEFAULT CURRENT_TIMESTAMP | Send timestamp |
| status | VARCHAR(20) | DEFAULT 'sent' | Delivery status |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | Auto-update | Last modification timestamp |

**Relationships:**
- Many-to-One: `patient`

---

#### `users`
System authentication accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| username | VARCHAR(150) | UNIQUE, NOT NULL | Login username |
| password_hash | VARCHAR(150) | NOT NULL | Hashed password |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication

All endpoints except `/login` and `/register` require authentication via Flask-Login session.

#### POST `/login`
Authenticate user and create session.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "message": "Logged in successfully"
}
```

**Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

#### POST `/logout`
Terminate user session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### POST `/register`
Create new user account.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (201):**
```json
{
  "message": "User created"
}
```

---

### Patients

#### GET `/patients`
List all patients with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name/email |
| gender | string | Filter by gender |
| date_from | date | Birth date from (YYYY-MM-DD) |
| date_to | date | Birth date to (YYYY-MM-DD) |

**Response (200):**
```json
[
  {
    "id": 1,
    "first_name": "string",
    "last_name": "string",
    "date_of_birth": "YYYY-MM-DD",
    "gender": "string",
    "address": "string",
    "phone": "string",
    "email": "string",
    "emergency_contact": "string",
    "medical_histories": [...],
    "created_at": "YYYY-MM-DD HH:MM:SS",
    "updated_at": "YYYY-MM-DD HH:MM:SS"
  }
]
```

#### POST `/patients`
Create new patient record.

**Required Fields:** `first_name`, `last_name`, `date_of_birth`

**Request:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "emergency_contact": "string"
}
```

#### GET `/patients/{id}`
Get single patient by ID.

#### PUT `/patients/{id}`
Update patient record.

#### DELETE `/patients/{id}`
Delete patient record.

---

### Appointments

#### GET `/appointments`
List appointments with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| date_from | date | Date range start |
| date_to | date | Date range end |
| patient_id | integer | Filter by patient |

#### POST `/appointments`
Create appointment.

**Required Fields:** `patient_id`, `appointment_date`, `start_time`, `end_time`

**Request:**
```json
{
  "patient_id": 1,
  "appointment_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "dentist_id": 1,
  "status": "scheduled",
  "notes": "string"
}
```

#### GET `/appointments/{id}`
Get single appointment.

#### PUT `/appointments/{id}`
Update appointment.

#### DELETE `/appointments/{id}`
Delete appointment.

---

### Treatments

#### GET `/treatments`
List all treatments.

#### POST `/treatments`
Create treatment record.

**Required Fields:** `patient_id`, `treatment_type`, `cost`, `treatment_date`

**Request:**
```json
{
  "patient_id": 1,
  "appointment_id": 1,
  "treatment_type": "string",
  "cost": 0.0,
  "notes": "string",
  "treatment_date": "YYYY-MM-DD"
}
```

#### GET `/treatments/{id}`
Get single treatment.

#### PUT `/treatments/{id}`
Update treatment.

#### DELETE `/treatments/{id}`
Delete treatment.

---

### Bills

#### GET `/bills`
List bills with optional status filter.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |

#### POST `/bills`
Create bill.

**Required Fields:** `patient_id`, `total_amount`

**Request:**
```json
{
  "patient_id": 1,
  "appointment_id": 1,
  "total_amount": 0.0,
  "paid_amount": 0.0,
  "discount_amount": 0.0,
  "direct_cost": 0.0,
  "balance": 0.0,
  "due_date": "YYYY-MM-DD",
  "status": "unpaid"
}
```

#### GET `/bills/{id}`
Get single bill.

#### PUT `/bills/{id}`
Update bill.

#### DELETE `/bills/{id}`
Delete bill.

---

### Medical Histories

#### GET `/medical_histories`
List medical histories.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| patient_id | integer | Filter by patient |

#### POST `/medical_histories`
Create medical history entry.

**Required Fields:** `patient_id`, `condition`, `diagnosis_date`

**Request:**
```json
{
  "patient_id": 1,
  "condition": "string",
  "diagnosis_date": "YYYY-MM-DD",
  "notes": "string"
}
```

#### GET `/medical_histories/{id}`
Get single entry.

#### PUT `/medical_histories/{id}`
Update entry.

#### DELETE `/medical_histories/{id}`
Delete entry.

---

### Professionals

#### GET `/professionals`
List professionals with search.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name/specialty/email |

#### POST `/professionals`
Create professional.

**Required Fields:** `first_name`, `last_name`

**Request:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "specialty": "string",
  "phone": "string",
  "email": "string",
  "license_number": "string"
}
```

#### GET `/professionals/{id}`
Get single professional.

#### PUT `/professionals/{id}`
Update professional.

#### DELETE `/professionals/{id}`
Delete professional.

---

### Salary Management

#### GET `/salaries`
List salary structures.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| professional_id | integer | Filter by professional |
| is_active | boolean | Filter by status |

#### POST `/salaries`
Create salary structure.

**Required Fields:** `professional_id`, `base_salary`, `effective_date`

**Request:**
```json
{
  "professional_id": 1,
  "base_salary": 0.0,
  "currency": "SAR",
  "salary_type": "monthly",
  "effective_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "commission_percentage": 0.0,
  "notes": "string"
}
```

#### GET `/salaries/{id}`
Get salary details.

#### PUT `/salaries/{id}`
Update salary.

#### DELETE `/salaries/{id}`
Delete salary (fails if payroll records exist).

#### GET `/salaries/{id}/components`
List salary components.

#### POST `/salaries/{id}/components`
Add salary component.

**Required Fields:** `component_type`, `name`, `amount`, `effective_date`

**Request:**
```json
{
  "component_type": "allowance",
  "name": "string",
  "amount": 0.0,
  "percentage": 0.0,
  "is_taxable": true,
  "is_fixed": true,
  "description": "string",
  "effective_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}
```

#### PUT `/salary-components/{id}`
Update component.

#### DELETE `/salary-components/{id}`
Delete component.

---

### Payroll

#### GET `/payrolls`
List payroll records.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| professional_id | integer | Filter by professional |
| payroll_period | string | Format: YYYY-MM |
| status | string | Filter by status |

#### POST `/payrolls/generate`
Generate payroll for period.

**Request:**
```json
{
  "professional_ids": [1, 2],
  "payroll_period": "2026-05",
  "preview_only": false
}
```

#### GET `/payrolls/{id}`
Get payroll details.

#### PUT `/payrolls/{id}`
Update payroll.

#### POST `/payrolls/{id}/process`
Mark payroll as processed.

#### POST `/payrolls/{id}/pay`
Process payroll payment.

**Required Fields:** `payment_method`, `payment_date`

**Request:**
```json
{
  "payment_method": "bank_transfer",
  "payment_date": "YYYY-MM-DD",
  "reference_number": "string",
  "bank_name": "string",
  "account_number": "string",
  "notes": "string",
  "processed_by": "string"
}
```

#### DELETE `/payrolls/{id}`
Delete payroll (fails if status is 'paid').

#### GET `/payrolls/{id}/payslip`
Get detailed payslip.

#### GET `/payrolls/analytics`
Get payroll analytics.

#### GET `/salary-payments`
List salary payments.

---

### Installments

#### GET `/installments`
List installment plans.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| professional_id | integer | Filter by professional |
| installment_type | string | Filter by type |
| status | string | Filter by status |

#### POST `/installments`
Create installment plan.

**Required Fields:** `professional_id`, `installment_type`, `title`, `total_amount`, `installment_amount`, `total_installments`, `frequency`, `start_date`

**Request:**
```json
{
  "professional_id": 1,
  "installment_type": "loan_repayment",
  "title": "string",
  "total_amount": 0.0,
  "installment_amount": 0.0,
  "total_installments": 1,
  "frequency": "monthly",
  "start_date": "YYYY-MM-DD",
  "payment_method": "bank_transfer",
  "auto_process": false,
  "description": "string",
  "notes": "string"
}
```

#### GET `/installments/{id}`
Get installment details.

#### PUT `/installments/{id}`
Update installment.

#### DELETE `/installments/{id}`
Delete installment (fails if payments exist).

#### GET `/installments/{id}/payments`
List installment payments.

#### POST `/installments/{id}/payments`
Record installment payment.

**Required Fields:** `amount`, `payment_date`

**Request:**
```json
{
  "amount": 0.0,
  "payment_date": "YYYY-MM-DD",
  "payment_method": "string",
  "reference_number": "string",
  "notes": "string"
}
```

#### GET `/installment-payments/{id}`
Get payment details.

#### PUT `/installment-payments/{id}`
Update payment.

#### DELETE `/installment-payments/{id}`
Delete payment (only last payment can be deleted).

#### GET `/installments/analytics`
Get installment analytics.

#### GET `/installments/overdue`
List overdue installments.

#### POST `/installments/process-auto`
Process auto-scheduled installments.

---

### Expenses

#### GET `/api/expenses`
List expenses with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| status | string | Filter by status |
| doctor_id | integer | Filter by doctor |
| patient_id | integer | Filter by patient |
| start_date | date | Date range start |
| end_date | date | Date range end |

#### POST `/api/expenses`
Create expense.

**Required Fields:** `category`, `description`, `amount`, `date`

**Request:**
```json
{
  "category": "clinic",
  "description": "string",
  "amount": 0.0,
  "paid_amount": 0.0,
  "doctor_id": 1,
  "patient_id": 1,
  "payment_method": "string",
  "receipt_id": "string",
  "date": "YYYY-MM-DD"
}
```

#### GET `/api/expenses/{id}`
Get expense details.

#### PUT `/api/expenses/{id}`
Update expense.

#### DELETE `/api/expenses/{id}`
Delete expense.

#### GET `/api/expenses/summary`
Get expense summary statistics.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | date | Date range start |
| end_date | date | Date range end |

---

### Revenue

#### POST `/api/revenue/quick-payment`
Record quick payment transaction.

**Required Fields:** `patient_id`, `treatment_type`, `total_cost`

**Request:**
```json
{
  "patient_id": 1,
  "treatment_type": "string",
  "total_cost": 0.0,
  "paid_amount": 0.0
}
```

#### GET `/api/revenue/summary`
Get revenue summary with trends.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | date | Date range start |
| end_date | date | Date range end |

**Response:**
```json
{
  "total_revenue": 0.0,
  "total_paid": 0.0,
  "total_balance": 0.0,
  "total_direct_cost": 0.0,
  "total_net_profit": 0.0,
  "profit_margin_percent": 0.0,
  "cases_count": 0,
  "trends": {
    "paid": { "value": "+0%", "up": true },
    "balance": { "value": "+0%", "up": true },
    "net_profit": { "value": "+0%", "up": true },
    "margin": { "value": "+0%", "up": true }
  }
}
```

#### GET `/api/revenue/categories`
Get revenue breakdown by treatment category.

#### GET `/api/revenue/payments`
Get detailed payment ledger.

---

### Search

#### GET `/search`
Global search across all entities.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |

**Response:**
```json
{
  "patients": [...],
  "appointments": [...],
  "treatments": [...],
  "medical_histories": [...],
  "bills": [...],
  "professionals": [...]
}
```

---

## Authentication & Security

### Session Management

The application uses Flask-Login for session-based authentication:

- **Session Cookie:** HTTP-only, SameSite=Lax
- **Secret Key:** Configured in `app.py` (must be changed for production)
- **Session Duration:** Browser session (no permanent sessions)

### Password Security

- Passwords hashed using Werkzeug's `generate_password_hash` (PBKDF2)
- Salted hashes stored in `password_hash` column

### CORS Configuration

```python
CORS(
    app,
    origins=["http://localhost:5173", "http://localhost:5174"],
    supports_credentials=True,
    resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5174"]}}
)
```

---

## Configuration

### Application Settings (`app.py`)

| Setting | Value | Description |
|---------|-------|-------------|
| `SQLALCHEMY_DATABASE_URI` | `sqlite:///dental.db` | Database connection |
| `SQLALCHEMY_TRACK_MODIFICATIONS` | `False` | Disable modification tracking |
| `SECRET_KEY` | `"your_secret_key"` | Session encryption (CHANGE IN PRODUCTION) |
| `SESSION_COOKIE_SAMESITE` | `"Lax"` | Cookie same-site policy |

### Production Checklist

1. Change `SECRET_KEY` to cryptographically secure random string
2. Switch from SQLite to PostgreSQL:
   ```python
   app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:pass@host/dbname"
   ```
3. Enable HTTPS and secure cookies:
   ```python
   app.config["SESSION_COOKIE_SECURE"] = True
   app.config["SESSION_COOKIE_HTTPONLY"] = True
   ```
4. Configure proper logging
5. Set up database backups
6. Enable firewall rules

---

## Development Guide

### Setup Instructions

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run database migrations:**
   ```bash
   flask db upgrade
   ```

4. **Start development server:**
   ```bash
   python app.py
   ```

Server runs at `http://localhost:5000`

### Database Migrations

**Create migration:**
```bash
flask db migrate -m "Description of changes"
```

**Apply migrations:**
```bash
flask db upgrade
```

**Rollback:**
```bash
flask db downgrade
```

---

## Testing

### Test Suite Structure

```
tests/
├── conftest.py           # Pytest configuration
├── test_models.py        # Model unit tests
├── test_patient.py       # Patient API tests
├── test_appointment.py   # Appointment API tests
├── test_treatment.py     # Treatment API tests
├── test_bill.py          # Billing API tests
├── test_medical_history.py # Medical history tests
└── test_auth.py          # Authentication tests
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_patient.py

# Run with verbose output
pytest -v
```

### Test Fixtures (`conftest.py`)

Key fixtures:
- `app` - Flask application instance
- `client` - Test HTTP client
- `_db` - Database instance
- `session` - Database session
- `sample_patient`, `sample_appointment`, etc. - Sample data

---

## API Summary Table

| Resource | Endpoint | Methods | Description |
|----------|----------|---------|-------------|
| Auth | `/login` | POST | User authentication |
| Auth | `/logout` | POST | End session |
| Auth | `/register` | POST | Create account |
| Auth | `/me` | GET | Current user info |
| Patients | `/patients` | GET, POST | List/Create |
| Patients | `/patients/{id}` | GET, PUT, DELETE | CRUD |
| Appointments | `/appointments` | GET, POST | List/Create |
| Appointments | `/appointments/{id}` | GET, PUT, DELETE | CRUD |
| Treatments | `/treatments` | GET, POST | List/Create |
| Treatments | `/treatments/{id}` | GET, PUT, DELETE | CRUD |
| Bills | `/bills` | GET, POST | List/Create |
| Bills | `/bills/{id}` | GET, PUT, DELETE | CRUD |
| Medical History | `/medical_histories` | GET, POST | List/Create |
| Medical History | `/medical_histories/{id}` | GET, PUT, DELETE | CRUD |
| Professionals | `/professionals` | GET, POST | List/Create |
| Professionals | `/professionals/{id}` | GET, PUT, DELETE | CRUD |
| Salaries | `/salaries` | GET, POST | List/Create |
| Salaries | `/salaries/{id}` | GET, PUT, DELETE | CRUD |
| Salary Components | `/salaries/{id}/components` | GET, POST | List/Add |
| Salary Components | `/salary-components/{id}` | PUT, DELETE | Update/Delete |
| Payrolls | `/payrolls` | GET | List |
| Payrolls | `/payrolls/generate` | POST | Generate |
| Payrolls | `/payrolls/{id}` | GET, PUT, DELETE | CRUD |
| Payrolls | `/payrolls/{id}/process` | POST | Process |
| Payrolls | `/payrolls/{id}/pay` | POST | Pay |
| Payrolls | `/payrolls/{id}/payslip` | GET | Payslip |
| Payrolls | `/payrolls/analytics` | GET | Analytics |
| Salary Payments | `/salary-payments` | GET | List |
| Installments | `/installments` | GET, POST | List/Create |
| Installments | `/installments/{id}` | GET, PUT, DELETE | CRUD |
| Installments | `/installments/{id}/payments` | GET, POST | List/Add |
| Installment Payments | `/installment-payments/{id}` | GET, PUT, DELETE | CRUD |
| Installments | `/installments/analytics` | GET | Analytics |
| Installments | `/installments/overdue` | GET | Overdue list |
| Installments | `/installments/process-auto` | POST | Auto-process |
| Expenses | `/api/expenses` | GET, POST | List/Create |
| Expenses | `/api/expenses/{id}` | GET, PUT, DELETE | CRUD |
| Expenses | `/api/expenses/summary` | GET | Summary |
| Revenue | `/api/revenue/quick-payment` | POST | Quick entry |
| Revenue | `/api/revenue/summary` | GET | Summary |
| Revenue | `/api/revenue/categories` | GET | By category |
| Revenue | `/api/revenue/payments` | GET | Ledger |
| Search | `/search` | GET | Global search |

---

*Documentation generated for DentalCare MVP v2.0.0*
