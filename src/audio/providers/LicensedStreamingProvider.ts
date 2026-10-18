import { ILicensedStreamingProvider } from './types';
import { Track } from '../../types';
import { SAMPLE_TRACKS } from './sampleTracks';

export class LicensedStreamingProvider implements ILicensedStreamingProvider {
  id = 'provider-licensed-stream';
  name = 'Auralis Cloud Catalog (CC / Licensed)';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getFeaturedTracks(): Promise<Track[]> {
    return SAMPLE_TRACKS;
  }

  async getTracksByGenre(genre: string): Promise<Track[]> {
    const lower = genre.toLowerCase();
    return SAMPLE_TRACKS.filter((t) => t.genre?.toLowerCase().includes(lower));
  }

  async searchTracks(query: string): Promise<Track[]> {
    if (!query) return SAMPLE_TRACKS;
    const lower = query.toLowerCase();
    return SAMPLE_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.artist.toLowerCase().includes(lower) ||
        t.album?.toLowerCase().includes(lower) ||
        t.genre?.toLowerCase().includes(lower)
    );
  }

  async getTrackById(id: string): Promise<Track | null> {
    return SAMPLE_TRACKS.find((t) => t.id === id) || null;
  }

  async resolvePlayableStreamUrl(trackId: string): Promise<string> {
    const track = await this.getTrackById(trackId);
    if (!track) throw new Error(`Track ${trackId} not found`);
    return track.sourceUri;
  }
}
