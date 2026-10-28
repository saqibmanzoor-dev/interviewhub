import app from '../server/src/app.js';
import connectDB from '../server/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Handler] Database connection issue:', err.message);
  }
  return app(req, res);
}
