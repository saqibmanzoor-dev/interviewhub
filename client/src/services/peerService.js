import { Peer } from 'peerjs';

/**
 * Universal WebRTC Peer-to-Peer Signaling Service for Vercel Deployments
 * Role-Agnostic: Connects ANY two participants (Candidate+Candidate, Interviewer+Candidate, Interviewer+Interviewer)
 * Uses deterministic slot allocation (Peer 1 & Peer 2) over free global PeerServer cloud.
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
    this.isPeer1 = true;
    this.isDestroyed = false;

    this.init();
  }

  init(asPeer2 = false) {
    if (this.isDestroyed) return;

    this.isPeer1 = !asPeer2;
    const p1Id = `ihub-${this.meetingCode}-p1`;
    const p2Id = `ihub-${this.meetingCode}-p2`;
    const myId = this.isPeer1 ? p1Id : p2Id;
    const otherId = this.isPeer1 ? p2Id : p1Id;

    try {
      this.peer = new Peer(myId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            {
              urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp'
              ],
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log(`[PeerRoom] Connected to cloud as ${this.isPeer1 ? 'Peer 1' : 'Peer 2'} (ID: ${id})`);
        
        // Peer 2 always initiates call to Peer 1; Peer 1 also attempts in case Peer 2 was already waiting
        if (!this.isPeer1) {
          this.callPeer(p1Id);
        } else {
          // If Peer 1, listen and attempt pinging Peer 2 after a brief delay
          clearTimeout(this.retryTimer);
          this.retryTimer = setTimeout(() => {
            if (!this.activeConn && !this.isDestroyed) {
              this.callPeer(p2Id);
            }
          }, 2500);
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

        // If Peer 1 spot was already taken by the other participant, join as Peer 2!
        if (err.type === 'unavailable-id') {
          if (this.isPeer1) {
            console.log('[PeerRoom] Slot 1 taken; joining as Slot 2 and calling Slot 1...');
            this.destroyPeerOnly();
            this.init(true); // Reconnect as Peer 2
          }
        } else if (err.type === 'peer-unavailable') {
          // Partner hasn't joined yet; retry calling periodically
          if (!this.isDestroyed) {
            clearTimeout(this.retryTimer);
            this.retryTimer = setTimeout(() => {
              if (!this.isDestroyed && (!this.activeConn || !this.activeCall)) {
                this.callPeer(otherId);
              }
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

  callPeer(targetPeerId) {
    if (this.isDestroyed || !this.peer || this.peer.destroyed) return;

    try {
      console.log('[PeerRoom] Attempting to connect to partner peer:', targetPeerId);
      // 1. Data connection for chat & code sync
      if (!this.activeConn || !this.activeConn.open) {
        const conn = this.peer.connect(targetPeerId, { reliable: true });
        if (conn) {
          this.setupDataConnection(conn);
        }
      }

      // 2. Media call (if local stream is available)
      if (this.localStream && !this.activeCall) {
        const call = this.peer.call(targetPeerId, this.localStream);
        if (call) {
          this.setupCall(call);
        }
      }
    } catch (err) {
      console.warn('[PeerRoom] Call partner notice:', err.message);
    }
  }

  setupDataConnection(conn) {
    this.activeConn = conn;

    conn.on('open', () => {
      console.log('[PeerRoom] Data connection established with:', conn.peer);
      conn.send({
        type: 'handshake',
        user: this.user
      });
    });

    conn.on('data', (data) => {
      if (!data) return;

      if (data.type === 'handshake') {
        this.onRemotePeer(data.user);
        conn.send({
          type: 'handshake_ack',
          user: this.user
        });
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
    } else if (this.peer && !this.peer.destroyed && !this.activeCall) {
      const otherId = this.isPeer1 ? `ihub-${this.meetingCode}-p2` : `ihub-${this.meetingCode}-p1`;
      this.callPeer(otherId);
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
