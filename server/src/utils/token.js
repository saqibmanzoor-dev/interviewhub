import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'interviewhub-super-secret-access-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'interviewhub-super-secret-refresh-key-2026';

export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      organizationId: user.organizationId
    },
    JWT_ACCESS_SECRET,
    { expiresIn: '1d' }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
