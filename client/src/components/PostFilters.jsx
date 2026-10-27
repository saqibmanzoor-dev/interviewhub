import React from 'react';
import { Search, RotateCcw, PlusCircle } from 'lucide-react';

export const PostFilters = ({
  search,
  onSearchChange,
  platform,
  onPlatformChange,
  status,
  onStatusChange,
  onReset,
  onOpenCreate,
}) => {
  const isFiltered = search || platform !== 'all' || status !== 'all';

  return (
    <div className="toolbar">
      <div className="search-box">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Search posts by title or caption..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search posts"
        />
      </div>

      <div className="filter-group">
        <select
          aria-label="Filter by platform"
          className="form-select"
          style={{ width: 'auto', padding: '0.65rem 0.85rem' }}
          value={platform}
          onChange={(e) => onPlatformChange(e.target.value)}
        >
          <option value="all">All Platforms</option>
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="x">𝕏 (Twitter)</option>
        </select>

        <select
          aria-label="Filter by status"
          className="form-select"
          style={{ width: 'auto', padding: '0.65rem 0.85rem' }}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Drafts</option>
          <option value="planned">Planned</option>
          <option value="published">Published</option>
        </select>

        {isFiltered && (
          <button
            onClick={onReset}
            className="btn btn-secondary btn-sm"
            title="Reset filters"
            aria-label="Reset filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}

        {onOpenCreate && (
          <button onClick={onOpenCreate} className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>New Post</span>
          </button>
        )}
      </div>
    </div>
  );
};
