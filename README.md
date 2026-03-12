<div align="center">

# 🎯 Sniper Think

**AI-powered document analysis platform — upload files, extract insights, and get intelligent text analytics in seconds.**

</div>

---

## 🛠️ Tech Stack

<div align="center">
<table>
<tr>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
  <br><strong>React 19</strong>
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" />
  <br><strong>Vite</strong>
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="TailwindCSS" />
  <br><strong>Tailwind</strong>
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=nodejs" width="48" height="48" alt="Node.js" />
  <br><strong>Node.js</strong>
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=express" width="48" height="48" alt="Express" />
  <br><strong>Express 5</strong>
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=postgres" width="48" height="48" alt="PostgreSQL" />
  <br><strong>NeonDB</strong>
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=redis" width="48" height="48" alt="Redis" />
  <br><strong>Upstash Redis</strong>
</td>
</tr>
</table>

<img src="https://img.shields.io/badge/BullMQ-FF6600?style=for-the-badge&logo=bull&logoColor=white" />
<img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
<img src="https://img.shields.io/badge/Multer-333333?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/pdf--parse-E34F26?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" />

</div>

---

## 🏗️ Architecture

```
sniper-think/
├── frontend/                  # React SPA (Vite + Tailwind)
│   └── src/
│       ├── components/        # Reusable UI — Navbar, Footer, FileUploader, LeadForm
│       ├── sections/          # Page sections — HeroSection, StrategyFlowSection
│       ├── pages/             # Route-level pages — Home
│       ├── data/              # Static data & config
│       ├── hooks/             # Custom React hooks
│       ├── services/          # API service layer (Axios)
│       └── assets/            # Images & static assets
│
├── backend/                   # Express 5 REST API
│   └── src/
│       ├── config/            # Database (NeonDB) & Redis connection setup
│       ├── routes/            # API routes — upload, jobs, interest
│       ├── controllers/       # Request handlers — upload, jobs, interest
│       ├── models/            # Data models — file, job, result, user
│       ├── queues/            # BullMQ queue definitions
│       └── workers/           # Background job processors — fileWorker
│
└── README.md
```

### How It Works

```
┌──────────────┐    HTTP     ┌──────────────────┐     Queue     ┌────────────────┐
│              │ ──────────► │                  │ ────────────► │                │
│   React UI   │             │  Express Server  │    BullMQ     │  File Worker   │
│   (Vite)     │ ◄────────── │  (REST API)      │ ◄──────────── │  (pdf-parse)   │
│              │    JSON     │                  │   Progress    │                │
└──────────────┘             └────────┬─────────┘               └───────┬────────┘
                                      │                                 │
                                      │  Postgres                       │  Results
                                      ▼                                 ▼
                              ┌──────────────┐                  ┌──────────────┐
                              │   NeonDB     │ ◄──────────────  │   NeonDB     │
                              │  (metadata)  │    Store          │  (results)   │
                              └──────────────┘                  └──────────────┘
                                      ▲
                                      │  Job Queue
                              ┌──────────────┐
                              │   Upstash    │
                              │   Redis      │
                              └──────────────┘
```

1. **User uploads** a PDF/text file via the React frontend
2. **Express API** receives the file (Multer), stores metadata in NeonDB, and pushes a job to **BullMQ**
3. **File Worker** picks up the job, extracts text with **pdf-parse**, runs text analytics (word count, paragraph detection, keyword extraction)
4. **Results** (word count, paragraph count, top keywords) are saved back to NeonDB
5. **Frontend polls** the job status and displays the analysis results

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| npm | v9+ |
| Redis | Upstash (cloud) or local |
| PostgreSQL | NeonDB (cloud) or local |

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/sniper-think.git
cd sniper-think
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# ─── Server ──────────────────────────────
PORT=5000

# ─── NeonDB (PostgreSQL) ────────────────
DATABASE_URL=your_neondb_connection_string

# ─── Redis (Upstash) ────────────────────
REDIS_URL=your_upstash_redis_url

# ─── File Uploads ───────────────────────
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

Start the backend server:

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The API will be running at **`http://localhost:5000`**

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The app will be running at **`http://localhost:5173`**

### 4️⃣ Build for Production

```bash
cd frontend
npm run build
```

The production-ready files will be in `frontend/dist/`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload a file for analysis |
| `GET` | `/api/jobs` | Get all job statuses |
| `POST` | `/api/interest` | Submit interest/lead form |

---


