import mongoose from 'mongoose';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';

const cachedMongoBinary = path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-cachyos-7.0.24');
const dataDir = path.join(os.homedir(), 'mongodb-data');

// Explicitly enable Mongoose command buffering so queries don't fail during startup/reconnection
mongoose.set('bufferCommands', true);

function isPortInUse(port = 27017) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function ensureLocalMongo() {
  if (await isPortInUse(27017)) {
    return;
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(cachedMongoBinary)) {
    console.log('[DB] Found cached mongod binary. Starting daemon...');
    const mongoProcess = spawn(cachedMongoBinary, [
      '--port', '27017',
      '--dbpath', dataDir,
      '--bind_ip', '127.0.0.1',
      '--nounixsocket'
    ], {
      detached: true,
      stdio: 'ignore'
    });
    mongoProcess.unref();

    // Poll until port is listening or timeout (up to 4s)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (await isPortInUse(27017)) {
        console.log('[DB] Local mongod daemon is listening on port 27017');
        break;
      }
    }
  }
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const uri = process.env.MONGODB_URI;

  if (!uri && isServerless) {
    console.warn('[DB] Serverless warning: MONGODB_URI environment variable is not defined in Vercel settings.');
    return null;
  }

  const finalUri = uri || 'mongodb://127.0.0.1:27017/interviewhub';

  // First try direct connection
  try {
    const conn = await mongoose.connect(finalUri, { 
      serverSelectionTimeoutMS: isServerless ? 3000 : 5000,
      bufferCommands: true
    });
    const sanitizedUri = finalUri.includes('@') ? finalUri.replace(/:([^:@]+)@/, ':****@') : finalUri;
    console.log(`[DB] Connected to MongoDB at ${sanitizedUri}`);
    return conn;
  } catch (err) {
    if (isServerless) {
      console.warn(`[DB] Cloud serverless connection warning: ${err.message}`);
      return null;
    }

    console.warn(`[DB] Direct connection to ${finalUri} failed: ${err.message}. Checking local mongod daemon...`);
    await ensureLocalMongo();

    try {
      const conn = await mongoose.connect(finalUri, { 
        serverSelectionTimeoutMS: 6000,
        bufferCommands: true
      });
      console.log(`[DB] Successfully connected to MongoDB at ${finalUri}`);
      return conn;
    } catch (launchErr) {
      console.error(`[DB] Critical: Failed to connect to MongoDB: ${launchErr.message}`);
      throw launchErr;
    }
  }
}

// Middleware to ensure DB connection is ready before processing API requests
export async function ensureDBConnected(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless && !process.env.MONGODB_URI) {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    if (isServerless) {
      console.warn('[DB] Serverless DB unavailable, proceeding with request:', err.message);
      return next();
    }
    return res.status(503).json({
      success: false,
      message: 'Database connection is still initializing. Please retry in a few seconds.'
    });
  }
}

export default connectDB;
