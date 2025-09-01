import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/health', () => {
  let app; let close;
  beforeAll(() => {
    const r = createApp({ dbFile: ':memory:' });
    app = r.app; close = r.close;
  });
  afterAll(() => { close?.(); });

  it('returns ok:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
