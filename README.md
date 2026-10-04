# NeonPulse OS &mdash; Mission Control for Serverless Postgres

A modern, high-performance operations platform for managing, querying, and observing Neon Serverless PostgreSQL databases.

## 🚀 Features
- **Serverless PostgreSQL 16/18 Telemetry:** Live ping diagnostics, database size tracking, and connection pooler health.
- **Interactive SQL Console:** Direct SQL execution with latency benchmarks and structured table preview.
- **Branch Topology Management:** Leverage Neon's Copy-on-Write branching primitive for instantaneous development and testing environments.
- **Cluster & Storage Metrics:** Real-time metrics on storage volume, query logs, and operational instances.
- **Enterprise-Grade Security:** Zero-leak architecture keeping database connection secrets safely quarantined in server environment variables.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express, `@neondatabase/serverless`, `dotenv`
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, JetBrains Mono
- **Database:** Neon Serverless PostgreSQL (AWS `us-east-2`)

## ⚙️ Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/8bbxc/vibe2-project.git
   cd vibe2-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and provide your Neon connection string:
   ```bash
   cp .env.example .env
   ```

4. **Run the Application:**
   ```bash
   # Start backend API (Port 3001)
   npm run server

   # Start frontend client (Port 5173)
   npm run dev
   ```
