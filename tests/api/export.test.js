import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('/api/export (CSV)', () => {
  let app;
  let close;

  beforeEach(() => {
    const r = createApp({ dbFile: ':memory:' });
    app = r.app;
    close = r.close;
  });

  afterEach(() => close?.());

  it('400 on bad month format', async () => {
    const r = await request(app).get('/api/export').query({ month: '2025/09' });
    expect(r.status).toBe(400);
  });

  it('exports CSV for given month (2 days -> 2*48 rows + header)', async () => {
    const payload1 = {
      date: '2025-09-01',
      sleep_minutes: 300,
      fatigue: { morning: 3, noon: 4, night: 5 },
      mood: { morning: 6, noon: 7, night: 8 },
      note: 'note1,with,comma',
      activities: [
        { slot: 0, label: '睡眠', category: 'sleep' },
        { slot: 3, label: '移動', category: 'move' },
      ],
    };
    const payload2 = {
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

    await request(app).post('/api/day').send(payload1).expect(200);
    await request(app).post('/api/day').send(payload2).expect(200);

    const res = await request(app).get('/api/export').query({ month: '2025-09' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/dailylog_2025-09\.csv/);
    const lines = res.text.trim().split('\n');
    // header + 2 days * 48
    expect(lines.length).toBe(1 + 2 * 48);
    // header columns
    expect(lines[0]).toBe(
      'date,slot_index,time_start,time_end,category,label,sleep_minutes,fatigue_morning,fatigue_noon,fatigue_night,mood_morning,mood_noon,mood_night,note'
    );
    // a quoted note with commas should be quoted in CSV
    expect(lines.some((l) => l.includes('"note1,with,comma"'))).toBe(true);
  });
});

