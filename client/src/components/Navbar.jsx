import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Video, 
  LayoutDashboard, 
  Calendar, 
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
  const { user, logout, demoLogin } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [quickCode, setQuickCode] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // If in the full-screen interview room, we don't render the global navbar to maximize screen space
  if (location.pathname.startsWith('/room/')) {
    return null;
  }

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Interviews', path: '/interviews', icon: Calendar },
    { name: 'Challenges', path: '/challenges', icon: Code2 },
    { name: 'Evaluations', path: '/evaluations', icon: Award },
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
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'recruiter': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'interviewer': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
                <Video className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Interview<span className="text-emerald-400">Hub</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PRO</span>
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
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
              placeholder="Enter meeting code..."
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg pl-3 pr-16 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all w-48 focus:w-56"
            />
            <button
              type="submit"
              disabled={!quickCode.trim()}
              className="absolute right-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-[11px] font-semibold text-white transition-colors"
            >
              Join
            </button>
          </form>

          {/* Persona Switcher Quick Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title="Quickly switch demo persona"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Persona:</span>
              <span className={`capitalize font-semibold ${getRoleBadgeColor(user?.role).split(' ')[1]}`}>
                {user?.role || 'Guest'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-50 text-xs"
                onMouseLeave={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Switch Demo Account
                </div>
                {[
                  { role: 'candidate', name: 'Sarah Chen (Candidate)' },
                  { role: 'interviewer', name: 'Alex Morgan (Interviewer)' },
                  { role: 'recruiter', name: 'David Miller (Recruiter)' },
                  { role: 'admin', name: 'Elena Vance (Admin)' }
                ].map((p) => (
                  <button
                    key={p.role}
                    onClick={() => handleSwitchRole(p.role)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors ${
                      user?.role === p.role ? 'bg-slate-800/80 text-emerald-400 font-medium' : ''
                    }`}
                  >
                    <span>{p.name}</span>
                    {user?.role === p.role && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]"></span>
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 text-xs"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">Recent Notifications</span>
                  <span className="text-[10px] text-emerald-400 cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                    <div className="font-medium text-slate-200">Technical Interview Scheduled</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Frontend Engineer interview with Sarah Chen tomorrow at 2:00 PM.</div>
                    <div className="text-[10px] text-slate-500 mt-1">10 mins ago</div>
                  </div>
                  <div className="p-2 rounded bg-slate-800/30 border border-slate-800">
                    <div className="font-medium text-slate-300">Evaluation Submitted</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Interviewer Alex Morgan submitted score card for Backend Lead.</div>
                    <div className="text-[10px] text-slate-500 mt-1">1 hour ago</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-xs text-slate-950 shadow">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'IH'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-xs"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-slate-200 truncate">{user?.name || 'InterviewHub User'}</p>
                  <p className="text-slate-400 text-[11px] truncate">{user?.email || 'user@example.com'}</p>
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role || 'Guest'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/interviews"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>My Interviews</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
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
