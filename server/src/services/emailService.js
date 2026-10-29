import nodemailer from 'nodemailer';

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const user = process.env.SMTP_USER?.trim() || 'sakibmanzoor2380@gmail.com';
    const pass = process.env.SMTP_PASS?.trim() || 'vnbjxpfqrekjqque';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);

    if (user && pass) {
      console.log(`[EmailService] Active SMTP transport: ${host} (${user}) on port ${port}`);
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        pool: false,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
    }

    if (process.env.NODE_ENV === 'test') {
      return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[EmailService] No SMTP_USER configured. Created Ethereal test inbox (${testAccount.user}) for live previews.`);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (e) {
      console.warn(`[EmailService] Ethereal fallback failed (${e.message}), using streamTransport.`);
      return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }
  })();

  return transporterPromise;
}

/**
 * Filter out mock and documentation domains to prevent SMTP bounce-backs
 */
export function isDeliverableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  const mockDomains = ['example.com', 'example.org', 'example.net', 'test.com', 'invalid', 'localhost', 'interviewhub.io'];
  return !mockDomains.includes(domain);
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) string
 */
export function generateICS({
  uid,
  title,
  description,
  start,
  end,
  locationUrl,
  organizerName = 'InterviewHub',
  organizerEmail = 'invites@interviewhub.io',
  attendeeName = 'Candidate',
  attendeeEmail = ''
}) {
  const formatICSDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = formatICSDate(new Date());
  const dtStart = formatICSDate(start);
  const dtEnd = formatICSDate(end);
  const cleanUid = uid || `ih-${Date.now()}@interviewhub.io`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InterviewHub//Technical Interview Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${cleanUid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `URL;VALUE=URI:${locationUrl}`,
    `LOCATION:${locationUrl}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    attendeeEmail ? `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${attendeeName}:mailto:${attendeeEmail}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

/**
 * Send OTP verification email for registration or password reset
 */
export async function sendOtpEmail({
  recipientEmail,
  recipientName = 'User',
  otpCode,
  purpose = 'registration',
  expiresInMinutes = 10
}) {
  if (!recipientEmail) return { success: false, reason: 'no_email' };
  if (!isDeliverableEmail(recipientEmail)) {
    console.log(`[EmailService] Simulated OTP delivery for mock domain: ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  const isPasswordReset = purpose === 'password_reset';
  const subject = isPasswordReset 
    ? 'InterviewHub Password Reset Code' 
    : 'Verify your InterviewHub Account - Verification Code';

  const titleText = isPasswordReset ? 'Password Reset Verification' : 'Welcome to InterviewHub';
  const actionText = isPasswordReset 
    ? 'Use the secure verification code below to reset your account password.' 
    : 'Please use the 6-digit verification code below to confirm your email and complete your registration.';

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"InterviewHub" <security@interviewhub.io>',
    to: recipientEmail,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleText}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#F1F5F9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background-color:#111827;border:1px solid #1E293B;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding:32px 32px 20px;background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(16,185,129,0.1));border-bottom:1px solid #1E293B;">
              <span style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">Interview<span style="color:#3B82F6;">Hub</span></span>
              <h2 style="margin:16px 0 0;font-size:20px;font-weight:700;color:#FFFFFF;">${titleText}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#E2E8F0;">Hello <strong>${recipientName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.6;">${actionText}</p>
              
              <div style="background-color:#0F172A;border:1px solid #3B82F6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;display:block;margin-bottom:8px;">Your Verification Code</span>
                <span style="font-size:36px;font-family:monospace;font-weight:800;letter-spacing:8px;color:#60A5FA;">${otpCode}</span>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#64748B;">• This code will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
              <p style="margin:0 0 8px;font-size:13px;color:#64748B;">• If you did not request this code, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#0A0D14;border-top:1px solid #1E293B;text-align:center;">
              <span style="font-size:11px;color:#64748B;">InterviewHub Security & Identity Verification</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Your InterviewHub verification code is: ${otpCode}. It expires in ${expiresInMinutes} minutes.`
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] OTP sent to ${recipientEmail} (${purpose}). MsgID: ${info.messageId || 'local-stream'}`);
    if (previewUrl) {
      console.log(`[EmailService] ✉️  OTP Email Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService] Failed to send OTP to ${recipientEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send an email invitation for a scheduled technical interview
 */
export async function sendInterviewInvitationEmail({
  recipientEmail,
  recipientName = 'Candidate',
  hostName = 'Interviewer',
  hostEmail = '',
  interviewTitle,
  scheduledStart,
  scheduledEnd,
  durationMinutes = 60,
  meetingCode,
  clientUrl
}) {
  if (!recipientEmail) {
    console.warn('[EmailService] Skipped: No recipient email provided.');
    return { success: false, reason: 'no_email' };
  }
  if (!isDeliverableEmail(recipientEmail)) {
    console.log(`[EmailService] Simulated invitation for mock domain: ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  const origin = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const meetingUrl = (hostEmail && recipientEmail.toLowerCase() === hostEmail.toLowerCase())
    ? `${origin}/room/${meetingCode}`
    : `${origin}/room/${meetingCode}?role=candidate`;

  const startDate = new Date(scheduledStart);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"InterviewHub" <sakibmanzoor2380@gmail.com>',
    to: recipientEmail,
    subject: `Interview Invitation: ${interviewTitle} with ${hostName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F1F5F9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08)); border-bottom: 1px solid #1E293B;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; vertical-align: middle;">
                      <span style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">Interview<span style="color: #10B981;">Hub</span></span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 999px; font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.5px;">
                      Invitation
                    </span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 20px 0 0; font-size: 22px; font-weight: 700; color: #FFFFFF; line-height: 1.3;">
                ${interviewTitle}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #CBD5E1;">
                Hello <strong style="color: #FFFFFF;">${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                You have been scheduled for a real-time collaborative technical interview session on InterviewHub. Please find the session details and direct meeting link below.
              </p>

              <!-- Session Details Box -->
              <table role="presentation" width="100%" style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; margin-bottom: 28px; border-collapse: separate; border-spacing: 0;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #1E293B;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Date & Time</div>
                    <div style="font-size: 14px; font-weight: 600; color: #F8FAFC; margin-top: 4px;">${formattedDate}</div>
                    <div style="font-size: 13px; color: #10B981; font-weight: 500; margin-top: 2px;">${formattedTime} (${durationMinutes} mins)</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #1E293B;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Host / Interviewer</div>
                    <div style="font-size: 14px; font-weight: 600; color: #F8FAFC; margin-top: 4px;">${hostName} ${hostEmail ? `<span style="font-weight: 400; color: #94A3B8; font-size: 12px;">(${hostEmail})</span>` : ''}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Meeting Code</div>
                    <div style="font-size: 16px; font-family: monospace; font-weight: 700; color: #38BDF8; margin-top: 4px; letter-spacing: 1px;">${meetingCode}</div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${meetingUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #10B981; color: #042F2E; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                      Join Interview Room &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <span style="font-size: 11px; color: #64748B;">Direct Link: <a href="${meetingUrl}" target="_blank" style="color: #10B981; word-break: break-all;">${meetingUrl}</a></span>
                  </td>
                </tr>
              </table>

              <!-- Quick Checklist -->
              <div style="padding: 16px 20px; background-color: rgba(30, 41, 59, 0.5); border-radius: 10px; border: 1px dashed #334155;">
                <div style="font-size: 12px; font-weight: 700; color: #E2E8F0; margin-bottom: 8px;">Tips for your session:</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #94A3B8; line-height: 1.6;">
                  <li>Join 3–5 minutes early to test your camera and microphone.</li>
                  <li>Ensure a stable internet connection and use a modern desktop browser (Chrome/Edge/Firefox).</li>
                  <li>You will have access to a collaborative IDE with live code execution and syntax highlighting.</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0A0D14; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B; line-height: 1.5;">
                This invitation was sent automatically via InterviewHub Technical Interview Platform.<br>
                Need to reschedule? Please contact your interviewer directly at ${hostEmail || 'the host email'}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Interview Invitation: ${interviewTitle}
Host: ${hostName} (${hostEmail})
Date & Time: ${formattedDate} at ${formattedTime} (${durationMinutes} mins)
Meeting Code: ${meetingCode}

Join Room: ${meetingUrl}

Tips: Join 5 minutes early to test your microphone and camera.
    `
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Invitation email dispatched to ${recipientEmail} for interview ${meetingCode}. MessageId: ${info.messageId || 'local-stream'}`);
    if (previewUrl) {
      console.log(`[EmailService] ✉️  Invitation Email Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${recipientEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
  * Send Booking Confirmation with iCalendar .ics attachment
  */
export async function sendBookingConfirmationEmail({
  recipientEmail,
  recipientName = 'Candidate',
  hostName = 'Interviewer',
  hostEmail = '',
  eventTitle,
  scheduledStart,
  scheduledEnd,
  durationMinutes = 45,
  meetingCode,
  clientUrl,
  answers = []
}) {
  if (!recipientEmail) return { success: false, reason: 'no_email' };
  if (!isDeliverableEmail(recipientEmail)) {
    console.log(`[EmailService] Simulated booking confirmation for mock domain: ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  const origin = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const meetingUrl = `${origin}/room/${meetingCode}`;
  const startDate = new Date(scheduledStart);
  const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  const icsData = generateICS({
    uid: `booking-${meetingCode}@interviewhub.io`,
    title: `${eventTitle}: ${recipientName} & ${hostName}`,
    description: `InterviewHub Session\\nMeeting Code: ${meetingCode}\\nJoin URL: ${meetingUrl}`,
    start: scheduledStart,
    end: scheduledEnd,
    locationUrl: meetingUrl,
    organizerName: hostName,
    organizerEmail: hostEmail || 'invites@interviewhub.io',
    attendeeName: recipientName,
    attendeeEmail: recipientEmail
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"InterviewHub" <invites@interviewhub.io>',
    to: recipientEmail,
    subject: `Confirmed: ${eventTitle} with ${hostName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:sans-serif;color:#F1F5F9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background-color:#111827;border:1px solid #1E293B;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:32px;background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(16,185,129,0.1));border-bottom:1px solid #1E293B;">
            <div style="color:#3B82F6;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Interview Confirmed</div>
            <h1 style="margin:12px 0 0;font-size:24px;color:#FFFFFF;">${eventTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#CBD5E1;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:14px;color:#94A3B8;line-height:1.6;">Your session with <strong>${hostName}</strong> is confirmed. A calendar invite (.ics) has been attached to this email.</p>
            
            <table width="100%" style="background-color:#0F172A;border:1px solid #1E293B;border-radius:12px;margin:24px 0;padding:16px;">
              <tr><td style="padding:8px 12px;font-size:13px;color:#94A3B8;">Date & Time:</td><td style="padding:8px 12px;font-weight:600;color:#F8FAFC;">${formattedDate} at ${formattedTime} (${durationMinutes} min)</td></tr>
              <tr><td style="padding:8px 12px;font-size:13px;color:#94A3B8;">Interviewer:</td><td style="padding:8px 12px;font-weight:600;color:#F8FAFC;">${hostName} ${hostEmail ? `(${hostEmail})` : ''}</td></tr>
              <tr><td style="padding:8px 12px;font-size:13px;color:#94A3B8;">Meeting Code:</td><td style="padding:8px 12px;font-family:monospace;font-weight:700;color:#38BDF8;">${meetingCode}</td></tr>
            </table>

            <div style="text-align:center;margin:32px 0;">
              <a href="${meetingUrl}" style="background-color:#3B82F6;color:#FFFFFF;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block;">Join Live Interview Room</a>
            </div>

            <p style="font-size:12px;color:#64748B;text-align:center;">
              Need to make changes? You can <a href="${origin}/booking/${meetingCode}/reschedule" style="color:#60A5FA;">reschedule</a> or <a href="${origin}/booking/${meetingCode}/cancel" style="color:#EF4444;">cancel</a> this session.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
    attachments: [
      {
        filename: 'invite.ics',
        content: icsData,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }
    ]
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Booking confirmation sent to ${recipientEmail}. MsgID: ${info.messageId || 'local-stream'}`);
    if (previewUrl) {
      console.log(`[EmailService] ✉️  Booking Email Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService] Failed to send booking confirmation to ${recipientEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
  * Send Reschedule Notification Email
  */
export async function sendRescheduleEmail({
  recipientEmail,
  recipientName = 'Candidate',
  hostName = 'Interviewer',
  eventTitle,
  newStart,
  newEnd,
  meetingCode,
  clientUrl
}) {
  if (!recipientEmail) return { success: false, reason: 'no_email' };
  if (!isDeliverableEmail(recipientEmail)) {
    console.log(`[EmailService] Simulated reschedule notice for mock domain: ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  const origin = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const meetingUrl = `${origin}/room/${meetingCode}`;
  const startDate = new Date(newStart);
  const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"InterviewHub" <invites@interviewhub.io>',
    to: recipientEmail,
    subject: `Rescheduled: ${eventTitle} with ${hostName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:sans-serif;color:#F1F5F9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background-color:#111827;border:1px solid #1E293B;border-radius:16px;padding:32px;">
        <h2 style="color:#F59E0B;margin-top:0;">Session Rescheduled</h2>
        <p style="color:#CBD5E1;">Hi ${recipientName}, your session "<strong>${eventTitle}</strong>" with ${hostName} has been rescheduled to:</p>
        <p style="background:#0F172A;padding:16px;border-radius:8px;font-weight:600;color:#38BDF8;">
          ${formattedDate} at ${formattedTime}
        </p>
        <p><a href="${meetingUrl}" style="background:#3B82F6;color:#FFF;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Join Room Link</a></p>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] ✉️  Reschedule Email Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
  * Send Cancellation Email
  */
export async function sendCancellationEmail({
  recipientEmail,
  recipientName = 'Candidate',
  hostName = 'Interviewer',
  eventTitle,
  scheduledStart,
  reason = ''
}) {
  if (!recipientEmail) return { success: false, reason: 'no_email' };
  if (!isDeliverableEmail(recipientEmail)) {
    console.log(`[EmailService] Simulated cancellation notice for mock domain: ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  const startDate = new Date(scheduledStart);
  const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"InterviewHub" <invites@interviewhub.io>',
    to: recipientEmail,
    subject: `Cancelled: ${eventTitle} with ${hostName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:sans-serif;color:#F1F5F9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background-color:#111827;border:1px solid #1E293B;border-radius:16px;padding:32px;">
        <h2 style="color:#EF4444;margin-top:0;">Session Cancelled</h2>
        <p style="color:#CBD5E1;">Hi ${recipientName}, the interview session "<strong>${eventTitle}</strong>" originally scheduled for ${formattedDate} has been cancelled.</p>
        ${reason ? `<p style="color:#94A3B8;font-style:italic;">Reason: "${reason}"</p>` : ''}
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
  * Send Reminder Email
  */
export async function sendReminderEmail({
  recipientEmail,
  recipientName = 'Candidate',
  hostName = 'Interviewer',
  eventTitle,
  scheduledStart,
  meetingCode,
  clientUrl,
  offsetMinutes = 15
}) {
  if (!recipientEmail) return { success: false, reason: 'no_email' };
  if (!isDeliverableEmail(recipientEmail)) {
    console.log(`[EmailService] Simulated reminder for mock domain: ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  const origin = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const meetingUrl = `${origin}/room/${meetingCode}`;

  const timeText = offsetMinutes >= 60 ? `${Math.round(offsetMinutes / 60)} hour(s)` : `${offsetMinutes} minutes`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"InterviewHub" <invites@interviewhub.io>',
    to: recipientEmail,
    subject: `Reminder: ${eventTitle} starts in ${timeText}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:sans-serif;color:#F1F5F9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background-color:#111827;border:1px solid #1E293B;border-radius:16px;padding:32px;">
        <h2 style="color:#3B82F6;margin-top:0;">Interview Starting Soon</h2>
        <p style="color:#CBD5E1;">Hi ${recipientName}, your interview "<strong>${eventTitle}</strong>" with ${hostName} starts in approximately <strong>${timeText}</strong>.</p>
        <p><a href="${meetingUrl}" style="background:#10B981;color:#042F2E;padding:12px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700;">Enter Room Now</a></p>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] ✉️  Notification Email Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

