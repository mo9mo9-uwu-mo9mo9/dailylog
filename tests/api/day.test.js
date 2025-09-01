import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('/api/day', () => {
  let app;
  beforeEach(() => {
    const r = createApp({ dbFile: ':memory:' });
    app = r.app;
  });

  it('400 when date is invalid', async () => {
    const r1 = await request(app).get('/api/day');
    expect(r1.status).toBe(400);
    const r2 = await request(app).post('/api/day').send({ date: '2025/09/01' });
    expect(r2.status).toBe(400);
  });

  it('accepts valid payload and persists data', async () => {
    const payload = {
      date: '2025-09-01',
      sleep_minutes: 300,
      fatigue: { morning: 3, noon: 5, night: 7 },
      mood: { morning: 4, noon: 6, night: 8 },
      note: 'test',
      activities: [ { slot: 0, label: '朝食' }, { slot: '03', label: '移動' } ]
    };
    const p = await request(app).post('/api/day').send(payload);
    expect(p.status).toBe(200);
    expect(p.body.ok).toBe(true);

    const g = await request(app).get('/api/day').query({ date: '2025-09-01' });
    expect(g.status).toBe(200);
    expect(g.body.activities).toEqual([
      { slot: 0, label: '朝食' },
      { slot: 3, label: '移動' },
    ]);
    expect(g.body.sleep_minutes).toBe(300);
    expect(g.body.fatigue).toEqual({ morning: 3, noon: 5, night: 7 });
    expect(g.body.mood).toEqual({ morning: 4, noon: 6, night: 8 });
  });

  it('rejects invalid slot or duplicate slot', async () => {
    const bad = await request(app).post('/api/day').send({
      date: '2025-09-01',
      activities: [ { slot: 100, label: 'x' } ]
    });
    expect(bad.status).toBe(400);

    const dup = await request(app).post('/api/day').send({
      date: '2025-09-01',
      activities: [ { slot: 1, label: 'a' }, { slot: '01', label: 'b' } ]
    });
    expect(dup.status).toBe(400);
    expect(dup.body.error).toBe('duplicate slot');
  });
});
