import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { setupInterviewSockets } from './sockets/interviewSocket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupInterviewSockets(io);

async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` InterviewHub Server running on http://localhost:${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api/v1`);
      console.log(` Socket.IO signaling ready`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
