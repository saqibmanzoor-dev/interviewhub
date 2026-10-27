import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, LayoutDashboard, Layers, LogOut, LogIn, UserPlus } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="nav-wrapper">
        <NavLink to={user ? "/dashboard" : "/login"} className="nav-brand">
          <div className="brand-icon">
            <Send size={18} />
          </div>
          <span>PostPilot</span>
        </NavLink>

        <div className="nav-links">
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <LayoutDashboard size={17} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/posts"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <Layers size={17} />
                <span>Posts</span>
              </NavLink>

              <div className="nav-user">
                <div className="user-badge" title={user.email}>
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <LogIn size={16} />
                <span>Log In</span>
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={16} />
                <span>Get Started</span>
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
