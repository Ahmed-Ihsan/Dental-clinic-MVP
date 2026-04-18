# Dental App MVP

A minimal viable product for dental clinic patient management.

## Setup

### Backend
1. Navigate to backend: `cd backend`
2. Activate virtual environment: `venv\Scripts\activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run migrations: `flask db upgrade`
5. Start server: `python run.py`

### Frontend
1. Navigate to frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Features
- Add, view, search, delete patients
- Basic appointment and treatment management (backend ready, frontend partial)

## Testing
- Install pytest: `pip install pytest`
- Run tests: `cd backend && pytest`