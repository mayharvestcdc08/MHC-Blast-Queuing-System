# May Harvest Corporation - Product Queuing & Blast Freezing Management System

Real-Time Multi-Device Product Queuing, Blast Freezing Monitor, and 30-Day+ Historical Audit Reports for May Harvest Corporation.

## 🚀 Key Features

1. **Online Date & Time Sync (PST / Asia/Manila UTC+8)**:
   - Synchronized with accurate network time servers (`/api/time` and WorldTimeAPI).
   - Displayed live with the `🇵🇭 Online PST` status badge.
   - Eliminates inaccuracies from drifted or wrong device clocks.

2. **Real-Time Cloud Sync (Supabase PostgreSQL)**:
   - Multi-device real-time sync via Supabase WebSockets.
   - Any product queued, temperature logged, or harvested on one workstation immediately updates all other tablets, PCs, and the **Live TV Queue Board**.
   - Offline resilient: automatically saves to `localStorage` when offline and seamlessly syncs when reconnected.

3. **📅 30-Day & Extended Historical Logs & Reports**:
   - Filter by **Today**, **Last 7 Days**, **Last 30 Days**, **Last 60 Days**, or **All-Time / Custom Date Range**.
   - Summary KPIs: Total Batches Queued, Total Volume (kg), Harvested / Completed count, Active in Blast count, and Average Freezing Cycle Time.
   - Detailed Historical Table showing Queue #, Dates, Shifts, Product Names, Production Dates, Volumes, Priorities, Blast Freezers, Temperature Logs, Statuses, and Cycle Times.
   - **CSV Export (Excel compatible)** with one-click download.
   - **Printable / PDF Report** format.

4. **Blast Freezing Operations**:
   - FIFO (First In, First Out) inventory management.
   - In-blast temperature monitoring with automated deviation alerts.
   - Multi-door allocation and live progress board.

---

## 🌐 Online Deployment Guide (Render)

This project includes pre-configured **`render.yaml`**, **`server.js`**, and **`package.json`** for zero-configuration, automated deployment on **Render**:

1. Log in to [Render.com](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository: `https://github.com/mayharvestcdc08/MHC-Blast-Queuing-System`.
4. Render will automatically detect the settings:
   - **Runtime**: `Node`
   - **Build Command**: *(leave empty)*
   - **Start Command**: `node server.js`
   - **Environment Variable**: `TZ = Asia/Manila`
5. Click **Create Web Service**.
6. Within 1–2 minutes, your system will be live on your custom `.onrender.com` URL!

---

## 🛠️ Local Development

To run locally on your computer:
```bash
git clone https://github.com/mayharvestcdc08/MHC-Blast-Queuing-System.git
cd MHC-Blast-Queuing-System
node server.js
```
Open your browser and navigate to:
`http://localhost:3000`

---

## 📁 Repository Structure

```
├── Blast Freezing Queuing_V4.html   # Standalone HTML application
├── index.html                       # Primary web entry point (identical mirror)
├── server.js                        # Node.js server with Online PST Time & Sync API
├── render.yaml                      # Render 1-click deployment blueprint
├── package.json                     # Node.js project configuration
├── .gitignore                       # Git ignore rules
└── README.md                        # Documentation
```
