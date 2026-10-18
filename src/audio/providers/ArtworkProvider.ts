import { IArtworkProvider } from './types';
import { Track } from '../../types';

export class ArtworkProvider implements IArtworkProvider {
  private fallbackGradients = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
  ];

  getArtworkUri(track: Partial<Track>): string {
    if (track.artworkUri) return track.artworkUri;
    // Derive deterministic gradient based on track ID or title
    const key = (track.id || track.title || 'auralis').length;
    return this.fallbackGradients[key % this.fallbackGradients.length];
  }
}
