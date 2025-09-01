import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

function basic(u, p){
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

describe('Basic Auth (optional)', () => {
  let app;
  beforeEach(() => {
    const { app: a } = createApp({ dbFile: ':memory:', auth: { user: 'u', pass: 'p' } });
    app = a;
  });

  it('401 without credentials', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(401);
    expect(r.headers['www-authenticate']).toMatch(/Basic/);
  });

  it('200 with valid credentials', async () => {
    const r = await request(app).get('/api/health').set('Authorization', basic('u','p'));
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
  });
});
