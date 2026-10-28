import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  RefreshCw,
  Server
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function AdminConsole() {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audits' | 'system'

  useEffect(() => {
    fetchAdminData();
  }, [roleFilter]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const [ovRes, uRes, aRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get(`/admin/users?role=${roleFilter}`),
        api.get('/admin/audit-logs')
      ]);

      setOverview(ovRes.data?.data);
      setUsersList(uRes.data?.data || []);
      setAuditLogs(aRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsersList(usersList.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Security & Operational Controls</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Administrator Console</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage accounts, role assignments, audit logs, and inspect real-time system health.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh State
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total User Accounts</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {overview?.metrics?.totalUsers ?? '—'}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active across platform</span>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Scheduled Sessions</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {overview?.metrics?.totalInterviews ?? '—'}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Completed & scheduled</span>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Audit Log Events</span>
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {overview?.metrics?.totalAuditLogs ?? '—'}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Security audit trace</span>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>System Health</span>
              <Server className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-5 h-5" /> Operational
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Heap: {overview?.systemHealth?.memoryUsageMb || 38}MB
            </span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> User Management ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audits' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Security Audit Log ({auditLogs.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400">Filter Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="candidate">Candidates</option>
                  <option value="interviewer">Interviewers</option>
                  <option value="recruiter">Recruiters</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Title / Headline</th>
                    <th className="py-3 px-4">Verified</th>
                    <th className="py-3 px-4 text-right">Assign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                        />
                        <div>
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                          u.role === 'interviewer' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          u.role === 'recruiter' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">
                        {u.title || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {u.emailVerified ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-slate-500">Unverified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="candidate">Candidate</option>
                          <option value="interviewer">Interviewer</option>
                          <option value="recruiter">Recruiter</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audits Tab */}
        {activeTab === 'audits' && (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-x-auto">
            <h3 className="text-base font-bold text-white mb-4">Security Audit Trail</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.actorId?.name || log.actorId?.email || 'Anonymous / Candidate'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.resourceType} {log.resourceId ? `(${log.resourceId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {log.status || 'success'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
