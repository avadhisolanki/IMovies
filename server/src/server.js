import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB, isMongoConnected } from './config/db.js';
import { memoryDB } from './config/memoryStore.js';
import { startTTLWatchdog } from './utils/ttlCleaner.js';
import { autoSeedMongoDB } from './utils/initDB.js';
import Show from './models/showModel.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import theatreRoutes from './routes/theatreRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import emailRoutes from './routes/emailRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/theatre', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/email', emailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'iMovies Ticket Booking Engine',
    database: isMongoConnected() ? 'MongoDB ODM' : 'In-Memory Persisted Store',
    timestamp: new Date(),
  });
});

// Explicit 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found` });
});

// Serve frontend build if dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[iMovies Server] Serving static client build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // 404 handler when frontend is not built
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Global process error handlers
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at]:', promise, 'reason:', reason);
});

const listenWithFallback = (appInstance, targetPort, maxAttempts = 10) => {
  const srv = appInstance.listen(targetPort, () => {
    console.log(`=======================================================`);
    console.log(` 🎬 iMovies Prime Video Cinema Application running on:`);
    console.log(`    http://localhost:${targetPort}`);
    console.log(`    Storage Engine: ${isMongoConnected() ? 'MongoDB (Mongoose ODM)' : 'Embedded Memory Store (Fully Active)'}`);
    console.log(`=======================================================`);
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && maxAttempts > 0) {
      console.warn(`[iMovies Server] Port ${targetPort} is occupied. Retrying on port ${targetPort + 1}...`);
      listenWithFallback(appInstance, targetPort + 1, maxAttempts - 1);
    } else {
      console.error('[iMovies Server] Listen error:', err);
    }
  });
};

// Boot the server
const startServer = async () => {
  // 1. Attempt MongoDB connection
  await connectDB();

  // 2. Auto-seed or fallback initialization
  if (isMongoConnected()) {
    await autoSeedMongoDB();
  } else {
    await memoryDB.init();
  }

  // 3. Start TTL Seat Lock Watchdog
  startTTLWatchdog(Show, isMongoConnected, memoryDB);

  listenWithFallback(app, PORT);
};

startServer();
