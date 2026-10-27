# InterviewHub — Database Schema & Data Models

InterviewHub uses MongoDB with Mongoose document models. Below is the specification of all collections, field definitions, indexing strategies, and relational links.

---

## 1. Entity-Relationship Overview

```
 [User] <----+ (candidateId)
             |
             +----+ (interviewerIds[])
                  |
             [Interview] <----+ (interviewId)
                  |           |
                  |           +--- [InterviewSession]
                  |           +--- [InterviewEvaluation]
                  |           +--- [ChatMessage]
                  |           +--- [Notification]
                  v
          [CodingChallenge]
```

---

## 2. Collections & Schema Definitions

### 2.1 `User` (`users`)
| Field | Type | Description / Constraints |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique primary key |
| `name` | String | User's full name |
| `email` | String | Unique email (lowercase, indexed) |
| `passwordHash` | String | bcrypt salted password hash |
| `role` | String | Enum: `candidate`, `interviewer`, `recruiter`, `admin` |
| `title` | String | Professional designation |
| `avatar` | String | URL to user avatar SVG/PNG |
| `organizationId` | ObjectId | Organization reference |
| `emailVerified` | Boolean | Verification flag (default `false`) |
| `timestamps` | Date | `createdAt`, `updatedAt` |

### 2.2 `Interview` (`interviews`)
| Field | Type | Description / Constraints |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique primary key |
| `title` | String | Title of technical interview session |
| `description` | String | Meeting agenda or context |
| `candidateId` | ObjectId | Ref to `User` (indexed) |
| `interviewerIds` | [ObjectId] | Array of refs to `User` |
| `scheduledStart` | Date | Scheduled beginning timestamp |
| `scheduledEnd` | Date | Scheduled end timestamp |
| `actualStart` | Date | Actual room launch timestamp |
| `actualEnd` | Date | Actual conclusion timestamp |
| `status` | String | Enum: `scheduled`, `in_progress`, `completed`, `cancelled` (indexed) |
| `meetingCode` | String | Unique slug (e.g. `abc-defg-hij`, indexed) |
| `meetingTokenHash` | String | SHA-256 session token hash |
| `challengeId` | ObjectId | Ref to `CodingChallenge` |
| `activeCode` | String | Persisted editor code state |
| `activeLanguage` | String | Default language (e.g. `javascript`) |
| `createdBy` | ObjectId | Ref to scheduling `User` |

### 2.3 `CodingChallenge` (`codingchallenges`)
| Field | Type | Description / Constraints |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique primary key |
| `title` | String | Problem title (indexed) |
| `description` | String | Markdown problem description |
| `difficulty` | String | Enum: `easy`, `medium`, `hard` (indexed) |
| `category` | String | E.g. `Algorithms`, `Data Structures` |
| `tags` | [String] | E.g. `['Array', 'Hash Table', 'Two Pointers']` |
| `starterCode` | Object | Code templates by language (js, py, cpp, java) |
| `testCases` | [Object] | Array of `{ input, expectedOutput, isHidden }` |
| `timeLimitMs` | Number | Execution time limit (default 1000ms) |

### 2.4 `InterviewEvaluation` (`interviewevaluations`)
| Field | Type | Description / Constraints |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique primary key |
| `interviewId` | ObjectId | Ref to `Interview` (indexed) |
| `evaluatorId` | ObjectId | Ref to interviewer `User` (indexed) |
| `candidateId` | ObjectId | Ref to candidate `User` (indexed) |
| `ratings` | Object | `{ problemSolving, codeQuality, systemDesign, communication, overallScore }` |
| `recommendation` | String | Enum: `Strong Hire`, `Hire`, `Leaning Hire`, `Leaning No Hire`, `No Hire` |
| `candidateFeedback` | String | Candidate-visible structured review |
| `privateNotes` | String | **Strictly confidential** hiring committee notes |
| `submittedAt` | Date | Submission timestamp |

### 2.5 `ChatMessage` (`chatmessages`)
| Field | Type | Description / Constraints |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique primary key |
| `interviewId` | ObjectId | Ref to `Interview` (indexed) |
| `senderId` | ObjectId | Ref to `User` |
| `senderName` | String | Cached display name |
| `senderRole` | String | Cached sender role |
| `message` | String | Message text |
| `createdAt` | Date | Timestamp (indexed) |

### 2.6 `AnalyticsEvent` (`analyticsevents`)
| Field | Type | Description / Constraints |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique primary key |
| `actorId` | ObjectId | Ref to `User` triggering event |
| `eventType` | String | E.g. `interview_scheduled`, `evaluation_submitted`, `code_executed` |
| `interviewId` | ObjectId | Ref to related `Interview` |
| `metadata` | Object | Arbitrary payload data |
| `occurredAt` | Date | Timestamp (indexed) |

---

## 3. Database Indexes

- `users.email`: Unique index for fast O(1) lookups and preventing duplicate registrations.
- `interviews.meetingCode`: Unique index for instant room lookup.
- `interviews.candidateId` & `interviews.status`: Compound index for candidate dashboard queries.
- `interviewevaluations.interviewId`: Index for fast evaluation retrieval.
- `analyticsevents.occurredAt`: Index supporting time-window aggregations without full collection scans.
