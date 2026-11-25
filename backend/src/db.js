const mongoose = require('mongoose');
const { Student, Course, Enrollment } = require('./models');

const RETRY_DELAY_MS = 5000;

// Fail fast instead of silently queuing queries while MongoDB is unreachable.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let initialized = false;
let retryTimer = null;

/**
 * Create every collection and index the application needs. Safe to run on
 * every startup: it does nothing when the structures already exist, and it
 * builds them from scratch when the database is empty or does not exist yet.
 */
async function initializeDatabase() {
  for (const Model of [Student, Course, Enrollment]) {
    await Model.createCollection();
    await Model.syncIndexes();
  }
  initialized = true;
}

function isDatabaseReady() {
  return initialized && mongoose.connection.readyState === 1;
}

function describeUri(uri) {
  // Never log credentials if someone puts them in the URI.
  return uri.replace(/\/\/([^@/]+)@/, '//***@');
}

/**
 * Connect to MongoDB and initialize it. If MongoDB is not running yet, keep
 * retrying in the background so the web server stays up and the user sees a
 * helpful message instead of a crash.
 */
async function connectDatabase(uri) {
  clearTimeout(retryTimer);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false, // indexes are created explicitly in initializeDatabase()
      autoCreate: false,
    });
    await initializeDatabase();
    console.log(`Connected to MongoDB at ${describeUri(uri)} (collections and indexes ready).`);
  } catch (error) {
    console.error(
      `Could not connect to MongoDB at ${describeUri(uri)}: ${error.message}\n` +
        `Make sure MongoDB Community Edition is running. Retrying in ${RETRY_DELAY_MS / 1000} seconds...`
    );
    await mongoose.disconnect().catch(() => {});
    retryTimer = setTimeout(() => connectDatabase(uri), RETRY_DELAY_MS);
  }
}

mongoose.connection.on('disconnected', () => {
  if (initialized) console.warn('Lost connection to MongoDB. The driver will reconnect automatically.');
});
mongoose.connection.on('reconnected', () => {
  console.log('Reconnected to MongoDB.');
});

async function disconnectDatabase() {
  clearTimeout(retryTimer);
  initialized = false;
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase, isDatabaseReady };
