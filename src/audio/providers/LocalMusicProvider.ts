import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ILocalMusicProvider } from './types';
import { Track } from '../../types';
import { dbInsertTrack } from '../../database/db';

export class LocalMusicProvider implements ILocalMusicProvider {
  id = 'provider-local';
  name = 'Local Device Storage';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Opens OS Document/Files picker to import local audio files
   */
  async pickAndImportFiles(): Promise<Track[]> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      const importedTracks: Track[] = [];

      for (const asset of result.assets) {
        // Parse artist & title from filename e.g. "Artist - Song.mp3"
        const rawName = asset.name.replace(/\.[^/.]+$/, ''); // strip extension
        let artist = 'Local Artist';
        let title = rawName;

        if (rawName.includes(' - ')) {
          const parts = rawName.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        const ext = asset.name.split('.').pop()?.toLowerCase() || 'mp3';
        const trackId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        const track: Track = {
          id: trackId,
          title,
          artist,
          album: 'Device Music',
          duration: 180, // Fallback duration until metadata loaded
          sourceUri: asset.uri,
          sourceType: 'local',
          isLocal: true,
          bitrate: '320 kbps',
          format: ext as any,
          genre: 'Local',
          fileSizeBytes: asset.size,
          addedAt: Date.now(),
          artworkUri: undefined,
        };

        await dbInsertTrack(track);
        importedTracks.push(track);
      }

      return importedTracks;
    } catch (error) {
      console.error('[LocalMusicProvider] File pick error:', error);
      throw error;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    // Handled by database search
    return [];
  }

  async getTrackById(id: string): Promise<Track | null> {
    return null;
  }
}
