const config = require('./src/config');
const app = require('./src/app');
const { connectDatabase, disconnectDatabase } = require('./src/db');

const server = app.listen(config.port, () => {
  console.log(`Student Management System running at http://localhost:${config.port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use. Stop the other process or change PORT in backend/.env.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

connectDatabase(config.mongoUri);

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close();
  await disconnectDatabase().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
