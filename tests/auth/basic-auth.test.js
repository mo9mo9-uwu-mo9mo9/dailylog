import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

function basic(u, p){
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

describe('Basic Auth (optional)', () => {
  let app; let close;
  beforeEach(() => {
    const { app: a, close: c } = createApp({ dbFile: ':memory:', auth: { user: 'u', pass: 'p' } });
    app = a; close = c;
  });
  afterEach(() => { close?.(); });

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
