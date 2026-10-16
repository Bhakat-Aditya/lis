# New Life Care Diagnostic Center - Laboratory Information System (LIS)

A complete clinical Laboratory Information System (LIS) built with a **three-tier architecture**:
1. **Frontend (Vercel)**: React + Vite + Tailwind CSS. A light, clean, sober white-themed responsive interface designed specifically for clinic staff (Front Desk / Receptionists, Lab Technicians / Analysts, Doctors / Pathologists, and Super Admins).
2. **Middleman Backend Server (Render)**: Node.js (ES6 modules `"type": "module"`) + Express.js. Acts as the secure intermediary bridge between the frontend and the upstream AWS server.
3. **Upstream Clinical Server (AWS)**: `https://lis.newlifecaremidnapore.com/lifecare` — Handles core database queries and master servlets (`APIServlet` and `GetAPIServlet`).

> **Security Guardrail**: The frontend **never** interacts directly with the AWS main server. All clinical requests, session tokens, and mutations flow strictly through the middleman server with JWT authentication and Role-Based Access Control (RBAC).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────┐
│     Client (Vercel)             │
│  React + Vite (Light/Sober UI)  │
└────────────────┬────────────────┘
                 │  JWT Bearer Token / HTTPS
                 ▼
┌────────────────────────────────────────────────────────┐
│     Middleman Server (Render)                          │
│  • Node.js + Express (ES6 Modules)                     │
│  • RBAC Authorization (Super, Reception, Tech, Doctor) │
│  • 24-Hour Local Static Cache for Master Lists         │
│  • Upstream Session & Cookie Bridging                  │
└────────────────┬───────────────────────────────────────┘
                 │  Tomcat JSESSIONID / GetAPIServlet & APIServlet
                 ▼
┌────────────────────────────────────────────────────────┐
│     Upstream AWS Main LIS Server                       │
│  https://lis.newlifecaremidnapore.com/lifecare         │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ 24-Hour Master Data Cache System

As per clinic system requirements, the following 11 master lists are cached with a **24-hour TTL (86,400 seconds)**:
- `DEPT_LIST` (`GETDEPERTMENTIST`)
- `UNIT_LIST` (`GETUNITLIST`)
- `METHOD_LIST` (`GETMETHODLIST`)
- `PROFILE_LIST` (`GETPROFILELIST`)
- `PKG_LIST` (`GETPACKAGELIST`)
- `TEST_LIST` (`GETTESTLIST`)
- `TEMPLATE_LIST` (`GETINTERPRETATIONLIST`)
- `DOCT_LIST` (`GETDOCTORLIST`)
- `REFERANCE_LIST` (`GETREFERLIST`)
- `BRANCH_LIST` (`GETBRANCHLIST`)
- `USER_LIST` (`GETUSERLIST`)

### Cache Behavior:
- **Cache Hit**: Serves from memory instantly without calling the AWS server.
- **Cache Miss**: Fetches from AWS server and stores in cache.
- **Auto-Invalidation**: Whenever an update API call is performed (e.g. `UPDATETEST`, `UPDATEDOCT`, `UPDATEBRANCH`, etc.), the corresponding cache key is automatically invalidated.
- **Manual Refresh**: Clinic administrators can trigger a manual sync via the "24h Cache" button in the Navbar or in the Master Data view.

---

## 👥 Role-Based Access Control (RBAC)

| Role | Permitted Actions |
|---|---|
| **Super Admin** | Full access to master data, user management, system audit, tests, profiles, packages, reports, and all clinical operations. |
| **Front Desk / Receptionist** | Patient registration, search, multi-test order entry, bill generation, deposit collection, discount entry, invoice printing, WhatsApp dispatch. |
| **Technician / Lab Analyst** | Sample receiving (`RECEIVESAMPLE`), test results entry (`UPDATEREPORT`), default value population, formula calculations (`CALCULATERESULT`), culture report entries. |
| **Doctor / Pathologist** | Critical range alerts review, test verification (`REPORTVERIFY`), report approval (`REPORTAPPROVE`), rejection with reason (`REPORTREJECT`), final release (`RELEASEREPORT`). |

---

## 🚀 Deployment Guide

### 1. Deploy Middleman Server to **Render**

1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/):
   - Click **New +** -> **Web Service**.
   - Connect your repository.
   - Set **Root Directory**: `server`
   - Set **Environment**: `Node`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`
3. Add the following **Environment Variables** in Render:
   ```env
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your_secure_jwt_secret_key_here
   CACHE_TTL_SECONDS=86400
   LAB_PATH=lifecare
   LAB_DATABASE_INIT=lifecare
   LAB_DOMAIN=https://lis.newlifecaremidnapore.com
   LAB_WEBSITE=https://lis.newlifecaremidnapore.com
   LAB_COOKIE_NAME=lifecareauth
   UPSTREAM_DEFAULT_USER=sandip
   UPSTREAM_DEFAULT_PASS=Life
   CLIENT_URL=https://your-frontend.vercel.app
   ```
4. Click **Deploy**. Note your live Render URL (e.g. `https://lis-server.onrender.com`).

---

### 2. Deploy Frontend to **Vercel**

1. In the [Vercel Dashboard](https://vercel.com/):
   - Click **Add New** -> **Project**.
   - Select your repository.
   - Set **Root Directory**: `client`
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. Add the following **Environment Variable** in Vercel:
   ```env
   VITE_API_BASE_URL=https://lis-server.onrender.com
   ```
   *(Replace with your actual Render server URL)*
3. Click **Deploy**. Vercel will automatically build and publish your frontend with SPA route rewriting (`vercel.json`).

---

## 💻 Running Locally

### 1. Start the Middleman Server:
```bash
cd server
npm install
npm run dev
# Server will run on http://localhost:5000
```

### 2. Start the Frontend Client:
```bash
cd client
npm install
npm run dev
# Client will run on http://localhost:3000
```

---

## 🧪 Default Test Credentials

| Login ID | Password | Role | Description |
|---|---|---|---|
| `sandip` | `Life` | Super Admin | Full administrative access |
| `entry` | `010101` | Front Desk | Receptionist / Billing |
| `micronmicrotech` | *(default)* | Microbiology User | Laboratory Analyst / Technician |

---

## 📄 Key Features Matching Clinic Screenshots

- **Patient Profile Card & Quick Actions**: Matches Screenshot 1 with PID, demographic details, financial summary (Total, Discount, Deposits, Advance), report status progress bar, and colored action buttons (Fill Results, Print Invoice, Print Report, Add Deposit, Add Discount, Receive Sample).
- **Printable Medical Invoice**: Matches Screenshot 2 with official clinic header, address, phone numbers, ISO 9001:2015 & NABL logos, QR code, itemized tests table, amount in words ("One Thousand Five Hundred Rupees Only"), and doctor signature line.
- **Laboratory Results Workstation**: Flagging of high/low/normal values against reference ranges, formula calculations, and template reports (e.g. Antibiotic sensitivity zones).
