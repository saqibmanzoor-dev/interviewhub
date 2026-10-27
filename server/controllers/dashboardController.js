import Post from '../models/Post.js';

// @desc    Get dashboard summary statistics and recent posts for the user
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run parallel queries for efficiency
    const [total, draft, planned, published, instagram, linkedin, x, recentPosts] =
      await Promise.all([
        Post.countDocuments({ user: userId }),
        Post.countDocuments({ user: userId, status: 'draft' }),
        Post.countDocuments({ user: userId, status: 'planned' }),
        Post.countDocuments({ user: userId, status: 'published' }),
        Post.countDocuments({ user: userId, platform: 'instagram' }),
        Post.countDocuments({ user: userId, platform: 'linkedin' }),
        Post.countDocuments({ user: userId, platform: 'x' }),
        Post.find({ user: userId }).sort({ updatedAt: -1 }).limit(5),
      ]);

    res.status(200).json({
      summary: {
        total,
        draft,
        planned,
        published,
        byPlatform: {
          instagram,
          linkedin,
          x,
        },
      },
      recentPosts,
    });
  } catch (err) {
    next(err);
  }
};
