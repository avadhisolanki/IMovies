import express from 'express';
import { getReviewsByMovie, addReview } from '../controllers/reviewController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:movieId', getReviewsByMovie);
router.post('/', verifyToken, addReview);

export default router;
