import { AppState, DayReport, DefaultTimeSlotTemplate, UserProfile } from '../types';
import { formatDateKey, formatFullDateHeader, getCurrentTimeString, isMondayOrOffDay } from './dateUtils';

const STORAGE_KEY = 'daily_report_schedule_app_state_v1';

export const INITIAL_DEFAULT_SCHEDULE: DefaultTimeSlotTemplate[] = [
  { id: '1', timeSlot: '08:00 - 09:00', taskName: 'Check platform', scheduleType: 'Schedule' },
  { id: '2', timeSlot: '09:00 - 10:00', taskName: 'Reply chat customer on Facebook page', scheduleType: 'Schedule' },
  { id: '3', timeSlot: '10:00 - 11:00', taskName: 'Find ideas for create video', scheduleType: 'Schedule' },
  { id: '4', timeSlot: '11:00 - 12:00', taskName: 'Find element for design', scheduleType: 'Schedule' },
  { id: '5', timeSlot: '12:00 - 13:00', taskName: 'Lunch Break & Rest', scheduleType: 'Schedule' },
  { id: '6', timeSlot: '13:00 - 14:00', taskName: 'Design poster', scheduleType: 'Schedule' },
  { id: '7', timeSlot: '14:00 - 15:00', taskName: 'Take video', scheduleType: 'Schedule' },
  { id: '8', timeSlot: '15:00 - 16:00', taskName: 'Edit video', scheduleType: 'Schedule' },
  { id: '9', timeSlot: '16:00 - 17:00', taskName: 'Post page', scheduleType: 'Schedule' },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  employeeName: 'ROTH DARO',
  department: 'Operations & Platform Management',
  supervisorName: 'Operations Lead',
  companyName: 'Operations Enterprise',
  companyLogoUrl: '',
  cloudinaryCloudName: 'dismpss5e',
  cloudinaryUploadPreset: 'REPORT',
  cloudinaryApiKey: '335545523274868',
  cloudinaryApiSecret: 'TMe5NO5FXq9H54J7O_XhBNex9AM',
  offDays: [1], // Monday is Holiday
  autoSyncGoogleSheets: false,
  language: 'en',
};

/**
 * Creates a brand new DayReport for dateStr (YYYY-MM-DD)
 */
export function createNewDayReport(dateStr: string, template: DefaultTimeSlotTemplate[], userProfile?: UserProfile): DayReport {
  const { dayOfWeek } = formatFullDateHeader(dateStr);
  const isHoliday = isMondayOrOffDay(dateStr, userProfile?.offDays ?? [1]);

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayIndex = new Date(y, m - 1, d).getDay(); // 0=Sun, 1=Mon, 2=Tue...

  // Filter templates matching this day
  const applicableTemplates = template.filter((item) => {
    const scope = item.applicableScope || 'all';
    if (scope === 'specific_date') {
      return item.specificDate === dateStr;
    }
    if (scope === 'specific_days') {
      return Array.isArray(item.daysOfWeek) && item.daysOfWeek.includes(dayIndex);
    }
    return true; // 'all'
  });

  return {
    date: dateStr,
    dayOfWeek,
    isHoliday,
    holidayReason: isHoliday ? `${dayOfWeek} Holiday (Weekly Off)` : undefined,
    lastUpdated: new Date().toISOString(),
    tasks: isHoliday
      ? []
      : applicableTemplates.map((item) => ({
          id: `${dateStr}_${item.id}_${Math.random().toString(36).substr(2, 4)}`,
          timeSlot: item.timeSlot,
          taskName: item.taskName,
          scheduleType: item.scheduleType || 'Schedule',
          isCompleted: false,
          completedAt: undefined,
          notes: '',
          applicableScope: item.applicableScope || 'all',
          daysOfWeek: item.daysOfWeek,
          specificDate: item.specificDate,
        })),
  };
}

/**
 * Generate fresh clean report for today without mock history
 */
export function getInitialFreshReports(template: DefaultTimeSlotTemplate[], userProfile: UserProfile): Record<string, DayReport> {
  const reports: Record<string, DayReport> = {};
  const todayKey = formatDateKey(new Date());
  reports[todayKey] = createNewDayReport(todayKey, template, userProfile);
  return reports;
}

/**
 * Generates a completely new fresh state
 */
export function getFreshInitialState(customProfile?: Partial<UserProfile>): AppState {
  const defaultSchedule = [...INITIAL_DEFAULT_SCHEDULE];
  const userProfile: UserProfile = {
    ...INITIAL_USER_PROFILE,
    ...customProfile,
  };
  const reports = getInitialFreshReports(defaultSchedule, userProfile);

  return {
    reports,
    defaultSchedule,
    userProfile,
  };
}

/**
 * Load application state from localStorage
 */
export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.userProfile && parsed.defaultSchedule && parsed.reports) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load state from localStorage:', err);
  }

  // Fallback initial clean state
  const fresh = getFreshInitialState();
  saveAppState(fresh);
  return fresh;
}

/**
 * Completely reset localStorage and return clean state
 */
export function resetAppState(): AppState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to remove localStorage key:', err);
  }
  const fresh = getFreshInitialState();
  saveAppState(fresh);
  return fresh;
}

/**
 * Save state to localStorage
 */
export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
  }
}
