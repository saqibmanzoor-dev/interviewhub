import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Maximize2, 
  Send,
  Terminal,
  Columns,
  Code2,
  Tv
} from 'lucide-react';
import api from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
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

  // Layout & Drawers
  const [layoutMode, setLayoutMode] = useState('split'); // 'split' | 'code' | 'video'
  const [activeSidePanel, setActiveSidePanel] = useState('problem'); // 'problem' | 'chat' | 'participants' | 'evaluation' | null

  // Media Controls (Mic, Cam, Screen)
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState('interviewer'); // 'candidate' | 'interviewer'

  // Code Editor State
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(`// Two Sum Solution\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\nconsole.log("Result:", twoSum([2, 7, 11, 15], 9));`);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('tests'); // 'output' | 'tests' | 'stdin'

  // Chat State
  const [messages, setMessages] = useState([
    { id: 1, sender: 'InterviewHub Bot', role: 'system', text: `Welcome to meeting room ${meetingCode}. Video and collaborative code sync are active.`, timestamp: 'Just now' }
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
  const [privateNotes, setPrivateNotes] = useState('Strong candidate for Senior L5 role. Fast execution and handled edge cases cleanly.');
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  // References
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Fetch Interview & Challenge Data
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
    };
  }, []);

  // 4. Socket.IO Connection & Events
  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;
    const roomId = interview?._id || meetingCode;

    // Join Room
    s.emit('room:join', {
      interviewId: roomId,
      user: {
        id: user?._id || 'guest',
        name: user?.name || 'Participant',
        role: user?.role || 'candidate',
        avatar: user?.avatar || ''
      }
    });

    // Room initial state from server
    s.on('room:state', (state) => {
      if (state.participants?.length) {
        setParticipants(state.participants.map(p => ({
          id: p.userId || p.socketId,
          name: p.name,
          role: p.role,
          mic: !p.mediaState?.audioMuted,
          video: !p.mediaState?.videoOff
        })));
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

    s.on('room:participant-joined', (participant) => {
      setParticipants(prev => {
        if (prev.some(p => p.id === (participant.userId || participant.socketId))) return prev;
        return [...prev, {
          id: participant.userId || participant.socketId,
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
    });

    s.on('room:participant-left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId));
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
      if (activeSidePanel !== 'chat') {
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
      s.emit('room:leave');
      s.off('room:state');
      s.off('room:participant-joined');
      s.off('room:participant-left');
      s.off('editor:change');
      s.off('chat:message');
      s.off('media:state-changed');
    };
  }, [meetingCode, interview?._id, user]);

  const fetchInterviewDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/interviews/${meetingCode}`);
      const data = res.data.data;
      setInterview(data.interview);
      if (data.interview?.challengeId) {
        setChallenge(data.interview.challengeId);
        if (data.interview.challengeId.starterCode?.javascript) {
          setCode(data.interview.challengeId.starterCode.javascript);
        }
      }
      // Populate mock participants
      setParticipants([
        { id: '1', name: data.interview?.interviewerId?.name || 'Alex Morgan', role: 'interviewer', mic: true, video: true },
        { id: '2', name: data.interview?.candidateId?.name || user?.name || 'Sarah Chen', role: 'candidate', mic: isMicOn, video: isCameraOn }
      ]);
    } catch (err) {
      console.warn('Could not load interview record, using simulated session:', err);
      // Fallback challenge
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
      setParticipants([
        { id: '1', name: 'Alex Morgan', role: 'interviewer', mic: true, video: true },
        { id: '2', name: user?.name || 'Sarah Chen', role: user?.role || 'candidate', mic: isMicOn, video: isCameraOn }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startMediaStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      // Permission denied or headless environment: normal in test environments
      console.log('Using simulated camera tile representation (camera access not granted)');
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

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setIsScreenSharing(true);
          if (socketRef.current) {
            socketRef.current.emit('media:state-changed', { screenSharing: true });
          }
          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            if (socketRef.current) {
              socketRef.current.emit('media:state-changed', { screenSharing: false });
            }
          };
        } else {
          setIsScreenSharing(true);
        }
      } catch (e) {
        console.warn('Screen share cancelled');
      }
    } else {
      setIsScreenSharing(false);
      if (socketRef.current) {
        socketRef.current.emit('media:state-changed', { screenSharing: false });
      }
    }
  };

  const handleCodeChange = (newVal) => {
    setCode(newVal || '');
    if (socketRef.current) {
      socketRef.current.emit('editor:change', {
        code: newVal,
        language: selectedLanguage
      });
    }
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
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
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    if (socketRef.current) {
      socketRef.current.emit('chat:message', { message: text });
    }
    setChatInput('');
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
      setTimeout(() => setEvalSuccess(false), 4000);
    } catch (err) {
      console.error('Error submitting evaluation:', err);
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
    navigator.clipboard.writeText(`${window.location.origin}/room/${meetingCode}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="h-screen w-screen bg-[#07090E] text-slate-100 flex flex-col overflow-hidden select-none">
      
      {/* 1. Google Meet Inspired Top Header */}
      <header className="h-14 px-4 bg-[#0B0F19] border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0 z-30">
        
        {/* Left: Meeting Info & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-semibold text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {interview?.title || 'Technical Assessment Round'}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              {meetingCode}
            </span>
            <button
              onClick={copyMeetingLink}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title="Copy Room Link"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right: Layout Switcher & Quick Profile */}
        <div className="flex items-center gap-2.5">
          {/* Layout Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setLayoutMode('split')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${layoutMode === 'split' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'}`}
              title="Split View (Video + Code)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Split</span>
            </button>
            <button
              onClick={() => setLayoutMode('code')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${layoutMode === 'code' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'}`}
              title="Full Code Editor"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Editor</span>
            </button>
            <button
              onClick={() => setLayoutMode('video')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${layoutMode === 'video' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'}`}
              title="Full Video View"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Video</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <span className="text-xs text-slate-300 font-medium hidden md:inline capitalize">
              {user?.role || 'Guest'}
            </span>
          </div>
        </div>

      </header>

      {/* 2. Main Work Area (Video Grid + Code Editor + Side Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT / CENTER CONTENT AREA */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2 bg-[#07090E]">
          
          {/* VIDEO CONFERENCING GRID */}
          {(layoutMode === 'split' || layoutMode === 'video') && (
            <div className={`flex flex-col gap-2 transition-all duration-200 ${
              layoutMode === 'video' ? 'w-full h-full' : 'w-full md:w-[38%] h-64 md:h-full shrink-0'
            }`}>
              
              {/* Tile 1: Interviewer Video Tile */}
              <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-lg group">
                {/* Active speaker emerald glowing ring */}
                {activeSpeaker === 'interviewer' && (
                  <div className="absolute inset-0 border-2 border-emerald-500/80 rounded-2xl pointer-events-none shadow-[inset_0_0_15px_rgba(16,185,129,0.3)] animate-pulse" />
                )}

                {/* Simulated high-fidelity avatar video representation */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-emerald-500/20 ring-4 ring-slate-800">
                      AM
                    </div>
                    {/* Audio wave indicator animation */}
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-slate-950">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2.5 text-center">
                    <span className="text-xs font-semibold text-white">Alex Morgan</span>
                    <span className="block text-[10px] text-emerald-400">Senior Staff Engineer (Interviewer)</span>
                  </div>
                </div>

                {/* Video Tile Name & Audio Badge */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-medium text-slate-200 flex items-center gap-1.5 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Alex Morgan (Speaking)</span>
                </div>
              </div>

              {/* Tile 2: Candidate Video Tile */}
              <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-lg group">
                {activeSpeaker === 'candidate' && (
                  <div className="absolute inset-0 border-2 border-emerald-500/80 rounded-2xl pointer-events-none shadow-[inset_0_0_15px_rgba(16,185,129,0.3)] animate-pulse" />
                )}

                {isCameraOn ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    {/* Fallback avatar if physical webcam is disabled/empty */}
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-slate-800">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SC'}
                      </div>
                      <div className="mt-2.5 text-center">
                        <span className="text-xs font-semibold text-white">{user?.name || 'Sarah Chen'}</span>
                        <span className="block text-[10px] text-slate-400">Candidate (Camera Live)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xl font-bold ring-4 ring-slate-800">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SC'}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Camera Off</div>
                  </div>
                )}

                {/* Candidate Tile Bottom Bar */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-medium text-slate-200 flex items-center gap-1.5 border border-white/10">
                  {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{user?.name || 'Sarah Chen'} (You)</span>
                </div>

                {isScreenSharing && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-[10px] font-semibold text-blue-300 flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    <span>Sharing Screen</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* MONACO CODE EDITOR & EXECUTION CONSOLE */}
          {(layoutMode === 'split' || layoutMode === 'code') && (
            <div className="flex-1 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              
              {/* Editor Top Bar */}
              <div className="h-11 px-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200 hidden sm:inline">Collaborative IDE</span>
                  
                  {/* Language Selector */}
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      if (socketRef.current) {
                        socketRef.current.emit('code_update', { meetingCode, code, language: e.target.value });
                      }
                    }}
                    className="bg-slate-900 border border-slate-700/80 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="python">Python 3</option>
                    <option value="cpp">C++ (GCC)</option>
                    <option value="java">Java 17</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (challenge?.starterCode?.[selectedLanguage]) {
                        handleCodeChange(challenge.starterCode[selectedLanguage]);
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
                    title="Reset to challenge starter code"
                  >
                    Reset
                  </button>

                  <button
                    onClick={handleRunCode}
                    disabled={isRunningCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
                  >
                    {isRunningCode ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Run Code</span>
                  </button>
                </div>
              </div>

              {/* Monaco Editor Pane */}
              <div className="flex-1 min-h-[220px] relative">
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
                  }}
                />
              </div>

              {/* Execution Console Tabs & Output Area */}
              <div className="h-44 bg-[#090C12] border-t border-slate-800 flex flex-col shrink-0">
                {/* Console tabs */}
                <div className="h-8 px-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveConsoleTab('tests')}
                      className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                        activeConsoleTab === 'tests'
                          ? 'bg-slate-800 text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Test Results</span>
                    </button>

                    <button
                      onClick={() => setActiveConsoleTab('output')}
                      className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                        activeConsoleTab === 'output'
                          ? 'bg-slate-800 text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Console Output</span>
                    </button>

                    <button
                      onClick={() => setActiveConsoleTab('stdin')}
                      className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                        activeConsoleTab === 'stdin'
                          ? 'bg-slate-800 text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Custom Input</span>
                    </button>
                  </div>

                  {executionResult && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Runtime: {executionResult.executionTimeMs}ms • Memory: {executionResult.memoryUsageBytes ? `${Math.round(executionResult.memoryUsageBytes/1024)}KB` : '18MB'}
                    </span>
                  )}
                </div>

                {/* Console Content */}
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
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {t.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                              <span className="font-semibold">{t.name || `Test Case ${idx + 1}`}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Input: <span className="text-slate-200">{t.input}</span> | Expected: <span className="text-emerald-400">{t.expected}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-center py-6">
                          Click "Run Code" above to execute test cases against the sandbox runner.
                        </div>
                      )}
                    </div>
                  )}

                  {activeConsoleTab === 'output' && (
                    <div className="whitespace-pre-wrap font-mono text-[11px] text-slate-300">
                      {executionResult ? (
                        executionResult.stderr ? (
                          <span className="text-rose-400">{executionResult.stderr}</span>
                        ) : (
                          executionResult.stdout || 'Program executed with exit code 0 and no standard output.'
                        )
                      ) : (
                        <span className="text-slate-500">Standard output and error logs will appear here.</span>
                      )}
                    </div>
                  )}

                  {activeConsoleTab === 'stdin' && (
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom standard input (stdin) for code execution..."
                      className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-200 placeholder-slate-600 font-mono text-xs"
                    />
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLLAPSIBLE DRAWER (Problem / Chat / Participants / Evaluation) */}
        {activeSidePanel && (
          <aside className="w-80 md:w-96 bg-[#0B0F19] border-l border-slate-800 flex flex-col shrink-0 z-20 shadow-2xl">
            
            {/* Drawer Header Tabs */}
            <div className="h-11 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                {activeSidePanel === 'problem' && <><FileCode2 className="w-4 h-4 text-emerald-400" /> Problem Statement</>}
                {activeSidePanel === 'chat' && <><MessageSquare className="w-4 h-4 text-blue-400" /> Room Chat</>}
                {activeSidePanel === 'participants' && <><Users className="w-4 h-4 text-purple-400" /> Participants ({participants.length})</>}
                {activeSidePanel === 'evaluation' && <><Award className="w-4 h-4 text-amber-400" /> Evaluation Rubric</>}
              </span>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Close Drawer"
              >
                ✕
              </button>
            </div>

            {/* TAB 1: PROBLEM DETAILS */}
            {activeSidePanel === 'problem' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {challenge ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {challenge.difficulty || 'Easy'}
                      </span>
                      <span className="text-[11px] text-slate-500">Time: 1000ms</span>
                    </div>

                    <h3 className="text-base font-bold text-white">{challenge.title}</h3>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {challenge.description}
                    </div>

                    {challenge.examples?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase text-slate-400">Examples</div>
                        {challenge.examples.map((ex, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
                            <div><strong className="text-emerald-400">Input:</strong> {ex.input}</div>
                            <div><strong className="text-cyan-400">Output:</strong> {ex.output}</div>
                            {ex.explanation && <div className="text-slate-400 mt-1 font-sans text-xs">{ex.explanation}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {challenge.constraints?.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Constraints</div>
                        <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                          {challenge.constraints.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500 text-center py-10">No challenge attached to this interview session.</div>
                )}
              </div>
            )}

            {/* TAB 2: LIVE CHAT */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className="text-xs">
                      {m.role === 'system' ? (
                        <div className="text-center my-2">
                          <span className="px-2 py-1 rounded-full bg-slate-800/80 text-slate-400 text-[10px] border border-slate-700/60">
                            {m.text}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-200">{m.sender}</span>
                            <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{m.text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="Send message to room..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: PARTICIPANTS ROSTER */}
            {activeSidePanel === 'participants' && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {participants.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{p.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: EVALUATION RUBRIC */}
            {activeSidePanel === 'evaluation' && (
              <form onSubmit={handleSubmitEvaluation} className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-200">Interviewer Rubric Scoring</h4>
                  <p className="text-[11px] text-slate-400">Score candidate on key hiring criteria 1 to 5.</p>
                </div>

                {evalSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Evaluation saved successfully!</span>
                  </div>
                )}

                {/* Criteria Sliders */}
                {[
                  { key: 'problemSolving', label: 'Problem Solving & Algorithmic Approach' },
                  { key: 'coding', label: 'Coding Proficiency & Code Quality' },
                  { key: 'systemDesign', label: 'Architecture & System Design' },
                  { key: 'communication', label: 'Communication & Collaboration' }
                ].map((crit) => (
                  <div key={crit.key} className="space-y-1">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>{crit.label}</span>
                      <span className="font-bold text-emerald-400">{rubric[crit.key]}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={rubric[crit.key]}
                      onChange={(e) => setRubric({ ...rubric, [crit.key]: Number(e.target.value) })}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                ))}

                {/* Recommendation */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Final Recommendation</label>
                  <select
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                  >
                    <option value="strong_hire">Strong Hire (Top Tier)</option>
                    <option value="hire">Hire (Meets All Standards)</option>
                    <option value="leaning_no">Leaning No</option>
                    <option value="strong_no">Strong No</option>
                  </select>
                </div>

                {/* Candidate Feedback */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Candidate Visible Feedback</label>
                  <textarea
                    rows="3"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>

                {/* Private Notes */}
                <div>
                  <label className="block font-semibold text-amber-400 mb-1">Confidential Hiring Notes</label>
                  <textarea
                    rows="3"
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/30 rounded-lg p-2 text-xs text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={evalSubmitting}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {evalSubmitting && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  <span>Submit Evaluation Dossier</span>
                </button>
              </form>
            )}

          </aside>
        )}

      </div>

      {/* 3. GOOGLE MEET STYLE BOTTOM FLOATING DOCK */}
      <footer className="h-16 px-4 bg-[#0B0F19] border-t border-slate-800/80 flex items-center justify-between shrink-0 z-30">
        
        {/* Left Side: Meeting Details Info */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
          <span className="font-mono text-emerald-400">{meetingCode}</span>
          <span>•</span>
          <span>InterviewHub Mesh Active</span>
        </div>

        {/* Center: Main Media Action Pills */}
        <div className="flex items-center gap-3 mx-auto md:mx-0">
          {/* Mic Button */}
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full transition-all shadow-lg ${
              isMicOn
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                : 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full transition-all shadow-lg ${
              isCameraOn
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
            title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {isCameraOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-all shadow-lg ${
              isScreenSharing
                ? 'bg-blue-600 text-white border border-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
            }`}
            title="Share Screen"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Leave Call (Red Google Meet Style) */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit this interview room?')) {
                navigate('/dashboard');
              }
            }}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
            title="Leave Call"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>

        {/* Right Side: Side Drawer Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'problem' ? null : 'problem')}
            className={`p-2 rounded-xl transition-colors ${
              activeSidePanel === 'problem' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Toggle Problem Statement"
          >
            <FileCode2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            className={`p-2 rounded-xl relative transition-colors ${
              activeSidePanel === 'chat' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Toggle Live Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'participants' ? null : 'participants')}
            className={`p-2 rounded-xl transition-colors ${
              activeSidePanel === 'participants' ? 'bg-slate-800 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Toggle Participants"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Evaluation Rubric Toggle */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'evaluation' ? null : 'evaluation')}
            className={`p-2 rounded-xl transition-colors ${
              activeSidePanel === 'evaluation' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Toggle Evaluation Rubric"
          >
            <Award className="w-4 h-4" />
          </button>
        </div>

      </footer>

    </div>
  );
}
