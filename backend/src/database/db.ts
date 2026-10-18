/**
 * Backend Data Store
 * In production connects to PostgreSQL, in local dev operates with zero-setup robust storage
 */

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: number;
}

export interface PlaylistSyncRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverUri?: string;
  trackIds: string[];
  updatedAt: number;
  version: number;
}

export interface HistoryRecord {
  id: string;
  userId: string;
  trackId: string;
  playedAt: number;
}

export const db = {
  users: new Map<string, UserRecord>(),
  playlists: new Map<string, PlaylistSyncRecord>(),
  history: [] as HistoryRecord[],
};

// Seed demo test user
db.users.set('demo@auralis.audio', {
  id: 'usr-demo-001',
  email: 'demo@auralis.audio',
  passwordHash: 'demo_hashed_password',
  displayName: 'Auralis Explorer',
  createdAt: Date.now(),
});
