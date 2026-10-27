import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { PostCard } from '../components/PostCard';
import { PostFormModal } from '../components/PostFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  FileText,
  Clock,
  CheckCircle,
  Layers,
  PlusCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const Dashboard = ({ showToast }) => {
  const [summary, setSummary] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postService.getDashboardSummary();
      setSummary(data.summary);
      setRecentPosts(data.recentPosts || []);
    } catch (err) {
      setError(err.customMessage || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenCreate = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      if (editingPost) {
        await postService.updatePost(editingPost._id, formData);
        showToast('Post updated successfully!');
      } else {
        await postService.createPost(formData);
        showToast('New post created successfully!');
      }
      setIsModalOpen(false);
      setEditingPost(null);
      await fetchDashboardData();
    } catch (err) {
      showToast(err.customMessage || 'Failed to save post', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await postService.updateStatus(id, newStatus);
      showToast(`Status updated to ${newStatus}`);
      await fetchDashboardData();
    } catch (err) {
      showToast(err.customMessage || 'Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await postService.deletePost(deleteTarget._id);
      showToast('Post deleted successfully');
      setDeleteTarget(null);
      await fetchDashboardData();
    } catch (err) {
      showToast(err.customMessage || 'Failed to delete post', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Failed to Load Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Content Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Plan, organize, and track your social media pipeline in real time.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Create Post</span>
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Posts</span>
            <span className="stat-value">{summary?.total || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Drafts</span>
            <span className="stat-value">{summary?.draft || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--status-planned-bg)', color: 'var(--status-planned-text)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Planned</span>
            <span className="stat-value">{summary?.planned || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--status-published-bg)', color: 'var(--status-published-text)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Published</span>
            <span className="stat-value">{summary?.published || 0}</span>
          </div>
        </div>
      </div>

      {/* Platform Distribution Bar */}
      {summary && summary.total > 0 && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Channel Distribution
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              {summary.total} planned items total
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0a66c2' }}></span>
              <span>LinkedIn: <strong>{summary.byPlatform?.linkedin || 0}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e1306c' }}></span>
              <span>Instagram: <strong>{summary.byPlatform?.instagram || 0}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffffff' }}></span>
              <span>𝕏 (Twitter): <strong>{summary.byPlatform?.x || 0}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Recently Updated Posts Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Recently Updated Posts</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Quick access to your latest drafts and scheduled content.
          </p>
        </div>
        {recentPosts.length > 0 && (
          <Link to="/posts" className="btn btn-secondary btn-sm">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {recentPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkles size={32} />
          </div>
          <h3 className="empty-state-title">No content yet!</h3>
          <p className="empty-state-text">
            Start organizing your social presence by creating your very first post draft or planned schedule.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <PlusCircle size={17} />
            <span>Create Your First Post</span>
          </button>
        </div>
      ) : (
        <div className="posts-grid">
          {recentPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={handleOpenEdit}
              onDelete={(p) => setDeleteTarget(p)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <PostFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPost(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPost}
        loading={formLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        post={deleteTarget}
        loading={deleteLoading}
      />
    </div>
  );
};
