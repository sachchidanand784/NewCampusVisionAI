# Campus Vision AI

**Campus Vision AI** is an industry-level, production-ready Smart Campus Management System powered by artificial intelligence. It integrates real-time Facial Recognition, QR Code Pass validation, Access Hours Scheduling, and Role-Based Access Control (RBAC) to automate attendance tracking and secure campus borders.

---

## 🌟 Key Features

### 1. Facial Recognition & Verification
* **Face Registration**: Students upload a clear photo, which is processed using `dlib` and `face_recognition` to extract 128-dimensional mathematical encodings.
* **1-to-N Search**: Incoming snapshots from the gate monitoring terminal are compared in under 0.2 seconds against database encodings using euclidean distance metrics.
* **Database Storage**: The raw image URL (hosted on Cloudinary) and the JSON-serialized face vectors are stored securely inside PostgreSQL.

### 2. Access Scheduling & Late Enforcement
* **Rule Scheduler**: Configures access timing templates date-wise, day-of-the-week, or general fallback defaults.
* **Smart Late Tracking**: Automated gate entry checks label check-ins outside the allowed window as late.
* **Automatic Lockdown**: Implements a progressive compliance warning policy:
  * **3rd Late Entry**: Triggers warning email to user.
  * **4th Late Entry**: Triggers a strong alert warning.
  * **5th Late Entry**: The student account is automatically **blocked** and gate access is denied until manual admin unblock.

### 3. QR Code Pass system
* **Dynamic Generation**: Generates a unique encrypted academic card for every student containing their roll number, name, and profile credentials.
* **Guard Scan**: Gatemen can scan QR codes for quick credential checks if facial recognition is unavailable.

### 4. Admin Management Controls
* **Interactive Graphs**: Visualizes monthly attendance logs (Present, Absent, Late trends) using `Recharts`.
* **Roster Registry**: CRUD controls for student records, status monitoring, and access unblocking (resets block state and late logs).
* **Timings & Safety Switches**: Customize class start/end check-in times and toggle the global gate lockdown switch to deny entry to all.
* **Document Exports**: Generates formatted CSV lists and professional PDF registers.

---

## 📁 Project Folder Structure

```
CampusVisionAI/
├── Frontend/                 # React 19 + Vite + Tailwind CSS Front-end
│   ├── public/
│   ├── src/
│   │   ├── api/              # Axios API client (auth headers & interceptor)
│   │   ├── assets/           # General SVGs and logos
│   │   ├── components/       # Login portals & role-specific dashboards
│   │   ├── pages/            # Marketing & static legal guidelines pages
│   │   ├── context/          # AuthContext (JWT sessions store)
│   │   ├── App.jsx           # React Router DOM mapping & Protected Wraps
│   │   └── main.jsx
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
│
└── Backend/                  # Django REST Framework Backend
    ├── config/               # Settings, routing, & Vercel deployment json
    ├── apps/                 # Django App modules
    │   ├── accounts/         # User roles, OTP checks, authentication
    │   ├── students/         # Student profiles, face registration
    │   ├── attendance/       # Timings configurations, attendance log records
    │   ├── gate/             # Access rules & log files
    │   ├── qr/               # QR generation helper endpoints
    │   ├── reports/          # Excel CSV & ReportLab PDF generators
    │   ├── notifications/    # Mail notifications triggers
    │   └── ai_engine/        # OpenCV / Face Recognition calculations
    ├── services/             # Clean Architecture business helpers
    ├── static/
    ├── requirements.txt
    ├── .env.example
    ├── .gitignore
    └── manage.py
```

---

## 🚀 Setup & Execution Guide

### Prerequisite Environment Settings
* **Python**: Python 3.12+
* **Node.js**: Node 18+
* **Database**: PostgreSQL (falls back to SQLite for local development)
* **Image Hosting**: Cloudinary Account
* **Mail Server**: SMTP Mail Host (e.g. Gmail App Password)

### 1. Backend Server Setup
1. Navigate to the `Backend/` folder.
2. Initialize and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Unix/Mac:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
   Provide your specific credentials:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   SECRET_KEY=django-secure-random-key
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_app_password
   JWT_SECRET=your_jwt_signing_key
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Run the local development server:
   ```bash
   python manage.py runserver
   ```
   The API will start at `http://localhost:8000/api`.

### 2. Frontend App Setup
1. Navigate to the `Frontend/` folder.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Set your target backend URL inside the `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
4. Start the local dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🛡️ API Endpoints Summary

### Authentication Portal (`/api/auth/`)
* `POST /login/` - JWT login returning access token + user details + role profile.
* `POST /refresh/` - Rotate refresh token.
* `POST /request-otp/` - Trigger 6-digit email OTP.
* `POST /verify-otp/` - Validate verification code.
* `POST /register/` - Register new user.
* `POST /reset-password-request/` - Request password recovery OTP.
* `POST /reset-password-confirm/` - Set new password.
* `GET/PATCH /profile/` - Access/update personal details.

### Student Management (`/api/students/`)
* `GET /` - Search/list student directories (Admins & Gatekeepers).
* `POST /register-face/` - Student uploads face image for model compilation.
* `GET/PUT/DELETE /<id>/` - Retrieve, update, or remove profile (Admin only).
* `POST /reset/<id>/` - Unblocks student access and clears late counters.

### Attendance & Timings (`/api/attendance/`)
* `GET/PUT /config/` - Update global Present range start/end limits & gate switch.
* `GET /` - List logs (Students view their own; Admins/Guards filter global logs).
* `POST /manual-mark/` - Manually update class register status for a student.

### Gate Controls (`/api/gate/`)
* `GET/POST /config/` - Manage custom gate schedules (date/day rules).
* `GET/PUT/DELETE /config/<id>/` - Control individual timing entries.
* `GET /records/` - Live access history of entries/exits.
* `POST /process-entry/` - Process face match/QR scan, log entry/exit direction, check lateness, and send email warnings.

### Export Reports (`/api/reports/`)
* `GET /stats/` - Aggregated counter counts & monthly Recharts trend lists.
* `GET /export/csv/` - Download Excel CSV sheet of logs.
* `GET /export/pdf/` - Download styled ReportLab PDF register.

---

## ☁️ Deployment Instructions

### Frontend (Netlify)
1. Set the Build Command: `npm run build`
2. Set the Publish Directory: `dist`
3. Setup Redirects: Create a `public/_redirects` file with:
   ```text
   /*   /index.html   200
   ```
4. Set Env: `VITE_API_URL` pointing to your deployed Django API.

### Backend (Vercel)
The project is configured with a `vercel.json` file inside `Backend/config/` mapping to `wsgi.py`.
1. Deploy the `Backend` folder to Vercel.
2. Link your Vercel project to your PostgreSQL database.
3. Configure the environment variables (`DATABASE_URL`, `CLOUDINARY_NAME`, etc.) inside the Vercel project panel.
