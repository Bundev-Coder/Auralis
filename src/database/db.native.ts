/**
 * Auralis Native SQLite Database Service for Android & iOS
 */

import * as SQLite from 'expo-sqlite';
import { Track, Playlist } from '../types';

let dbInstance: any = null;

export async function initDatabase(): Promise<void> {
  try {
    const db = SQLite.openDatabaseSync('auralis.db');
    dbInstance = db;

    db.execSync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        duration REAL NOT NULL,
        artwork_uri TEXT,
        source_uri TEXT NOT NULL,
        source_type TEXT NOT NULL,
        is_local INTEGER NOT NULL,
        bitrate TEXT,
        format TEXT,
        genre TEXT,
        year INTEGER,
        lyrics TEXT,
        play_count INTEGER DEFAULT 0,
        is_favorite INTEGER DEFAULT 0,
        added_at INTEGER NOT NULL,
        file_size_bytes INTEGER
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        cover_uri TEXT,
        track_count INTEGER DEFAULT 0,
        total_duration_sec REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_favorite INTEGER DEFAULT 0,
        is_smart INTEGER DEFAULT 0,
        smart_filter TEXT
      );

      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (playlist_id, track_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS listening_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT NOT NULL,
        played_at INTEGER NOT NULL,
        completed INTEGER DEFAULT 0
      );
    `);
  } catch (err) {
    console.warn('[DB Native] SQLite initialization error:', err);
  }
}

export async function dbInsertTrack(track: Track): Promise<void> {
  if (!dbInstance) return;
  try {
    const stmt = dbInstance.prepareSync(`
      INSERT OR REPLACE INTO tracks (
        id, title, artist, album, duration, artwork_uri, source_uri, 
        source_type, is_local, bitrate, format, genre, year, lyrics, 
        play_count, is_favorite, added_at, file_size_bytes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.executeSync([
      track.id,
      track.title,
      track.artist,
      track.album,
      track.duration,
      track.artworkUri || null,
      track.sourceUri,
      track.sourceType,
      track.isLocal ? 1 : 0,
      track.bitrate || null,
      track.format || null,
      track.genre || null,
      track.year || null,
      track.lyrics || null,
      track.playCount || 0,
      track.isFavorite ? 1 : 0,
      track.addedAt,
      track.fileSizeBytes || null,
    ]);
  } catch (e) {
    console.warn('[DB Native] Insert track error:', e);
  }
}

export async function dbGetAllTracks(): Promise<Track[]> {
  if (!dbInstance) return [];
  try {
    const rows = dbInstance.getAllSync('SELECT * FROM tracks ORDER BY added_at DESC');
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      album: r.album,
      duration: r.duration,
      artworkUri: r.artwork_uri,
      sourceUri: r.source_uri,
      sourceType: r.source_type,
      isLocal: r.is_local === 1,
      bitrate: r.bitrate,
      format: r.format,
      genre: r.genre,
      year: r.year,
      lyrics: r.lyrics,
      playCount: r.play_count,
      isFavorite: r.is_favorite === 1,
      addedAt: r.added_at,
      fileSizeBytes: r.file_size_bytes,
    }));
  } catch (e) {
    console.warn('[DB Native] Get all tracks error:', e);
    return [];
  }
}

export async function dbToggleFavorite(trackId: string, isFav: boolean): Promise<void> {
  if (!dbInstance) return;
  try {
    dbInstance.runSync('UPDATE tracks SET is_favorite = ? WHERE id = ?', [isFav ? 1 : 0, trackId]);
  } catch (e) {
    console.warn('[DB Native] Toggle favorite error:', e);
  }
}

export async function dbSavePlaylist(playlist: Playlist): Promise<void> {
  if (!dbInstance) return;
  try {
    dbInstance.runSync(`
      INSERT OR REPLACE INTO playlists (
        id, name, description, cover_uri, track_count, total_duration_sec,
        created_at, updated_at, is_favorite, is_smart, smart_filter
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      playlist.id,
      playlist.name,
      playlist.description || null,
      playlist.coverUri || null,
      playlist.trackCount,
      playlist.totalDurationSec,
      playlist.createdAt,
      playlist.updatedAt,
      playlist.isFavorite ? 1 : 0,
      playlist.isSmart ? 1 : 0,
      playlist.smartFilter ? JSON.stringify(playlist.smartFilter) : null,
    ]);

    dbInstance.runSync('DELETE FROM playlist_tracks WHERE playlist_id = ?', [playlist.id]);
    playlist.trackIds.forEach((trackId, index) => {
      dbInstance.runSync(`
        INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
        VALUES (?, ?, ?, ?)
      `, [playlist.id, trackId, index, Date.now()]);
    });
  } catch (e) {
    console.warn('[DB Native] Save playlist error:', e);
  }
}

export async function dbGetAllPlaylists(): Promise<Playlist[]> {
  if (!dbInstance) return [];
  try {
    const rows = dbInstance.getAllSync('SELECT * FROM playlists ORDER BY updated_at DESC');
    return rows.map((p: any) => {
      const trackRows = dbInstance.getAllSync(
        'SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC',
        [p.id]
      );
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        coverUri: p.cover_uri,
        trackIds: trackRows.map((tr: any) => tr.track_id),
        trackCount: p.track_count,
        totalDurationSec: p.total_duration_sec,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        isFavorite: p.is_favorite === 1,
        isSmart: p.is_smart === 1,
        smartFilter: p.smart_filter ? JSON.parse(p.smart_filter) : undefined,
      };
    });
  } catch (e) {
    console.warn('[DB Native] Get playlists error:', e);
    return [];
  }
}

export async function dbDeletePlaylist(playlistId: string): Promise<void> {
  if (!dbInstance) return;
  try {
    dbInstance.runSync('DELETE FROM playlist_tracks WHERE playlist_id = ?', [playlistId]);
    dbInstance.runSync('DELETE FROM playlists WHERE id = ?', [playlistId]);
  } catch (e) {
    console.warn('[DB Native] Delete playlist error:', e);
  }
}

export async function dbRecordHistory(trackId: string): Promise<void> {
  if (!dbInstance) return;
  try {
    dbInstance.runSync('INSERT INTO listening_history (track_id, played_at) VALUES (?, ?)', [
      trackId,
      Date.now(),
    ]);
    dbInstance.runSync('UPDATE tracks SET play_count = play_count + 1 WHERE id = ?', [trackId]);
  } catch (e) {
    console.warn('[DB Native] Record history error:', e);
  }
}

export async function dbGetRecentTrackIds(limit = 20): Promise<string[]> {
  if (!dbInstance) return [];
  try {
    const rows = dbInstance.getAllSync(
      'SELECT track_id FROM listening_history ORDER BY played_at DESC LIMIT ?',
      [limit]
    );
    const seen = new Set<string>();
    const result: string[] = [];
    for (const r of rows as any[]) {
      if (!seen.has(r.track_id)) {
        seen.add(r.track_id);
        result.push(r.track_id);
      }
    }
    return result;
  } catch (e) {
    console.warn('[DB Native] Get history error:', e);
    return [];
  }
}
