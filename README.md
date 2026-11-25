# RGIPT NOC Management Portal

A full-stack web application designed to digitize and streamline the No Objection Certificate (NOC) application and approval workflow for Rajiv Gandhi Institute of Petroleum Technology (RGIPT).

![RGIPT NOC Portal Overview](frontend/public/rgipt_logo.png)

## 📌 Overview

The NOC Portal replaces the traditional, manual, paper-based requisition process with a seamless digital platform. It connects four distinct user roles—Students, Department Officers, the TNP Head, and System Administrators—into a unified, transparent pipeline. 

Students can submit their internship/NOC details, attach necessary documents (Offer Letters, Statements of Objective), and track their approval progress in real-time.

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Secure JWT authentication supporting `Student`, `DeptOfficer`, `TNPHead`, and `Admin` access tiers.
*   **Domain-Restricted Registration:** Student registrations are strictly bound to official `@rgipt.ac.in` email addresses with OTP-based verification (via Nodemailer).
*   **Dynamic Workflow Engine:** Administrators can dynamically create departments and route NOC applications to specific faculty or HODs for initial review.
*   **Approval Pipeline:** Standardized flow: `Submitted` ➡️ `Department Review` ➡️ `TNP Head Review` ➡️ `Ready for Collection`.
*   **Premium UI/UX:** Built using modern Tailwind CSS (v4) with fully responsive split-screen authentication designs, glassmorphism navbars, and interactive dashboard cards.
*   **File Handling:** Secure multi-file uploads utilizing Multer for Offer Letters and Objective Statements.

## 🛠️ Technology Stack

*   **Frontend:** React.js (Vite), Tailwind CSS v4, React Router DOM, Axios
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose
*   **Authentication & Security:** JSON Web Tokens (JWT), bcrypt.js
*   **Mailing:** Nodemailer (Resend / any SMTP), optional BullMQ + Redis queue

## ⚡ Quick Start (local demo, zero config)

Only [Node.js](https://nodejs.org/) 18+ is needed. No MongoDB, Redis or SMTP setup required.

```bash
git clone https://github.com/Lodhi-ji/NOC-RGIPT.git
cd NOC-RGIPT
npm run setup      # installs root, backend and frontend packages
npm run demo       # starts API on :5000 and web app on :5173
```

On Windows you can also just double-click **`start-demo.bat`**.

Open **http://localhost:5173** and use the **Quick demo login** buttons. All demo accounts use the password `password123`:

| Role | Email | What to show |
|---|---|---|
| Student | `student@rgipt.ac.in` | Submit a NOC (marksheet PDF + SOP), track status & audit trail |
| Dept. Officer (CSE) | `officer@rgipt.ac.in` | First-level review of own department, approve/reject with remarks |
| Dept. Officer (PEG) | `peg.officer@rgipt.ac.in` | Same, for a different department |
| Chairman T&P (TNP Head) | `tnphead@rgipt.ac.in` | Final approval → *Ready for Collection* |
| TNP Office | `tnpoffice@rgipt.ac.in` | Hands over the hardcopy → marks *Collected* |
| CDC Chairperson | `cdc@rgipt.ac.in` | Read-only oversight of everything past department level |
| Admin | `admin@rgipt.ac.in` | Departments, routing, role assignment |
| More students | `priya@rgipt.ac.in`, `rohan@rgipt.ac.in` | Pre-loaded applications |

**Workflow:** Student → Dept. Officer → Chairman T&P → Ready for Collection → TNP Office marks Collected (CDC Chairperson watches the whole pipeline).

How the local demo works (`DEMO_MODE=true` in `backend/.env`):
- **Database:** with no `MONGO_URI`, a local MongoDB starts automatically (downloaded once on first run, ~780 MB) and stores data in `backend/.localdb`.
- **Sample data:** departments, demo accounts and 6 applications at every workflow stage are created on first start.
- **Emails/OTP:** without a Resend key, emails are printed in the API console. In demo mode the OTP is also auto-filled on the Register / Forgot Password pages, and emails addressed to the demo accounts are never really sent.
- **File uploads:** go to Cloudinary when `CLOUDINARY_*` keys are set, otherwise to `backend/uploads`.
- **Using a real Atlas cluster for the demo:** set `MONGO_DB_NAME=noc_demo` so demo data stays out of your production database.
- **Reset everything:** `npm run demo:reset`.

> ⚠️ Never set `DEMO_MODE=true` on a public deployment.

### Suggested demo flow (≈5 min)
1. **Student** → *Apply for New NOC* → fill form, attach a marksheet PDF, write the SOP → submit. Open the *Microsoft / Google* cards to show the timeline.
2. **Dept. Officer** → the new application appears under pending → expand → view PDFs → add remark → **Approve**.
3. **Chairman T&P** → it now shows for final review → **Approve** → status becomes *Ready for Collection*.
4. **TNP Office** → *Ready for Pickup* → **Mark Collected**. **CDC Chairperson** → see the whole pipeline read-only.
5. **Student** again → status updated, audit trail shows every step with remarks.
6. **Admin** → create a department, assign an officer role, configure routing.
7. Optional: **Register** a new `@rgipt.ac.in` account to show OTP verification.

## ⚙️ Production Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed, along with a running MongoDB instance.

### 1. Clone the Repository
```bash
git clone <repository_url>
cd "Noc Portal"
```

### 2. Backend Setup
Navigate to the backend directory, install packages, and set up your environment variables.
```bash
cd backend
npm install
```

Create a `.env` file in the root of the `backend` folder and configure the following:
See [`backend/.env.example`](backend/.env.example) for every variable. Typical production values:
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=a_long_random_secret
CLIENT_URLS=https://your-frontend.example.com
RESEND_SMTP_URL=re_xxx            # or SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD
REDIS_URL=redis://...             # optional: caching + email queue
WEB_CONCURRENCY=2                 # optional: Node cluster workers
```

Start the backend server:
```bash
npm run dev
```
To load demo data into a real database: `npm run seed` (⚠️ wipes existing data).

### Render + UptimeRobot
If you deploy the backend on Render, add an UptimeRobot monitor to keep the service warm and verify uptime.

Use this monitor URL:
```text
https://<your-render-backend>.onrender.com/health
```

Recommended monitor settings:
- Monitor type: HTTP(s)
- Interval: 5 minutes
- Expected status code: 200

The endpoint returns a simple JSON payload and does not require authentication.

Render service settings:
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

### 3. Frontend Setup
Open a new terminal tab, navigate to the frontend directory, and install dependencies.
```bash
cd frontend
npm install
```

Start the React development server:
```bash
npm run dev
```

### 4. Admin Initialization
Run `npm run seed` once for a ready-made admin (`admin@rgipt.ac.in` / `password123` — change it!), or register an account and set its `role` to `Admin` in MongoDB. Then use the **System Administration** dashboard to create departments and assign officer roles.

## 📁 Project Structure

```text
Noc Portal/
├── backend/
│   ├── index.js          # Express server entry point
│   ├── routes/           # API Endpoints (Auth, Admin, Officer, Student)
│   ├── controllers/      # Route logic & Database interactions
│   ├── models/           # Mongoose schemas (User, Application, Department, RoutingConfig, ApplicationLog)
│   ├── middleware/       # JWT Auth verification & Multer config
│   ├── uploads/          # Student document storage (.gitignore)
│   └── utils/            # Helper functions (Nodemailer configuration)
└── frontend/
    ├── index.html        # Main HTML
    ├── vite.config.js
    └── src/
        ├── App.jsx       # Route provider
        ├── api.js        # Axios instance configured for backend
        ├── context/      # React global auth context
        ├── components/   # UI elements (Navbar, ProtectedRoutes)
        └── pages/        # Views (Login, Dashboards, Applications)
```

## 🔐 Security Considerations

*   Ensure the `uploads/` folder path is secure and restrict direct unauthorized static access where applicable.
*   Keep the `.env` file out of Version Control (included in `.gitignore`).
*   Always use App Passwords or robust SMTP relays for Nodemailer in a production environment.
