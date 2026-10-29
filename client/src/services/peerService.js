import { Peer } from 'peerjs';

/**
 * Universal WebRTC Peer-to-Peer Signaling Service for Vercel Deployments
 * Automatically pairs Host & Candidate over the free global PeerServer cloud.
 */
export class PeerRoomService {
  constructor({ meetingCode, user, isHost, localStream, onRemoteStream, onRemotePeer, onCodeChange, onChatMessage, onPeerLeft }) {
    this.meetingCode = meetingCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    this.user = user || { name: 'Participant', role: isHost ? 'interviewer' : 'candidate' };
    this.isHost = Boolean(isHost);
    this.localStream = localStream || null;
    this.onRemoteStream = onRemoteStream || (() => {});
    this.onRemotePeer = onRemotePeer || (() => {});
    this.onCodeChange = onCodeChange || (() => {});
    this.onChatMessage = onChatMessage || (() => {});
    this.onPeerLeft = onPeerLeft || (() => {});

    this.peer = null;
    this.activeCall = null;
    this.activeConn = null;
    this.retryTimer = null;
    this.isDestroyed = false;

    this.init();
  }

  init() {
    const hostPeerId = `ihub-${this.meetingCode}-host`;
    const candidatePeerId = `ihub-${this.meetingCode}-cand-${Math.random().toString(36).slice(2, 7)}`;

    const targetId = this.isHost ? hostPeerId : candidatePeerId;

    try {
      this.peer = new Peer(targetId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('[PeerRoom] Connected to PeerJS cloud with ID:', id);
        if (!this.isHost) {
          this.callHost(hostPeerId);
        }
      });

      // Handle incoming video/audio call
      this.peer.on('call', (call) => {
        console.log('[PeerRoom] Incoming media call from peer:', call.peer);
        this.activeCall = call;
        call.answer(this.localStream || undefined);

        call.on('stream', (remoteStream) => {
          console.log('[PeerRoom] Received remote media stream');
          this.onRemoteStream(remoteStream);
        });

        call.on('close', () => {
          console.log('[PeerRoom] Media call ended');
          this.onPeerLeft();
        });
      });

      // Handle incoming data channel connection (chat, code sync)
      this.peer.on('connection', (conn) => {
        console.log('[PeerRoom] Incoming data connection from:', conn.peer);
        this.setupDataConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[PeerRoom] PeerJS notice:', err.type, err.message);
        // If Host ID was already taken (e.g. Host reloaded or two people opened as host)
        if (err.type === 'unavailable-id') {
          if (this.isHost) {
            console.log('[PeerRoom] Host ID already registered. Reconnecting as secondary peer...');
            this.peer.destroy();
            this.isHost = false;
            this.init();
          }
        } else if (err.type === 'peer-unavailable') {
          // Host hasn't joined yet; retry calling host
          if (!this.isHost && !this.isDestroyed) {
            clearTimeout(this.retryTimer);
            this.retryTimer = setTimeout(() => {
              if (!this.isDestroyed) this.callHost(hostPeerId);
            }, 2500);
          }
        }
      });

      this.peer.on('disconnected', () => {
        if (!this.isDestroyed && this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch (e) {}
        }
      });
    } catch (e) {
      console.error('[PeerRoom] Peer initialization error:', e);
    }
  }

  callHost(hostPeerId) {
    if (this.isDestroyed || !this.peer || this.peer.destroyed) return;

    try {
      console.log('[PeerRoom] Attempting to connect to host peer:', hostPeerId);
      // 1. Media call
      if (this.localStream) {
        const call = this.peer.call(hostPeerId, this.localStream);
        if (call) {
          this.activeCall = call;
          call.on('stream', (remoteStream) => {
            console.log('[PeerRoom] Remote host stream received');
            this.onRemoteStream(remoteStream);
          });
          call.on('close', () => {
            this.onPeerLeft();
          });
        }
      }

      // 2. Data connection
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      if (conn) {
        this.setupDataConnection(conn);
      }
    } catch (err) {
      console.warn('[PeerRoom] Calling host notice:', err.message);
    }
  }

  setupDataConnection(conn) {
    this.activeConn = conn;

    conn.on('open', () => {
      console.log('[PeerRoom] Data connection open with:', conn.peer);
      // Send greeting handshake with user info
      conn.send({
        type: 'handshake',
        user: this.user
      });
    });

    conn.on('data', (data) => {
      if (!data) return;

      if (data.type === 'handshake') {
        this.onRemotePeer(data.user);
        // Reply with our info if we didn't initiate
        if (this.isHost) {
          conn.send({
            type: 'handshake_ack',
            user: this.user
          });
        }
      } else if (data.type === 'handshake_ack') {
        this.onRemotePeer(data.user);
      } else if (data.type === 'code') {
        this.onCodeChange(data.code);
      } else if (data.type === 'chat') {
        this.onChatMessage(data.message);
      }
    });

    conn.on('close', () => {
      this.onPeerLeft();
    });
  }

  updateLocalStream(newStream) {
    this.localStream = newStream;
    if (this.activeCall && this.activeCall.peerConnection) {
      const pc = this.activeCall.peerConnection;
      const senders = pc.getSenders();
      newStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          try {
            pc.addTrack(track, newStream);
          } catch (e) {}
        }
      });
    }
  }

  sendCode(code) {
    if (this.activeConn && this.activeConn.open) {
      try {
        this.activeConn.send({ type: 'code', code });
      } catch (e) {}
    }
  }

  sendChatMessage(message) {
    if (this.activeConn && this.activeConn.open) {
      try {
        this.activeConn.send({ type: 'chat', message });
      } catch (e) {}
    }
  }

  destroy() {
    this.isDestroyed = true;
    clearTimeout(this.retryTimer);
    if (this.activeCall) {
      try { this.activeCall.close(); } catch (e) {}
      this.activeCall = null;
    }
    if (this.activeConn) {
      try { this.activeConn.close(); } catch (e) {}
      this.activeConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}
