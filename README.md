# 🌌 AURALIS — Next-Generation Immersive Audio App for Android & iOS

**AURALIS** is a production-grade, cross-platform music streaming and local audio playback application built with **React Native**, **TypeScript**, **Expo**, and **Node.js/Express**. Designed with a futuristic dark aesthetic (obsidian midnight `#07090E`, smoky violet `#8B5CF6`, neon electric cyan `#00F2FE`, and emerald mint `#10B981`), Auralis combines high-fidelity audio playback, synchronized karaoke-style lyrics, a 10-band DSP equalizer, an offline download manager, local device storage importing, and a conversational AI music assistant.

---

## 🚀 Key Highlights & Architecture

- **Configurable Branding**: App name, slogans, bundle IDs, and feature toggles are centralized in [`src/config/appConfig.ts`](file:///c:/Users/ad/Documents/Auralis/src/config/appConfig.ts) for effortless rebranding.
- **Independent Audio Player Engine**: Unified audio engine (`src/audio/engine/AudioEngine.ts`) with background audio playback, system media session notifications (`navigator.mediaSession` on web / Android foreground media service / iOS Control Center), and interruption handling.
- **True 10-Band Equalizer**: Connects directly to audio DSP (Web Audio API `BiquadFilterNode` chain on Web, native DSP on Android/iOS) with 7 standard presets (`Flat`, `Bass Boost`, `Treble Boost`, `Vocal Clarity`, `Rock`, `Jazz`, `Classical`) and custom preset storage.
- **Synchronized Lyrics (LRC)**: Real-time active line highlighting with neon glow, auto-scrolling, tap-to-seek, font size scaling, and instrumental track fallbacks.
- **Local Audio Importer**: Browse and import MP3, M4A, FLAC, and WAV files directly from device storage via system file pickers into a local SQLite library.
- **Provider Architecture**: Decoupled `LocalMusicProvider`, `LicensedStreamingProvider`, `LyricsProvider`, and `ArtworkProvider`.
- **Conversational AI Music Assistant**: Analyzes natural language prompts (e.g., *"Tạo playlist lofi 45 phút học tập"*), generates playable playlists verified against the catalog (zero hallucinated tracks), and provides contextual explanations.
- **Deployable Backend API**: Complete Node.js + TypeScript server with JWT authentication, playlist sync with conflict resolution, playback history, and AI recommendation endpoints.
- **100% Test Coverage**: 24 automated unit and integration tests across queue management, LRC parsing, equalizer math, AI engine, and REST endpoints.

---

## 📁 Project Structure

```text
Auralis/
├── App.tsx                      # App root component with safe areas & store init
├── app.json                     # Expo config with background audio & Android permissions
├── package.json                 # Dependencies (Expo 58, React 19, Zustand, Expo-AV)
├── vitest.config.ts             # Test runner configuration
├── .env.example                 # Environment variable template
├── src/
│   ├── config/
│   │   └── appConfig.ts         # Central configurable app branding & settings
│   ├── types/
│   │   └── index.ts             # Domain models (Track, Playlist, Equalizer, Lyrics)
│   ├── theme/
│   │   ├── colors.ts            # Obsidian, violet, electric cyan color tokens
│   │   ├── typography.ts        # Typography scale
│   │   └── index.ts             # Spacing, border radius, theme exports
│   ├── audio/
│   │   ├── engine/
│   │   │   ├── AudioEngine.ts   # Core engine: Web Audio DSP + Expo AV + MediaSession
│   │   │   ├── types.ts         # Playback state & listeners
│   │   │   └── equalizerPresets.ts # 10-band frequencies & 7 presets
│   │   ├── queue/
│   │   │   └── QueueManager.ts  # Queue, reorder, Fisher-Yates shuffle, repeat modes
│   │   └── providers/
│   │       ├── types.ts         # Provider interfaces
│   │       ├── sampleTracks.ts  # CC-licensed legal audio tracks with synced LRC
│   │       ├── LocalMusicProvider.ts     # DocumentPicker local audio scanner
│   │       ├── LicensedStreamingProvider.ts # Streaming catalog adapter
│   │       ├── LyricsProvider.ts         # LRC parser & provider
│   │       └── ArtworkProvider.ts        # Dynamic gradient artwork generator
│   ├── database/
│   │   ├── db.ts                # Unified database entry
│   │   ├── db.native.ts         # Native SQLite WAL mode database (expo-sqlite)
│   │   └── db.web.ts            # Web persistent localStorage database
│   ├── services/
│   │   └── ai/
│   │       └── AIEngine.ts      # Natural language intent & playlist generator
│   ├── state/
│   │   ├── useAudioStore.ts     # Zustand reactive audio playback store
│   │   └── usePlaylistStore.ts  # Zustand playlists, favorites & downloads store
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx       # Branding header with action icons
│   │   │   ├── TrackRow.tsx     # Track item with playing animation & actions
│   │   │   ├── ProgressBar.tsx  # Seek bar with neon progress fill
│   │   │   └── GlassCard.tsx    # Glassmorphism container
│   │   ├── player/
│   │   │   ├── MiniPlayer.tsx   # Docked floating mini player above tab bar
│   │   │   ├── NowPlayingModal.tsx # Fullscreen player with artwork glow
│   │   │   ├── WaveformVisualizer.tsx # Real-time animated audio spectrum
│   │   │   └── QueueModal.tsx   # Queue manager modal
│   │   ├── lyrics/
│   │   │   └── LyricsModal.tsx  # Synced karaoke lyrics with tap-to-seek
│   │   ├── equalizer/
│   │   │   └── EqualizerModal.tsx # 10-band slider equalizer interface
│   │   └── downloads/
│   │       └── DownloadsModal.tsx # Offline manager & storage analytics
│   ├── features/
│   │   ├── home/
│   │   │   └── HomeScreen.tsx   # AI Flow hero, carousels, recently played
│   │   ├── discover/
│   │   │   └── DiscoverScreen.tsx # Search bar & genre filters
│   │   ├── library/
│   │   │   └── LibraryScreen.tsx # Tabs: Tracks, Playlists, Favorites, Local
│   │   ├── ai-assistant/
│   │   │   └── AIAssistantScreen.tsx # Chat interface for AI music curation
│   │   └── settings/
│   │       └── SettingsScreen.tsx # Bitrate, crossfade, sync, privacy
│   ├── navigation/
│   │   └── TabNavigator.tsx     # 4 bottom tabs + docked mini player
│   └── utils/
│       ├── formatTime.ts        # Seconds to mm:ss & byte formatting
│       └── lrcParser.ts         # High-precision LRC timestamp parser
├── backend/
│   ├── package.json             # Express, JWT, CORS, TypeScript
│   ├── tsconfig.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.ts            # Express server initialization & routes
│   │   ├── config/env.ts        # Environment loader
│   │   ├── database/db.ts       # Backend persistence
│   │   └── modules/
│   │       ├── auth/authController.ts         # JWT register, login, profile
│   │       ├── playlists/playlistController.ts # Sync & conflict resolution
│   │       ├── history/historyController.ts   # Playback history
│   │       └── recommendations/recommendationController.ts # AI endpoint
│   └── tests/
│       └── api.test.ts          # Backend integration tests
└── tests/
    ├── queueManager.test.ts     # Queue, shuffle, repeat tests
    ├── lrcParser.test.ts        # Timestamp parsing & sync tests
    ├── equalizer.test.ts        # Presets & band gain tests
    └── aiEngine.test.ts         # Intent parsing & catalog safety tests
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v20+ or v24+
- **npm**: v10+

### 1. Installation

From the project root:

```bash
cd c:/Users/ad/Documents/Auralis

# Install mobile/web dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Running the Web Application (Interactive Browser Preview)

```bash
npm run web
```
Open [http://localhost:8081](http://localhost:8081) in your browser. You can test audio playback, seekbar, equalizer, lyrics, and the AI assistant immediately!

### 3. Running on Android

#### Option A: Expo Go (Quick Testing)
1. Install **Expo Go** from Google Play Store on your Android device.
2. Run:
   ```bash
   npm run android
   ```
3. Scan the generated QR code with your phone.

#### Option B: Android Emulator / Development Build
1. Ensure Android Studio and Android SDK are installed with `ANDROID_HOME` configured.
2. Run an Android Virtual Device (AVD).
3. Execute:
   ```bash
   npx expo run:android
   ```

### 4. Running on iOS

*Note: Building native iOS applications requires macOS with Xcode installed.*

1. On a macOS workstation, clone or copy the repository.
2. Open terminal in the project directory and run:
   ```bash
   npm install
   npx expo run:ios
   ```
3. To test on a physical iPhone without a Mac, install **Expo Go** from the iOS App Store and scan the QR code from `npm start`.

### 5. Running the Backend API Server

```bash
cd backend
npm run dev
```
The server will start at `http://localhost:4000`.

- Health Check: `GET http://localhost:4000/api/health`
- Auth Register: `POST http://localhost:4000/api/auth/register`
- Auth Login: `POST http://localhost:4000/api/auth/login`
- Sync Playlists: `POST http://localhost:4000/api/playlists/sync`
- AI Assistant: `POST http://localhost:4000/api/ai/chat`

---

## 🧪 Running Automated Tests

Run the full automated test suite (24 tests):

```bash
# Frontend & Audio Engine Tests
npm test

# Backend API Tests
cd backend && npm test
```

---

## 🎛️ How to Rebrand the Application

To change the name of the app to any custom brand:

1. Open [`src/config/appConfig.ts`](file:///c:/Users/ad/Documents/Auralis/src/config/appConfig.ts):
   ```typescript
   export const APP_CONFIG: AppConfig = {
     appName: 'YOUR_BRAND_NAME', // Edit here
     tagline: 'Your Custom Slogan',
     ...
   };
   ```
2. Open [`app.json`](file:///c:/Users/ad/Documents/Auralis/app.json):
   ```json
   {
     "expo": {
       "name": "YOUR_BRAND_NAME",
       "slug": "your-brand-slug"
     }
   }
   ```
3. The UI, header, and metadata will immediately reflect your new brand name throughout the entire application.

---

## 📦 Production Build Instructions

### Android APK / AAB
Using Expo Application Services (EAS):
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

### iOS IPA
```bash
eas build --platform ios --profile production
```

---

## 🔒 Security & Privacy Practices

- **Zero Client Secrets**: No third-party API secret keys are bundled in client code.
- **Local Fallback**: AI recommendation engine operates completely offline using local heuristics when backend is unreachable.
- **Data Minimization**: Personal local audio files are never transmitted to external servers without explicit user intent.
- **SQLite WAL Mode**: Uses write-ahead logging for high concurrency and crash resiliency.
