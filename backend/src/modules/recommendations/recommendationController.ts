import { Request, Response } from 'express';

export class RecommendationController {
  static async handleAIChat(req: Request, res: Response) {
    const { prompt, candidateTrackIds } = req.body as {
      prompt: string;
      candidateTrackIds?: string[];
    };

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const lower = prompt.toLowerCase();
    let playlistName = 'Neural Mix';
    let description = `Curated for: "${prompt}"`;
    let explanation = 'Tracks matched based on audio timbre and mood affinity.';

    if (lower.includes('học') || lower.includes('tập trung') || lower.includes('focus')) {
      playlistName = 'Alpha State Focus';
      description = 'BPM 60-80, harmonic pads for high cognitive flow';
      explanation = 'Lo-Fi and ambient chords selected to reduce distraction.';
    } else if (lower.includes('đêm') || lower.includes('night') || lower.includes('cyber')) {
      playlistName = 'Midnight Cyber Horizon';
      description = 'Warm analog synths and driving basslines';
      explanation = 'Synthwave and cyber frequencies calibrated for late night sessions.';
    } else if (lower.includes('chill') || lower.includes('thư giãn') || lower.includes('relax')) {
      playlistName = 'Zen Frequencies';
      description = 'Down-tempo and acoustic space for tranquility';
      explanation = 'Harmonics optimized for lowering heart rate and tension.';
    }

    // Pick subset of candidateTrackIds if provided
    let matchedIds = candidateTrackIds || [];
    if (matchedIds.length > 4) {
      matchedIds = matchedIds.slice(0, 4);
    }

    return res.json({
      reply: `Auralis Cloud AI đã tạo danh sách "${playlistName}" phù hợp với sở thích của bạn.`,
      playlistName,
      description,
      explanation,
      trackIds: matchedIds,
    });
  }
}
