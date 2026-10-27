# InterviewHub — Real-Time Technical Interview Platform

> A full-stack technical interview platform inspired by Google Meet, HackerRank, and Social Blade. Conduct live video calls, collaborate on code in real time, schedule sessions, evaluate candidates with structured rubrics, and track platform-wide hiring analytics.

---

## 🚀 Key Features

- **Google Meet–Style Video Conferencing**:
  - WebRTC mesh audio and video calling with STUN/TURN fallback.
  - Active speaker glowing emerald outline and real-time audio wave indicator.
  - Camera on/off, microphone mute/unmute, and screen sharing.
  - Responsive layout modes: **Split View** (Side-by-side video and code editor), **Editor Focus**, and **Video Focus**.
  - Google Meet bottom floating action dock and top status bar.
- **Collaborative Code Editor (Monaco Editor)**:
  - Multi-language syntax highlighting (JavaScript, Python, C++, Java).
  - Instant code synchronization across peers via Socket.IO.
  - Isolated code execution sandbox with runtime duration, memory consumption, stdout, stderr, and automated test cases runner.
  - Reset to challenge starter code button.
- **Side Drawers**:
  - **Problem Statement**: Formatted descriptions, input/output examples, and constraints.
  - **Live Chat**: Room messaging with timestamps and sender role tags.
  - **Participants Roster**: Real-time connected attendee statuses and audio/video indicators.
  - **Evaluation Rubric**: 4-criteria scoring sliders (1–5), private notes, and hiring recommendations (`Strong Hire`, `Hire`, `Leaning No Hire`, `No Hire`).
- **Social Blade–Style Analytics Dashboard**:
  - **Platform Grade Card**: Grade badge (**A+**, Top 2%), ranking, and completion metrics.
  - **Interview Velocity Chart**: Recharts area chart tracking weekly scheduled vs completed interviews.
  - **Competency Radar**: Evaluation distributions across Problem Solving, Code Quality, System Design, and Communication.
  - **Upcoming Interviews Table**: Direct 1-click room launch buttons and meeting code copier.
- **Interview Scheduling & Management**:
  - Schedule technical interviews with title, date/time, duration, candidate, and attached coding challenge.
  - Filter interviews by status (`all`, `scheduled`, `in_progress`, `completed`, `cancelled`).
  - Unique meeting code generation (e.g., `meet-demo-live`).
- **Standardized Evaluations & Protected Dossiers**:
  - Confidential Hiring Committee notes strictly redacted for candidate users on the backend.
  - Candidate-visible constructive feedback.
- **Instant Demo Personas & Auth**:
  - 1-click instant login buttons for **Candidate** (Sarah Chen), **Interviewer** (Alex Morgan), **Recruiter** (David Miller), and **Admin** (Elena Vance).
  - Simulated Google OAuth 2.0 flow.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Recharts, Lucide React, Zustand, Axios, Socket.IO Client.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs, Pino.
- **Real-Time Communication**: WebRTC (`RTCPeerConnection`), Socket.IO signaling mesh.
- **Code Execution**: Isolated VM execution runner with timeouts, memory limits, and automated assertion checkers.

---

## 📋 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ & npm
- MongoDB running locally on port 27017 or a MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository
git clone <repository_url>
cd interviewhub

# Install all dependencies (root, server, and client)
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Seed Database
```bash
# Seeds demo users, coding challenges, interviews, evaluations, and live meeting room
npm run seed
```

### 4. Run Development Servers
```bash
# Starts both Express backend (port 5000) and Vite frontend (port 5173) concurrently
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 👥 Seed Demo Personas

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Candidate** | Alex Chen / Sarah Chen | `alex.chen@example.com` | `Password123!` |
| **Interviewer** | Elena Rostova / Alex Morgan | `elena.rostova@example.com` | `Password123!` |
| **Recruiter** | Rachel Green / David Miller | `rachel.green@example.com` | `Password123!` |
| **Admin** | System Admin / Elena Vance | `admin@interviewhub.io` | `Password123!` |

> **Tip:** You can also use the **1-Click Demo Login** buttons on the Login page (`/login`) to sign in instantly without typing credentials!

---

## 🎥 Live Interview Demo Room

A pre-configured live meeting room is available immediately:
- **Meeting Code**: `meet-demo-live`
- **Direct Link**: `http://localhost:5173/room/meet-demo-live`

---

## 🧪 Testing

```bash
# Run backend API and security test suite
npm test
```

---

## 📚 Documentation

- [Technical Architecture](file:///home/saqib/Desktop/Project/docs/architecture.md)
- [REST API Specification](file:///home/saqib/Desktop/Project/docs/api.md)
- [Database Schema & Models](file:///home/saqib/Desktop/Project/docs/database-schema.md)

---

## 📄 License
MIT License
