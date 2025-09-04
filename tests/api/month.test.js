import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('/api/month (JSON aggregate)', () => {
  let app;
  let close;

  beforeEach(() => {
    const r = createApp({ dbFile: ':memory:' });
    app = r.app;
    close = r.close;
  });

  afterEach(() => close?.());

  it('400 on bad month format', async () => {
    const r = await request(app).get('/api/month').query({ month: '2025/09' });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe('bad month');
  });

  it('aggregates days and activities for the month (includes empty days)', async () => {
    // Seed two days in September
    const d1 = {
      date: '2025-09-01',
      sleep_minutes: 300,
      fatigue: { morning: 3, noon: 4, night: 5 },
      mood: { morning: 6, noon: 7, night: 8 },
      note: 'note1',
      activities: [
        { slot: 0, label: '睡眠', category: 'sleep' },
        { slot: 3, label: '移動', category: 'move' },
      ],
    };
    const d2 = {
      date: '2025-09-15',
      sleep_minutes: 420,
      fatigue: { morning: 2, noon: 3, night: 4 },
      mood: { morning: 5, noon: 6, night: 7 },
      note: 'note2',
      activities: [
        { slot: 1, label: '家事', category: 'house' },
        { slot: 2, label: '食事', category: 'meal' },
      ],
    };
    await request(app).post('/api/day').send(d1).expect(200);
    await request(app).post('/api/day').send(d2).expect(200);

    const res = await request(app).get('/api/month').query({ month: '2025-09' });
    expect(res.status).toBe(200);
    expect(res.body.month).toBe('2025-09');
    const arr = res.body.days;
    expect(Array.isArray(arr)).toBe(true);
    // Should contain at least our two days
    const i1 = arr.findIndex((d) => d.date === '2025-09-01');
    const i2 = arr.findIndex((d) => d.date === '2025-09-15');
    expect(i1).toBeGreaterThanOrEqual(0);
    expect(i2).toBeGreaterThan(i1);
    // Verify payload for 2025-09-01
    const one = arr[i1];
    expect(one.sleep_minutes).toBe(300);
    expect(one.fatigue).toEqual({ morning: 3, noon: 4, night: 5 });
    expect(one.mood).toEqual({ morning: 6, noon: 7, night: 8 });
    expect(one.activities).toEqual([
      { slot: 0, label: '睡眠', category: 'sleep' },
      { slot: 3, label: '移動', category: 'move' },
    ]);
    // Verify an empty day is present (e.g., 2025-09-02)
    const empty = arr.find((d) => d.date === '2025-09-02');
    expect(empty).toBeTruthy();
    expect(empty.activities).toEqual([]);
    expect(empty.sleep_minutes).toBe(0);
  });
});
