import express from 'express';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  updatePostStatus,
  deletePost,
} from '../controllers/postController.js';
import {
  createPostValidation,
  updatePostValidation,
  patchStatusValidation,
  validatePostId,
} from '../validators/postValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All post routes require authentication
router.use(protect);

router
  .route('/')
  .get(getPosts)
  .post(createPostValidation, createPost);

router
  .route('/:id')
  .get(validatePostId, getPostById)
  .put(updatePostValidation, updatePost)
  .delete(validatePostId, deletePost);

router.patch('/:id/status', patchStatusValidation, updatePostStatus);

export default router;
