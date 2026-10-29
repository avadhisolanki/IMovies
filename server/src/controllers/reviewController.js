import Review from '../models/reviewModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';

export const getReviewsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (isMongoConnected()) {
      const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });
      return res.json({ success: true, count: reviews.length, reviews });
    } else {
      const reviews = memoryDB.reviews
        .filter(r => r.movieId === movieId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ success: true, count: reviews.length, reviews });
    }
  } catch (err) {
    console.error('Get Reviews Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

export const addReview = async (req, res) => {
  try {
    const { movieId, rating, reviewText } = req.body;
    const userEmail = req.user.email;
    const userName = req.user.username || 'Prime Cinema Fan';

    if (!movieId || rating == null || !reviewText) {
      return res.status(400).json({ success: false, message: 'Movie ID, rating, and review text are required' });
    }

    const reviewData = {
      movieId,
      userEmail,
      userName,
      rating: Number(rating),
      reviewText: reviewText.trim(),
    };

    if (isMongoConnected()) {
      const review = await Review.create(reviewData);
      return res.status(201).json({ success: true, message: 'Review posted successfully!', review });
    } else {
      const review = {
        _id: `rev_${Date.now()}`,
        ...reviewData,
        createdAt: new Date(),
      };
      memoryDB.reviews.unshift(review);
      return res.status(201).json({ success: true, message: 'Review posted successfully!', review });
    }
  } catch (err) {
    console.error('Add Review Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
