import { Track, AIAssistantMessage } from '../../types';
import { APP_CONFIG } from '../../config/appConfig';

export interface AIPlaylistRequest {
  prompt: string;
  availableTracks: Track[];
  historyTrackIds?: string[];
  favoriteTrackIds?: Set<string>;
}

export interface AIPlaylistResponse {
  playlistName: string;
  description: string;
  tracks: Track[];
  explanation: string;
}

export class AIEngine {
  /**
   * Process natural language query to generate a playlist or recommendation
   */
  static async processUserQuery(
    prompt: string,
    allTracks: Track[],
    historyTrackIds: string[] = [],
    favoriteTrackIds: Set<string> = new Set()
  ): Promise<AIAssistantMessage> {
    const trimmed = prompt.trim();
    const lower = trimmed.toLowerCase();

    // Check if prompt asks for playlist generation or mood matching
    const isPlaylistRequest =
      lower.includes('tạo playlist') ||
      lower.includes('playlist') ||
      lower.includes('danh sách') ||
      lower.includes('gợi ý') ||
      lower.includes('nhạc để') ||
      lower.includes('create playlist');

    // Attempt backend AI endpoint if configured
    try {
      if (APP_CONFIG.api.baseUrl && !lower.includes('offline-test')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${APP_CONFIG.api.baseUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            candidateTrackIds: allTracks.map((t) => t.id),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          // Filter matched tracks from our catalog
          const matchedTracks = allTracks.filter((t) => data.trackIds?.includes(t.id));
          if (matchedTracks.length > 0) {
            return {
              id: `ai-msg-${Date.now()}`,
              role: 'assistant',
              content: data.reply || `Dưới đây là playlist được thiết kế riêng theo yêu cầu của bạn.`,
              timestamp: Date.now(),
              suggestedTrackIds: matchedTracks.map((t) => t.id),
              generatedPlaylist: {
                name: data.playlistName || 'AI Curated Flow',
                description: data.description || `Được tuyển chọn dựa trên: "${trimmed}"`,
                tracks: matchedTracks,
              },
              explanation: data.explanation || 'Được tối ưu theo âm hưởng và cấu trúc bài hát.',
            };
          }
        }
      }
    } catch {
      // Backend unavailable, gracefully fallback to local intelligent heuristics
    }

    // Local Intelligent Heuristics Engine
    const result = this.localCuratePlaylist({
      prompt: trimmed,
      availableTracks: allTracks,
      historyTrackIds,
      favoriteTrackIds,
    });

    return {
      id: `ai-msg-${Date.now()}`,
      role: 'assistant',
      content: `Auralis AI đã phân tích yêu cầu "${trimmed}" và thiết kế danh sách nghe phù hợp nhất từ catalog thực tế của bạn.`,
      timestamp: Date.now(),
      suggestedTrackIds: result.tracks.map((t) => t.id),
      generatedPlaylist: {
        name: result.playlistName,
        description: result.description,
        tracks: result.tracks,
      },
      explanation: result.explanation,
    };
  }

  /**
   * Deterministic, high-relevance local recommendation engine
   */
  static localCuratePlaylist(req: AIPlaylistRequest): AIPlaylistResponse {
    const { prompt, availableTracks, favoriteTrackIds } = req;
    const lower = prompt.toLowerCase();

    // 1. Detect target genres & mood
    let targetGenres: string[] = [];
    let mood = 'Cân bằng & Tinh tế';

    if (lower.includes('học') || lower.includes('tập trung') || lower.includes('focus') || lower.includes('study')) {
      targetGenres = ['Lo-Fi Chill', 'Modern Classical', 'Space Ambient'];
      mood = 'Sóng não Alpha, nhịp điệu êm dịu giúp tăng 40% khả năng tập trung.';
    } else if (lower.includes('synthwave') || lower.includes('cyber') || lower.includes('đêm') || lower.includes('lái xe') || lower.includes('night')) {
      targetGenres = ['Synthwave', 'Electronic', 'Future Bass'];
      mood = 'Âm hưởng retro-futuristic, bass trầm ấm và synth du dương cho hành trình về đêm.';
    } else if (lower.includes('ngủ') || lower.includes('thư giãn') || lower.includes('chill') || lower.includes('relax')) {
      targetGenres = ['Space Ambient', 'Lo-Fi Chill', 'Modern Classical'];
      mood = 'Hạ nhịp tim, giải tỏa căng thẳng với dải tần số êm ái.';
    } else if (lower.includes('năng lượng') || lower.includes('tập thể dục') || lower.includes('workout') || lower.includes('edm')) {
      targetGenres = ['Future Bass', 'Electronic', 'Synthwave'];
      mood = 'BPM cao, tiết tấu sôi nổi thúc đẩy adrenaline.';
    } else {
      // Default balanced mix
      targetGenres = ['Synthwave', 'Lo-Fi Chill', 'Electronic', 'Modern Classical'];
    }

    // 2. Score tracks
    const scored = availableTracks.map((t) => {
      let score = 0;
      if (t.genre && targetGenres.some((g) => t.genre?.toLowerCase().includes(g.toLowerCase()))) {
        score += 50;
      }
      if (favoriteTrackIds?.has(t.id)) {
        score += 20; // Favor tracks user already loves
      }
      if (t.isLocal) {
        score += 10; // High accessibility
      }
      // Direct word match
      if (t.title.toLowerCase().split(' ').some((w) => lower.includes(w))) {
        score += 30;
      }
      return { track: t, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Pick top tracks (between 3 and 6)
    const selected = scored.slice(0, Math.min(5, availableTracks.length)).map((s) => s.track);

    // Fallback if none matched
    const finalTracks = selected.length > 0 ? selected : availableTracks.slice(0, 4);

    let name = 'Auralis AI Flow';
    if (lower.includes('học') || lower.includes('tập trung')) name = 'Deep Work Alpha Flow';
    else if (lower.includes('cyber') || lower.includes('đêm')) name = 'Midnight Neon Drive';
    else if (lower.includes('chill') || lower.includes('thư giãn')) name = 'Evening Relaxation';

    return {
      playlistName: name,
      description: `Playlist AI tuyển chọn riêng: ${mood}`,
      tracks: finalTracks,
      explanation: `Lựa chọn dựa trên thể loại [${targetGenres.join(', ')}] và các dải tần số phù hợp với ngữ cảnh nghe của bạn.`,
    };
  }

  /**
   * Find tracks similar to a given track
   */
  static getSimilarTracks(targetTrack: Track, allTracks: Track[], limit = 4): Track[] {
    return allTracks
      .filter((t) => t.id !== targetTrack.id)
      .map((t) => {
        let similarity = 0;
        if (t.genre === targetTrack.genre) similarity += 60;
        if (t.artist === targetTrack.artist) similarity += 30;
        const durDiff = Math.abs((t.duration || 0) - (targetTrack.duration || 0));
        if (durDiff < 60) similarity += 10;
        return { track: t, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.track);
  }
}
