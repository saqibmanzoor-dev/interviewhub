import { Peer } from 'peerjs';

/**
 * Universal WebRTC Peer-to-Peer Service for Vercel Deployments
 * Supports any two devices across Wi-Fi and 4G/5G Cellular Networks
 * Uses OpenRelay TURN servers and unique, collision-free Peer IDs.
 */
export class PeerRoomService {
  constructor({
    myPeerId,
    user,
    localStream,
    onRemoteStream,
    onRemotePeer,
    onCodeChange,
    onChatMessage,
    onPeerLeft
  }) {
    this.myPeerId = myPeerId;
    this.user = user || { name: 'Participant', role: 'candidate' };
    this.localStream = localStream || null;
    this.onRemoteStream = onRemoteStream || (() => {});
    this.onRemotePeer = onRemotePeer || (() => {});
    this.onCodeChange = onCodeChange || (() => {});
    this.onChatMessage = onChatMessage || (() => {});
    this.onPeerLeft = onPeerLeft || (() => {});

    this.peer = null;
    this.activeCall = null;
    this.activeConn = null;
    this.targetPeerId = null;
    this.isDestroyed = false;

    this.init();
  }

  init() {
    if (this.isDestroyed) return;

    try {
      this.peer = new Peer(this.myPeerId, {
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
        console.log('[PeerRoom] Connected to cloud signaling with ID:', id);
        if (this.targetPeerId) {
          this.connectToPeer(this.targetPeerId);
        }
      });

      // Handle incoming video/audio call
      this.peer.on('call', (call) => {
        console.log('[PeerRoom] Incoming media call from peer:', call.peer);
        this.activeCall = call;
        this.setupCall(call);
        call.answer(this.localStream || undefined);
      });

      // Handle incoming data channel connection
      this.peer.on('connection', (conn) => {
        console.log('[PeerRoom] Incoming data connection from:', conn.peer);
        this.setupDataConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[PeerRoom] PeerJS error:', err.type, err.message);
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

  connectToPeer(targetPeerId) {
    if (this.isDestroyed || !targetPeerId || targetPeerId === this.myPeerId) return;
    this.targetPeerId = targetPeerId;

    if (!this.peer || this.peer.destroyed || !this.peer.open) {
      return;
    }

    try {
      // 1. Data connection for real-time P2P sync
      if (!this.activeConn || !this.activeConn.open) {
        console.log('[PeerRoom] Connecting data channel to:', targetPeerId);
        const conn = this.peer.connect(targetPeerId, { reliable: true });
        if (conn) {
          this.setupDataConnection(conn);
        }
      }

      // 2. Media call (if local stream is available and not already connected)
      if (this.localStream && (!this.activeCall || !this.activeCall.open)) {
        console.log('[PeerRoom] Initiating media call to:', targetPeerId);
        const call = this.peer.call(targetPeerId, this.localStream);
        if (call) {
          this.activeCall = call;
          this.setupCall(call);
        }
      }
    } catch (err) {
      console.warn('[PeerRoom] Call partner notice:', err.message);
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

  setupDataConnection(conn) {
    this.activeConn = conn;

    conn.on('open', () => {
      console.log('[PeerRoom] Data connection established with:', conn.peer);
      try {
        conn.send({
          type: 'handshake',
          user: this.user
        });
      } catch (e) {}
    });

    conn.on('data', (data) => {
      if (!data) return;

      if (data.type === 'handshake') {
        this.onRemotePeer(data.user);
        try {
          conn.send({
            type: 'handshake_ack',
            user: this.user
          });
        } catch (e) {}
      } else if (data.type === 'handshake_ack') {
        this.onRemotePeer(data.user);
      } else if (data.type === 'code') {
        this.onCodeChange(data.code);
      } else if (data.type === 'chat') {
        this.onChatMessage(data.message);
      }
    });

    conn.on('close', () => {
      this.activeConn = null;
      this.onPeerLeft();
    });

    conn.on('error', (err) => {
      console.warn('[PeerRoom] Data channel error:', err);
    });
  }

  updateLocalStream(newStream) {
    this.localStream = newStream;
    if (this.activeCall && this.activeCall.peerConnection) {
      const pc = this.activeCall.peerConnection;
      const senders = pc.getSenders ? pc.getSenders() : [];
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
    } else if (this.targetPeerId) {
      this.connectToPeer(this.targetPeerId);
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
