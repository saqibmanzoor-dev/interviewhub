import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  Share2, 
  Play, 
  MessageSquare, 
  Users, 
  FileCode2, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Settings, 
  Award, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Maximize2, 
  Send,
  Terminal,
  Columns,
  Code2,
  Tv,
  AlertTriangle,
  Flame,
  Layers,
  Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import { PeerRoomService } from '../services/peerService';
import { useAuthStore } from '../store/authStore';

export default function InterviewRoom() {
  const { meetingCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Interview & Session State
  const [interview, setInterview] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  // Left Pane Sub-tabs: 'chat' | 'participants' | 'evaluation'
  const [leftTab, setLeftTab] = useState('chat');
  const [isProblemCollapsed, setIsProblemCollapsed] = useState(false);

  // Media Controls (Mic, Cam, Screen)
  const [isMicOn, setIsMicOn] = useState(true);

  // Mobile Responsiveness & Audio Policy
  const [mobileTab, setMobileTab] = useState('call'); // 'call' | 'code'
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resizable Panes State
  const [leftWidthPercent, setLeftWidthPercent] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const newWidth = ((clientX - rect.left) / rect.width) * 100;
      setLeftWidthPercent(Math.min(Math.max(newWidth, 25), 65));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isResizing]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState('self'); // 'self' | 'remote'

  // Code Editor State
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(`// Two Sum Solution\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\nconsole.log("Result:", twoSum([2, 7, 11, 15], 9));`);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('tests'); // 'output' | 'tests' | 'stdin'
  const [showConsole, setShowConsole] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([
    { id: 1, sender: 'InterviewHub Bot', role: 'system', text: `Welcome to session ${meetingCode}. Video and collaborative code sync are active.`, timestamp: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Participants State
  const [participants, setParticipants] = useState([]);

  // Evaluation Rubric Form
  const [rubric, setRubric] = useState({
    problemSolving: 4,
    coding: 4,
    systemDesign: 4,
    communication: 5
  });
  const [recommendation, setRecommendation] = useState('hire');
  const [feedback, setFeedback] = useState('Excellent algorithmic understanding and structured communication throughout the problem solving process.');
  const [privateNotes, setPrivateNotes] = useState('Strong candidate for Senior role. Fast execution and handled edge cases cleanly.');
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const cleanCode = (meetingCode || '').trim().toLowerCase();
  const isExplicitCandidate = searchParams.get('role') === 'candidate';
  const isExplicitHost = searchParams.get('role') === 'interviewer' || searchParams.get('role') === 'host';
  const isSessionCreator = sessionStorage.getItem('ihub_host_' + cleanCode) === 'true' || location.state?.isHost === true;

  // Manual role state (allows toggling role in-room)
  const [manualRole, setManualRole] = useState(null);

  const isHost = manualRole ? manualRole === 'interviewer' : Boolean(
    !isExplicitCandidate && (
      isExplicitHost ||
      isSessionCreator ||
      (interview?.createdBy && (interview.createdBy === user?._id || interview.createdBy?._id === user?._id)) ||
      (interview?.interviewerIds && interview.interviewerIds.some(i => (i?._id || i) === user?._id))
    )
  );

  const [guestName, setGuestName] = useState(() => localStorage.getItem('interview_guest_name') || '');
  const [showGuestModal, setShowGuestModal] = useState(() => !isHost && (!user || user.role === 'candidate') && !localStorage.getItem('interview_guest_name'));
  const [guestInputName, setGuestInputName] = useState('');

  // WebRTC State & References
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [remotePeerInfo, setRemotePeerInfo] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const fallbackStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const broadcastRef = useRef(null);
  const localPeerIdRef = useRef('peer_' + Math.random().toString(36).slice(2, 9));
  const iceCandidateQueueRef = useRef([]);
  const peerRoomRef = useRef(null);
  const lastCodeEditTimeRef = useRef(0);
  const codeSyncTimerRef = useRef(null);

  const sessionIdRef = useRef('cs_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36));
  const myPeerIdRef = useRef('ihub-' + cleanCode.replace(/[^a-z0-9]/g, '') + '-' + Math.random().toString(36).slice(2, 8));

  const currentUserName = user?.name || guestName || (isHost ? 'Lead Interviewer' : 'Second Candidate');
  const currentUserRoleLabel = isHost ? (user?.role === 'admin' ? 'Admin' : 'Interviewer') : 'Candidate';

  const remoteParticipantName = isHost 
    ? (remotePeerInfo?.name || interview?.candidateId?.name || 'Second Candidate') 
    : (remotePeerInfo?.name || interview?.interviewerIds?.[0]?.name || interview?.createdBy?.name || 'Lead Interviewer');
  const remoteParticipantRoleLabel = isHost ? 'Candidate' : 'Interviewer';

  const RTC_CONFIG = {
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
  };

  const flushIceCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription) return;
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] flush candidate error:', e);
      }
    }
  };

  const createPeerConnection = (targetSocketId) => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;
    iceCandidateQueueRef.current = [];

    // Ensure video and audio transceivers exist so SDP always negotiates media
    try {
      pc.addTransceiver('video', { direction: 'sendrecv' });
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {}

    const activeStream = screenStreamRef.current || localStreamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        try {
          const senders = pc.getSenders();
          const already = senders.find(s => s.track && s.track.kind === track.kind);
          if (already) {
            already.replaceTrack(track);
          } else {
            pc.addTrack(track, activeStream);
          }
        } catch (e) {}
      });
    }

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
      setHasRemoteStream(true);
      toast.success('Remote video connected');
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (socketRef.current && targetSocketId) {
          socketRef.current.emit('webrtc:ice-candidate', {
            targetSocketId,
            candidate: event.candidate
          });
        }
        if (broadcastRef.current) {
          broadcastRef.current.postMessage({
            type: 'webrtc:ice-candidate',
            candidate: event.candidate,
            senderId: localPeerIdRef.current
          });
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setHasRemoteStream(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setHasRemoteStream(false);
      }
    };

    return pc;
  };

  // 1. Fetch Interview Details
  useEffect(() => {
    fetchInterviewDetails();
  }, [meetingCode]);

  // 2. Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Audio / Video Stream Setup
  useEffect(() => {
    startMediaStream();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
        peerConnectionRef.current = null;
      }
    };
  }, []);

  // 4. Socket.IO Connection & Dual-Channel Signaling
  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;
    const roomId = meetingCode;

    const sendJoin = () => {
      s.emit('room:join', {
        interviewId: (meetingCode || '').trim().toLowerCase(),
        user: {
          id: user?._id || localPeerIdRef.current,
          name: currentUserName,
          role: isHost ? 'interviewer' : 'candidate',
          avatar: user?.avatar || ''
        }
      });
    };

    if (s.connected) {
      sendJoin();
    }

    s.on('connect', () => {
      setIsConnected(true);
      sendJoin();
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Initialize local cross-tab BroadcastChannel for bulletproof zero-latency signaling
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('interviewhub_room_' + meetingCode);
        broadcastRef.current = bc;

        bc.onmessage = async (evt) => {
          const msg = evt.data;
          if (!msg || msg.senderId === localPeerIdRef.current) return;

          if (msg.type === 'peer:announce') {
            setRemotePeerInfo({ name: msg.name || 'Candidate', role: msg.role || 'candidate' });
            try {
              const pc = createPeerConnection(null);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              bc.postMessage({
                type: 'webrtc:offer',
                sdp: offer,
                senderId: localPeerIdRef.current,
                name: currentUserName,
                role: currentUserRoleLabel.toLowerCase()
              });
            } catch (err) {
              console.error('[Broadcast] Offer error:', err);
            }
          } else if (msg.type === 'webrtc:offer') {
            setRemotePeerInfo({ name: msg.name || 'Interviewer', role: msg.role || 'interviewer' });
            try {
              const pc = createPeerConnection(null);
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              bc.postMessage({
                type: 'webrtc:answer',
                sdp: answer,
                senderId: localPeerIdRef.current
              });
            } catch (err) {
              console.error('[Broadcast] Answer error:', err);
            }
          } else if (msg.type === 'webrtc:answer') {
            try {
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              }
            } catch (err) {
              console.error('[Broadcast] Set remote description error:', err);
            }
          } else if (msg.type === 'webrtc:ice-candidate') {
            try {
              if (peerConnectionRef.current && msg.candidate) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
              }
            } catch (e) {}
          } else if (msg.type === 'editor:change') {
            if (msg.code !== undefined) {
              setCode(msg.code);
            }
          } else if (msg.type === 'chat:message') {
            setMessages(prev => [...prev, msg.message]);
          }
        };

        bc.postMessage({
          type: 'peer:announce',
          senderId: localPeerIdRef.current,
          name: currentUserName,
          role: currentUserRoleLabel.toLowerCase()
        });
      }
    } catch (bcErr) {
      console.warn('BroadcastChannel not supported:', bcErr);
    }

    // Room initial state from server
    s.on('room:state', async (state) => {
      if (state.participants?.length) {
        setParticipants(state.participants.map(p => ({
          id: p.userId || p.socketId,
          socketId: p.socketId,
          name: p.name,
          role: p.role,
          mic: !p.mediaState?.audioMuted,
          video: !p.mediaState?.videoOff
        })));

        const otherPeer = state.participants.find(p => p.socketId !== s.id);
        if (otherPeer) {
          setRemotePeerInfo(otherPeer);
        }
      }
      if (state.activeCode && !code) {
        setCode(state.activeCode);
      }
      if (state.activeLanguage) {
        setSelectedLanguage(state.activeLanguage);
      }
      if (state.challenge) {
        setChallenge(state.challenge);
      }
      if (state.chats?.length) {
        setMessages(state.chats.map(c => ({
          id: c._id || Math.random(),
          sender: c.senderName || 'Participant',
          role: c.senderRole || 'candidate',
          text: c.message,
          timestamp: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    });

    s.on('room:participant-joined', async (participant) => {
      setRemotePeerInfo(participant);
      toast.success(`${participant.name} joined the room`);
      setParticipants(prev => {
        if (prev.some(p => p.id === (participant.userId || participant.socketId))) return prev;
        return [...prev, {
          id: participant.userId || participant.socketId,
          socketId: participant.socketId,
          name: participant.name,
          role: participant.role,
          mic: !participant.mediaState?.audioMuted,
          video: !participant.mediaState?.videoOff
        }];
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'System',
        role: 'system',
        text: `${participant.name} (${participant.role}) joined the interview.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      if (participant.socketId && participant.socketId !== s.id) {
        try {
          const pc = createPeerConnection(participant.socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          s.emit('webrtc:offer', {
            targetSocketId: participant.socketId,
            sdp: offer
          });
        } catch (err) {
          console.error('[WebRTC] Offer initiation error:', err);
        }
      }
    });

    s.on('webrtc:offer', async ({ senderSocketId, sdp }) => {
      console.log('[WebRTC] Incoming offer from:', senderSocketId);
      try {
        const pc = createPeerConnection(senderSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushIceCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit('webrtc:answer', {
          targetSocketId: senderSocketId,
          sdp: answer
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    s.on('webrtc:answer', async ({ senderSocketId, sdp }) => {
      console.log('[WebRTC] Incoming answer from:', senderSocketId);
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushIceCandidates(peerConnectionRef.current);
        }
      } catch (err) {
        console.error('[WebRTC] Error handling answer:', err);
      }
    });

    s.on('webrtc:ice-candidate', async ({ senderSocketId, candidate }) => {
      if (!candidate) return;
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidateQueueRef.current.push(candidate);
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    });

    s.on('room:participant-left', ({ userId, socketId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId && p.socketId !== socketId));
      setHasRemoteStream(false);
      setRemotePeerInfo(null);
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
        peerConnectionRef.current = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      toast.info('Remote participant left');
    });

    s.on('editor:change', (data) => {
      if (data.code !== undefined && data.code !== code) {
        setCode(data.code);
      }
      if (data.language) {
        setSelectedLanguage(data.language);
      }
    });

    s.on('chat:message', (msg) => {
      setMessages(prev => [...prev, {
        id: msg._id || Date.now(),
        sender: msg.senderName || 'Participant',
        role: msg.senderRole || 'candidate',
        text: msg.message,
        timestamp: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      if (leftTab !== 'chat') {
        setUnreadChatCount(prev => prev + 1);
      }
    });

    s.on('media:state-changed', ({ userId, mediaState }) => {
      setParticipants(prev => prev.map(p => {
        if (p.id === userId) {
          return { ...p, mic: !mediaState.audioMuted, video: !mediaState.videoOff };
        }
        return p;
      }));
    });

    return () => {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
        peerConnectionRef.current = null;
      }
      if (broadcastRef.current) {
        try {
          broadcastRef.current.close();
        } catch (e) {}
      }
      s.emit('room:leave');
      s.off('connect');
      s.off('disconnect');
      s.off('room:state');
      s.off('room:participant-joined');
      s.off('room:participant-left');
      s.off('editor:change');
      s.off('chat:message');
      s.off('media:state-changed');
      s.off('webrtc:offer');
      s.off('webrtc:answer');
      s.off('webrtc:ice-candidate');
    };
  }, [meetingCode, user]);

  // Persistent video element binding (prevents black screen on mobile tab switch/render)
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [isCameraOn, mobileTab]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [hasRemoteStream, mobileTab]);

  // Fast Room State Sync engine (MongoDB backed, 100% reliable on Vercel Serverless)
  const triggerRoomSync = useCallback(async (overrides = {}) => {
    if (!meetingCode) return;
    try {
      const payload = {
        sessionId: sessionIdRef.current,
        peerId: myPeerIdRef.current,
        user: {
          name: currentUserName,
          role: currentUserRoleLabel.toLowerCase(),
          avatar: user?.avatar || ''
        },
        media: {
          mic: isMicOn,
          video: isCameraOn
        },
        ...overrides
      };

      const res = await api.post(`/interviews/${cleanCode}/sync`, payload);
      const data = res.data?.data;
      if (!data) return;

      // 1. Sync participants
      if (Array.isArray(data.participants)) {
        const others = data.participants.filter(p => p.sessionId !== sessionIdRef.current);
        const mySelf = {
          id: 'self',
          name: currentUserName,
          role: currentUserRoleLabel.toLowerCase(),
          video: isCameraOn,
          mic: isMicOn
        };

        const mappedOthers = others.map(p => ({
          id: p.sessionId,
          peerId: p.peerId,
          name: p.name,
          role: p.role,
          video: p.video,
          mic: p.mic
        }));

        const newList = [mySelf, ...mappedOthers];
        setParticipants(prev => {
          if (
            prev.length === newList.length &&
            prev.every((p, i) =>
              p.id === newList[i].id &&
              p.name === newList[i].name &&
              p.video === newList[i].video &&
              p.mic === newList[i].mic
            )
          ) {
            return prev;
          }
          return newList;
        });

        if (others.length > 0) {
          const firstOther = others[0];
          setRemotePeerInfo(firstOther);

          // Connect to peer if valid peerId and not yet connected
          if (firstOther.peerId && peerRoomRef.current) {
            peerRoomRef.current.connectToPeer(firstOther.peerId);
          }
        }
      }

      // 2. Sync chat messages
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => String(m.id)));
          const newOnes = data.messages.filter(m => !existingIds.has(String(m.id)));
          if (newOnes.length === 0) return prev;
          return [...prev, ...newOnes];
        });
      }

      // 3. Sync code (if partner edited and local user hasn't edited in > 2.5s)
      if (typeof data.activeCode === 'string' && data.activeCode.length > 0) {
        const timeSinceLocalEdit = Date.now() - lastCodeEditTimeRef.current;
        if (timeSinceLocalEdit > 2500) {
          setCode(prev => {
            if (prev !== data.activeCode) return data.activeCode;
            return prev;
          });
        }
      }

      if (data.activeLanguage) {
        setSelectedLanguage(data.activeLanguage);
      }
    } catch (err) {
      console.warn('[RoomSync] Notice:', err.message);
    }
  }, [cleanCode, meetingCode, currentUserName, currentUserRoleLabel, isMicOn, isCameraOn, user?.avatar]);

  // Periodic heartbeat & room state sync (smooth 3s/4.5s backoff to eliminate CPU & network lag)
  useEffect(() => {
    if (!meetingCode) return;
    triggerRoomSync();
    const pollInterval = hasRemoteStream ? 4500 : 3000;
    const interval = setInterval(() => {
      triggerRoomSync();
    }, pollInterval);
    return () => clearInterval(interval);
  }, [triggerRoomSync, meetingCode, hasRemoteStream]);

  // PeerJS Cloud WebRTC Signaling (Unique Collision-Free Peer IDs + TURN Relay)
  useEffect(() => {
    if (!meetingCode) return;

    if (!peerRoomRef.current) {
      const pService = new PeerRoomService({
        myPeerId: myPeerIdRef.current,
        user: {
          name: currentUserName,
          role: currentUserRoleLabel.toLowerCase(),
          avatar: user?.avatar || ''
        },
        localStream: screenStreamRef.current || localStreamRef.current,
        onRemoteStream: (stream) => {
          remoteStreamRef.current = stream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            const p = remoteVideoRef.current.play();
            if (p !== undefined) {
              p.catch((err) => {
                console.log('[Media] Autoplay requires user tap on mobile:', err.message);
                setNeedsTapToPlay(true);
              });
            }
          }
          setHasRemoteStream(true);
          toast.success('Remote participant video connected');
        },
        onRemotePeer: (remoteUser) => {
          setRemotePeerInfo(remoteUser);
          toast.success(`${remoteUser.name} joined the room`);
        },
        onCodeChange: (newCode) => {
          if (newCode !== undefined) {
            lastCodeEditTimeRef.current = Date.now();
            setCode(newCode);
          }
        },
        onChatMessage: (msg) => {
          setMessages(prev => {
            if (prev.some(m => String(m.id) === String(msg.id))) return prev;
            return [...prev, msg];
          });
        },
        onPeerLeft: () => {
          setHasRemoteStream(false);
          setRemotePeerInfo(null);
          remoteStreamRef.current = null;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          toast.info('Remote participant left');
        }
      });

      peerRoomRef.current = pService;
    }

    return () => {
      if (peerRoomRef.current) {
        peerRoomRef.current.destroy();
        peerRoomRef.current = null;
      }
    };
  }, [meetingCode]);

  const fetchInterviewDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/interviews/${meetingCode}`);
      const data = res.data?.data;
      const fetched = data?.interview || data;
      if (fetched) {
        setInterview(fetched);
        if (fetched.challengeId) {
          setChallenge(fetched.challengeId);
          if (fetched.challengeId.starterCode?.javascript) {
            setCode(fetched.challengeId.starterCode.javascript);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load interview record, using simulated session:', err);
      setChallenge({
        title: 'Two Sum & Subarray Target Sum',
        difficulty: 'Easy',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ],
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.'
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createFallbackMediaStream = (name, role) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let f = 0;
    const draw = () => {
      f++;
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#18181b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      const pulse = Math.sin(f * 0.08) * 6;
      ctx.beginPath();
      ctx.arc(320, 200, 54 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = role === 'candidate' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(139, 92, 246, 0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(320, 200, 46, 0, Math.PI * 2);
      ctx.fillStyle = role === 'candidate' ? '#4f46e5' : '#7c3aed';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((name || 'P').slice(0, 2).toUpperCase(), 320, 200);

      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillText(name || 'Participant', 320, 280);

      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText((role === 'candidate' ? 'Second Candidate' : 'Interviewer').toUpperCase(), 320, 305);
    };
    draw();
    const interval = setInterval(draw, 100);
    const stream = canvas.captureStream(15);
    stream._stopFallback = () => clearInterval(interval);
    return stream;
  };

  const startMediaStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream = null;
        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        };
        try {
          // Low-latency mobile & desktop constraints (capped at 480p @ 24fps to prevent cellular bufferbloat)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 640, max: 854 },
              height: { ideal: 480, max: 480 },
              frameRate: { ideal: 24, max: 30 }
            },
            audio: audioConstraints
          });
        } catch (mobileErr) {
          // Fall back to standard capped constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } },
            audio: audioConstraints
          });
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        if (peerConnectionRef.current) {
          const currentSenders = peerConnectionRef.current.getSenders();
          stream.getTracks().forEach(track => {
            const sender = currentSenders.find(s => s.track && s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              try {
                peerConnectionRef.current.addTrack(track, stream);
              } catch (e) {}
            }
          });
        }
        peerRoomRef.current?.updateLocalStream(stream);
        return;
      }
    } catch (err) {
      console.log('Webcam unavailable or in use, activating synthetic live stream fallback:', err.message);
    }

    // Fallback stream so WebRTC peer connection always has real video stream
    const fallbackStream = createFallbackMediaStream(currentUserName, isHost ? 'interviewer' : 'candidate');
    fallbackStreamRef.current = fallbackStream;
    localStreamRef.current = fallbackStream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = fallbackStream;
      localVideoRef.current.play().catch(() => {});
    }
    peerRoomRef.current?.updateLocalStream(fallbackStream);
    if (peerConnectionRef.current) {
      const currentSenders = peerConnectionRef.current.getSenders();
      fallbackStream.getTracks().forEach(track => {
        const sender = currentSenders.find(s => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          try {
            peerConnectionRef.current.addTrack(track, fallbackStream);
          } catch (e) {}
        }
      });
    }
  };

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = next));
    }
    if (socketRef.current) {
      socketRef.current.emit('media:state-changed', { audioMuted: !next });
    }
  };

  const toggleCamera = () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = next));
    }
    if (socketRef.current) {
      socketRef.current.emit('media:state-changed', { videoOff: !next });
    }
  };

  const stopScreenSharing = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (peerConnectionRef.current && cameraTrack) {
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(cameraTrack);
      }
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }

    if (localStreamRef.current) {
      peerRoomRef.current?.updateLocalStream(localStreamRef.current);
    }

    if (socketRef.current) {
      socketRef.current.emit('media:state-changed', { screenSharing: false });
    }
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'media:state-changed',
        screenSharing: false,
        senderId: localPeerIdRef.current
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = screenStream;
          const screenTrack = screenStream.getVideoTracks()[0];

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
            localVideoRef.current.play().catch(() => {});
          }

          if (peerConnectionRef.current) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(screenTrack);
            }
          }

          peerRoomRef.current?.updateLocalStream(screenStream);

          setIsScreenSharing(true);
          toast.success('Screen sharing started');

          if (socketRef.current) {
            socketRef.current.emit('media:state-changed', { screenSharing: true });
          }
          if (broadcastRef.current) {
            broadcastRef.current.postMessage({
              type: 'media:state-changed',
              screenSharing: true,
              senderId: localPeerIdRef.current
            });
          }

          screenTrack.onended = () => {
            stopScreenSharing();
          };
        } else {
          toast.error('Screen sharing is not supported in this browser.');
        }
      } catch (e) {
        console.warn('Screen share cancelled or failed:', e);
      }
    } else {
      stopScreenSharing();
    }
  };

  const handleCodeChange = (newVal) => {
    lastCodeEditTimeRef.current = Date.now();
    setCode(newVal || '');
    if (socketRef.current) {
      socketRef.current.emit('editor:change', {
        code: newVal,
        language: selectedLanguage
      });
    }
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'editor:change',
        code: newVal,
        senderId: localPeerIdRef.current
      });
    }
    peerRoomRef.current?.sendCode(newVal || '');

    // Debounced sync to MongoDB / Vercel serverless
    if (codeSyncTimerRef.current) clearTimeout(codeSyncTimerRef.current);
    codeSyncTimerRef.current = setTimeout(() => {
      triggerRoomSync({ codeUpdate: newVal || '' });
    }, 700);
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setShowConsole(true);
    setActiveConsoleTab('tests');
    try {
      const res = await api.post('/code-executions', {
        code,
        language: selectedLanguage,
        stdin: customInput,
        challengeId: challenge?._id
      });
      setExecutionResult(res.data.data);
      if (socketRef.current) {
        socketRef.current.emit('editor:run-result', res.data.data);
      }
      toast.success('Code executed successfully');
    } catch (err) {
      setExecutionResult({
        status: 'error',
        stdout: '',
        stderr: err.response?.data?.message || err.message,
        executionTimeMs: 14,
        testResults: [
          { name: 'Test 1: Standard Case', passed: false, input: '[2, 7, 11, 15], 9', expected: '[0, 1]', actual: 'Error running code' }
        ]
      });
      toast.error('Code execution failed');
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      sender: currentUserName,
      role: currentUserRoleLabel.toLowerCase(),
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Instant sync to MongoDB & other devices
    triggerRoomSync({ newChat: newMsg });

    if (socketRef.current) {
      socketRef.current.emit('chat:message', { message: text });
    }
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'chat:message',
        message: newMsg,
        senderId: localPeerIdRef.current
      });
    }
    peerRoomRef.current?.sendChatMessage(newMsg);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    setEvalSubmitting(true);
    setEvalSuccess(false);
    try {
      const recMap = {
        strong_hire: 'Strong Hire',
        hire: 'Hire',
        leaning_no: 'Leaning No Hire',
        strong_no: 'No Hire'
      };
      const recValue = recMap[recommendation] || recommendation || 'Hire';
      const targetInterviewId = interview?._id;

      if (targetInterviewId) {
        await api.post(`/evaluations/interviews/${targetInterviewId}`, {
          ratings: {
            problemSolving: rubric.problemSolving,
            codeQuality: rubric.coding,
            systemDesign: rubric.systemDesign,
            communication: rubric.communication,
            overallScore: Math.round(((rubric.problemSolving + rubric.coding + rubric.systemDesign + rubric.communication) / 4) * 2)
          },
          recommendation: recValue,
          candidateFeedback: feedback,
          privateNotes
        });
      }
      setEvalSuccess(true);
      toast.success('Evaluation rubric saved');
      setTimeout(() => setEvalSuccess(false), 4000);
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      toast.error('Failed to submit evaluation');
    } finally {
      setEvalSubmitting(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyMeetingLink = () => {
    const url = `${window.location.origin}/room/${meetingCode}?role=candidate`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    toast.success('Candidate invitation link copied');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none selection:bg-violet-500/30 selection:text-violet-300">
      
      {/* Network Reconnection Warning Banner */}
      {!isConnected && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-1.5 text-xs flex items-center justify-center gap-2 z-50 shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-medium">Reconnecting to live session...</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-12 px-4 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h1 className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {interview?.title || 'Technical Assessment Round'}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded hidden sm:inline-block">
              {meetingCode}
            </span>

            {/* In-Room Role Switcher */}
            <button
              onClick={() => {
                const nextRole = isHost ? 'candidate' : 'interviewer';
                setManualRole(nextRole);
                if (peerRoomRef.current) {
                  peerRoomRef.current.isHost = nextRole === 'interviewer';
                  peerRoomRef.current.destroyPeerOnly();
                  peerRoomRef.current.init();
                }
                toast.info(`Switched role to ${nextRole === 'interviewer' ? 'Interviewer' : 'Candidate'}`);
              }}
              className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Click to toggle role between Interviewer and Candidate"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isHost ? 'bg-violet-400' : 'bg-emerald-400'}`} />
              <span className="capitalize">{currentUserRoleLabel}</span>
              <span className="text-[9px] text-zinc-500 font-normal">(switch)</span>
            </button>

            <button
              onClick={copyMeetingLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-md shadow-violet-600/25 cursor-pointer shrink-0"
              title="Copy shareable link for candidate"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Link Copied!' : 'Share Room'}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Call vs Code) */}
        <div className="flex md:hidden items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setMobileTab('call')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
              mobileTab === 'call' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <VideoIcon className="w-3 h-3" />
            <span>Call</span>
          </button>
          <button
            onClick={() => setMobileTab('code')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
              mobileTab === 'code' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Code</span>
          </button>
        </div>

        {/* Right side persona badge & leave room */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="w-6 h-6 rounded-md bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-[10px] border border-violet-500/30">
              {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <span className="text-xs text-zinc-300 font-medium hidden md:inline capitalize">
              {currentUserRoleLabel}
            </span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to leave this interview room?')) {
                navigate('/dashboard');
              }
            }}
            className="px-2.5 sm:px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Main Draggable Split Pane Area */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-hidden relative flex flex-col md:flex-row ${isResizing ? 'cursor-col-resize select-none' : ''}`}
      >
        {/* Left Pane: Responsive Video Grid + Bottom Drawer (Chat/Participants/Evaluation) */}
        <div 
          style={isMobile ? undefined : { width: `${leftWidthPercent}%` }}
          className={`h-full flex flex-col bg-zinc-950 p-2 gap-2 border-r border-zinc-800/80 min-h-0 shrink-0 overflow-hidden ${
            isMobile ? (mobileTab === 'call' ? 'w-full' : 'hidden') : ''
          }`}
        >
            
            {/* Video Container with Sliding Control Bar on Hover */}
            <div className="h-44 sm:h-56 md:h-72 shrink-0 grid grid-cols-2 gap-2 relative group overflow-hidden rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-2">
              
              {/* Tile 1: Local Stream */}
              <div 
                onClick={() => setActiveSpeaker('self')}
                className={`rounded-lg bg-zinc-950 border relative overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeSpeaker === 'self' 
                    ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950 border-violet-500/80 shadow-[0_0_15px_rgba(139,92,246,0.25)]' 
                    : 'border-zinc-800/80'
                }`}
              >
                {isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center text-sm font-bold shadow-sm">
                      {currentUserName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300 mt-2">{currentUserName}</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-medium text-zinc-200 flex items-center gap-1.5 border border-white/10">
                  {isMicOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                  <span>{currentUserName} ({currentUserRoleLabel})</span>
                </div>

                {isScreenSharing && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-500/40 text-[9px] font-semibold text-violet-300 flex items-center gap-1">
                    <Share2 className="w-2.5 h-2.5" />
                    <span>Screen</span>
                  </div>
                )}
              </div>

              {/* Tile 2: Remote Peer Stream */}
              <div 
                onClick={() => setActiveSpeaker('remote')}
                className={`rounded-lg bg-zinc-950 border relative overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeSpeaker === 'remote' 
                    ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950 border-violet-500/80 shadow-[0_0_15px_rgba(139,92,246,0.25)]' 
                    : 'border-zinc-800/80'
                }`}
              >
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover rounded-lg ${hasRemoteStream ? 'block' : 'hidden'}`}
                />

                {needsTapToPlay && hasRemoteStream && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (remoteVideoRef.current) {
                        remoteVideoRef.current.play().catch(() => {});
                        setNeedsTapToPlay(false);
                      }
                    }}
                    className="absolute inset-0 m-auto w-max h-max px-3.5 py-2 rounded-xl bg-violet-600/90 hover:bg-violet-500 text-white text-xs font-semibold backdrop-blur-md shadow-2xl flex items-center gap-2 z-30 cursor-pointer animate-pulse"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Tap to Unmute Audio</span>
                  </button>
                )}

                {!hasRemoteStream && !remotePeerInfo && (
                  <div className="flex flex-col items-center justify-center text-center p-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400 mb-2">
                      <Users className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">
                      Waiting for Second Participant
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1 max-w-[190px]">
                      Share room link with your peer or candidate to connect
                    </span>
                    <button
                      onClick={copyMeetingLink}
                      className="mt-2.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Link Copied!' : 'Copy Room Link'}</span>
                    </button>
                  </div>
                )}

                {!hasRemoteStream && remotePeerInfo && (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-zinc-800">
                      {(remotePeerInfo?.name || remoteParticipantName).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="mt-2">
                      <span className="text-[11px] font-medium text-white block truncate max-w-[120px]">
                        {remotePeerInfo?.name || remoteParticipantName}
                      </span>
                      <span className="text-[10px] text-zinc-400 block capitalize">
                        {remotePeerInfo ? (remotePeerInfo.role === 'candidate' ? 'Candidate' : 'Interviewer') : 'Connecting stream...'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-medium text-zinc-200 flex items-center gap-1.5 border border-white/10">
                  <span className={`w-1.5 h-1.5 rounded-full ${remotePeerInfo || hasRemoteStream ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{remotePeerInfo ? `${remotePeerInfo.name} (${remotePeerInfo.role === 'candidate' ? 'Candidate' : 'Interviewer'})` : 'Second Participant (Waiting...)'}</span>
                </div>
              </div>

              {/* Hover Media Controls Dock - Hidden by default, slides up from bottom on hover */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full bg-zinc-950/90 backdrop-blur-md border border-zinc-800 shadow-xl opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-200 z-20">
                <button
                  onClick={toggleMic}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-red-600 text-white animate-pulse'
                  }`}
                  title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isCameraOn ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-red-600 text-white'
                  }`}
                  title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                >
                  {isCameraOn ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isScreenSharing ? 'bg-violet-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                  title="Share Screen"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Left Pane Drawer: Tabbed Panel for Chat, Participants, Evaluation */}
            <div className="flex-1 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col overflow-hidden min-h-0">
              {/* Tab Navigation Header */}
              <div className="h-10 px-3 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setLeftTab('chat'); setUnreadChatCount(0); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      leftTab === 'chat' 
                        ? 'bg-zinc-800 text-violet-300' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                    {unreadChatCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    )}
                  </button>

                  <button
                    onClick={() => setLeftTab('participants')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      leftTab === 'participants' 
                        ? 'bg-zinc-800 text-violet-300' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Participants ({participants.length})</span>
                  </button>

                  <button
                    onClick={() => setLeftTab('evaluation')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      leftTab === 'evaluation' 
                        ? 'bg-zinc-800 text-violet-300' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Rubric</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Live Chat */}
              {leftTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                    {messages.map((m) => (
                      <div key={m.id}>
                        {m.role === 'system' ? (
                          <div className="text-center my-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-500 text-[10px] border border-zinc-800">
                              {m.text}
                            </span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-zinc-200">{m.sender}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{m.timestamp}</span>
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed">{m.text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-2.5 bg-zinc-950 border-t border-zinc-800/80 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message to room..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Participants Roster */}
              {leftTab === 'participants' && (
                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                  {participants.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-violet-600/20 text-violet-400 font-bold flex items-center justify-center text-xs">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">{p.name}</div>
                          <div className="text-[10px] text-zinc-500 capitalize">{p.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Evaluation Rubric */}
              {leftTab === 'evaluation' && (
                <form onSubmit={handleSubmitEvaluation} className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
                  <div>
                    <h4 className="font-semibold text-zinc-200">Interviewer Rubric Scoring</h4>
                    <p className="text-[11px] text-zinc-400">Score candidate on key hiring criteria 1 to 5.</p>
                  </div>

                  {evalSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Evaluation saved successfully!</span>
                    </div>
                  )}

                  {[
                    { key: 'problemSolving', label: 'Problem Solving & Algorithms' },
                    { key: 'coding', label: 'Coding Proficiency & Quality' },
                    { key: 'systemDesign', label: 'Architecture & System Design' },
                    { key: 'communication', label: 'Communication & Collaboration' }
                  ].map((crit) => (
                    <div key={crit.key} className="space-y-1">
                      <div className="flex justify-between font-medium text-zinc-300">
                        <span>{crit.label}</span>
                        <span className="font-bold text-violet-400">{rubric[crit.key]}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={rubric[crit.key]}
                        onChange={(e) => setRubric({ ...rubric, [crit.key]: Number(e.target.value) })}
                        className="w-full accent-violet-600 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Final Recommendation</label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100"
                    >
                      <option value="strong_hire">Strong Hire (Top Tier)</option>
                      <option value="hire">Hire (Meets All Standards)</option>
                      <option value="leaning_no">Leaning No</option>
                      <option value="strong_no">Strong No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Feedback Notes</label>
                    <textarea
                      rows="2"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 placeholder-zinc-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={evalSubmitting}
                    className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {evalSubmitting && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    <span>Submit Evaluation</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Resizer Handle (Desktop only) */}
          <div
            onMouseDown={startResizing}
            onTouchStart={startResizing}
            role="separator"
            tabIndex={0}
            title="Drag to resize panels"
            className={`hidden md:flex w-1.5 shrink-0 bg-zinc-900 hover:bg-violet-600/70 active:bg-violet-600 transition-colors cursor-col-resize items-center justify-center group relative z-20 ${
              isResizing ? 'bg-violet-600' : ''
            }`}
          >
            <div className="w-0.5 h-6 bg-zinc-700 group-hover:bg-white rounded-full transition-colors" />
          </div>

          {/* Right Pane: Collapsible Question Panel + Monaco Editor (vs-dark) + Fixed Bottom Execution Bar */}
          <div 
            style={isMobile ? undefined : { width: `${100 - leftWidthPercent}%` }}
            className={`h-full flex flex-col bg-zinc-950 overflow-hidden relative min-h-0 flex-1 ${
              isMobile ? (mobileTab === 'code' ? 'w-full' : 'hidden') : ''
            }`}
          >
            
            {/* Top Collapsible Challenge Statement Panel */}
            <div className="border-b border-zinc-800/80 bg-zinc-900/60 transition-all duration-200">
              <div 
                onClick={() => setIsProblemCollapsed(!isProblemCollapsed)}
                className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-zinc-850 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode2 className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold text-white">
                    {challenge?.title || 'Algorithmic Problem Challenge'}
                  </span>
                  {challenge?.difficulty && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {challenge.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="text-[11px] hidden sm:inline text-zinc-500">
                    {isProblemCollapsed ? 'Show Details' : 'Collapse'}
                  </span>
                  {isProblemCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!isProblemCollapsed && challenge && (
                <div className="p-4 pt-1 max-h-48 overflow-y-auto space-y-3 text-xs text-zinc-300 border-t border-zinc-800/60">
                  <p className="leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {challenge.description}
                  </p>

                  {challenge.examples?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Examples</span>
                      {challenge.examples.map((ex, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px]">
                          <div><strong className="text-emerald-400">Input:</strong> {ex.input}</div>
                          <div><strong className="text-cyan-400">Output:</strong> {ex.output}</div>
                          {ex.explanation && <div className="text-zinc-400 mt-1 font-sans text-xs">{ex.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {challenge.constraints?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 block">Constraints</span>
                      <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-xs">
                        {challenge.constraints.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Monaco Editor Pane (vs-dark theme with zero default white margins) */}
            <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  padding: { top: 12, bottom: 12 }
                }}
              />
            </div>

            {/* Execution Console Tabs & Output Area */}
            {showConsole && (
              <div className="h-44 bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0">
                <div className="h-8 px-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveConsoleTab('tests')}
                      className={`text-xs px-2.5 py-0.5 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeConsoleTab === 'tests'
                          ? 'bg-zinc-800 text-violet-300 font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Test Results</span>
                    </button>

                    <button
                      onClick={() => setActiveConsoleTab('output')}
                      className={`text-xs px-2.5 py-0.5 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeConsoleTab === 'output'
                          ? 'bg-zinc-800 text-violet-300 font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Console Output</span>
                    </button>

                    <button
                      onClick={() => setActiveConsoleTab('stdin')}
                      className={`text-xs px-2.5 py-0.5 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeConsoleTab === 'stdin'
                          ? 'bg-zinc-800 text-violet-300 font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>Custom Input</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {executionResult && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Runtime: {executionResult.executionTimeMs}ms
                      </span>
                    )}
                    <button
                      onClick={() => setShowConsole(false)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-3 overflow-y-auto text-xs font-mono">
                  {activeConsoleTab === 'tests' && (
                    <div className="space-y-2">
                      {executionResult?.testResults?.length ? (
                        executionResult.testResults.map((t, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border flex items-center justify-between ${
                              t.passed
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {t.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                              <span className="font-semibold">{t.name || `Test Case ${idx + 1}`}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Input: <span className="text-zinc-200">{t.input}</span> | Expected: <span className="text-emerald-400">{t.expected}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-zinc-500 text-center py-6">
                          Click "Run Code" in the command bar below to execute test suites.
                        </div>
                      )}
                    </div>
                  )}

                  {activeConsoleTab === 'output' && (
                    <div className="whitespace-pre-wrap font-mono text-[11px] text-zinc-300">
                      {executionResult ? (
                        executionResult.stderr ? (
                          <span className="text-red-400">{executionResult.stderr}</span>
                        ) : (
                          executionResult.stdout || 'Program executed with exit code 0.'
                        )
                      ) : (
                        <span className="text-zinc-500">Standard output and error logs will appear here.</span>
                      )}
                    </div>
                  )}

                  {activeConsoleTab === 'stdin' && (
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom standard input (stdin)..."
                      className="w-full h-full bg-transparent resize-none focus:outline-none text-zinc-200 placeholder-zinc-600 font-mono text-xs"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Fixed Bottom Execution Command Bar */}
            <div className="h-12 px-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    if (socketRef.current) {
                      socketRef.current.emit('editor:change', { code, language: e.target.value });
                    }
                  }}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 font-medium cursor-pointer"
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="java">Java 17</option>
                </select>

                <button
                  onClick={() => setShowConsole(!showConsole)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showConsole ? 'Hide Console' : 'Show Console'}
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    if (challenge?.starterCode?.[selectedLanguage]) {
                      handleCodeChange(challenge.starterCode[selectedLanguage]);
                      toast.info('Reset code template');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Reset Template
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunningCode}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-xs shadow-sm hover:shadow-violet-600/25 transition-all cursor-pointer"
                >
                  {isRunningCode ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      {/* Guest Candidate Prompt Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Join Technical Assessment</h3>
                <p className="text-xs text-zinc-400 font-mono">Session: {meetingCode}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              You are joining this live interview session as a candidate. Please enter your name to proceed.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Candidate Name</label>
              <input
                type="text"
                value={guestInputName}
                onChange={(e) => setGuestInputName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const finalName = guestInputName.trim() || 'Candidate';
                    setGuestName(finalName);
                    localStorage.setItem('interview_guest_name', finalName);
                    setShowGuestModal(false);
                    if (socketRef.current) {
                      socketRef.current.emit('room:join', {
                        interviewId: (meetingCode || '').trim().toLowerCase(),
                        user: { id: localPeerIdRef.current, name: finalName, role: 'candidate', avatar: '' }
                      });
                    }
                    if (broadcastRef.current) {
                      broadcastRef.current.postMessage({
                        type: 'peer:announce',
                        senderId: localPeerIdRef.current,
                        name: finalName,
                        role: 'candidate'
                      });
                    }
                    if (peerRoomRef.current) {
                      peerRoomRef.current.user.name = finalName;
                      if (peerRoomRef.current.activeConn && peerRoomRef.current.activeConn.open) {
                        peerRoomRef.current.activeConn.send({
                          type: 'handshake',
                          user: peerRoomRef.current.user
                        });
                      }
                    }
                  }
                }}
              />
            </div>

            <button
              onClick={() => {
                const finalName = guestInputName.trim() || 'Candidate';
                setGuestName(finalName);
                localStorage.setItem('interview_guest_name', finalName);
                setShowGuestModal(false);
                if (socketRef.current) {
                  socketRef.current.emit('room:join', {
                    interviewId: (meetingCode || '').trim().toLowerCase(),
                    user: { id: localPeerIdRef.current, name: finalName, role: 'candidate', avatar: '' }
                  });
                }
                if (broadcastRef.current) {
                  broadcastRef.current.postMessage({
                    type: 'peer:announce',
                    senderId: localPeerIdRef.current,
                    name: finalName,
                    role: 'candidate'
                  });
                }
                if (peerRoomRef.current) {
                  peerRoomRef.current.user.name = finalName;
                  if (peerRoomRef.current.activeConn && peerRoomRef.current.activeConn.open) {
                    peerRoomRef.current.activeConn.send({
                      type: 'handshake',
                      user: peerRoomRef.current.user
                    });
                  }
                }
              }}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/30 cursor-pointer"
            >
              Join Session as Candidate
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
