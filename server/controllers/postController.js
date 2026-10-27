import Post from '../models/Post.js';

// @desc    Get all posts for the authenticated user with optional filtering and search
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req, res, next) => {
  try {
    const { status, platform, search } = req.query;

    const query = { user: req.user._id };

    if (status && ['draft', 'planned', 'published'].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    if (platform && ['instagram', 'linkedin', 'x'].includes(platform.toLowerCase())) {
      query.platform = platform.toLowerCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    const posts = await Post.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      count: posts.length,
      posts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single post by ID (must belong to authenticated user)
// @route   GET /api/posts/:id
// @access  Private
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found or access denied',
      });
    }

    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { title, content, platform, status, scheduledAt, hashtags } = req.body;

    const post = await Post.create({
      title,
      content,
      platform,
      status: status || 'draft',
      scheduledAt: scheduledAt || null,
      hashtags: hashtags || [],
      user: req.user._id, // Enforce authenticated user ownership
    });

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    const { title, content, platform, status, scheduledAt, hashtags } = req.body;

    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found or access denied',
      });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (platform !== undefined) post.platform = platform;
    if (status !== undefined) post.status = status;
    if (scheduledAt !== undefined) post.scheduledAt = scheduledAt || null;
    if (hashtags !== undefined) post.hashtags = hashtags;

    await post.save();

    res.status(200).json({
      message: 'Post updated successfully',
      post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Quick status change
// @route   PATCH /api/posts/:id/status
// @access  Private
export const updatePostStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found or access denied',
      });
    }

    post.status = status;
    await post.save();

    res.status(200).json({
      message: 'Post status updated successfully',
      post,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found or access denied',
      });
    }

    res.status(200).json({
      message: 'Post deleted successfully',
      id: req.params.id,
    });
  } catch (err) {
    next(err);
  }
};
