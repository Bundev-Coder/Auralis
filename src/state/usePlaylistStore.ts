import { create } from 'zustand';
import { Playlist, Track, DownloadItem } from '../types';
import {
  initDatabase,
  dbGetAllTracks,
  dbGetAllPlaylists,
  dbSavePlaylist,
  dbDeletePlaylist,
  dbToggleFavorite,
  dbGetRecentTrackIds,
  dbInsertTrack,
} from '../database/db';
import { SAMPLE_TRACKS } from '../audio/providers/sampleTracks';
import { LocalMusicProvider } from '../audio/providers/LocalMusicProvider';

interface PlaylistStoreState {
  playlists: Playlist[];
  allTracks: Track[];
  favoriteTrackIds: Set<string>;
  recentTrackIds: string[];
  downloads: DownloadItem[];
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  importLocalFiles: () => Promise<Track[]>;
  startDownload: (track: Track) => Promise<void>;
  removeDownload: (trackId: string) => Promise<void>;
}

const localProvider = new LocalMusicProvider();

export const usePlaylistStore = create<PlaylistStoreState>((set, get) => ({
  playlists: [],
  allTracks: [],
  favoriteTrackIds: new Set(),
  recentTrackIds: [],
  downloads: [],
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    await initDatabase();

    // Seed sample tracks into DB if empty
    const existingTracks = await dbGetAllTracks();
    if (existingTracks.length === 0) {
      for (const track of SAMPLE_TRACKS) {
        await dbInsertTrack(track);
      }
    }

    const tracks = await dbGetAllTracks();
    let playlists = await dbGetAllPlaylists();

    // Create default starter playlists if none exist
    if (playlists.length === 0) {
      const defaultMix: Playlist = {
        id: 'pl-cyber-mix',
        name: 'Auralis Cyber Mix',
        description: 'Selected futuristic synthwave & electronic beats',
        coverUri: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
        trackIds: tracks.slice(0, 4).map((t) => t.id),
        trackCount: Math.min(4, tracks.length),
        totalDurationSec: tracks.slice(0, 4).reduce((acc, t) => acc + t.duration, 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: true,
      };

      const chillMix: Playlist = {
        id: 'pl-lofi-lounge',
        name: 'Night Owl Lo-Fi',
        description: 'Mellow frequencies for deep focus and midnight coding',
        coverUri: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
        trackIds: tracks.slice(1, 4).map((t) => t.id),
        trackCount: Math.min(3, tracks.length),
        totalDurationSec: tracks.slice(1, 4).reduce((acc, t) => acc + t.duration, 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      };

      await dbSavePlaylist(defaultMix);
      await dbSavePlaylist(chillMix);
      playlists = [defaultMix, chillMix];
    }

    const favSet = new Set<string>();
    tracks.forEach((t) => {
      if (t.isFavorite) favSet.add(t.id);
    });

    const recentIds = await dbGetRecentTrackIds(20);

    set({
      allTracks: tracks,
      playlists,
      favoriteTrackIds: favSet,
      recentTrackIds: recentIds,
      isLoading: false,
    });
  },

  createPlaylist: async (name: string, description?: string) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      description,
      coverUri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      trackIds: [],
      trackCount: 0,
      totalDurationSec: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dbSavePlaylist(newPlaylist);
    set((state) => ({ playlists: [newPlaylist, ...state.playlists] }));
    return newPlaylist;
  },

  deletePlaylist: async (id: string) => {
    await dbDeletePlaylist(id);
    set((state) => ({
      playlists: state.playlists.filter((p) => p.id !== id),
    }));
  },

  addTrackToPlaylist: async (playlistId: string, trackId: string) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist || playlist.trackIds.includes(trackId)) return;

    const track = get().allTracks.find((t) => t.id === trackId);
    const updated: Playlist = {
      ...playlist,
      trackIds: [...playlist.trackIds, trackId],
      trackCount: playlist.trackCount + 1,
      totalDurationSec: playlist.totalDurationSec + (track?.duration || 0),
      updatedAt: Date.now(),
    };

    await dbSavePlaylist(updated);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? updated : p)),
    }));
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const track = get().allTracks.find((t) => t.id === trackId);
    const updatedTrackIds = playlist.trackIds.filter((id) => id !== trackId);
    const updated: Playlist = {
      ...playlist,
      trackIds: updatedTrackIds,
      trackCount: updatedTrackIds.length,
      totalDurationSec: Math.max(0, playlist.totalDurationSec - (track?.duration || 0)),
      updatedAt: Date.now(),
    };

    await dbSavePlaylist(updated);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? updated : p)),
    }));
  },

  toggleFavorite: async (trackId: string) => {
    const currentFavs = new Set(get().favoriteTrackIds);
    const isNowFav = !currentFavs.has(trackId);

    if (isNowFav) {
      currentFavs.add(trackId);
    } else {
      currentFavs.delete(trackId);
    }

    await dbToggleFavorite(trackId, isNowFav);

    set((state) => ({
      favoriteTrackIds: currentFavs,
      allTracks: state.allTracks.map((t) =>
        t.id === trackId ? { ...t, isFavorite: isNowFav } : t
      ),
    }));
  },

  importLocalFiles: async () => {
    const newTracks = await localProvider.pickAndImportFiles();
    if (newTracks.length > 0) {
      const refreshed = await dbGetAllTracks();
      set({ allTracks: refreshed });
    }
    return newTracks;
  },

  startDownload: async (track: Track) => {
    const currentDownloads = get().downloads;
    if (currentDownloads.some((d) => d.trackId === track.id)) return;

    const item: DownloadItem = {
      id: `dl-${Date.now()}`,
      trackId: track.id,
      trackTitle: track.title,
      artist: track.artist,
      progress: 0.1,
      status: 'downloading',
      downloadedBytes: 1024 * 500,
      totalBytes: track.fileSizeBytes || 1024 * 1024 * 8, // ~8MB default
      startedAt: Date.now(),
    };

    set({ downloads: [item, ...currentDownloads] });

    // Simulate steady network download progress
    let currentProgress = 0.1;
    const interval = setInterval(() => {
      currentProgress += 0.3;
      if (currentProgress >= 1) {
        clearInterval(interval);
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === item.id
              ? {
                  ...d,
                  progress: 1.0,
                  status: 'completed',
                  downloadedBytes: d.totalBytes,
                  completedAt: Date.now(),
                  localFilePath: `file:///storage/offline/${track.id}.mp3`,
                }
              : d
          ),
        }));
      } else {
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === item.id
              ? {
                  ...d,
                  progress: currentProgress,
                  downloadedBytes: Math.floor(d.totalBytes * currentProgress),
                }
              : d
          ),
        }));
      }
    }, 400);
  },

  removeDownload: async (trackId: string) => {
    set((state) => ({
      downloads: state.downloads.filter((d) => d.trackId !== trackId),
    }));
  },
}));
