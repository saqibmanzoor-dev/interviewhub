import api from '../api/axios';

export const postService = {
  // Fetch posts with optional filters and search
  async getPosts(params = {}) {
    const cleanParams = {};
    if (params.status && params.status !== 'all') cleanParams.status = params.status;
    if (params.platform && params.platform !== 'all') cleanParams.platform = params.platform;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();

    const res = await api.get('/posts', { params: cleanParams });
    return res.data;
  },

  // Fetch single post
  async getPostById(id) {
    const res = await api.get(`/posts/${id}`);
    return res.data.post;
  },

  // Create post
  async createPost(data) {
    const res = await api.post('/posts', data);
    return res.data;
  },

  // Update post
  async updatePost(id, data) {
    const res = await api.put(`/posts/${id}`, data);
    return res.data;
  },

  // Quick status update
  async updateStatus(id, status) {
    const res = await api.patch(`/posts/${id}/status`, { status });
    return res.data;
  },

  // Delete post
  async deletePost(id) {
    const res = await api.delete(`/posts/${id}`);
    return res.data;
  },

  // Get dashboard summary
  async getDashboardSummary() {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
};
