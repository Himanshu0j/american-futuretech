const mongoose = require('mongoose');

let mongod = null;

// 'external' = a real, persistent MongoDB (Atlas / server / local mongod)
// 'in-memory' = throwaway mongodb-memory-server engine: wiped on every restart
let connectionMode = 'unknown';

const isLoopbackUri = (uri) => /(^|\/\/)(127\.0\.0\.1|localhost)(:|\/)/i.test(uri);

const truthy = (value) => /^(1|true|yes|on)$/i.test(String(value || '').trim());

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

/**
 * A deployment that cannot reach its database must not quietly serve traffic
 * from a throwaway one: that is exactly how admin content looked like it
 * "saved but vanished". Fail loudly instead so the platform log and the
 * health endpoint both tell the truth.
 */
const failFatal = (headline, detail) => {
  const line = '='.repeat(74);
  console.error(`\n${line}`);
  console.error(`  FATAL: ${headline}`);
  console.error(`  ${detail}`);
  console.error('  Refusing to start on an in-memory database because this');
  console.error('  environment is expected to persist data (REQUIRE_PERSISTENT_DB');
  console.error('  or MONGODB_URI is configured). Every admin edit would be lost.');
  console.error(`${line}\n`);
  process.exit(1);
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

/**
 * A cold Atlas cluster or a transient network blip should not kill the boot,
 * so production retries patiently (~35s worst case) before giving up.
 * Development stays snappy: one short attempt, then the in-memory fallback.
 */
const connectWithRetry = async (uri) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const attempts = isProduction ? 3 : 1;
  const perAttemptTimeout = isProduction ? 10000 : 4000;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await mongoose.connect(uri, { serverSelectionTimeoutMS: perAttemptTimeout });
    } catch (error) {
      lastError = error;
      console.error(`MongoDB Connection Error (attempt ${attempt}/${attempts}): ${error.message}`);
      await mongoose.disconnect().catch(() => {});
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  throw lastError;
};

const connectDB = async () => {
  const configuredUri = (process.env.MONGODB_URI || '').trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const requirePersistentDb = truthy(process.env.REQUIRE_PERSISTENT_DB);

  // On a real deployment, giving us a connection string is an explicit promise
  // that this service persists data — so a failed connection must never
  // degrade silently. Development and the test suites keep the in-memory
  // fallback: they point at a throwaway/local database on purpose.
  const mustNotDegrade = requirePersistentDb || (isProduction && Boolean(configuredUri));

  // In production an empty MONGODB_URI must NOT silently point at localhost —
  // that URI can never exist on the host, so go straight to the memory engine.
  const uri = configuredUri || (isProduction ? '' : 'mongodb://127.0.0.1:27018/american_futuretech');

  if (uri) {
    try {
      console.log(`Connecting to MongoDB at: ${uri}...`);
      const conn = await connectWithRetry(uri);
      connectionMode = 'external';
      console.log(`[MongoDB Connected Successfully]: ${conn.connection.host}`);
      if (isProduction && isLoopbackUri(uri)) {
        console.warn(
          `[Data Warning]: Production is connected to a loopback MongoDB (${uri}). Data will not survive a restart.`
        );
      }
      return;
    } catch (error) {
      if (mustNotDegrade) {
        failFatal(
          'MONGODB_URI is set, but the database could not be reached.',
          `Last error: ${error.message}`
        );
      }
      console.error(`MongoDB Connection Error: ${error.message}`);
    }
  } else {
    console.warn('[Data Warning]: MONGODB_URI is not set in this environment.');
    if (requirePersistentDb) {
      failFatal('MONGODB_URI is not set.', 'REQUIRE_PERSISTENT_DB is enabled, so a temporary database is not allowed.');
    }
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
  // true => boot fails instead of falling back to a temporary database
  persistedRequired: truthy(process.env.REQUIRE_PERSISTENT_DB),
});

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDbInfo = getDbInfo;
