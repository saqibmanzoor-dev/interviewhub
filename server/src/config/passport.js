import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';

export function configurePassport() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback';
  const jwtSecret = process.env.JWT_ACCESS_SECRET || 'interviewhub-super-secret-access-key-2026';

  // 1. Passport JWT Strategy for protected endpoints
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req) => req?.cookies?.token || null
    ]),
    secretOrKey: jwtSecret
  };

  passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.id).select('-passwordHash');
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  }));

  // 2. Passport Google OAuth 2.0 Strategy
  if (clientId && clientSecret) {
    passport.use(new GoogleStrategy({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackUrl,
      passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        const targetRole = req.query?.state || 'admin';
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.name?.givenName || email.split('@')[0],
            email,
            role: targetRole,
            title: '',
            avatar: profile.photos?.[0]?.value || '',
            emailVerified: true,
            authProviders: [{ provider: 'google', providerUserId: profile.id }]
          });
        } else if (targetRole && user.role !== targetRole) {
          user.role = targetRole;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));
  }

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  return passport;
}

export default passport;
