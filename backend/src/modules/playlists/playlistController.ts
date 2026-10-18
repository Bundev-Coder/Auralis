import { Request, Response } from 'express';
import { db, PlaylistSyncRecord } from '../../database/db';

export class PlaylistController {
  static async syncPlaylists(req: Request, res: Response) {
    const { playlists } = req.body as { playlists: PlaylistSyncRecord[] };
    const userId = (req as any).user?.userId || 'guest';

    if (!Array.isArray(playlists)) {
      return res.status(400).json({ error: 'Playlists array required' });
    }

    const synced: PlaylistSyncRecord[] = [];

    for (const clientPl of playlists) {
      const existing = db.playlists.get(clientPl.id);

      if (!existing) {
        // New playlist
        const record: PlaylistSyncRecord = {
          ...clientPl,
          userId,
          version: 1,
          updatedAt: Date.now(),
        };
        db.playlists.set(clientPl.id, record);
        synced.push(record);
      } else {
        // Conflict resolution: latest updatedAt wins
        if (clientPl.updatedAt >= existing.updatedAt) {
          const updated: PlaylistSyncRecord = {
            ...clientPl,
            userId,
            version: existing.version + 1,
            updatedAt: Date.now(),
          };
          db.playlists.set(clientPl.id, updated);
          synced.push(updated);
        } else {
          synced.push(existing);
        }
      }
    }

    return res.json({ synced, timestamp: Date.now() });
  }

  static async getUserPlaylists(req: Request, res: Response) {
    const userId = (req as any).user?.userId || 'guest';
    const userPlaylists = Array.from(db.playlists.values()).filter(
      (p) => p.userId === userId
    );
    return res.json({ playlists: userPlaylists });
  }
}
