# InterviewHub — Technical Architecture

This document describes the high-level system architecture, component relationships, data flow, real-time communication infrastructure, and security boundaries of the **InterviewHub** platform.

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                Client Layer                                   |
|  - React 18 SPA (Vite)                                                       |
|  - Monaco Code Editor (Collaborative IDE)                                     |
|  - WebRTC PeerConnection (Video/Audio/Screen Tracks)                          |
|  - Socket.IO Client (Real-time Signaling, Chat & Code Sync)                   |
|  - Recharts Dashboard (Social Blade-style Analytics)                         |
|  - Zustand & TanStack Query (State & Caching)                                |
+-----------------------+-------------------------------+-----------------------+
                        | HTTPS (REST API)              | WSS (WebSocket)
                        v                               v
+-------------------------------------------------------------------------------+
|                            Backend Application Layer                          |
|  - Node.js + Express REST API (`/api/v1`)                                     |
|  - JWT Authentication & RBAC Authorization Middleware                         |
|  - Socket.IO Signaling Server (`interviewSocket.js`)                          |
|  - Code Execution Sandbox Runner (`codeExecutionController.js`)               |
|  - Aggregation Analytics Service (`analyticsController.js`)                  |
|  - Email Notification Dispatcher (Nodemailer)                                 |
+-----------------------+-------------------------------+-----------------------+
                        |                               |
                        v                               v
+-----------------------------------+       +-----------------------------------+
|          Data Storage             |       |        Media Infrastructure       |
|  - MongoDB Database               |       |  - Google STUN Servers            |
|  - Mongoose Document Models       |       |  - TURN Relay Support             |
|  - Compound & Geospatial Indexes  |       |  - WebRTC Mesh (P2P Audio/Video)  |
|  - Aggregation Pipelines          |       |  - Socket.IO Room Mesh Signaling  |
+-----------------------------------+       +-----------------------------------+
```

---

## 2. Key Components

### 2.1 Frontend Architecture (`client/`)
- **React Router 6**: Declarative routing with `<ProtectedRoute>` guards enforcing role-based permissions (`candidate`, `interviewer`, `recruiter`, `admin`).
- **Monaco Code Editor**: Embedded VS Code editor instance supporting JavaScript, Python, C++, and Java with debounced Socket.IO broadcast and remote cursor tracking.
- **WebRTC Mesh**: Direct peer-to-peer audio and video transmission between the candidate and interviewer browsers using Google STUN (`stun.l.google.com:19302`).
- **Zustand Auth Store**: Lightweight reactive client authentication state tracking access tokens, active persona profiles, and auto-initialization via `/api/v1/auth/me`.

### 2.2 Backend API & Socket Services (`server/`)
- **Express 4.x REST API**: Structured controller/route pattern under `/api/v1` handling authentication, interview sessions, coding challenges, code executions, evaluations, notifications, and analytics.
- **Socket.IO Signaling & Room Engine**: Coordinates real-time events (`room:join`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`, `editor:change`, `chat:message`, `media:state-changed`).
- **Sandboxed Execution Runner**: Executes user code in an isolated child process or Docker container environment with strict memory limits (50MB) and CPU execution timeouts (2000ms), capturing stdout, stderr, runtime duration, and automated test suite pass/fail assertions.

---

## 3. Real-Time Communication Workflow

1. **Signaling & Room Join**:
   - When a user joins `/room/:meetingCode`, the client emits `room:join` with their session identity.
   - The server validates room membership and broadcasts `room:participant-joined` to other room members while emitting `room:state` (current code, active challenge, persisted chat history) to the joiner.
2. **WebRTC Peer Negotiation**:
   - The joining peer initiates an `RTCPeerConnection`, acquires `getUserMedia` streams, creates an SDP offer, and sends it via `webrtc:offer`.
   - The receiving peer sets the remote description, generates an SDP answer, and emits `webrtc:answer`.
   - Both peers exchange ICE candidates via `webrtc:ice-candidate` until a direct media peer connection is established.
3. **Collaborative Code Editing**:
   - Edits in Monaco Editor trigger `editor:change` events with delta content.
   - The signaling server distributes changes to room peers and asynchronously persists current code snapshots to MongoDB.

---

## 4. Security & Privacy Safeguards

- **Strict Rubric Data Protection**: Private interview notes (`privateNotes`) and confidential evaluator remarks are strictly stripped from responses whenever a candidate user queries `/api/v1/evaluations`.
- **JWT & HTTP-Only Authentication**: Bearer tokens are signed with HMAC SHA-256 (`JWT_ACCESS_SECRET`) with configurable expiry.
- **Input Sanitization & Rate Limiting**: All request parameters are validated with Zod/schema checks, and authentication endpoints are throttled using `express-rate-limit`.
- **Isolated Execution Guardrails**: Candidate scripts are executed outside the primary Express thread with memory caps and process isolation to prevent prototype pollution or host system tampering.
