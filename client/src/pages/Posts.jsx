import React, { useState, useEffect, useCallback } from 'react';
import { postService } from '../services/postService';
import { PostCard } from '../components/PostCard';
import { PostFilters } from '../components/PostFilters';
import { PostFormModal } from '../components/PostFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Loader2, AlertCircle, FileSearch, PlusCircle } from 'lucide-react';

export const Posts = ({ showToast }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch posts with debounced or standard parameters
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await postService.getPosts({ search, platform, status });
      setPosts(res.posts || []);
    } catch (err) {
      setError(err.customMessage || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [search, platform, status]);

  useEffect(() => {
    // Debounce search slightly for responsive typing
    const timer = setTimeout(() => {
      fetchPosts();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const handleResetFilters = () => {
    setSearch('');
    setPlatform('all');
    setStatus('all');
  };

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
      await fetchPosts();
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
      await fetchPosts();
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
      await fetchPosts();
    } catch (err) {
      showToast(err.customMessage || 'Failed to delete post', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Content Library
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Browse, filter, and edit all your drafted and scheduled posts.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Post</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <PostFilters
        search={search}
        onSearchChange={setSearch}
        platform={platform}
        onPlatformChange={setPlatform}
        status={status}
        onStatusChange={setStatus}
        onReset={handleResetFilters}
      />

      {/* Content State Handling */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
          <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Filtering posts...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Failed to Load Posts</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchPosts} className="btn btn-primary">
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileSearch size={32} />
          </div>
          <h3 className="empty-state-title">
            {search || platform !== 'all' || status !== 'all'
              ? 'No matching posts found'
              : 'Your content library is empty'}
          </h3>
          <p className="empty-state-text">
            {search || platform !== 'all' || status !== 'all'
              ? 'Try modifying your search query or reset your filters to see more results.'
              : 'Ready to start scheduling? Create your first post idea now!'}
          </p>
          {search || platform !== 'all' || status !== 'all' ? (
            <button onClick={handleResetFilters} className="btn btn-secondary">
              Reset Filters
            </button>
          ) : (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <PlusCircle size={17} />
              <span>Create Post</span>
            </button>
          )}
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
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
