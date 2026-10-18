import { Request, Response } from 'express';
import { db, HistoryRecord } from '../../database/db';

export class HistoryController {
  static async recordPlayback(req: Request, res: Response) {
    const { trackId } = req.body;
    const userId = (req as any).user?.userId || 'guest';

    if (!trackId) {
      return res.status(400).json({ error: 'trackId required' });
    }

    const record: HistoryRecord = {
      id: `hist-${Date.now()}`,
      userId,
      trackId,
      playedAt: Date.now(),
    };

    db.history.unshift(record);
    if (db.history.length > 500) db.history.pop();

    return res.status(201).json({ success: true, record });
  }

  static async getRecentHistory(req: Request, res: Response) {
    const userId = (req as any).user?.userId || 'guest';
    const recent = db.history.filter((h) => h.userId === userId).slice(0, 30);
    return res.json({ history: recent });
  }
}
