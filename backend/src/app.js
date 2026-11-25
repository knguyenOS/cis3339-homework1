const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const config = require('./config');
const { isDatabaseReady } = require('./db');
const { requireDatabase, apiNotFound, errorHandler } = require('./middleware/errors');
const studentsRouter = require('./routes/students');
const coursesRouter = require('./routes/courses');
const enrollmentsRouter = require('./routes/enrollments');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// ---------- REST API ----------
const api = express.Router();

api.get('/health', (_req, res) => {
  const ready = isDatabaseReady();
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'degraded',
    database: ready ? 'connected' : 'unavailable',
    databaseName: ready ? mongoose.connection.name : undefined,
  });
});

api.use(requireDatabase);
api.use('/students', studentsRouter);
api.use('/courses', coursesRouter);
api.use('/enrollments', enrollmentsRouter);
api.use(apiNotFound);

app.use('/api', api);

// ---------- Vue production build ----------
const indexHtml = path.join(config.clientDist, 'index.html');

// Hashed assets can be cached for a long time; index.html must always be revalidated.
app.use(
  express.static(config.clientDist, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

// History-mode fallback: any non-file GET (e.g. /courses after a refresh) returns
// index.html so Vue Router can render the right view instead of a 404.
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (path.extname(req.path)) return next(); // a missing file such as /assets/x.js → real 404

  if (!fs.existsSync(indexHtml)) {
    return res
      .status(503)
      .type('html')
      .send(
        '<h1>Frontend not built</h1><p>Run <code>npm run build</code> in the project root, then restart the server with <code>npm start</code>.</p>'
      );
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(indexHtml);
});

app.use((req, res) => {
  res.status(404).type('text').send(`Not found: ${req.originalUrl}`);
});

app.use(errorHandler);

module.exports = app;
