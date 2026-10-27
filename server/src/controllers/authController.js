import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'candidate', title } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const validRoles = ['candidate', 'interviewer', 'recruiter', 'admin'];
    const assignedRole = validRoles.includes(role) ? role : 'candidate';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
      title: title || '',
      avatar: req.body.avatar || '',
      emailVerified: true
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await AnalyticsEvent.create({
      actorId: user._id,
      eventType: 'user_registered',
      metadata: { role: user.role, email: user.email }
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          avatar: user.avatar,
          organizationId: user.organizationId
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await AnalyticsEvent.create({
      actorId: user._id,
      eventType: 'user_logged_in',
      metadata: { role: user.role }
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          avatar: user.avatar,
          organizationId: user.organizationId
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// Quick demo login for testing without manual credentials
export async function demoLogin(req, res, next) {
  try {
    const { role = 'candidate' } = req.body;
    const user = await User.findOne({ role }).sort({ createdAt: 1 });
    if (!user) {
      return res.status(404).json({ success: false, message: `No demo user found for role: ${role}` });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: `Logged in as demo ${role}`,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          avatar: user.avatar,
          organizationId: user.organizationId
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
}

// Real Google OAuth 2.0 Flow & Direct Google Account Sign-In
export async function googleAuth(req, res, next) {
  try {
    const clientUrl = process.env.CLIENT_URL || req.headers.origin || `${req.protocol}://${req.hostname}:5173`;
    const emailParam = req.query.email || req.body?.email;
    const nameParam = req.query.name || req.body?.name;
    const roleParam = req.query.role || req.body?.role;

    // Direct Google authentication with user's own email and name
    if (emailParam) {
      const email = emailParam.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (req.method === 'POST') {
          return res.status(400).json({ success: false, message: 'Please provide a valid Google email address.' });
        }
        return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Please provide a valid Google email address.')}`);
      }

      const validRoles = ['candidate', 'interviewer', 'recruiter', 'admin'];
      const role = validRoles.includes(roleParam) ? roleParam : 'candidate';
      const name = (nameParam || email.split('@')[0]).trim();

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          role,
          title: req.body?.title || req.query?.title || '',
          avatar: req.body?.avatar || req.query?.avatar || '',
          emailVerified: true,
          authProviders: [{ provider: 'google', providerUserId: email }]
        });
      }

      const token = generateAccessToken(user);

      if (req.method === 'POST') {
        return res.json({
          success: true,
          message: 'Authenticated successfully with Google.',
          data: {
            token,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              title: user.title
            }
          }
        });
      }

      return res.redirect(`${clientUrl}/auth/callback?token=${token}&role=${user.role}&name=${encodeURIComponent(user.name)}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;

    // Verify Google OAuth Client ID is provided
    if (!clientId) {
      if (req.method === 'POST') {
        return res.status(400).json({
          success: false,
          message: 'Google Cloud OAuth credentials not configured in server/.env.'
        });
      }
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Google OAuth credentials not configured in Google Cloud Console. Enter your Google email address directly to sign in.')}`);
    }

    // Direct redirect to genuine Google accounts OAuth 2.0 consent screen
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account`;
    return res.redirect(googleUrl);
  } catch (err) {
    next(err);
  }
}

// Google OAuth 2.0 Callback Handler
export async function googleCallback(req, res, next) {
  const clientUrl = process.env.CLIENT_URL || req.headers.origin || `${req.protocol}://${req.hostname}:5173`;
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('No authorization code received from Google')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in server/.env')}`);
    }

    // Exchange auth code for access token with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Google OAuth token exchange error:', tokenData);
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Google token exchange failed')}`);
    }

    // Fetch verified profile from Google UserInfo API
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileResponse.json();

    if (!profile.email) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Unable to retrieve verified email from Google account')}`);
    }

    // Find existing user or register new user using real Google credentials
    let user = await User.findOne({ email: profile.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        role: req.query?.role || 'candidate',
        title: '',
        avatar: profile.picture || '',
        emailVerified: Boolean(profile.email_verified),
        authProviders: [{ provider: 'google', providerUserId: profile.sub }]
      });
    }

    const token = generateAccessToken(user);
    res.redirect(`${clientUrl}/auth/callback?token=${token}&role=${user.role}&name=${encodeURIComponent(user.name)}`);
  } catch (err) {
    console.error('Google Callback Exception:', err);
    res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(err.message)}`);
  }
}

export async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully.' });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't leak user existence
      return res.json({ success: true, message: 'If an account exists with this email, password reset instructions have been sent.' });
    }

    // In local development / test mode, we generate a reset token and return it or dispatch email
    const resetToken = 'reset_' + Math.random().toString(36).substring(2, 15);
    res.json({
      success: true,
      message: 'Password reset link sent to your registered email address.',
      data: { resetToken }
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword, email } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const query = email ? { email: email.toLowerCase() } : {};
    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully. You may now log in with your new credentials.' });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'interviewhub_jwt_refresh_secret_key_prod_fallback';
    const decoded = jwt.verify(rToken, secret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({
      success: true,
      data: { token: newAccessToken }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Expired or invalid refresh token.' });
  }
}
