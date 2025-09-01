import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/health', () => {
  let app;
  beforeAll(() => {
    process.env.DB_FILE = ':memory:';
    const r = createApp();
    app = r.app;
  });

  it('returns ok:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

