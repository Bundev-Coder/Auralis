import { describe, it, expect } from 'vitest';
import { createApp } from '../src/server';

async function request(app: any, method: string, path: string, body?: any, headers?: Record<string, string>) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const req: any = {
      method,
      url: path,
      headers: { 'content-type': 'application/json', ...headers },
      body: body || {},
    };

    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        resolve({ status: this.statusCode, body: data });
      },
      send(data: any) {
        resolve({ status: this.statusCode, body: data });
      },
      setHeader() {},
    };

    app(req, res);
  });
}

describe('Auralis Backend API', () => {
  const app = createApp();

  it('GET /api/health returns operational status', async () => {
    const res = await request(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('Auralis API');
  });

  it('POST /api/auth/register creates a user and returns JWT token', async () => {
    const res = await request(app, 'POST', '/api/auth/register', {
      email: 'creator@auralis.audio',
      password: 'password123',
      displayName: 'Neon Creator',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('creator@auralis.audio');
  });

  it('POST /api/auth/login authenticates registered user', async () => {
    const res = await request(app, 'POST', '/api/auth/login', {
      email: 'creator@auralis.audio',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/playlists/sync syncs client playlists with versioning', async () => {
    const playlist = {
      id: 'pl-test-01',
      name: 'Cyber Drive 2099',
      trackIds: ['auralis-demo-1', 'auralis-demo-5'],
      updatedAt: Date.now(),
      version: 1,
    };

    const res = await request(app, 'POST', '/api/playlists/sync', {
      playlists: [playlist],
    });

    expect(res.status).toBe(200);
    expect(res.body.synced.length).toBe(1);
    expect(res.body.synced[0].id).toBe('pl-test-01');
  });

  it('POST /api/ai/chat returns contextual AI curated playlist and explanation', async () => {
    const res = await request(app, 'POST', '/api/ai/chat', {
      prompt: 'Tạo playlist lofi 45 phút học tập',
      candidateTrackIds: ['auralis-demo-2', 'auralis-demo-4'],
    });

    expect(res.status).toBe(200);
    expect(res.body.playlistName).toContain('Focus');
    expect(res.body.trackIds).toBeDefined();
  });
});
