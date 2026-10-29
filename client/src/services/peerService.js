import { Peer } from 'peerjs';

/**
 * Universal WebRTC Peer-to-Peer Signaling Service for Vercel Deployments
 * Automatically pairs Host & Candidate over the free global PeerServer cloud.
 * Features:
 * - Dynamic host election & collision recovery
 * - Bidirectional audio/video exchange
 * - Real-time chat & Monaco code synchronisation
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
    this.peerUnavailableCount = 0;
    this.isDestroyed = false;

    this.init();
  }

  init() {
    if (this.isDestroyed) return;

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
        console.log('[PeerRoom] Connected to PeerJS cloud with ID:', id, '| isHost:', this.isHost);
        this.peerUnavailableCount = 0;
        if (!this.isHost) {
          this.callHost(hostPeerId);
        }
      });

      // Handle incoming video/audio call
      this.peer.on('call', (call) => {
        console.log('[PeerRoom] Incoming media call from peer:', call.peer);
        this.setupCall(call);
        call.answer(this.localStream || undefined);
      });

      // Handle incoming data channel connection (chat, code sync)
      this.peer.on('connection', (conn) => {
        console.log('[PeerRoom] Incoming data connection from:', conn.peer);
        this.setupDataConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[PeerRoom] PeerJS notice:', err.type, err.message);

        // If Host ID was already taken (e.g. host is already in room or host reloaded)
        if (err.type === 'unavailable-id') {
          if (this.isHost) {
            console.log('[PeerRoom] Host spot taken; joining as candidate to connect to existing host...');
            this.destroyPeerOnly();
            this.isHost = false;
            this.init();
          }
        } else if (err.type === 'peer-unavailable') {
          if (!this.isHost && !this.isDestroyed) {
            this.peerUnavailableCount++;
            // If candidate tried to call host 2 times (~4 seconds) and no host is found:
            // Self-heal: Elect this peer to claim the host spot!
            if (this.peerUnavailableCount >= 2) {
              console.log('[PeerRoom] No host found after retries. Claiming host role for this room...');
              this.peerUnavailableCount = 0;
              this.destroyPeerOnly();
              this.isHost = true;
              this.init();
              return;
            }

            clearTimeout(this.retryTimer);
            this.retryTimer = setTimeout(() => {
              if (!this.isDestroyed) this.callHost(hostPeerId);
            }, 2000);
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

  setupCall(call) {
    this.activeCall = call;

    call.on('stream', (remoteStream) => {
      console.log('[PeerRoom] Received remote media stream from:', call.peer);
      this.onRemoteStream(remoteStream);
    });

    call.on('close', () => {
      console.log('[PeerRoom] Media call ended');
      this.activeCall = null;
      this.onPeerLeft();
    });

    call.on('error', (err) => {
      console.warn('[PeerRoom] Media call error:', err);
    });
  }

  callHost(hostPeerId) {
    if (this.isDestroyed || !this.peer || this.peer.destroyed) return;

    try {
      console.log('[PeerRoom] Attempting to connect to host peer:', hostPeerId);
      // 1. Data connection for immediate presence, chat & code sync
      if (!this.activeConn || !this.activeConn.open) {
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        if (conn) {
          this.setupDataConnection(conn);
        }
      }

      // 2. Media call (if local stream is ready)
      if (this.localStream && !this.activeCall) {
        const call = this.peer.call(hostPeerId, this.localStream);
        if (call) {
          this.setupCall(call);
        }
      }
    } catch (err) {
      console.warn('[PeerRoom] Calling host notice:', err.message);
    }
  }

  setupDataConnection(conn) {
    this.activeConn = conn;

    conn.on('open', () => {
      console.log('[PeerRoom] Data connection open with:', conn.peer);
      conn.send({
        type: 'handshake',
        user: this.user
      });
    });

    conn.on('data', (data) => {
      if (!data) return;

      if (data.type === 'handshake') {
        this.onRemotePeer(data.user);
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
    } else if (!this.isHost && this.peer && !this.peer.destroyed) {
      // If we are candidate and media just became available, initiate the media call to host now!
      const hostPeerId = `ihub-${this.meetingCode}-host`;
      this.callHost(hostPeerId);
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

  destroyPeerOnly() {
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

  destroy() {
    this.isDestroyed = true;
    this.destroyPeerOnly();
  }
}
