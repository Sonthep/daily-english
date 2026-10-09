import { Session } from '../../types';

/**
 * Formats a duration in seconds into a friendly Thai string:
 * e.g. "5 นาที 20 วินาที" or "12 วินาที"
 */
export function formatDurationThai(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  if (safeSeconds < 60) {
    return `${safeSeconds} วินาที`;
  }
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  if (secs === 0) {
    return `${mins} นาที`;
  }
  return `${mins} นาที ${secs} วินาที`;
}

/**
 * Returns formatted date in Thai locale:
 * e.g. "วันจันทร์ที่ 14 กันยายน 2026"
 */
export function formatThaiDate(date: Date = new Date(), timezone = 'Asia/Bangkok'): string {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Returns a day key "YYYY-MM-DD" for a given ISO UTC timestamp in the given timezone.
 */
export function getDayKeyInTimezone(isoUtc: string, timezone = 'Asia/Bangkok'): string {
  const date = new Date(isoUtc);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs "YYYY-MM-DD"
}

export interface DayActivity {
  dateKey: string; // YYYY-MM-DD
  dayLabel: string; // จ., อ., พ., ...
  dayNumber: number; // 1..31
  completedSessions: number;
  totalActiveSeconds: number;
  isToday: boolean;
}

/**
 * Generates the past 7 days activity array (including today as the last element).
 */
export function getPast7DaysActivity(
  sessions: Session[],
  timezone = 'Asia/Bangkok',
  now: Date = new Date()
): DayActivity[] {
  const thaiDayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // Map completed sessions to their day key
  const completedSessions = sessions.filter((s) => s.completedAt !== null);
  const activityMap = new Map<string, { count: number; seconds: number }>();

  for (const session of completedSessions) {
    const key = getDayKeyInTimezone(session.completedAt!, timezone);
    const current = activityMap.get(key) || { count: 0, seconds: 0 };
    activityMap.set(key, {
      count: current.count + 1,
      seconds: current.seconds + (session.activeDurationSeconds || 0),
    });
  }

  const days: DayActivity[] = [];
  const todayKey = getDayKeyInTimezone(now.toISOString(), timezone);

  const [todayYear, todayMonth, todayDay] = todayKey.split('-').map(Number);
  const todayCalendarUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);

  // Generate seven distinct calendar dates in the selected timezone.
  for (let i = 6; i >= 0; i--) {
    const calendarDate = new Date(todayCalendarUtc - i * 24 * 60 * 60 * 1000);
    const year = calendarDate.getUTCFullYear();
    const month = String(calendarDate.getUTCMonth() + 1).padStart(2, '0');
    const dayNumber = calendarDate.getUTCDate();
    const key = `${year}-${month}-${String(dayNumber).padStart(2, '0')}`;
    const dayOfWeek = calendarDate.getUTCDay();
    const activity = activityMap.get(key) || { count: 0, seconds: 0 };

    days.push({
      dateKey: key,
      dayLabel: thaiDayLabels[dayOfWeek],
      dayNumber,
      completedSessions: activity.count,
      totalActiveSeconds: activity.seconds,
      isToday: key === todayKey,
    });
  }

  return days;
}
