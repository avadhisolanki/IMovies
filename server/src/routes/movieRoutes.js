import express from 'express';
import { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie } from '../controllers/movieController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllMovies);
router.get('/:id', getMovieById);
router.post('/', verifyAdmin, createMovie);
router.put('/:id', verifyAdmin, updateMovie);
router.delete('/:id', verifyAdmin, deleteMovie);

export default router;
