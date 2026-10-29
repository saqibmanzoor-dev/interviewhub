import app from '../server/src/app.js';
import connectDB from '../server/src/config/db.js';

export default async function handler(req, res) {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
    }
  } catch (err) {
    console.warn('[Vercel Handler] Database connection notice:', err.message);
  }
  return app(req, res);
}
