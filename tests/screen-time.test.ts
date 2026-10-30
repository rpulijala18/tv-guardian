import { describe, it, expect } from 'vitest';

describe('Screen Time & Schedule Enforcement Engine', () => {
  const DAILY_LIMIT_MINUTES = 120; // 2 hours
  const TIMEZONE = 'Asia/Kolkata';

  function calculateRemaining(usedSeconds: number, limitMinutes: number) {
    const usedMinutes = Math.floor(usedSeconds / 60);
    const remainingMinutes = Math.max(0, limitMinutes - usedMinutes);
    const percentConsumed = Math.min(100, Math.round((usedMinutes / limitMinutes) * 100));
    const isLimitReached = usedMinutes >= limitMinutes;

    return { usedMinutes, remainingMinutes, percentConsumed, isLimitReached };
  }

  it('calculates remaining screen time accurately', () => {
    // 45 minutes used
    const stats = calculateRemaining(45 * 60, DAILY_LIMIT_MINUTES);
    expect(stats.usedMinutes).toBe(45);
    expect(stats.remainingMinutes).toBe(75);
    expect(stats.percentConsumed).toBe(38);
    expect(stats.isLimitReached).toBe(false);
  });

  it('detects when limit is reached and triggers restriction', () => {
    // 120 minutes used
    const stats = calculateRemaining(120 * 60, DAILY_LIMIT_MINUTES);
    expect(stats.remainingMinutes).toBe(0);
    expect(stats.percentConsumed).toBe(100);
    expect(stats.isLimitReached).toBe(true);
  });

  it('handles overtime without negative remaining minutes', () => {
    // 150 minutes used (overtime)
    const stats = calculateRemaining(150 * 60, DAILY_LIMIT_MINUTES);
    expect(stats.remainingMinutes).toBe(0);
    expect(stats.percentConsumed).toBe(100);
    expect(stats.isLimitReached).toBe(true);
  });

  it('correctly evaluates Asia/Kolkata date format', () => {
    const testDate = new Date('2026-10-30T18:30:00Z');
    const istString = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(testDate);

    expect(istString).toBe('2026-10-31'); // 18:30 UTC is 00:00 next day in IST
  });
});

