# TrustBridge AI
**AI-Powered Freelance Contract, Work Verification & Payment Protection Platform**  
*Submitted to the PayPal AI Hackathon 2026*

> **"Don't just trust the promise. Verify the work."**

TrustBridge AI acts as an independent AI-powered trust layer between clients and independent freelancers. It turns informal conversations into measurable agreements, automatically verifies submitted web deliverables using browser testing and cryptographic hashing, and coordinates milestone disbursements using PayPal's developer platform.

---

## 🚀 Key Features

1. **AI Contract Architect (Agent 1):** Converts natural language briefs into structured, versioned milestone contracts with unambiguous, testable acceptance criteria (`BROWSER_INTERACTION`, `HTTP_STATUS`, `RESPONSIVE_VIEWPORT`, `CODE_INSPECTION`).
2. **Proof of Work Engine (Agent 2 & 3):** Playwright automated headless browser tests, HTTP probes, and viewport checks with timestamped PNG screenshots and SHA-256 evidence hashing. **Zero hallucinated passes** — every verdict links to concrete evidence.
3. **PayPal Orders v2 Integration (Agent 5):** Evaluates milestone readiness, creates authorized PayPal orders, and captures disbursement upon evidence certification with sandbox transaction ledger tracking.
4. **Impartial AI Dispute Analyst (Agent 4):** Contrasts signed contract acceptance criteria with complaints to identify unagreed scope creep vs genuine defects.
5. **Cryptographic Trust Auditor (Agent 6):** Maintains an immutable SHA-256 hash-chained chronological project ledger verifying continuity across all agreements, tests, and payments.
6. **Built-in Demo Store Target:** Embedded e-commerce storefront (`/demo-store`) equipped with a toggleable checkout bug switch to demonstrate the end-to-end hackathon video storyboard live!

---

## 🏗️ Architecture & The 6 AI Agents

```
TrustBridge Architecture
├── Client & Freelancer UI (Next.js 15, TypeScript, Tailwind CSS, Lucide)
├── FastAPI Backend (Python 3.14, SQLAlchemy, SQLite/PostgreSQL)
├── Multi-Agent AI Engine (Google Gemini API / Structured Fallback)
│   ├── Agent 1: Contract Architect (Brief -> Measurable Milestones)
│   ├── Agent 2: Requirement Planner (Criteria -> Playwright Test Specs)
│   ├── Agent 3: Work Inspector (Test Execution & Evidence Synthesis)
│   ├── Agent 4: Dispute Analyst (Neutral Scope Creep vs Defect Analysis)
│   ├── Agent 5: Payment Coordinator (Readiness Gate & PayPal Orders v2)
│   └── Agent 6: Trust Auditor (SHA-256 Cryptographic Event Ledger)
├── Proof of Work Automation (Playwright Headless Browser + Evidence Vault)
└── PayPal Developer Platform (Sandbox Orders v2: Create, Capture, Webhooks)
```

---

## 🎬 3-Minute Hackathon Demo Storyboard

1. **0:00–0:30 — Problem & Contract Creation:** Client Alex Rivera types a brief into the **AI Contract Builder**. Agent 1 structures 3 milestones ($500, $600, $400) with testable criteria. Freelancer Elena Rostova accepts the contract.
2. **0:30–1:30 — Proof of Work Catching a Bug:** Freelancer submits `http://localhost:8000/api/demo-store` with the checkout bug enabled. The **Proof of Work Engine** executes Playwright: Cart update passes, but checkout throws `500 Server Error`. Agent 3 blocks payment disbursement.
3. **1:30–2:15 — Fix & Reverification:** Toggle bug to `FIXED`. Re-run verification: All tests pass with green checkmarks, PNG evidence is cryptographically hashed, and Agent 3 certifies completion.
4. **2:15–2:45 — PayPal Sandbox Disbursement:** Client clicks **"Approve & Pay with PayPal"**. Agent 5 initiates PayPal Orders v2, captures the transaction, and marks the milestone `PAID`.
5. **2:45–3:00 — Cryptographic Trust Ledger:** Inspect the **Trust Timeline** verifying the unbroken SHA-256 hash chain.

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: 3.10+ (tested on 3.14)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Seed database with initial demo project and users
python seed_data.py

# Run tests
pytest tests/

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already installed if cloned)
npm install

# Start Next.js development server
npm run dev
```
- Frontend UI: [http://localhost:3000](http://localhost:3000)
- Demo Store: [http://localhost:3000/demo-store](http://localhost:3000/demo-store)
- Demo Project Room: [http://localhost:3000/projects/proj-demo-1042](http://localhost:3000/projects/proj-demo-1042)
- Proof of Work Live Console: [http://localhost:3000/projects/proj-demo-1042/verify](http://localhost:3000/projects/proj-demo-1042/verify)

### 4. Or Launch Everything in 1 Click (Windows):
Double-click `start_all.bat` at the root directory.

---

## 🔒 PayPal Sandbox Credentials (Optional)
To use custom PayPal credentials instead of the built-in sandbox simulator, add your keys to `backend/.env`:
```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
```

---

## 🧪 Verified Test Suite
The backend contains automated tests verifying all 6 AI agents, the Playwright evidence pipeline, and the PayPal transaction lifecycle:
```bash
.\backend\venv\Scripts\pytest .\backend\tests\
# Output: 7 passed in 1.49s
```

Frontend build verification:
```bash
cd frontend && npm run build
# Output: Compiled successfully, 11/11 routes generated with zero errors.
```

---

## 📜 License
MIT License. Open-source submission for the PayPal AI Hackathon 2026.

