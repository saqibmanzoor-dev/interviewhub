# PostPilot — Social Media Content Planner

> A full-stack MERN web application for creating, organizing, scheduling, and tracking social media content from a unified dashboard.

**Project Type:** End-Term Full Stack Development Project  
**Stack:** MongoDB, Express.js, React, Node.js (JavaScript throughout)  
**Status:** MVP Fully Operational & Verified (17/17 Integration Tests Passing)

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Proposed Solution](#proposed-solution)
- [Core Features](#core-features)
- [Out of Scope (MVP Boundaries)](#out-of-scope-mvp-boundaries)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Getting Started & Installation](#getting-started--installation)
- [Environment Configuration](#environment-configuration)
- [Data Models & Schema](#data-models--schema)
- [API Reference](#api-reference)
- [Frontend Pages and Workflows](#frontend-pages-and-workflows)
- [Input Validation & Security Considerations](#input-validation--security-considerations)
- [Testing & Quality Verification](#testing--quality-verification)
- [Deployment Guide](#deployment-guide)
- [Limitations & Future Scope](#limitations--future-scope)
- [Demo Walkthrough](#demo-walkthrough)
- [License](#license)

---

## Overview

**PostPilot** empowers content creators, students, and small businesses to organize their social media presence in one central dashboard. Users can brainstorm and write post drafts, target designated platforms (LinkedIn, Instagram, 𝕏), manage publishing stages (`draft`, `planned`, `published`), set publication dates, and track their content pipeline with real-time statistics.

> **Important MVP Boundary:** PostPilot is a content-planning and scheduling workspace. Setting a post's status to `published` updates the internal workflow record in MongoDB; it does **not** make unauthorized API calls to publish content to external third-party social media accounts.

---

## Problem Statement

Content creators and marketing leads frequently store post concepts across fragmented mediums: phone notes, sticky pads, spreadsheets, and messaging drafts. This decentralization leads to:
- Lost or duplicate ideas.
- Unclear editorial pipelines (what is drafted vs. scheduled vs. published).
- Inconsistent publishing cadence across multiple channels.

PostPilot solves this problem by providing a single source of truth for planning, filtering, and organizing social content.

---

## Proposed Solution

1. **Secure Authentication & Ownership:** Multi-tenant user isolation where each account securely manages its own private content.
2. **Dynamic Dashboard:** Real-time counters for Total Posts, Drafts, Planned, and Published posts, alongside channel distribution metrics.
3. **Complete Post CRUD:** Seamless creation, inline editing, quick status toggling, and confirmed deletion of posts.
4. **Instant Search & Multi-Criteria Filtering:** Filter simultaneously by platform, workflow status, or full-text keywords.
5. **Persistent MERN Architecture:** Express REST API backed by MongoDB schemas with validation and sanitized responses.

---

## Core Features

### 1. Account & Session Management
- Registration with validation (name, email, password >= 6 characters).
- Duplicate email prevention (HTTP 409 Conflict).
- Password encryption using `bcryptjs` with salt rounds.
- Stateless JWT issuance via HTTP-only cookies and Bearer token fallback.
- Client session restoration on page reload (`GET /api/auth/me`).

### 2. Interactive Dashboard
- Stat cards: Total Posts, Drafts, Planned, and Published counts.
- Channel distribution breakdown (LinkedIn, Instagram, 𝕏).
- Recently updated posts feed with quick edit/delete actions.
- Empty states guiding users to create their first post.

### 3. Content Library & Post CRUD
- Create and edit modal with character counters (Title max 120, Content max 3000).
- Platform selector (`instagram`, `linkedin`, `x`).
- Status workflow selector (`draft`, `planned`, `published`).
- Optional planned publication datetime picker.
- Hashtag tagging (stored as normalized tag arrays).
- Direct status switching from cards.
- Safe two-step deletion confirmation modal.

### 4. Search & Multi-Filter Engine
- Keyword search querying both titles and caption content.
- Platform filter dropdown.
- Status filter dropdown.
- One-click filter reset.

### 5. Multi-User Data Isolation
- Strict server-side user scoping (`req.user._id`).
- Protection against unauthorized ID access: attempting to view, edit, or delete another user's post ID returns `404 Not Found`.

---

## Out of Scope (MVP Boundaries)

To ensure reliable, bulletproof delivery within deadlines, the MVP deliberately excludes:
- Third-party social media OAuth and direct posting via external APIs.
- AI caption generators.
- Multi-user team workspace permissions.
- Social media engagement metrics / scraping.
- Automated cron job background schedulers.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend UI** | React | ^18.3.1 | Component-driven user interface |
| **Routing** | React Router DOM | ^6.29.0 | Client-side routing and protected routes |
| **HTTP Client** | Axios | ^1.7.9 | Credentialed HTTP requests and interceptors |
| **Icons** | Lucide React | ^0.475.0 | Modern interface icons |
| **Build Tool** | Vite | ^5.4.14 | Development server and production bundling |
| **Styling** | Vanilla CSS3 | Standard | Custom theme, glassmorphism, responsive grid |
| **Backend Runtime** | Node.js | >= 18 | Server-side JavaScript runtime |
| **API Framework** | Express.js | ^4.21.2 | RESTful API routing and middleware |
| **Database** | MongoDB | >= 6.0 | Document store for users and posts |
| **ODM** | Mongoose | ^8.9.5 | Schemas, data validation, and query modeling |
| **Security** | Helmet & Rate Limit | Latest | HTTP security headers and auth brute-force limiting |
| **Auth & Crypto** | JWT & Bcrypt.js | Latest | Token signing and one-way password hashing |

---

## System Architecture

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                   Browser (React + Vite)                    │
  │     AuthContext  │  Dashboard  │  Posts  │  PostFormModal    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ HTTP / JSON (Axios, Credentials)
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 Node.js / Express REST API                  │
  │  Helmet │ CORS │ RateLimit │ AuthMiddleware │ Validators    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ Mongoose ODM
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                      MongoDB Database                       │
  │            User Collection  │  Post Collection              │
  └─────────────────────────────────────────────────────────────┘
```

---

## Project Directory Structure

```text
postpilot/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                 # Shared Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── DeleteConfirmModal.jsx   # Deletion confirmation dialog
│   │   │   ├── Navbar.jsx               # Navigation bar & auth controls
│   │   │   ├── PostCard.jsx             # Post card with quick status dropdown
│   │   │   ├── PostFilters.jsx          # Search and filter toolbar
│   │   │   ├── PostFormModal.jsx        # Create and edit post dialog
│   │   │   ├── ProtectedRoute.jsx       # Route guard for authenticated users
│   │   │   └── Toast.jsx                # Toast notification system
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Global auth state and actions
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Aggregated statistics & recent feed
│   │   │   ├── Login.jsx                # User login screen
│   │   │   ├── NotFound.jsx             # 404 page
│   │   │   ├── Posts.jsx                # Content library with full filters
│   │   │   └── Register.jsx             # Account registration screen
│   │   ├── services/
│   │   │   ├── authService.js           # Auth API service methods
│   │   │   └── postService.js           # Post & dashboard API methods
│   │   ├── App.jsx                      # App router and layout wrapper
│   │   ├── index.css                    # Modern design system & CSS variables
│   │   └── main.jsx                     # Application entry point
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   │   └── db.js                        # MongoDB connection & memory fallback
│   ├── controllers/
│   │   ├── authController.js            # Register, login, logout, getMe
│   │   ├── dashboardController.js       # Dashboard counters & platform aggregates
│   │   └── postController.js            # User-scoped post CRUD operations
│   ├── middleware/
│   │   ├── authMiddleware.js            # JWT verification & req.user attachment
│   │   └── errorHandler.js              # Centralized error & 404 handler
│   ├── models/
│   │   ├── Post.js                      # Post Mongoose schema
│   │   └── User.js                      # User Mongoose schema
│   ├── routes/
│   │   ├── authRoutes.js                # Auth endpoints & rate limits
│   │   ├── dashboardRoutes.js           # Dashboard endpoint
│   │   └── postRoutes.js                # Protected post CRUD endpoints
│   ├── validators/
│   │   ├── authValidator.js             # Auth input validation
│   │   └── postValidator.js             # Post input validation
│   ├── .env.example
│   ├── package.json
│   ├── server.js                        # Express server entry point
│   └── test-e2e.js                      # Automated 17-point test suite
├── .gitignore
├── PROJECT_BUILD_PROMPT.md
└── README.md
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/postpilot`) or MongoDB Atlas URI.
  *(Note: For development environments lacking a local MongoDB daemon, the server includes an automatic embedded in-memory MongoDB fallback).*

---

## Getting Started & Installation

### 1. Clone the repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd Project
```

### 2. Configure Environment Variables
Copy the template files into active `.env` files:

```bash
# Server environment
cp server/.env.example server/.env

# Client environment
cp client/.env.example client/.env
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### 4. Run the Backend API
```bash
cd server
npm run dev
```
The server will start on `http://localhost:5000`.

### 5. Run the Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
```
Open the local URL displayed in the terminal (typically `http://localhost:5173` or `http://localhost:5174`).

---

## Environment Configuration

### `server/.env`
```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/postpilot
JWT_SECRET=postpilot_super_secure_jwt_secret_key_2026_dev_env
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### `client/.env`
```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Data Models & Schema

### User Schema (`server/models/User.js`)

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | String | Yes | Trimmed, max 60 chars |
| `email` | String | Yes | Unique, lowercase, validated format |
| `password` | String | Yes | Min 6 chars, hashed with bcrypt |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

### Post Schema (`server/models/Post.js`)

| Field | Type | Required | Default | Allowed Values / Constraints |
|---|---|---|---|---|
| `title` | String | Yes | - | Max 120 chars, trimmed |
| `content` | String | Yes | - | Max 3000 chars, trimmed |
| `platform` | String | Yes | - | `instagram`, `linkedin`, `x` |
| `status` | String | Yes | `draft` | `draft`, `planned`, `published` |
| `scheduledAt`| Date | No | `null` | Valid ISO date |
| `hashtags` | [String] | No | `[]` | Array of strings without `#` |
| `user` | ObjectId | Yes | - | References `User` model, indexed |
| `createdAt` | Date | Auto | - | Timestamp |
| `updatedAt` | Date | Auto | - | Timestamp |

---

## API Reference

Base URL: `http://localhost:5000/api`

### Health Check
- `GET /health` — Check server status, uptime, and timestamp.

### Authentication Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new account (`name`, `email`, `password`) |
| `POST` | `/auth/login` | Public | Log in with credentials |
| `POST` | `/auth/logout` | Public | Clear session cookie |
| `GET` | `/auth/me` | Private | Retrieve current user profile |

### Post Endpoints (All Private)
| Method | Endpoint | Query / Body Params | Description |
|---|---|---|---|
| `GET` | `/posts` | `?platform=&status=&search=` | List authenticated user's posts |
| `GET` | `/posts/:id` | - | Get single post owned by user |
| `POST` | `/posts` | `title`, `content`, `platform`, `status`, `scheduledAt`, `hashtags` | Create post |
| `PUT` | `/posts/:id` | Updated post fields | Update post content |
| `PATCH` | `/posts/:id/status` | `status` | Quick change workflow status |
| `DELETE` | `/posts/:id` | - | Delete owned post |

### Dashboard Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/dashboard/summary` | Private | Get total, draft, planned, published counts and recent posts |

---

## Frontend Pages and Workflows

1. **Authentication Flow (`/login`, `/register`):**
   - Clean card layout with real-time feedback for password length, confirmation matching, and server error handling (e.g. duplicate email).
2. **Dashboard Overview (`/dashboard`):**
   - Visual stat cards with distinct status accents.
   - Channel breakdown bar for LinkedIn, Instagram, and 𝕏.
   - Quick action to create a post.
   - List of recent posts with direct editing capabilities.
3. **Content Library (`/posts`):**
   - Search bar filtering dynamically on keystroke.
   - Multi-dropdown filter for platforms and statuses.
   - Status badge selector allowing instantaneous status switching.
   - Delete confirmation modal guarding against accidental deletions.

---

## Input Validation & Security Considerations

- **Server-Side Validation:** All request bodies and URL parameters are validated via `express-validator`.
- **User Scoping:** Every database query includes `{ user: req.user._id }` ensuring no user can view or mutate another account's content.
- **Password Security:** Passwords hashed with `bcryptjs` salt rounds; password hashes are excluded from model queries by default (`select: false`).
- **HTTP Security Headers:** `helmet` active on all Express endpoints.
- **Brute Force Protection:** Sensitive auth routes limited via `express-rate-limit`.
- **CORS Protection:** Configured with specific origin allowances and credential support.
- **Zero Secrets in Bundles:** Sensitive keys (`MONGODB_URI`, `JWT_SECRET`) reside exclusively in backend environment variables.

---

## Testing & Quality Verification

### Automated Integration Test Suite

The project includes a standalone automated test script verifying the full API contract and multi-tenant isolation.

To run the verification suite:
```bash
cd server
npm test
```

### Verified Test Results (17/17 Passed)

```text
🚀 Running PostPilot End-to-End Verification Suite...

  ✅ [PASS] GET /api/health returns 200 OK
  ✅ [PASS] POST /api/auth/register creates User A and returns token
  ✅ [PASS] POST /api/auth/register rejects duplicate email with 409 Conflict
  ✅ [PASS] POST /api/auth/login authenticates User A
  ✅ [PASS] GET /api/auth/me retrieves current user
  ✅ [PASS] POST /api/posts creates a post for User A
  ✅ [PASS] GET /api/posts/:id fetches the created post
  ✅ [PASS] GET /api/posts filters by platform, status, and search
  ✅ [PASS] PUT /api/posts/:id updates post fields
  ✅ [PASS] PATCH /api/posts/:id/status updates status to published
  ✅ [PASS] GET /api/dashboard/summary reflects updated metrics (total: 1, published: 1)
  ✅ [PASS] ISOLATION: User B cannot view User A post (404 Not Found)
  ✅ [PASS] ISOLATION: User B cannot update User A post (404 Not Found)
  ✅ [PASS] ISOLATION: User B cannot delete User A post (404 Not Found)
  ✅ [PASS] ISOLATION: User B post list is completely isolated (count: 0)
  ✅ [PASS] DELETE /api/posts/:id allows owner to delete post
  ✅ [PASS] VERIFICATION: Deleted post no longer exists (404)

========================================
🏁 Test Results: 17/17 Passed (100%)
========================================
```

### Production Build Verification
The frontend compiles with zero errors:
```bash
cd client
npm run build
# ✓ 1669 modules transformed.
# ✓ built in 1.52s
```

---

## Deployment Guide

### Recommended Stack
- **Frontend:** Vercel or Netlify
- **Backend:** Render or Railway
- **Database:** MongoDB Atlas

### Steps:
1. **Database:** Create a MongoDB Atlas cluster and acquire the connection URI.
2. **Backend (Render):**
   - Connect the repository with root set to `server`.
   - Set build command: `npm install`
   - Set start command: `node server.js`
   - Add environment variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your deployed frontend URL), `NODE_ENV=production`.
3. **Frontend (Vercel):**
   - Connect repository with root set to `client`.
   - Add environment variable: `VITE_API_BASE_URL` (e.g. `https://your-api.onrender.com/api`).
   - Run production deploy.

---

## Limitations & Future Scope

### Current MVP Limitations
- PostPilot manages planned content; it does not publish directly to social networks.
- Analytics reflect internal content planning tallies rather than third-party engagement figures.

### Future Scope
- Official social platform API integration for direct scheduled posting.
- Calendar view with drag-and-drop scheduling.
- Media attachment uploads (images/videos).
- Team collaboration and role-based permissions.

---

## Demo Walkthrough

1. Open `http://localhost:5174` (or `5173`).
2. Register a new account (`Alex Creator`, `alex@example.com`, `password123`).
3. View the blank Dashboard with zeroed counters.
4. Click **Create Post**, provide title, caption, choose **LinkedIn**, and set status to **Planned**.
5. Save the post and observe the Dashboard counters update (`Total: 1`, `Planned: 1`).
6. Change the post status to **Published** via the card dropdown; watch the counter update.
7. Navigate to **Posts**, search by keyword or filter by platform.
8. Click **Edit** to modify post content, and **Delete** to test confirmed removal.

---

## License

This project is submitted as an academic software engineering project. All rights reserved.
