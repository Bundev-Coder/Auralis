/**
 * Auralis Web Database Store (localStorage / memory)
 * Ensures 100% crash-free operation on web without wasm bundler dependency.
 */

import { Track, Playlist } from '../types';

const webStore: {
  tracks: Track[];
  playlists: Playlist[];
  history: { trackId: string; playedAt: number }[];
  favorites: Set<string>;
} = {
  tracks: [],
  playlists: [],
  history: [],
  favorites: new Set(),
};

function persistWeb() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auralis_tracks', JSON.stringify(webStore.tracks));
      localStorage.setItem('auralis_playlists', JSON.stringify(webStore.playlists));
      localStorage.setItem('auralis_favorites', JSON.stringify(Array.from(webStore.favorites)));
      localStorage.setItem('auralis_history', JSON.stringify(webStore.history));
    }
  } catch {
    // quota limit
  }
}

export async function initDatabase(): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      const storedTracks = localStorage.getItem('auralis_tracks');
      if (storedTracks) webStore.tracks = JSON.parse(storedTracks);
      const storedPlaylists = localStorage.getItem('auralis_playlists');
      if (storedPlaylists) webStore.playlists = JSON.parse(storedPlaylists);
      const storedFavorites = localStorage.getItem('auralis_favorites');
      if (storedFavorites) webStore.favorites = new Set(JSON.parse(storedFavorites));
      const storedHistory = localStorage.getItem('auralis_history');
      if (storedHistory) webStore.history = JSON.parse(storedHistory);
    }
  } catch {
    // ignore
  }
}

export async function dbInsertTrack(track: Track): Promise<void> {
  const idx = webStore.tracks.findIndex((t) => t.id === track.id);
  if (idx >= 0) {
    webStore.tracks[idx] = track;
  } else {
    webStore.tracks.push(track);
  }
  persistWeb();
}

export async function dbGetAllTracks(): Promise<Track[]> {
  return [...webStore.tracks];
}

export async function dbToggleFavorite(trackId: string, isFav: boolean): Promise<void> {
  if (isFav) {
    webStore.favorites.add(trackId);
  } else {
    webStore.favorites.delete(trackId);
  }
  const t = webStore.tracks.find((x) => x.id === trackId);
  if (t) t.isFavorite = isFav;
  persistWeb();
}

export async function dbSavePlaylist(playlist: Playlist): Promise<void> {
  const idx = webStore.playlists.findIndex((p) => p.id === playlist.id);
  if (idx >= 0) {
    webStore.playlists[idx] = playlist;
  } else {
    webStore.playlists.push(playlist);
  }
  persistWeb();
}

export async function dbGetAllPlaylists(): Promise<Playlist[]> {
  return [...webStore.playlists];
}

export async function dbDeletePlaylist(playlistId: string): Promise<void> {
  webStore.playlists = webStore.playlists.filter((p) => p.id !== playlistId);
  persistWeb();
}

export async function dbRecordHistory(trackId: string): Promise<void> {
  webStore.history.unshift({ trackId, playedAt: Date.now() });
  if (webStore.history.length > 100) webStore.history.pop();
  const t = webStore.tracks.find((x) => x.id === trackId);
  if (t) t.playCount = (t.playCount || 0) + 1;
  persistWeb();
}

export async function dbGetRecentTrackIds(limit = 20): Promise<string[]> {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const h of webStore.history) {
    if (!seen.has(h.trackId)) {
      seen.add(h.trackId);
      result.push(h.trackId);
      if (result.length >= limit) break;
    }
  }
  return result;
}
