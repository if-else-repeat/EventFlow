require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const { initWebSocket } = require('./websocket/server');
const { initRedis }     = require('./services/redis');
const { initHealth }    = require('./engines/health');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.API_PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.PUBLIC_URL]
    : ['http://localhost:4000','http://localhost:4001','http://localhost:5173','http://localhost:5174'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs:15*60*1000, max:300, standardHeaders:true, legacyHeaders:false }));

app.get('/health', (_, res) =>
  res.json({ status:'ok', version:'0.1.0', timestamp:new Date().toISOString() }));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/events',     require('./routes/events'));
app.use('/api/incidents',  require('./routes/incidents'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/zones',      require('./routes/zones'));
app.use('/api/timeline',   require('./routes/timeline'));
app.use('/api/feed',       require('./routes/feed'));
app.use('/webhooks',       require('./routes/webhooks'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status||500).json({
    error: process.env.NODE_ENV==='production' ? 'Server error' : err.message
  });
});

async function start() {
  try {
    await initRedis();
    console.log('✓ Redis connected');
    initWebSocket(server);
    console.log('✓ WebSocket ready');
    initHealth();
    console.log('✓ Health engine started');
    server.listen(PORT, () => {
      console.log(`\n✓ EventFlow API  →  http://localhost:${PORT}`);
      console.log(`  Health check   →  http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}
start();

module.exports = { app, server };
