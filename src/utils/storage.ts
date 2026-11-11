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

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, normalizeCloudinaryConfig } from '../config/cloudinary';

export const INITIAL_USER_PROFILE: UserProfile = {
  employeeId: 'EMP-001',
  employeeName: 'ROTH DARO',
  department: 'Operations & Platform Management',
  supervisorName: 'Operations Lead',
  companyName: 'Operations Enterprise',
  companyLogoUrl: '',
  cloudinaryCloudName: CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: CLOUDINARY_UPLOAD_PRESET,
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
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.userProfile && parsed.defaultSchedule && parsed.reports) {
        const normalizedCloudinary = normalizeCloudinaryConfig(
          parsed.userProfile.cloudinaryCloudName,
          parsed.userProfile.cloudinaryUploadPreset
        );
        parsed.userProfile = {
          ...INITIAL_USER_PROFILE,
          ...parsed.userProfile,
          employeeId: parsed.userProfile.employeeId || INITIAL_USER_PROFILE.employeeId,
          cloudinaryCloudName: normalizedCloudinary.cloudName,
          cloudinaryUploadPreset: normalizedCloudinary.uploadPreset,
        };
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
export function saveAppState(state: AppState): boolean {
  try {
    const serialized = JSON.stringify(state);
    const sizeBytes = new TextEncoder().encode(serialized).length;
    const FIVE_MB = 5 * 1024 * 1024;
    if (sizeBytes > FIVE_MB) {
      console.warn(`[WARNING] AppState payload size (${Math.round(sizeBytes / 1024 / 1024 * 100) / 100} MB) exceeds localStorage ~5MB limit! Base64 photos may cause storage failure.`);
    }
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
    return false;
  }
}

/**
 * Strips any data:image strings from imageUrl, thumbnailUrl, and localDataUrl without mutating input object
 */
export function stripInlineImages<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = JSON.parse(JSON.stringify(obj)) as T;

  function clean(item: unknown) {
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item)) {
      for (const el of item) clean(el);
      return;
    }
    const record = item as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const val = record[key];
      if (typeof val === 'string' && val.startsWith('data:')) {
        if (key === 'imageUrl' || key === 'thumbnailUrl' || key === 'localDataUrl') {
          record[key] = '';
        }
      } else if (typeof val === 'object') {
        clean(val);
      }
    }
  }

  clean(clone);
  return clone;
}

export function stripReportImages(report: DayReport): DayReport {
  return stripInlineImages(report);
}

