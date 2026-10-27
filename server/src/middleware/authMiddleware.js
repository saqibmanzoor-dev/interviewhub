import passport from 'passport';
import User from '../models/User.js';
import { verifyAccessToken } from '../utils/token.js';

export function protect(req, res, next) {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (user) {
      req.user = user;
      return next();
    }

    // Fallback token extraction for request handling
    try {
      let token = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      }

      const decoded = verifyAccessToken(token);
      const dbUser = await User.findById(decoded.id).select('-passwordHash');
      if (!dbUser) {
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
      }

      req.user = dbUser;
      return next();
    } catch (fallbackErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: fallbackErr.message });
    }
  })(req, res, next);
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user?.role || 'anonymous'}' is not authorized to access this resource.`
      });
    }
    next();
  };
}
