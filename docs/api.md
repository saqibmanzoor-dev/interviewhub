# InterviewHub — REST API Specification (`/api/v1`)

All endpoints use JSON payloads and return standardized response formats:
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { ... }
}
```

---

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new user profile.
- **Request Body**:
  ```json
  {
    "name": "Alex Chen",
    "email": "alex.chen@example.com",
    "password": "Password123!",
    "role": "candidate",
    "title": "Full-Stack Software Engineer"
  }
  ```
- **Response**: `201 Created` with JWT access token, refresh token, and user record.

### `POST /api/v1/auth/login`
Authenticates a user with email and password credentials.
- **Request Body**:
  ```json
  {
    "email": "alex.chen@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK` with user profile and auth token.

### `POST /api/v1/auth/demo-login`
One-click instant authentication for demo personas without entering credentials.
- **Request Body**:
  ```json
  { "role": "candidate" } // or "interviewer", "recruiter", "admin"
  ```
- **Response**: `200 OK` with demo persona credentials and JWT.

### `GET /api/v1/auth/me`
Retrieves current authenticated profile from JWT header (`Authorization: Bearer <token>`).

### `POST /api/v1/auth/forgot-password`
Requests password reset instructions.
- **Request Body**: `{ "email": "user@example.com" }`

### `POST /api/v1/auth/reset-password`
Resets password using a validated token.
- **Request Body**: `{ "token": "...", "newPassword": "NewPassword123!" }`

---

## 2. Interviews (`/api/v1/interviews`)

### `GET /api/v1/interviews`
Lists interviews accessible to the current user (candidates see their own sessions; interviewers and recruiters see organization sessions).
- **Query Parameters**: `status` (`scheduled`, `in_progress`, `completed`, `cancelled`).

### `POST /api/v1/interviews`
Schedules a new technical interview.
- **Request Body**:
  ```json
  {
    "title": "Senior Frontend Engineer Technical Round",
    "candidateEmail": "candidate@example.com",
    "candidateName": "Maya Lin",
    "scheduledStart": "2026-11-01T14:00:00Z",
    "durationMinutes": 60,
    "challengeId": "651a2b3c4d5e6f7a8b9c0d1e"
  }
  ```
- **Response**: `201 Created` with generated `meetingCode` (e.g. `abc-defg-hij`).

### `GET /api/v1/interviews/:id`
Retrieves interview details and active session state by MongoDB `_id` or `meetingCode`.

---

## 3. Coding Challenges (`/api/v1/challenges`)

### `GET /api/v1/challenges`
Returns coding challenge repository with difficulty, category, and public test cases.
- **Query Parameters**: `difficulty` (`easy`, `medium`, `hard`), `category`, `search`.

### `GET /api/v1/challenges/:id`
Retrieves detailed challenge statement, constraints, examples, and starter templates. (Hidden test cases are protected from candidate roles).

---

## 4. Code Execution Sandbox (`/api/v1/code-executions`)

### `POST /api/v1/code-executions`
Executes code in an isolated runner against test cases.
- **Request Body**:
  ```json
  {
    "code": "function twoSum(nums, target) { ... }",
    "language": "javascript",
    "stdin": "",
    "challengeId": "651a2b3c4d5e6f7a8b9c0d1e"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "success",
      "stdout": "Result: [0, 1]\n",
      "stderr": "",
      "executionTimeMs": 18,
      "memoryUsageBytes": 14500000,
      "testResults": [
        { "name": "Example 1", "passed": true, "input": "[2,7,11,15], 9", "expected": "[0,1]", "actual": "[0,1]" }
      ]
    }
  }
  ```

---

## 5. Evaluations (`/api/v1/evaluations`)

### `GET /api/v1/evaluations`
Retrieves evaluations ledger. (For candidate requests, `privateNotes` are strictly redacted).

### `POST /api/v1/evaluations/interviews/:interviewId`
Submits rubric ratings and recommendation for an interview session.
- **Request Body**:
  ```json
  {
    "ratings": {
      "problemSolving": 4,
      "codeQuality": 4,
      "systemDesign": 4,
      "communication": 5,
      "overallScore": 8
    },
    "recommendation": "Strong Hire",
    "candidateFeedback": "Strong algorithmic foundations and clear communication.",
    "privateNotes": "Recommended for L5 senior position."
  }
  ```

---

## 6. Social Blade Analytics (`/api/v1/analytics`)

### `GET /api/v1/analytics/overview`
Computes real-time platform metrics from database records:
- Total interviews conducted
- Passing rate percentage
- Code executions count
- Weekly interview velocity trends
- Candidate competency radar distributions
- Platform Grade Badge (`A+`, `A`, `B`)
