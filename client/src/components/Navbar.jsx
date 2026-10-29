import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Video, 
  LayoutDashboard, 
  Calendar, 
  Clock,
  Code2, 
  Award, 
  LogOut, 
  User, 
  ChevronDown, 
  Bell, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, demoLogin, isAuthenticated } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [quickCode, setQuickCode] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // If in the full-screen interview room, we don't render the global navbar to maximize screen space
  if (location.pathname.startsWith('/room/')) {
    return null;
  }

  const isInterviewerOrAdmin = ['interviewer', 'recruiter', 'admin'].includes(user?.role);
  const isAdmin = ['admin', 'recruiter'].includes(user?.role);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Interviews', path: '/interviews', icon: Calendar },
    ...(isInterviewerOrAdmin ? [
      { name: 'Event Types', path: '/event-types', icon: Calendar },
      { name: 'Working Hours', path: '/availability', icon: Clock }
    ] : []),
    { name: 'Challenges', path: '/challenges', icon: Code2 },
    { name: 'Evaluations', path: '/evaluations', icon: Award },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : [])
  ];

  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (quickCode.trim()) {
      navigate(`/room/${quickCode.trim().toLowerCase()}`);
      setQuickCode('');
    }
  };

  const handleSwitchRole = async (role) => {
    setShowRoleMenu(false);
    await demoLogin(role);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'recruiter': return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'interviewer': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default: return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-purple-400 p-[1px] shadow-glow-violet group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                <Video className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Interview<span className="text-violet-400">Hub</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">PRO</span>
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-zinc-900 text-violet-400 border border-zinc-800 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Quick Meeting Code Join */}
          <form onSubmit={handleQuickJoin} className="hidden sm:flex items-center relative">
            <input
              type="text"
              placeholder="Meeting code..."
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              className="bg-zinc-900/90 border border-zinc-800 rounded-lg pl-3 pr-14 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all w-40 focus:w-52"
            />
            <button
              type="submit"
              disabled={!quickCode.trim()}
              className="absolute right-1 px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-[11px] font-semibold text-white transition-colors"
            >
              Join
            </button>
          </form>

          {/* Persona Switcher Quick Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
              title="Quickly switch demo persona"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Persona:</span>
              <span className={`capitalize font-semibold ${getRoleBadgeColor(user?.role).split(' ')[1]}`}>
                {user?.role || 'Guest'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showRoleMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-card-elevated py-1.5 z-50 text-xs animate-slide-up"
                onMouseLeave={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                  Switch Demo Persona
                </div>
                {[
                  { role: 'admin', name: 'Admin (Host / Creator)' },
                  { role: 'interviewer', name: 'Interviewer (Host)' },
                  { role: 'recruiter', name: 'Recruiter' },
                  { role: 'candidate', name: 'Candidate' }
                ].map((p) => (
                  <button
                    key={p.role}
                    onClick={() => handleSwitchRole(p.role)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-800/60 text-zinc-300 hover:text-white transition-colors ${
                      user?.role === p.role ? 'bg-zinc-800/80 text-violet-400 font-medium' : ''
                    }`}
                  >
                    <span>{p.name}</span>
                    {user?.role === p.role && <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-zinc-950"></span>
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-xl bg-zinc-900 border border-zinc-800 shadow-card-elevated p-3 z-50 text-xs animate-slide-up"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-semibold text-zinc-200">Recent Notifications</span>
                  <span className="text-[10px] text-violet-400 cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                    <div className="font-medium text-zinc-200">Technical Interview Scheduled</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Frontend Engineer interview scheduled for tomorrow at 2:00 PM.</div>
                    <div className="text-[10px] text-zinc-500 mt-1">10 mins ago</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                    <div className="font-medium text-zinc-300">Evaluation Submitted</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Interviewer scorecard submitted for Backend Lead round.</div>
                    <div className="text-[10px] text-zinc-500 mt-1">1 hour ago</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-glow-subtle">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'IH'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-card-elevated py-2 z-50 text-xs animate-slide-up"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-3.5 py-2.5 border-b border-zinc-800">
                  <p className="font-semibold text-zinc-200 truncate">{user?.name || 'InterviewHub User'}</p>
                  <p className="text-zinc-400 text-[11px] truncate">{user?.email || 'user@example.com'}</p>
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role || 'Guest'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/interviews"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>My Interviews</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>Profile & Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
