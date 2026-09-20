const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { autoSeedIfEmpty } = require('./utils/seeder');
const errorHandler = require('./middleware/errorHandler');

// Initialize database and auto-seed if empty
connectDB().then(() => {
  autoSeedIfEmpty();
});

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

// Rate limiting for public leads apply endpoint
const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 60,
  message: {
    success: false,
    message: 'Too many requests submitted from this IP, please try again in 15 minutes.',
  },
});

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'American FutureTech Enterprise Core API',
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/curriculum', require('./routes/curriculumRoutes'));
app.use('/api/lms', require('./routes/lmsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/leads/apply', applyLimiter);
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[American FutureTech Server Running] on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
