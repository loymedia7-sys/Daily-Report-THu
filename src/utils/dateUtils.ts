/**
 * Date utility functions for Daily Report Schedule Tracker
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Returns YYYY-MM-DD for a given Date object or today
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns full today information for context displays (e.g. "Today is Monday, August 24, 2026")
 */
export function getTodayInfo(): {
  todayKey: string;
  dayOfWeek: string;
  dayNumber: number;
  monthName: string;
  year: number;
  fullFormatted: string;
  bannerText: string;
} {
  const now = new Date();
  const todayKey = formatDateKey(now);
  const dayOfWeek = DAY_NAMES[now.getDay()];
  const monthName = MONTH_NAMES[now.getMonth()];
  const dayNumber = now.getDate();
  const year = now.getFullYear();

  const fullFormatted = `${dayOfWeek}, ${dayNumber} ${monthName} ${year}`;
  const bannerText = `Today is ${dayOfWeek} (${todayKey})`;

  return {
    todayKey,
    dayOfWeek,
    dayNumber,
    monthName,
    year,
    fullFormatted,
    bannerText
  };
}

/**
 * Parses time strings like "08:00 - 09:00", "08:00-09:30", "13:00 - 14:00" into duration minutes
 */
export function parseTimeSlotDurationMinutes(timeSlot: string): {
  durationMinutes: number;
  formattedDuration: string;
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  isValid: boolean;
} {
  if (!timeSlot || typeof timeSlot !== 'string') {
    return { durationMinutes: 60, formattedDuration: '1h 00m', isValid: false };
  }

  // Look for patterns like "08:00 - 09:00" or "8:00-9:30" or "08:00 to 09:00"
  const clean = timeSlot.replace(/\s+/g, ' ');
  const match = clean.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|—|to)\s*(\d{1,2})[:.](\d{2})/i);

  if (match) {
    let startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    let endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);

    // Handle PM edge cases if end is smaller than start (e.g. 1:00 to 2:00 in 12h format)
    if (endH < startH && startH < 12 && endH < 12) {
      endH += 12;
    }

    const startTotalMinutes = startH * 60 + startM;
    let endTotalMinutes = endH * 60 + endM;

    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Next day wrap
    }

    const diff = endTotalMinutes - startTotalMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    const formattedDuration = mins > 0 ? `${hours}h ${String(mins).padStart(2, '0')}m` : `${hours}h 00m`;

    return {
      durationMinutes: diff,
      formattedDuration,
      startHour: startH,
      startMinute: startM,
      endHour: endH,
      endMinute: endM,
      isValid: true
    };
  }

  // Fallback: Check if slot says e.g. "1 hour", "30 mins", etc.
  const hourMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)/i);
  if (hourMatch) {
    const hrs = parseFloat(hourMatch[1]);
    const mins = Math.round(hrs * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return {
      durationMinutes: mins,
      formattedDuration: m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h 00m`,
      isValid: true
    };
  }

  // Default standard slot: 60 minutes
  return { durationMinutes: 60, formattedDuration: '1h 00m', isValid: false };
}

/**
 * Format total minutes into "Xh Ym" or "X Hours Y Mins"
 */
export function formatMinutesToHours(minutes: number, verbose = false): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (verbose) {
    if (h === 0) return `${m} Minutes`;
    if (m === 0) return `${h} Hour${h > 1 ? 's' : ''}`;
    return `${h} Hour${h > 1 ? 's' : ''} ${m} Min${m > 1 ? 's' : ''}`;
  }
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h 00m`;
}

/**
 * Calculate comprehensive daily work time statistics for a list of tasks
 */
export function calculateDayWorkHours(tasks: Array<{
  id: string;
  timeSlot: string;
  taskName: string;
  scheduleType?: string;
  isOvertime?: boolean;
  isCompleted?: boolean;
  notes?: string;
  completedAt?: string;
}>): {
  totalMinutes: number;
  totalHoursFormatted: string;
  totalHoursVerbose: string;
  regularMinutes: number;
  regularHoursFormatted: string;
  overtimeMinutes: number;
  overtimeHoursFormatted: string;
  completedMinutes: number;
  completedHoursFormatted: string;
  pendingMinutes: number;
  pendingHoursFormatted: string;
  completedCount: number;
  pendingCount: number;
  overtimeCount: number;
  regularCount: number;
  totalSlots: number;
  completionRate: number;
  slotBreakdown: Array<{
    id: string;
    timeSlot: string;
    taskName: string;
    isOvertime: boolean;
    isCompleted: boolean;
    durationMinutes: number;
    durationFormatted: string;
    notes?: string;
    completedAt?: string;
  }>;
} {
  let totalMinutes = 0;
  let regularMinutes = 0;
  let overtimeMinutes = 0;
  let completedMinutes = 0;
  let pendingMinutes = 0;
  let completedCount = 0;
  let overtimeCount = 0;

  const slotBreakdown = tasks.map((task) => {
    const isOvertime = task.scheduleType === 'Over Time' || Boolean(task.isOvertime);
    const isCompleted = Boolean(task.isCompleted);
    const parsed = parseTimeSlotDurationMinutes(task.timeSlot);
    const durationMinutes = parsed.durationMinutes || 60;

    totalMinutes += durationMinutes;
    if (isOvertime) {
      overtimeMinutes += durationMinutes;
      overtimeCount++;
    } else {
      regularMinutes += durationMinutes;
    }

    if (isCompleted) {
      completedMinutes += durationMinutes;
      completedCount++;
    } else {
      pendingMinutes += durationMinutes;
    }

    return {
      id: task.id,
      timeSlot: task.timeSlot,
      taskName: task.taskName,
      isOvertime,
      isCompleted,
      durationMinutes,
      durationFormatted: parsed.formattedDuration,
      notes: task.notes,
      completedAt: task.completedAt
    };
  });

  const totalSlots = tasks.length;
  const pendingCount = totalSlots - completedCount;
  const regularCount = totalSlots - overtimeCount;
  const completionRate = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0;

  return {
    totalMinutes,
    totalHoursFormatted: formatMinutesToHours(totalMinutes),
    totalHoursVerbose: formatMinutesToHours(totalMinutes, true),
    regularMinutes,
    regularHoursFormatted: formatMinutesToHours(regularMinutes),
    overtimeMinutes,
    overtimeHoursFormatted: formatMinutesToHours(overtimeMinutes),
    completedMinutes,
    completedHoursFormatted: formatMinutesToHours(completedMinutes),
    pendingMinutes,
    pendingHoursFormatted: formatMinutesToHours(pendingMinutes),
    completedCount,
    pendingCount,
    overtimeCount,
    regularCount,
    totalSlots,
    completionRate,
    slotBreakdown
  };
}

/**
 * Formats date key YYYY-MM-DD into "Date 25 August 2026"
 */
export function formatDateToScreenshotBanner(dateStr: string): string {
  if (!dateStr) return 'Date';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return `Date ${dateStr}`;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTH_NAMES[monthIdx] || '';
  return `Date ${day} ${monthName} ${year}`;
}

/**
 * Converts standard time slot (e.g. "08:00 - 09:00" or "13:00 - 14:00")
 * to short 2-digit format (e.g. "08-09" or "01-02") matching the required spreadsheet template
 */
export function formatTimeSlotToTwoDigitHours(timeSlot: string): string {
  if (!timeSlot || typeof timeSlot !== 'string') return '';
  const clean = timeSlot.trim();
  
  // If already like "08-09" or "01-02" or "P"
  if (/^\d{1,2}\s*[-–]\s*\d{1,2}$/.test(clean) || clean.toUpperCase() === 'P') {
    const parts = clean.split(/[-–]/).map(p => p.trim());
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return clean;
  }

  // Parse "08:00 - 09:00" or "13:00 - 14:00"
  const match = clean.match(/(\d{1,2})[:.]?(\d{2})?\s*(?:-|–|—|to)\s*(\d{1,2})[:.]?(\d{2})?/i);
  if (match) {
    let startH = parseInt(match[1], 10);
    let endH = parseInt(match[3], 10);

    // Convert 24-hour PM to 12-hour 2-digit if >= 13 (e.g. 13 -> 1 -> "01", 17 -> 5 -> "05")
    const formatHour = (h: number) => {
      const h12 = h > 12 ? h - 12 : h;
      return String(h12).padStart(2, '0');
    };

    return `${formatHour(startH)}-${formatHour(endH)}`;
  }

  return clean;
}

export function formatFullDateHeader(dateStr: string): {
  formattedText: string;
  dayNumber: number;
  monthName: string;
  year: number;
  dayOfWeek: string;
} {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const dayNumber = parseInt(dayStr, 10);
  
  // Construct date safely in local time
  const dateObj = new Date(year, monthIndex, dayNumber);
  const dayOfWeekIndex = dateObj.getDay();
  const dayOfWeek = DAY_NAMES[dayOfWeekIndex];
  const monthName = MONTH_NAMES[monthIndex];

  const formattedText = `${dayNumber} ${monthName} ${year} / ${dayOfWeek}`;

  return {
    formattedText,
    dayNumber,
    monthName,
    year,
    dayOfWeek
  };
}

/**
 * Check if a date key YYYY-MM-DD is Monday (day index 1) or in offDays array
 */
export function isMondayOrOffDay(dateStr: string, offDays: number[] = [1]): boolean {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday
  return offDays.includes(dayIndex);
}

/**
 * Get current time string formatted as HH:MM:SS AM/PM or HH:MM
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

/**
 * Helper to add or subtract days from YYYY-MM-DD
 */
export function addDaysToDateKey(dateStr: string, days: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  dateObj.setDate(dateObj.getDate() + days);
  return formatDateKey(dateObj);
}

export interface MonthWeekGroup {
  weekNumber: number;
  weekLabel: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  reports: any[]; // DayReport[]
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  workingDays: number;
  holidays: number;
}

/**
 * Groups days of a target month (YYYY-MM) into calendar weeks (Monday to Sunday)
 */
export function getMonthWeekBuckets(year: number, monthIndex: number): Array<{
  weekNumber: number;
  startDay: number;
  endDay: number;
  startDate: string;
  endDate: string;
  label: string;
}> {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks: Array<{
    weekNumber: number;
    startDay: number;
    endDay: number;
    startDate: string;
    endDate: string;
    label: string;
  }> = [];

  let currentStartDay = 1;
  let weekNum = 1;

  while (currentStartDay <= daysInMonth) {
    const curDate = new Date(year, monthIndex, currentStartDay);
    const dayOfWeek = curDate.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
    // Days remaining until Sunday (Sunday is end of week, where Sunday dayOfWeek is 0)
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const endDay = Math.min(currentStartDay + daysUntilSunday, daysInMonth);

    const startStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(currentStartDay).padStart(2, '0')}`;
    const endStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    const monthName = MONTH_NAMES[monthIndex].substring(0, 3);

    const label = `Week ${weekNum} (${String(currentStartDay).padStart(2, '0')} ${monthName} - ${String(endDay).padStart(2, '0')} ${monthName} ${year})`;

    weeks.push({
      weekNumber: weekNum,
      startDay: currentStartDay,
      endDay,
      startDate: startStr,
      endDate: endStr,
      label
    });

    currentStartDay = endDay + 1;
    weekNum++;
  }

  return weeks;
}

/**
 * Returns the 7 date strings (YYYY-MM-DD) for the Monday-to-Sunday week containing the given date
 */
export function getWeekDays7(dateStr: string): string[] {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const cur = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  const day = cur.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(cur);
  monday.setDate(cur.getDate() + diffToMonday);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(formatDateKey(d));
  }
  return weekDates;
}

/**
 * Formats a 7-day week range label, e.g. "24 Aug - 30 Aug 2026"
 */
export function getWeekRangeLabel(weekDays: string[]): string {
  if (!weekDays || weekDays.length === 0) return '';
  const first = formatFullDateHeader(weekDays[0]);
  const last = formatFullDateHeader(weekDays[weekDays.length - 1]);
  return `${first.dayNumber} ${first.monthName.substring(0, 3)} - ${last.dayNumber} ${last.monthName.substring(0, 3)} ${last.year}`;
}

/**
 * Returns an array of date keys (YYYY-MM-DD) between startDate and endDate inclusive
 */
export function getDateRangeDays(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  
  let start = startDate;
  let end = endDate;
  if (start > end) {
    // swap if inverted
    start = endDate;
    end = startDate;
  }

  const days: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);

  const cur = new Date(sy, sm - 1, sd);
  const finish = new Date(ey, em - 1, ed);

  // Safety limit to max 366 days
  let count = 0;
  while (cur <= finish && count <= 366) {
    days.push(formatDateKey(cur));
    cur.setDate(cur.getDate() + 1);
    count++;
  }

  return days;
}

/**
 * Formats a custom date range label, e.g. "01 Aug 2026 - 15 Aug 2026"
 */
export function getDateRangeLabel(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  let start = startDate;
  let end = endDate;
  if (start > end) {
    start = endDate;
    end = startDate;
  }
  const first = formatFullDateHeader(start);
  const last = formatFullDateHeader(end);
  return `${String(first.dayNumber).padStart(2, '0')} ${first.monthName.substring(0, 3)} ${first.year} - ${String(last.dayNumber).padStart(2, '0')} ${last.monthName.substring(0, 3)} ${last.year}`;
}

/**
 * Returns HH:MM in 24-hour format
 */
export function get24HourTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Returns formatted 12-hour or 24-hour time string for display (e.g. "08:30 AM")
 */
export function getFormattedTimeString(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Parses a time string (e.g. "08:30", "8:30 AM", "17:45", "5:45 PM") into total minutes from start of day
 */
export function parseTimeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');

  const match = clean.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return 0;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

/**
 * Calculates duration in minutes between check-in and check-out
 */
export function calculateSessionMinutes(checkIn: string, checkOut: string): number {
  const inMin = parseTimeStringToMinutes(checkIn);
  let outMin = parseTimeStringToMinutes(checkOut);

  if (outMin < inMin) {
    // Next day wrap
    outMin += 24 * 60;
  }

  return Math.max(0, outMin - inMin);
}

