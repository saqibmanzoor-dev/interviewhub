import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

let candidateToken = '';
let interviewerToken = '';
let testMeetingCode = '';
let testInterviewId = '';

beforeAll(async () => {
  await connectDB();

  // Login as Candidate
  const candRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'alex.chen@example.com', password: 'Password123!' });
  candidateToken = candRes.body.data.token;

  // Login as Interviewer
  const intRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'elena.rostova@example.com', password: 'Password123!' });
  interviewerToken = intRes.body.data.token;
});

describe('InterviewHub Backend API Suite', () => {
  it('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/v1/auth/demo-login logs in recruiter successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ role: 'recruiter' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('recruiter');
    expect(res.body.data.token).toBeDefined();
  });

  it('GET /api/v1/interviews returns user-scoped interviews', async () => {
    const res = await request(app)
      .get('/api/v1/interviews')
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    testMeetingCode = res.body.data[0].meetingCode;
    testInterviewId = res.body.data[0]._id;
  });

  it('GET /api/v1/interviews/:id retrieves interview by meetingCode', async () => {
    const res = await request(app)
      .get(`/api/v1/interviews/${testMeetingCode}`)
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.meetingCode).toBe(testMeetingCode);
  });

  it('POST /api/v1/code-executions securely executes JavaScript in sandbox', async () => {
    const res = await request(app)
      .post('/api/v1/code-executions')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        language: 'javascript',
        code: 'const a = 10; const b = 25; console.log("Calculated:", a + b); a + b;'
      });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Success');
    expect(res.body.data.stdout).toContain('Calculated: 35');
  });

  it('POST /api/v1/code-executions blocks harmful node process inspection', async () => {
    const res = await request(app)
      .post('/api/v1/code-executions')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        language: 'javascript',
        code: 'process.exit(1);'
      });
    expect(res.status).toBe(200);
    expect(res.body.data.stderr).toContain('Security Policy Violation');
  });

  it('GET /api/v1/evaluations/interviews/:id strips privateNotes for candidates', async () => {
    const res = await request(app)
      .get(`/api/v1/evaluations/interviews/${testInterviewId}`)
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].privateNotes).toBeUndefined();
    }
  });

  it('GET /api/v1/analytics/overview calculates aggregation metrics from real data', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${interviewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalInterviews).toBeGreaterThan(0);
    expect(res.body.data.totalUsers).toBeGreaterThan(0);
    expect(res.body.data.completionRate).toBeDefined();
  });
});
