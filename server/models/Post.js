import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content/caption is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: {
        values: ['instagram', 'linkedin', 'x'],
        message: '{VALUE} is not a supported platform (must be instagram, linkedin, or x)',
      },
      lowercase: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['draft', 'planned', 'published'],
        message: '{VALUE} is not a valid status (must be draft, planned, or published)',
      },
      default: 'draft',
      lowercase: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to a user'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying posts by user, platform, status, and creation date
postSchema.index({ user: 1, status: 1, platform: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
