import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { config } from './config.js';
import { agentBus } from './agent-ws.js';
import { scheduleEnforcer } from './scheduler.js';
import deviceRoutes from './routes/devices.js';
import settingsRoutes from './routes/settings.js';
import schedulesRoutes from './routes/schedules.js';
import analyticsRoutes from './routes/analytics.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
}));

// Routes
app.use('/api/devices', deviceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TV Guardian API',
    timestamp: new Date().toISOString(),
    agent_connected: agentBus.isAgentOnline()
  });
});

// 404
app.use((_req, res) => { res.status(404).json({ error: 'Endpoint not found' }); });

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize WebSocket for local agent communication
agentBus.init(server);

// Start schedule enforcer
scheduleEnforcer.start();

server.listen(config.port, () => {
  console.log(`[TV Guardian API] Server running on port ${config.port}`);
  console.log(`[TV Guardian API] Environment: ${config.nodeEnv}`);
});
