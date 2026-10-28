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

  it('GET /api/v1/event-types/public/:slug retrieves public booking event type', async () => {
    const res = await request(app).get('/api/v1/event-types/public/frontend-live-coding');
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('frontend-live-coding');
    expect(res.body.data.userId).toBeDefined();
    expect(res.body.data.duration).toBe(45);
  });

  it('GET /api/v1/availability/slots calculates slots for event type', async () => {
    const eventRes = await request(app).get('/api/v1/event-types/public/frontend-live-coding');
    const eventTypeId = eventRes.body.data._id;

    // Use tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const slotsRes = await request(app).get(`/api/v1/availability/slots?eventTypeId=${eventTypeId}&date=${dateStr}`);
    expect(slotsRes.status).toBe(200);
    expect(slotsRes.body.data.date).toBe(dateStr);
    expect(Array.isArray(slotsRes.body.data.slots)).toBe(true);
  });

  it('POST /api/v1/bookings/public books a slot and prevents double-booking', async () => {
    const eventRes = await request(app).get('/api/v1/event-types/public/frontend-live-coding');
    const eventTypeId = eventRes.body.data._id;

    // Unique future time slot for each test run to ensure clean isolated test
    const futureDate = new Date(Date.now() + (10 + Math.random() * 10) * 86400000);
    futureDate.setSeconds(0, 0);

    const bookingPayload = {
      eventTypeId,
      slotStart: futureDate.toISOString(),
      candidateName: 'Booking Test Candidate',
      candidateEmail: `booking.${Date.now()}@example.com`,
      attendeeNotes: 'Excited for live interview'
    };

    // First booking attempt should succeed
    const firstRes = await request(app)
      .post('/api/v1/bookings/public')
      .send(bookingPayload);

    expect(firstRes.status).toBe(201);
    expect(firstRes.body.data.meetingCode).toBeDefined();

    // Second booking attempt for overlapping slot should be rejected with 409 Conflict
    const secondRes = await request(app)
      .post('/api/v1/bookings/public')
      .send(bookingPayload);

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.message).toContain('no longer available');
  });

  it('POST /api/v1/auth/register-otp dispatches OTP without leaking plain code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register-otp')
      .send({
        name: 'New Candidate',
        email: `otp.cand.${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'candidate'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('6-digit verification code');
    // Security check: ensure raw OTP is never returned in HTTP response
    expect(res.body.otp).toBeUndefined();
    expect(res.body.code).toBeUndefined();
  });
});
