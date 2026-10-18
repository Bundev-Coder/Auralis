import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { AuthController } from './modules/auth/authController';
import { PlaylistController } from './modules/playlists/playlistController';
import { HistoryController } from './modules/history/historyController';
import { RecommendationController } from './modules/recommendations/recommendationController';

export function createApp() {
  const app = express();

  app.use(cors({ origin: ENV.CORS_ORIGIN }));
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Auralis API',
      version: '1.0.0',
      timestamp: Date.now(),
    });
  });

  // Auth routes
  app.post('/api/auth/register', AuthController.register);
  app.post('/api/auth/login', AuthController.login);
  app.get('/api/auth/profile', AuthController.getProfile);

  // Playlists sync
  app.post('/api/playlists/sync', PlaylistController.syncPlaylists);
  app.get('/api/playlists', PlaylistController.getUserPlaylists);

  // History
  app.post('/api/history', HistoryController.recordPlayback);
  app.get('/api/history', HistoryController.getRecentHistory);

  // AI Assistant
  app.post('/api/ai/chat', RecommendationController.handleAIChat);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  app.listen(ENV.PORT, () => {
    console.log(`[Auralis Backend] Server running on http://localhost:${ENV.PORT}`);
  });
}
