# Detailed Build Prompt — PostPilot MERN Full-Stack Project

Copy and paste this prompt into your coding assistant or development agent. If working in an existing repository, attach the repository context and ask the assistant to inspect the actual files before changing them.

---

## Role

Act as a senior full-stack JavaScript engineer, practical software architect, UI/UX designer, and testing-minded mentor. Build a working end-term **Full Stack Development** project named **PostPilot**, a Social Media Content Planner, using the MERN stack. The goal is a reliable, demonstrable application—not just a mockup or a large amount of untested code.

## Deadline and delivery priorities

The delivery deadline is **27 October 2026, 11:59 PM IST**. Work in a time-boxed way and prioritize the smallest complete full-stack product.

Priority order:

1. Application starts on frontend and backend.
2. MongoDB connection works.
3. Registration/login and protected access work.
4. User-owned post CRUD works end-to-end.
5. Dashboard, search, and filters work.
6. Validation, error states, responsiveness, and README are completed.
7. Deployment and optional enhancements are attempted only after the core app is stable.

Do not waste time adding AI integrations, real social media publishing, elaborate animations, payments, or microservices. Do not claim features are completed when they are not.

## Product concept

**Name:** PostPilot  
**Tagline:** Plan your social content. Keep every post organized.  
**Problem:** Content creators and small businesses keep post ideas in scattered notes and spreadsheets, making drafts and planned posts difficult to manage.  
**Solution:** A dashboard to create, edit, filter, and track social media post ideas in a single application.  
**Target users:** Individual content creators, students, small businesses, and small social media teams.  
**MVP limitation:** The application records posts and statuses; it does not automatically publish to Instagram, LinkedIn, or X.

## Required technology stack

Use JavaScript throughout; do not convert this into TypeScript.

### Frontend

- HTML5 / JSX
- CSS3 with a clean responsive design
- React
- Vite
- React Router DOM for routes
- React hooks (`useState`, `useEffect`, `useContext`, and `useMemo` when useful)
- Context API for authentication state where appropriate
- Axios **or** Fetch API for server calls; choose one and use it consistently

### Backend

- Node.js
- Express.js
- REST API returning JSON
- MongoDB
- Mongoose
- JWT for authentication
- bcryptjs for password hashing
- dotenv for environment variables
- cors for frontend/backend access
- cookie-parser if authentication uses cookies
- helmet for security headers
- express-rate-limit for sensitive endpoints
- Zod or express-validator for request validation; choose one
- morgan for development request logs if useful

Use only packages that are actually needed. Check existing `package.json` files before installing dependencies. Do not mix CommonJS and ES modules inconsistently; follow the existing module configuration and keep imports/exports valid.

## Core requirements

### 1. Account and authentication

Implement:

- Registration using name, email, and password.
- Login using email and password.
- Logout.
- A `GET /api/auth/me` endpoint to restore the current user's authenticated state.
- Protected frontend routes.
- Protected backend post routes.
- Password hashing with bcryptjs; never store plain-text passwords.
- Duplicate email handling.
- Safe user responses that never contain the password hash.

Prefer an HTTP-only cookie for the JWT. Configure `cookie-parser`, CORS credentials, Axios/Fetch credentials, cookie expiration, and `secure`/`sameSite` settings consistently. Use non-secure cookies only for local HTTP development; use HTTPS and secure cookies in production. If the existing environment makes cookies impractical, explain the trade-off and implement one consistent authentication approach rather than half-implementing two.

### 2. Post data and ownership

Each post should contain:

- `title`: required string, trimmed, with a reasonable maximum length.
- `content`: required string, trimmed, with a reasonable maximum length.
- `platform`: one of `instagram`, `linkedin`, `x`.
- `status`: one of `draft`, `planned`, `published`.
- `scheduledAt`: optional date or `null`.
- `hashtags`: optional array of strings.
- `user`: required reference to the owning User.
- `createdAt` and `updatedAt`: timestamps.

Define a Mongoose schema with appropriate types, required constraints, enums, trimming, and timestamps. Every read, update, and delete operation must be scoped to the authenticated user. Never trust a user/owner ID supplied in the request body. A user must never access or mutate another user's post by guessing its MongoDB ID.

### 3. Post CRUD

Implement these workflows completely through the actual database:

- Create a post.
- List the current user's posts.
- Fetch one owned post for editing.
- Update an owned post.
- Change an owned post's status.
- Delete an owned post after frontend confirmation.

The frontend must call the API. Do not fake successful requests or use hard-coded arrays as the primary data store. Seed demo data only through an explicit development-only approach or create it through the UI.

### 4. Dashboard

Create a dashboard with:

- Total posts.
- Draft count.
- Planned count.
- Published count.
- A short list of recently updated posts.
- A clear create-post action.
- Loading, error, and empty states.

Counts must be derived from real data for the authenticated user, preferably through a dashboard summary endpoint or reliably derived from the fetched list. They must update after successful mutations.

### 5. Search and filters

Implement:

- Search by title and content.
- Filter by platform.
- Filter by status.
- Combined filters.
- A clear/reset filter action.

Filtering may be performed server-side using query parameters. Validate query values and always constrain the query to the authenticated user's ID. If the dataset is small, do not add complex pagination unless time remains.

### 6. UX and accessibility

Use a polished but realistic interface:

- Responsive layout for desktop and mobile.
- Consistent navigation, spacing, typography, buttons, cards, inputs, and status badges.
- Labels linked to form inputs.
- Visible focus indicators and keyboard-friendly controls.
- Inline validation feedback.
- Loading indicators or disabled buttons during requests.
- Success/error feedback after actions.
- Confirmation before destructive deletion.
- Helpful empty states and a not-found page.
- No buttons that look functional but do nothing.

Favor clarity over decorative complexity. Avoid fake analytics or charts that are not based on real records.

## Required API contract

Use `/api` as the API prefix. Keep the endpoint names consistent across the backend, frontend service files, and README.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Posts

- `GET /api/posts` — supports optional `status`, `platform`, and `search` filters.
- `GET /api/posts/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `PATCH /api/posts/:id/status`
- `DELETE /api/posts/:id`
- `GET /api/dashboard/summary`
- `GET /api/health`

Return sensible HTTP status codes: `200`, `201`, `400`, `401`, `403` when appropriate, `404`, `409` for duplicate email where appropriate, `429`, and `500`. Use consistent JSON responses. Do not expose stack traces or secrets in production responses.

## Suggested architecture and code organization

Use a clear and not-overengineered structure similar to:

```text
postpilot/
  client/
    src/
      api/
      components/
      context/
      pages/
      services/
      App.jsx
      main.jsx
      index.css
    package.json
    .env.example
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    validators/
    server.js
    package.json
    .env.example
  .gitignore
  README.md
  PROJECT_BUILD_PROMPT.md
```

Recommended backend separation:

- `config/db.js`: connect to MongoDB and fail clearly if connection fails.
- `models/User.js`: user schema.
- `models/Post.js`: post schema.
- `routes/`: API route definitions.
- `controllers/`: request logic.
- `middleware/authMiddleware.js`: verify authentication and attach the safe authenticated user context.
- `middleware/errorHandler.js`: centralized error handling.
- `validators/`: schema/request validation.
- `server.js`: configure Express middleware, routes, health endpoint, and server startup.

Recommended frontend separation:

- `api/axios.js`: shared API client and credentials/base URL.
- `context/AuthContext.jsx`: current user and login/logout/register actions.
- `services/`: API methods, not UI markup.
- `components/`: reusable presentational components.
- `pages/`: route-level screens.
- `ProtectedRoute.jsx`: route protection.
- `PostForm.jsx`: shared create/edit form.

You may adapt this to an existing repository, but keep responsibilities understandable and avoid duplicating API logic in every component.

## Environment configuration

Create example files and document them. Use placeholders, never actual secrets.

Server `.env.example`:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/postpilot
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Client `.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Never expose `MONGODB_URI` or `JWT_SECRET` through frontend variables. Ensure `.gitignore` excludes `.env`, `node_modules`, build output, logs, and other local artifacts.

## Input validation and security requirements

- Validate request bodies and query parameters on the server.
- Normalize emails, and enforce uniqueness at the database level where possible.
- Hash passwords with bcryptjs.
- Set a reasonable password minimum length and never log passwords.
- Do not return password hashes.
- Verify authentication on every private API route.
- Check ownership on every post read/update/delete.
- Validate MongoDB IDs before querying.
- Use centralized error handling.
- Use Helmet, rate limiting on auth routes, and body-size limits.
- Restrict CORS to configured frontend origins.
- If using cookies, configure credentialed CORS correctly and use appropriate production cookie flags; consider CSRF implications for the chosen setup.
- Do not use raw HTML rendering for user-generated captions.
- Keep secrets out of Git and client bundles.

## Error and loading behavior

The app must handle:

- API is unreachable.
- Database connection fails.
- User enters invalid data.
- Email already exists.
- Credentials are invalid.
- Session expires or is missing.
- Post ID is invalid or does not exist.
- User tries to access another person's post.
- Save/delete operation fails.
- Empty post list.

Show a human-readable message in the UI and log useful technical information on the server without leaking secrets to the browser.

## Quality and testing requirements

At minimum:

1. Start backend and frontend independently using documented commands.
2. Verify health endpoint and database connection.
3. Register a new account.
4. Log in and refresh the browser; authentication restoration should behave according to the selected session strategy.
5. Create, view, edit, status-update, filter, search, and delete a post.
6. Verify posts remain after refresh.
7. Test invalid input and duplicate registration.
8. Test that User A cannot read/update/delete User B's post.
9. Test API failure/loading states in the UI.
10. Run the frontend production build and fix build errors.
11. Check browser console and server terminal for errors.
12. Confirm `.env` is not staged or committed.

If time allows, add automated tests for auth and post ownership. Do not spend the whole deadline writing a test framework before the main workflow functions.

## README requirements

Create or update `README.md` with:

- Project overview and problem statement.
- Features and what is intentionally out of scope.
- Complete technology stack with each tool's purpose.
- Architecture diagram/request lifecycle.
- Actual folder structure.
- Prerequisites and precise setup commands.
- Environment variable templates.
- Database models.
- API routes and example payloads.
- Security/validation choices.
- Testing checklist.
- Deployment steps.
- Known limitations and future scope.
- Screenshots/demo instructions if available.

The README must match the code. Clearly label unimplemented items as planned or remove them from the implemented-features list. Never fabricate a demo link, screenshot, test result, database setup, or deployment.

## Required execution behavior from the coding assistant

1. **Inspect before editing.** List the repository files, examine `package.json` files, identify the current frameworks/module system, and inspect existing app entry points. If a repository already exists, preserve useful code.
2. **Summarize the current state briefly.** Identify what exists, what is broken, and the smallest plan to complete the MVP.
3. **Work in vertical slices.** Complete one path end-to-end before starting the next: server/database health → authentication → post CRUD → frontend integration → dashboard/filters → polish.
4. **Make concrete edits.** Do not respond with pseudocode alone. Create or modify the files in the repository and keep imports, exports, scripts, and file paths consistent.
5. **Use valid commands.** Before installing packages, inspect what is already installed. Avoid unnecessary dependency churn.
6. **Run and verify.** Execute available checks, frontend build, and targeted API tests. If something fails, report the exact error and fix it where possible.
7. **Do not hide failures.** Never say “everything works” without running the relevant checks. Separate verified, unverified, and remaining work.
8. **Protect data and secrets.** Never overwrite the user's existing data, expose credentials, disable security to pass a demo, or commit `.env` files.
9. **Avoid unnecessary clarifying questions.** Make reasonable choices based on the existing repository and state assumptions explicitly, unless a critical requirement is impossible to infer.
10. **Finish with a delivery summary.** List implemented features, key files changed, commands to run frontend/backend, environment variables still required, checks actually performed, known bugs, and a short demo sequence.

## Acceptance criteria

The project is ready for demonstration only when all of these are true:

- [ ] Frontend and backend run using documented commands.
- [ ] Backend connects to MongoDB or reports a clear actionable error.
- [ ] Registration/login/logout work.
- [ ] Private pages and endpoints are protected.
- [ ] Each account sees and modifies only its own posts.
- [ ] Post CRUD works through React → Express → Mongoose → MongoDB.
- [ ] Dashboard numbers reflect the user's records.
- [ ] Search and filters work.
- [ ] Validation and common API errors are handled.
- [ ] Refreshing does not remove database-backed posts.
- [ ] Responsive layout works at common mobile and desktop widths.
- [ ] Production frontend build succeeds.
- [ ] README and repository state reflect reality.
- [ ] No secrets are committed.

## First response expected from you

Start by inspecting the current project repository and tell me briefly:

1. What files and frameworks are already present.
2. Which required technologies are missing.
3. The exact shortest implementation plan for the current state.
4. The first end-to-end vertical slice you will implement.

Then implement and test the project in that order. Do not stop after only suggesting code or creating a mock UI.

---

**Reminder:** A smaller, verified MERN application is better than a long list of incomplete features. Keep the implementation honest, demonstrate the full-stack data flow, and leave sufficient time to submit the project.
