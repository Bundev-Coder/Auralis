import { Track } from '../../types';
import { parseLRC } from '../../utils/lrcParser';

export const SAMPLE_TRACKS: Track[] = [
  {
    id: 'auralis-demo-1',
    title: 'Cyber Horizon',
    artist: 'Neon Pulse',
    album: 'Synthetic Dreams 2099',
    duration: 372,
    artworkUri: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    sourceUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    sourceType: 'stream',
    isLocal: false,
    bitrate: '320 kbps',
    format: 'mp3',
    genre: 'Synthwave',
    year: 2026,
    playCount: 124,
    isFavorite: true,
    addedAt: Date.now() - 86400000 * 3,
    lyrics: `[00:00.00]♪ Synth intro starts ♪
[00:15.00]Driving through the neon glow of midnight rain
[00:28.50]Reflections on the asphalt wash away the pain
[00:43.00]The skyline whispers secrets in a cybernetic haze
[00:58.20]Lost inside the circuit boards and digital displays
[01:14.00]We are the children of the electric dawn
[01:29.40]Chasing frequencies until the dark is gone
[01:45.00]Turn the volume up and let the bass collide
[02:00.00]Across the digital horizon where we ride
[02:20.00]♪ Lead synth solo soaring ♪
[02:50.00]No past, no future, only here and now
[03:10.00]Signals merging through the static cloud
[03:30.00]Cyber horizon calls our names tonight...`,
  },
  {
    id: 'auralis-demo-2',
    title: 'Midnight Rain in Tokyo',
    artist: 'Aether Echo',
    album: 'Shibuya Nightscapes',
    duration: 423,
    artworkUri: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    sourceUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    sourceType: 'stream',
    isLocal: false,
    bitrate: '320 kbps',
    format: 'mp3',
    genre: 'Lo-Fi Chill',
    year: 2026,
    playCount: 89,
    isFavorite: false,
    addedAt: Date.now() - 86400000 * 5,
    lyrics: `[00:00.00]♪ Vinyl crackle and rain ambience ♪
[00:18.00]Drops falling on the umbrella canopy
[00:35.00]Warm coffee steam in a quiet alley
[00:52.00]Lo-fi chords floating through the humid air
[01:10.00]Footsteps echoing with gentle care
[01:30.00]Take a breath, slow down the ticking clock
[01:50.00]Past midnight as the city doors unlock
[02:15.00]Drifting in tranquility and peace...`,
  },
  {
    id: 'auralis-demo-3',
    title: 'Quantum Resonance',
    artist: 'HyperDrive',
    album: 'Zero Point Energy',
    duration: 345,
    artworkUri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    sourceUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    sourceType: 'stream',
    isLocal: false,
    bitrate: '320 kbps',
    format: 'mp3',
    genre: 'Electronic',
    year: 2026,
    playCount: 210,
    isFavorite: true,
    addedAt: Date.now() - 86400000 * 2,
    lyrics: `[00:00.00]♪ Pulsing electronic arpeggio ♪
[00:20.00]Particles in super-position dance
[00:40.00]Entering a deep harmonic trance
[01:00.00]Oscillating at eight hundred hertz
[01:25.00]Breaking through the boundaries of the universe
[01:50.00]Feel the resonance inside your soul!`,
  },
  {
    id: 'auralis-demo-4',
    title: 'Echoes of Silence',
    artist: 'Aura Ensemble',
    album: 'Solitude Suite',
    duration: 302,
    artworkUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    sourceUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    sourceType: 'stream',
    isLocal: false,
    bitrate: '256 kbps',
    format: 'mp3',
    genre: 'Modern Classical',
    year: 2025,
    playCount: 45,
    isFavorite: false,
    addedAt: Date.now() - 86400000 * 7,
    lyrics: `[00:00.00]♪ Gentle grand piano chords ♪
[00:25.00]When all the noise begins to fade away
[00:55.00]The silent moments find the words to say
[01:30.00]Strings swell beneath the tender key
[02:00.00]A quiet space where minds can wander free...`,
  },
  {
    id: 'auralis-demo-5',
    title: 'Starlight Velocity',
    artist: 'Nova Drive',
    album: 'Hypervelocity',
    duration: 388,
    artworkUri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    sourceUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    sourceType: 'stream',
    isLocal: false,
    bitrate: '320 kbps',
    format: 'mp3',
    genre: 'Future Bass',
    year: 2026,
    playCount: 150,
    isFavorite: true,
    addedAt: Date.now() - 86400000 * 1,
    lyrics: `[00:00.00]♪ Upbeat sparkling synths ♪
[00:16.00]Accelerating beyond light speed
[00:32.00]This is the rush that we both need
[00:50.00]Gravity lets go, we leave the ground
[01:08.00]Riding on a tidal wave of sound!`,
  },
  {
    id: 'auralis-demo-6',
    title: 'Deep Space Solitude',
    artist: 'Cosmic Drifter',
    album: 'Voyager Infinite',
    duration: 410,
    artworkUri: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
    sourceUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    sourceType: 'stream',
    isLocal: false,
    bitrate: '320 kbps',
    format: 'mp3',
    genre: 'Space Ambient',
    year: 2026,
    playCount: 67,
    isFavorite: false,
    addedAt: Date.now() - 86400000 * 4,
    lyrics: `[00:00.00]♪ Deep atmospheric drone ♪
[00:30.00]Beyond the asteroid belt we float
[01:05.00]A solitary vessel, a timeless boat
[01:45.00]Stars shining millions of light years old
[02:30.00]In the cosmic embrace of velvet cold...`,
  },
];

// Pre-parse synced lyrics for all demo tracks
for (const track of SAMPLE_TRACKS) {
  if (track.lyrics) {
    track.syncedLyrics = parseLRC(track.lyrics);
  }
}
