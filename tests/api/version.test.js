import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/version', () => {
  let app;
  let close;
  beforeAll(() => {
    const r = createApp({ dbFile: ':memory:' });
    app = r.app;
    close = r.close;
  });
  afterAll(() => {
    close?.();
  });

  it('returns commit and built_at with no-store', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toHaveProperty('commit');
    expect(res.body).toHaveProperty('built_at');
    expect(typeof res.body.commit).toBe('string');
    expect(typeof res.body.built_at).toBe('string');
    expect(res.body.commit.length).toBeGreaterThan(0);
    // built_at should be ISO-like
    expect(res.body.built_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

