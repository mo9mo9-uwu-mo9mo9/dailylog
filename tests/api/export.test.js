import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/export', () => {
  let app; let close;
  beforeEach(() => { ({ app, close } = createApp({ dbFile: ':memory:' })); });
  afterEach(() => { close?.(); });

  it('400 on bad month', async () => {
    const r = await request(app).get('/api/export').query({ month: '2025/09' });
    expect(r.status).toBe(400);
  });

  it('returns CSV for the month', async () => {
    const day = (d) => ({
      date: d,
      sleep_minutes: 300,
      fatigue: { morning: 3, noon: 5, night: 7 },
      mood: { morning: 4, noon: 6, night: 8 },
      note: 'テスト',
      activities: [ { slot: 0, label: '睡眠' }, { slot: 3, label: '移動' } ]
    });
    await request(app).post('/api/day').send(day('2025-09-01'));
    await request(app).post('/api/day').send(day('2025-09-02'));

    const r = await request(app).get('/api/export').query({ month: '2025-09' });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toMatch(/text\/csv/);
    const lines = r.text.trim().split('\n');
    expect(lines[0]).toMatch(/^date,/);
    expect(lines.length).toBe(1 + 2); // header + 2 days
    expect(r.text).toMatch(/2025-09-01/);
  });
});

