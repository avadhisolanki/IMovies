import express from 'express';
import { getAllTheatres, getTheatreById, createTheatre, updateTheatre, deleteTheatre } from '../controllers/theatreController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllTheatres);
router.get('/:id', getTheatreById);
router.post('/', verifyAdmin, createTheatre);
router.put('/:id', verifyAdmin, updateTheatre);
router.delete('/:id', verifyAdmin, deleteTheatre);

export default router;
