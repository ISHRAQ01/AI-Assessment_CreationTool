import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import cors from 'cors';
import Redis from 'ioredis';
import assignmentRoutes from './routes/Assignments';
import generateRoutes from './routes/Generate';
import './workers/GenerationWorker';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/generate', generateRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Redis connection for pub/sub
const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Store active WebSocket connections
const clients = new Map<string, WebSocket>();

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(7);
  clients.set(clientId, ws);
  console.log(`Client ${clientId} connected`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received:', message);
    } catch (error) {
      console.error('Invalid JSON:', data.toString());
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });
});

// Subscribe to Redis channel for job completion events
const JOB_COMPLETION_CHANNEL = 'job:completed';

redisSub.subscribe(JOB_COMPLETION_CHANNEL, (err) => {
  if (err) {
    console.error('Failed to subscribe to channel:', err);
  } else {
    console.log(`✅ Subscribed to Redis channel: ${JOB_COMPLETION_CHANNEL}`);
  }
});

redisSub.on('message', (channel, message) => {
  if (channel === JOB_COMPLETION_CHANNEL) {
    console.log('Job completion event received:', message);
    // Broadcast to all connected WebSocket clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});