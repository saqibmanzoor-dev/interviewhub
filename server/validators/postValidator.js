import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(400).json({
      message: extractedErrors[0].message,
      errors: extractedErrors,
    });
  }
  next();
};

export const createPostValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content/caption is required')
    .isLength({ max: 3000 })
    .withMessage('Content cannot exceed 3000 characters'),
  body('platform')
    .trim()
    .toLowerCase()
    .isIn(['instagram', 'linkedin', 'x'])
    .withMessage('Platform must be instagram, linkedin, or x'),
  body('status')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['draft', 'planned', 'published'])
    .withMessage('Status must be draft, planned, or published'),
  body('scheduledAt')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error('Scheduled date must be a valid ISO date');
      }
      return true;
    }),
  body('hashtags')
    .optional()
    .customSanitizer((val) => {
      if (Array.isArray(val)) {
        return val.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean);
      }
      if (typeof val === 'string') {
        return val
          .split(/[\s,]+/)
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean);
      }
      return [];
    }),
  validateResult,
];

export const updatePostValidation = [
  param('id')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid post ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isLength({ max: 3000 })
    .withMessage('Content cannot exceed 3000 characters'),
  body('platform')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['instagram', 'linkedin', 'x'])
    .withMessage('Platform must be instagram, linkedin, or x'),
  body('status')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['draft', 'planned', 'published'])
    .withMessage('Status must be draft, planned, or published'),
  body('scheduledAt')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error('Scheduled date must be a valid ISO date');
      }
      return true;
    }),
  body('hashtags')
    .optional()
    .customSanitizer((val) => {
      if (Array.isArray(val)) {
        return val.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean);
      }
      if (typeof val === 'string') {
        return val
          .split(/[\s,]+/)
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean);
      }
      return [];
    }),
  validateResult,
];

export const patchStatusValidation = [
  param('id')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid post ID format'),
  body('status')
    .trim()
    .toLowerCase()
    .isIn(['draft', 'planned', 'published'])
    .withMessage('Status must be draft, planned, or published'),
  validateResult,
];

export const validatePostId = [
  param('id')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid post ID format'),
  validateResult,
];
