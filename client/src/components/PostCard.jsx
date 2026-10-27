import React from 'react';
import { Calendar, Edit3, Trash2, Hash } from 'lucide-react';

export const PostCard = ({ post, onEdit, onDelete, onStatusChange }) => {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return '📷 Instagram';
      case 'linkedin':
        return '💼 LinkedIn';
      case 'x':
        return '𝕏 Platform';
      default:
        return platform;
    }
  };

  return (
    <div className="post-card">
      <div>
        <div className="post-card-header">
          <span className={`badge badge-${post.platform}`}>
            {getPlatformIcon(post.platform)}
          </span>

          <select
            aria-label="Change status"
            value={post.status}
            onChange={(e) => onStatusChange(post._id, e.target.value)}
            className={`badge badge-${post.status}`}
            style={{
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
              appearance: 'auto',
            }}
          >
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
            <option value="published">Published</option>
          </select>
        </div>

        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-content">{post.content}</p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="post-hashtags">
            {post.hashtags.map((tag, idx) => (
              <span key={idx} className="hashtag-pill">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="post-card-footer">
        <div className="post-schedule-info">
          <Calendar size={14} />
          <span>{formatDate(post.scheduledAt) || 'Unscheduled'}</span>
        </div>

        <div className="post-actions">
          <button
            onClick={() => onEdit(post)}
            className="btn btn-secondary btn-sm"
            title="Edit post"
            aria-label="Edit post"
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(post)}
            className="btn btn-danger btn-sm"
            title="Delete post"
            aria-label="Delete post"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
