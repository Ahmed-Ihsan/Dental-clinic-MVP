# Dental Clinic Patient Management System MVP

## Description

A web-based patient management system for dental clinics that allows staff to efficiently manage patient records, schedule appointments, and track treatments. The system aims to digitize traditional paper-based processes and improve clinic operations. Built with a modern tech stack including Flask backend and React frontend.

## Features

- **Patient Management**: Register new patients, view and update patient profiles, search patients by name or email
- **Appointment Scheduling**: Schedule appointments with date and time, track appointment status
- **Treatment Records**: Record and manage patient treatments with details and costs
- **Search and Filtering**: Basic search functionality for patients and records
- **Responsive Web Interface**: Accessible from desktop and mobile devices

## Technologies Used

### Backend
- **Flask**: Python web framework for API development
- **SQLAlchemy**: ORM for database interactions
- **Flask-Migrate**: Database migration management with Alembic
- **Flask-CORS**: Cross-Origin Resource Sharing support
- **Flask-Login**: User authentication (prepared for future implementation)
- **SQLite**: Database for MVP (upgradable to PostgreSQL/MySQL)

### Frontend
- **React**: JavaScript library for building user interfaces
- **Vite**: Fast build tool and development server
- **Axios**: HTTP client for API requests
- **React Router DOM**: Routing library for React
- **Recharts**: Chart library for data visualization
- **React Icons**: Icon library for UI components

### Testing
- **pytest**: Testing framework for Python backend

### Development Tools
- **Git**: Version control system
- **npm**: Package manager for Node.js
- **pip**: Package manager for Python

## Installation Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js and npm
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dental-clinic-mvp
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   # source venv/bin/activate
   pip install -r requirements.txt
   flask db upgrade
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Run the Application**
   - **Backend** (in backend directory):
     ```bash
     python run.py
     ```
   - **Frontend** (in frontend directory):
     ```bash
     npm run dev
     ```

5. **Run Tests**
   ```bash
   cd backend
   pytest
   ```

## Usage Guide

1. **Start the Backend**: Run `python run.py` in the backend directory. The API will be available at `http://localhost:5000`.

2. **Start the Frontend**: Run `npm run dev` in the frontend directory. Open your browser and navigate to `http://localhost:5173`.

3. **Managing Patients**:
   - Use the patient form to add new patients with their personal information
   - View the patient list to see all registered patients
   - Search for patients by name or email using the search functionality
   - Edit or delete patient records as needed

4. **Scheduling Appointments**:
   - Create new appointments by selecting a patient and specifying date and time
   - View upcoming appointments in the appointments section

5. **Recording Treatments**:
   - Add treatment records for patients with details about procedures performed
   - Include costs and notes for each treatment

The application provides a user-friendly interface for all dental clinic staff to manage patient data efficiently.

## API Documentation

The backend provides RESTful API endpoints for managing patients, appointments, and treatments. All endpoints return JSON responses and are prefixed with `/api`.

### Patients Endpoints
- `GET /api/patients` - List all patients (supports search query parameter)
- `POST /api/patients` - Create a new patient
- `GET /api/patients/<id>` - Get specific patient details
- `PUT /api/patients/<id>` - Update patient information
- `DELETE /api/patients/<id>` - Delete a patient

### Appointments Endpoints
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create a new appointment
- `GET /api/appointments/<id>` - Get specific appointment details
- `PUT /api/appointments/<id>` - Update appointment information
- `DELETE /api/appointments/<id>` - Delete an appointment

### Treatments Endpoints
- `GET /api/treatments` - List all treatments
- `POST /api/treatments` - Create a new treatment record
- `GET /api/treatments/<id>` - Get specific treatment details
- `PUT /api/treatments/<id>` - Update treatment information
- `DELETE /api/treatments/<id>` - Delete a treatment record

## Contributing Guidelines

We welcome contributions to improve the Dental Clinic Patient Management System! Please follow these guidelines:

1. **Fork the repository** and create your branch from `main`
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the existing code style
4. **Add tests** for new functionality
5. **Run tests**: `cd backend && pytest`
6. **Commit your changes**: `git commit -m 'Add some feature'`
7. **Push to the branch**: `git push origin feature/your-feature-name`
8. **Open a Pull Request** with a clear description of your changes

### Code Style
- Follow PEP 8 for Python code
- Use ESLint rules for JavaScript/React code
- Write descriptive commit messages
- Add comments for complex logic

## License Information

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact Information

For questions or support, please open an issue on GitHub or contact the development team.

## Acknowledgments

- Thanks to the Flask, React, and SQLAlchemy communities for their excellent frameworks and libraries
- Special thanks to all contributors and the open-source community

## Changelog

### v1.0.0 - Initial MVP Release
- Patient registration and management
- Appointment scheduling
- Treatment record tracking
- Basic search functionality
- Responsive web interface
- RESTful API backend

## Screenshots

Screenshots of the application will be added here once the UI is finalized.
