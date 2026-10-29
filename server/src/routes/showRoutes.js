import express from 'express';
import { getShowsByMovie, getShowById, createShow, deleteShow } from '../controllers/showController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/movie/:movieId', getShowsByMovie);
router.get('/:showId', getShowById);
router.post('/', verifyAdmin, createShow);
router.delete('/:id', verifyAdmin, deleteShow);

export default router;
