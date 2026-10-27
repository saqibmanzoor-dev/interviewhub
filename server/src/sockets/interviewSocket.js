import ChatMessage from '../models/ChatMessage.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';

// In-memory room tracking: interviewId -> Map of socketId => { user, role, mediaState }
const interviewRooms = new Map();

export function setupInterviewSockets(io) {
  io.on('connection', (socket) => {
    let currentInterviewId = null;
    let currentUser = null;

    socket.on('room:join', async ({ interviewId, user }) => {
      try {
        currentInterviewId = interviewId;
        currentUser = user;

        socket.join(interviewId);

        if (!interviewRooms.has(interviewId)) {
          interviewRooms.set(interviewId, new Map());
        }

        const roomMap = interviewRooms.get(interviewId);
        const participantInfo = {
          socketId: socket.id,
          userId: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          mediaState: {
            audioMuted: false,
            videoOff: false,
            screenSharing: false
          }
        };

        roomMap.set(socket.id, participantInfo);

        // Fetch interview details for initial code & challenge state (support ObjectId and meetingCode slug)
        const isObjectId = typeof interviewId === 'string' && interviewId.match(/^[0-9a-fA-F]{24}$/);
        const query = isObjectId ? { _id: interviewId } : { meetingCode: interviewId };

        const interview = await Interview.findOne(query)
          .populate('challengeId')
          .lean();

        // Fetch recent chat history
        const chatQuery = interview ? { interviewId: interview._id } : (isObjectId ? { interviewId } : null);
        const recentChats = chatQuery 
          ? await ChatMessage.find(chatQuery).sort({ createdAt: -1 }).limit(50).lean()
          : [];

        // Emit current room state to joining participant
        const participants = Array.from(roomMap.values());
        socket.emit('room:state', {
          participants,
          activeCode: interview?.activeCode || '',
          activeLanguage: interview?.activeLanguage || 'javascript',
          challenge: interview?.challengeId || null,
          chats: recentChats.reverse()
        });

        // Notify other participants in the room
        socket.to(interviewId).emit('room:participant-joined', participantInfo);
        console.log(`[Socket] User ${user.name} joined interview ${interviewId} (${participants.length} in room)`);
      } catch (err) {
        console.error('[Socket Join Error]', err);
        socket.emit('error', { message: 'Failed to join interview room.' });
      }
    });

    // WebRTC Signaling: Offer
    socket.on('webrtc:offer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc:offer', {
        senderSocketId: socket.id,
        sdp
      });
    });

    // WebRTC Signaling: Answer
    socket.on('webrtc:answer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc:answer', {
        senderSocketId: socket.id,
        sdp
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc:ice-candidate', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // Media state change (mic, camera, screenshare)
    socket.on('media:state-changed', (mediaState) => {
      if (!currentInterviewId) return;
      const roomMap = interviewRooms.get(currentInterviewId);
      if (roomMap && roomMap.has(socket.id)) {
        const participant = roomMap.get(socket.id);
        participant.mediaState = { ...participant.mediaState, ...mediaState };
        socket.to(currentInterviewId).emit('media:state-changed', {
          socketId: socket.id,
          userId: participant.userId,
          mediaState: participant.mediaState
        });
      }
    });

    // Real-Time Collaborative Editor: Code Sync
    socket.on('editor:change', async ({ code, language }) => {
      if (!currentInterviewId) return;

      // Broadcast immediately to everyone else in room for low latency
      socket.to(currentInterviewId).emit('editor:change', {
        code,
        language,
        senderSocketId: socket.id
      });

      // Debounced or direct persistence to DB
      if (code) {
        try {
          const isObjectId = typeof currentInterviewId === 'string' && currentInterviewId.match(/^[0-9a-fA-F]{24}$/);
          const q = isObjectId ? { _id: currentInterviewId } : { meetingCode: currentInterviewId };
          await Interview.findOneAndUpdate(q, {
            activeCode: code,
            ...(language ? { activeLanguage: language } : {})
          });
        } catch (e) {
          // ignore transient save failures
        }
      }
    });

    // Real-Time Editor Cursor
    socket.on('editor:cursor', (cursorData) => {
      if (!currentInterviewId) return;
      socket.to(currentInterviewId).emit('editor:cursor', {
        ...cursorData,
        socketId: socket.id
      });
    });

    // Switch Challenge
    socket.on('editor:set-challenge', async ({ challengeId }) => {
      if (!currentInterviewId) return;
      try {
        const isObjectId = typeof currentInterviewId === 'string' && currentInterviewId.match(/^[0-9a-fA-F]{24}$/);
        const q = isObjectId ? { _id: currentInterviewId } : { meetingCode: currentInterviewId };
        const interview = await Interview.findOneAndUpdate(
          q,
          { challengeId },
          { new: true }
        ).populate('challengeId');

        if (interview) {
          io.to(currentInterviewId).emit('editor:challenge-updated', {
            challenge: interview.challengeId,
            activeCode: interview.activeCode
          });
        }
      } catch (e) {
        console.error('[Set Challenge Error]', e);
      }
    });

    // Code Run Output Broadcasting
    socket.on('editor:run-result', (result) => {
      if (!currentInterviewId) return;
      io.to(currentInterviewId).emit('editor:run-result', {
        ...result,
        runnerName: currentUser?.name || 'Participant'
      });
    });

    // Chat Message
    socket.on('chat:message', async ({ message }) => {
      if (!currentInterviewId || !currentUser || !message?.trim()) return;

      try {
        const chatRecord = await ChatMessage.create({
          interviewId: currentInterviewId,
          senderId: currentUser.id || currentUser._id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          message: message.trim()
        });

        io.to(currentInterviewId).emit('chat:message', {
          _id: chatRecord._id,
          senderId: chatRecord.senderId,
          senderName: chatRecord.senderName,
          senderRole: chatRecord.senderRole,
          message: chatRecord.message,
          createdAt: chatRecord.createdAt
        });
      } catch (err) {
        console.error('[Chat Save Error]', err);
      }
    });

    // Interview Ended
    socket.on('interview:end', () => {
      if (!currentInterviewId) return;
      io.to(currentInterviewId).emit('interview:ended');
    });

    // Disconnect handling
    const handleLeave = () => {
      if (currentInterviewId && interviewRooms.has(currentInterviewId)) {
        const roomMap = interviewRooms.get(currentInterviewId);
        roomMap.delete(socket.id);
        socket.to(currentInterviewId).emit('room:participant-left', {
          socketId: socket.id,
          userId: currentUser?.id || currentUser?._id
        });

        if (roomMap.size === 0) {
          interviewRooms.delete(currentInterviewId);
        }
        console.log(`[Socket] User ${currentUser?.name || socket.id} left interview ${currentInterviewId}`);
      }
    };

    socket.on('room:leave', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}
