import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Development fallback transporter (logs email output cleanly to console)
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  return transporter;
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

  const origin = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const meetingUrl = `${origin}/room/${meetingCode}`;
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
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"InterviewHub" <invites@interviewhub.io>',
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
    const info = await getTransporter().sendMail(mailOptions);
    console.log(`[EmailService] Invitation email dispatched to ${recipientEmail} for interview ${meetingCode}. MessageId: ${info.messageId || 'local-stream'}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${recipientEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}
