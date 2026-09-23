const mongoose = require('mongoose');

let mongod = null;

// 'external' = a real, persistent MongoDB (Atlas / server / local mongod)
// 'in-memory' = throwaway mongodb-memory-server engine: wiped on every restart
let connectionMode = 'unknown';

const isLoopbackUri = (uri) => /(^|\/\/)(127\.0\.0\.1|localhost)(:|\/)/i.test(uri);

const memoryWarning = () => {
  const line = '='.repeat(74);
  console.warn(`\n${line}`);
  console.warn('  WARNING: RUNNING ON AN IN-MEMORY (TEMPORARY) DATABASE');
  console.warn('  Every restart or redeploy WIPES all data: courses, curriculum,');
  console.warn('  admin content, uploaded records, leads — then the demo dataset is');
  console.warn('  re-seeded from scratch.');
  console.warn('  Fix: set MONGODB_URI to a persistent MongoDB (e.g. MongoDB Atlas).');
  console.warn(`${line}\n`);
};

const startMemoryServer = async (label) => {
  console.log(`${label} Initializing embedded In-Memory MongoDB engine...`);
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'american_futuretech',
    },
  });
  const memoryUri = mongod.getUri();
  const conn = await mongoose.connect(memoryUri, { dbName: 'american_futuretech' });
  connectionMode = 'in-memory';
  console.log(`[In-Memory MongoDB Connected]: ${memoryUri}`);
  memoryWarning();
  return conn;
};

const connectDB = async () => {
  const configuredUri = (process.env.MONGODB_URI || '').trim();
  const isProduction = process.env.NODE_ENV === 'production';

  // In production an empty MONGODB_URI must NOT silently point at localhost —
  // that URI can never exist on the host, so go straight to the memory engine.
  const uri = configuredUri || (isProduction ? '' : 'mongodb://127.0.0.1:27018/american_futuretech');

  if (uri) {
    try {
      console.log(`Connecting to MongoDB at: ${uri}...`);
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      connectionMode = 'external';
      console.log(`[MongoDB Connected Successfully]: ${conn.connection.host}`);
      if (isProduction && isLoopbackUri(uri)) {
        console.warn(
          `[Data Warning]: Production is connected to a loopback MongoDB (${uri}). Data will not survive a restart.`
        );
      }
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
    }
  } else {
    console.warn('[Data Warning]: MONGODB_URI is not set in this environment.');
  }

  try {
    await startMemoryServer('Falling back to temporary storage.');
  } catch (fallbackErr) {
    console.error(`Fatal DB Failure: ${fallbackErr.message}`);
    process.exit(1);
  }
};

/**
 * Diagnostic snapshot used by /api/health so deployments can be verified
 * without guessing whether stored content will survive the next restart.
 */
const getDbInfo = () => ({
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  mode: connectionMode,
  // true => content created in the admin panel will be lost on the next restart
  ephemeral: connectionMode === 'in-memory',
  host: mongoose.connection.host || null,
  database: mongoose.connection.name || null,
  uriConfigured: Boolean((process.env.MONGODB_URI || '').trim()),
});

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDbInfo = getDbInfo;
