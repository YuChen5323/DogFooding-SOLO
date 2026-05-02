import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import recordsRouter from './routes/records';
import navigationRouter from './routes/navigation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/records', recordsRouter);
app.use('/api/navigation', navigationRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../../frontend/dist');
  app.use(express.static(frontendDistPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

async function startServer() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Flight Instruments Simulator Backend`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🔗 API available at http://localhost:${PORT}/api`);
      console.log(`🗄️  SQLite database ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
