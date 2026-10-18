import { Platform } from 'react-native';
import { APP_CONFIG } from '../../config/appConfig';
import { Playlist, UserProfile } from '../../types';

interface AuthResponse {
  token: string;
  user: UserProfile;
}

class ApiClient {
  private baseUrl = APP_CONFIG.api.baseUrl;
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          this.token = localStorage.getItem('auralis_auth_token');
        }
      } else {
        const SecureStore = await import('expo-secure-store');
        this.token = await SecureStore.getItemAsync('auralis_auth_token');
      }
    } catch {
      // SecureStore fallback
    }
  }

  private async saveToken(token: string | null) {
    this.token = token;
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          if (token) {
            localStorage.setItem('auralis_auth_token', token);
          } else {
            localStorage.removeItem('auralis_auth_token');
          }
        }
      } else {
        const SecureStore = await import('expo-secure-store');
        if (token) {
          await SecureStore.setItemAsync('auralis_auth_token', token);
        } else {
          await SecureStore.deleteItemAsync('auralis_auth_token');
        }
      }
    } catch {
      // SecureStore fallback
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    await this.saveToken(data.token);
    return data;
  }

  public async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    await this.saveToken(data.token);
    return data;
  }

  public async logout(): Promise<void> {
    await this.saveToken(null);
  }

  public async getProfile(): Promise<UserProfile | null> {
    if (!this.token) return null;

    try {
      const res = await fetch(`${this.baseUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }

  public async syncPlaylists(localPlaylists: Playlist[]): Promise<{
    mergedPlaylists: Playlist[];
    syncedAt: number;
  }> {
    if (!this.token) {
      throw new Error('Please sign in to sync playlists with the cloud');
    }

    const res = await fetch(`${this.baseUrl}/playlists/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        playlists: localPlaylists,
        lastSyncTimestamp: Date.now() - 86400000,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Playlist sync failed');
    }

    return {
      mergedPlaylists: data.playlists || localPlaylists,
      syncedAt: data.syncedAt || Date.now(),
    };
  }

  public async recordPlayback(trackId: string): Promise<void> {
    if (!this.token) return;

    try {
      await fetch(`${this.baseUrl}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ trackId, playedAt: Date.now() }),
      });
    } catch {
      // Non-blocking telemetry
    }
  }
}

export const apiClient = new ApiClient();
