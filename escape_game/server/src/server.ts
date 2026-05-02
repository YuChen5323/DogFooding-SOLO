import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import saveRoutes from './routes/saves';
import achievementRoutes from './routes/achievements';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/escape_game';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/saves', saveRoutes);
app.use('/api/achievements', achievementRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ message: '路由不存在' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('已连接到 MongoDB');
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  });
