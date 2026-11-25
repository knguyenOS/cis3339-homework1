const path = require('path');
const dotenv = require('dotenv');

// Always load backend/.env, no matter which directory the server is started from.
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cis3339_homework1',
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  // Folder produced by `npm run build` in the frontend project.
  clientDist: path.resolve(__dirname, '..', '..', 'frontend', 'dist'),
};

module.exports = config;
