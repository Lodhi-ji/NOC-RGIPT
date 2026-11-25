const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cluster = require('cluster');
const logger = require('./utils/logger');
const morgan = require('morgan');

dotenv.config();

// --- Startup Guards ---
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Set it in your .env file.');
  process.exit(1);
}

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const officerRoutes = require('./routes/officerRoutes');
const tnpOfficeRoutes = require('./routes/tnpOfficeRoutes');
const cdcRoutes = require('./routes/cdcRoutes');

// Rate limiter
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// With no CLIENT_URL(S) configured (local / demo), allow any localhost origin.
const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// --- Health Checks FIRST — before CORS/rate-limiter so Uptime Robot always gets HTTP 200 ---
app.get('/', (req, res) => res.status(200).send('OK'));
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// --- Core Middleware ---
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or curl requests without Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (allowedOrigins.length === 0 && isLocalOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(morgan(':method :url :status :response-time ms - size::res[content-length]', { stream: logger.stream }));

app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Prom Client Metrics ---
const promClient = require('prom-client');
promClient.collectDefaultMetrics();
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
});

app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] + diff[1] / 1e9;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
      .observe(time);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  if (req.headers['x-metrics-secret'] !== process.env.METRICS_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.set('Content-Type', promClient.register.contentType);
  const metrics = await promClient.register.metrics();
  res.send(metrics);
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/tnpoffice', tnpOfficeRoutes);
app.use('/api/cdc', cdcRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  logger.warn(`[404] Route ${req.originalUrl} not found`);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// --- Global Error Handler (must be last) ---
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.statusCode || err.status || 500;
  logger.error(`[Unhandled] [${req.method}] ${req.path} -> HTTP ${status}: ${err.message}`);
  logger.error(err.stack);
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// --- Database Connection + Server Startup ---
// HTTP server only starts AFTER DB is confirmed connected to prevent
// requests hitting the app before Mongoose is ready.
const isDemoMode = process.env.DEMO_MODE === 'true';
const mongoUriFromEnv = process.env.MONGODB_URI || process.env.MONGO_URI || '';
// No MONGO_URI => run a local MongoDB automatically (binary is downloaded once by
// mongodb-memory-server). Data is kept in backend/.localdb so it survives restarts.
const useLocalDb = !mongoUriFromEnv || process.env.USE_IN_MEMORY_DB === 'true';

const startLocalMongo = async () => {
  const fs = require('fs');
  const dbPath = path.join(__dirname, '.localdb');
  if (process.env.RESET_DEMO === 'true' && fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { recursive: true, force: true });
    fs.rmSync(path.join(__dirname, 'uploads'), { recursive: true, force: true });
    logger.info('Demo database wiped (RESET_DEMO=true)');
  }
  fs.mkdirSync(dbPath, { recursive: true });
  const mem = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } });
  const stop = async () => { await mongoose.disconnect().catch(() => {}); await mem.stop({ doCleanup: false }).catch(() => {}); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  return mem.getUri('noc_portal');
};

const startServer = async () => {
  try {
    let mongoUri = mongoUriFromEnv;
    if (useLocalDb) {
      logger.info('No MONGO_URI set - starting a local MongoDB (first run downloads it, please wait)...');
      mongoUri = await startLocalMongo();
      logger.info('Local MongoDB ready (data stored in backend/.localdb)');
    }
    // Max 10 connections per worker keeps us well below Atlas connection limits.
    // MONGO_DB_NAME lets the same cluster host separate databases (e.g. a demo copy).
    const dbName = useLocalDb ? undefined : (process.env.MONGO_DB_NAME || undefined);
    await mongoose.connect(mongoUri.trim(), { maxPoolSize: 10, minPoolSize: 2, dbName });
    logger.info(`Worker ${process.pid} MongoDB Connected (database: ${mongoose.connection.name})`);

    if (isDemoMode) {
      const { seedDemoData, DEMO_ACCOUNTS, DEMO_PASSWORD } = require('./utils/demoSeed');
      // RESET_DEMO wipes and re-seeds - only allowed on the local DB or a dedicated
      // MONGO_DB_NAME database, never on the default production database.
      const canReset = useLocalDb || Boolean(process.env.MONGO_DB_NAME);
      const reset = process.env.RESET_DEMO === 'true' && canReset;
      if (reset) logger.info(`RESET_DEMO: wiping and re-seeding database "${mongoose.connection.name}"`);
      await seedDemoData({ reset });
      logger.info(`DEMO MODE: demo accounts ready (password: ${DEMO_PASSWORD})`);
      DEMO_ACCOUNTS.forEach((a) => logger.info(`   ${a.role.padEnd(12)} ${a.email}`));
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`Worker ${process.pid} Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`Worker ${process.pid} Startup Error: ${error.message}`);
    process.exit(1);
  }
};

// Node clustering is opt-in via WEB_CONCURRENCY (e.g. on a multi-core server).
// It is never used with the local DB, since every worker would start its own database.
const numWorkers = parseInt(process.env.WEB_CONCURRENCY, 10) || 1;

if (cluster.isPrimary && numWorkers > 1 && !useLocalDb) {
  logger.info(`Primary process ${process.pid} is running`);
  logger.info(`Forking ${numWorkers} workers for Node clustering (Load Balancing)`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    logger.info('Starting a new worker...');
    cluster.fork();
  });
} else {
  startServer();
}
