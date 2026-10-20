# How to Deploy LegalConnect on Render (render.com)

This guide walks you through deploying the **LegalConnect (Online Legal Consultation & Lawyer Aggregation Platform)** to **Render** as a full-stack Node.js + React web application.

---

## 📋 Quick Specifications for Render

| Setting | Value |
| :--- | :--- |
| **Service Type** | **Web Service** |
| **Runtime / Environment** | **Node** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` (or `/api/health`) |
| **Instance Type** | **Free** (or Starter/Standard) |

---

## 🚀 Option 1: Automatic 1-Click Blueprint Deploy (Recommended)

Because this repository includes a [`render.yaml`](./render.yaml) file, you can deploy using Render Blueprints:

1. Push this project to your **GitHub** or **GitLab** account.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your Git repository.
5. Render will automatically read `render.yaml` and configure:
   - Web service name: `legalconnect-platform`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment variables (including generating a secure `JWT_SECRET`)
6. Click **Apply**.
7. In the service's **Environment** tab, set your `MONGODB_URI` (optional; if left empty, LegalConnect automatically uses its built-in disk persistence).
8. Once deployment completes, open your provided Render URL (e.g. `https://legalconnect-platform.onrender.com`).

---

## 🛠️ Option 2: Step-by-Step Manual Deployment on Render Dashboard

If you prefer configuring the Web Service manually via the Render dashboard:

### Step 1: Push Code to GitHub / GitLab
Make sure your repository has all files, including `package.json`, `server.ts`, and `src/`.

### Step 2: Create a New Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Choose **Build and deploy from a Git repository** and click **Next**.
4. Select your `legalconnect` repository.

### Step 3: Configure Settings
Fill out the service configuration fields:

- **Name**: `legalconnect` (or any custom name)
- **Region**: Choose the closest region (e.g., Oregon, Ohio, Frankfurt, Singapore)
- **Branch**: `main` (or your active branch)
- **Root Directory**: Leave blank (default is root `.`)
- **Runtime**: **Node**
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```
- **Instance Type**: Select **Free** (0.1 CPU, 512 MB RAM) or Starter.

### Step 4: Configure Environment Variables
Scroll down to the **Environment Variables** section and add:

| Key | Suggested Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production static bundling and asset caching |
| `PORT` | `10000` | Render's default web service internal port (automatically bound) |
| `JWT_SECRET` | *(Generate a 32+ character random string)* | Secure token signing for client/lawyer/admin logins |
| `MONGODB_URI` | `mongodb+srv://...` *(optional)* | MongoDB Atlas database URI (if omitted, platform uses local disk store) |
| `GEMINI_API_KEY` | *(optional)* | For AI legal query analysis & pre-consultation organizer |

### Step 5: Advanced Settings (Optional but Recommended)
- Under **Advanced**:
  - **Health Check Path**: `/api/system/status`
    *(Render uses this endpoint to verify server health before routing traffic)*
  - **Auto-Deploy**: **Yes** *(deploys automatically whenever you push code)*

### Step 6: Deploy
Click **Create Web Service**. 
Render will:
1. Clone the repository.
2. Run `npm install` and `npm run build` (builds the React Vite client into `dist/`).
3. Execute `npm start` (starts the Express server with `tsx server.ts`).
4. Serve the client and backend on your live `https://<your-app>.onrender.com` domain!

---

## 🔍 How LegalConnect Works in Production on Render

1. **Unified Full-Stack App**:
   In `server.ts`, when `NODE_ENV=production`:
   - Express handles all `/api/*` routes (Auth, Lawyers, Appointments, Reviews, Documents, Admin, System).
   - Express serves the compiled frontend from `/dist` with SPA client-side fallback to `/dist/index.html`.
2. **Port Binding**:
   Render automatically assigns a dynamic port via `process.env.PORT`. `server.ts` binds to `0.0.0.0:${process.env.PORT || 3000}` which prevents 502 Bad Gateway errors.
3. **Database Flexibility**:
   - If `MONGODB_URI` is provided, LegalConnect connects to MongoDB Atlas.
   - If MongoDB Atlas is unavailable or credentials are omitted, LegalConnect automatically uses its local disk/memory data store (`/data/local_db.json`), ensuring your site never crashes during demos or evaluation.
4. **Render Free Tier Spin-Down**:
   Render free tier services spin down after 15 minutes of inactivity. When a request arrives, it may take 30–50 seconds to spin back up. The `/api/system/status` endpoint allows uptime monitors (like UptimeRobot) to keep it awake if desired.
