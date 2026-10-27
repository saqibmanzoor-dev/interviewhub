import React, { useState, useEffect } from 'react';
import { X, Send, Save, Loader2 } from 'lucide-react';

export const PostFormModal = ({ isOpen, onClose, onSubmit, initialData = null, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'linkedin',
    status: 'draft',
    scheduledAt: '',
    hashtags: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        platform: initialData.platform || 'linkedin',
        status: initialData.status || 'draft',
        scheduledAt: initialData.scheduledAt
          ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
          : '',
        hashtags: Array.isArray(initialData.hashtags)
          ? initialData.hashtags.join(', ')
          : '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        platform: 'linkedin',
        status: 'draft',
        scheduledAt: '',
        hashtags: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    } else if (formData.title.length > 120) {
      errs.title = 'Title cannot exceed 120 characters';
    }

    if (!formData.content.trim()) {
      errs.content = 'Content/caption is required';
    } else if (formData.content.length > 3000) {
      errs.content = 'Content cannot exceed 3000 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      platform: formData.platform,
      status: formData.status,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
      hashtags: formData.hashtags
        ? formData.hashtags
            .split(/[\s,]+/)
            .map((t) => t.trim().replace(/^#/, ''))
            .filter(Boolean)
        : [],
    };

    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Edit Social Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close dialog"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="post-title" className="form-label">
                Post Title *
              </label>
              <span style={{ fontSize: '0.75rem', color: formData.title.length > 120 ? '#f87171' : 'var(--text-dim)' }}>
                {formData.title.length}/120
              </span>
            </div>
            <input
              id="post-title"
              name="title"
              type="text"
              className="form-input"
              placeholder="e.g. Q4 Product Announcement"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              maxLength={120}
              required
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="post-content" className="form-label">
                Caption / Content *
              </label>
              <span style={{ fontSize: '0.75rem', color: formData.content.length > 3000 ? '#f87171' : 'var(--text-dim)' }}>
                {formData.content.length}/3000
              </span>
            </div>
            <textarea
              id="post-content"
              name="content"
              className="form-textarea"
              placeholder="Write your post caption, body copy, and thoughts here..."
              rows={4}
              value={formData.content}
              onChange={handleChange}
              disabled={loading}
              maxLength={3000}
              required
            />
            {errors.content && <p className="form-error">{errors.content}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="post-platform" className="form-label">
                Target Platform *
              </label>
              <select
                id="post-platform"
                name="platform"
                className="form-select"
                value={formData.platform}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="x">𝕏 (Twitter)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="post-status" className="form-label">
                Workflow Status *
              </label>
              <select
                id="post-status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="planned">Planned</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="post-scheduledAt" className="form-label">
              Planned Publication Date & Time (Optional)
            </label>
            <input
              id="post-scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              className="form-input"
              value={formData.scheduledAt}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-hashtags" className="form-label">
              Hashtags (Optional, comma or space separated)
            </label>
            <input
              id="post-hashtags"
              name="hashtags"
              type="text"
              className="form-input"
              placeholder="e.g. startup, dev, productlaunch"
              value={formData.hashtags}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{initialData ? 'Update Post' : 'Save Post'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
