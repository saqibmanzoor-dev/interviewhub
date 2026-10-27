import mongoose from 'mongoose';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const cachedMongoBinary = path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-cachyos-7.0.24');
const dataDir = path.join(os.homedir(), 'mongodb-data');

async function ensureLocalMongo() {
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
    // Give it a brief moment to bind port
    await new Promise(r => setTimeout(r, 1200));
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewhub';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[DB] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.warn(`[DB] Direct connection to ${uri} failed: ${err.message}. Attempting to launch local mongod...`);
    await ensureLocalMongo();
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[DB] Successfully connected to spawned local MongoDB at ${uri}`);
    } catch (launchErr) {
      console.error(`[DB] Critical: Failed to connect to MongoDB: ${launchErr.message}`);
      throw launchErr;
    }
  }
}

export default connectDB;
