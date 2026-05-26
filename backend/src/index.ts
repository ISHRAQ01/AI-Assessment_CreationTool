import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/Assignments';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assignments', assignmentRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().then(() => console.log('✅ Redis connected'));

// WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});