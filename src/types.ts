export type TaskScope = 'today' | 'all' | 'specific_days' | 'specific_date';

export type TaskStatus = 'completed' | 'crossed' | 'pending';

export interface PresetActivity {
  id: string;
  name: string;
  category?: string;
  colorClass?: string;
}

export const PRESET_ACTIVITIES: PresetActivity[] = [
  { id: 'check_platform', name: 'Check Platform(all)view & Engagement', category: 'Operations', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { id: 'post_platform', name: 'Post on Platform', category: 'Marketing', colorClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { id: 'design_video_poster', name: 'Design(Video or poster)', category: 'Design', colorClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { id: 'search_elements', name: 'Sreach Elements', category: 'Design', colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
  { id: 'fb_chat', name: 'Reply chat customer on Facebook page', category: 'Support', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  { id: 'video_ideas', name: 'Find ideas for create video', category: 'Creative', colorClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { id: 'edit_video', name: 'Edit video', category: 'Video', colorClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  { id: 'take_video', name: 'Take video', category: 'Video', colorClass: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
];

export interface ScheduleTask {
  id: string;
  timeSlot: string; // e.g. "08:00 - 09:00" or "08-09"
  taskName: string; // e.g. "Check Platform(all)view & Engagement"
  scheduleType?: string; // e.g. "Schedule" or "Over Time"
  isOvertime?: boolean; // true if Over Time slot
  isCompleted: boolean;
  status?: TaskStatus; // 'completed' (✓), 'crossed' (✗), 'pending'
  crossReason?: string; // Reason why user crossed / incomplete / delayed
  other?: string; // Other remarks / details
  completedAt?: string; // ISO string or formatted "08:14:22 AM"
  notes?: string; // Detail / remark on what was done
  applicableScope?: TaskScope;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  specificDate?: string; // "YYYY-MM-DD"
}

export interface WorkSession {
  id: string;
  checkInTime: string; // e.g. "08:00 AM" or "08:00"
  checkInTimestamp: number;
  checkOutTime?: string; // e.g. "17:00 PM" or "17:00"
  checkOutTimestamp?: number;
  durationMinutes?: number;
  type?: 'regular' | 'overtime';
  notes?: string;
}

import { WorkActivity, WorkActivityPhoto, WorkCategory, WORK_CATEGORIES, ActivityStatus, MainNavView } from './types/workReport';
export * from './types/workReport';

export interface DayReport {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  isHoliday: boolean;
  holidayReason?: string;
  // Permission & Attendance Support
  isPermission?: boolean; // true if user requested Permission (P) / Sick / Absent
  permissionType?: string; // e.g. "P", "Sick Leave", "Personal", "Absent"
  permissionReason?: string; // e.g. "(sick can go need to rest and sleep)"
  isAbsent?: boolean; // true if not checked in & marked absent
  absentReason?: string;
  tasks: ScheduleTask[];
  // Upgraded Daily Activities with Work Evidence Photographs
  activities?: WorkActivity[];
  notes?: string;
  lastUpdated: string;
  isDoneForToday?: boolean;
  doneAt?: string; // Formatted timestamp when marked done for today
  // Check-in and Check-out Time Tracking
  workSessions?: WorkSession[];
  isCheckedIn?: boolean;
  currentCheckInTime?: string;
  currentCheckInTimestamp?: number;
  totalWorkedMinutes?: number;
}

export interface DefaultTimeSlotTemplate {
  id: string;
  timeSlot: string;
  taskName: string;
  scheduleType: string; // Default: "Schedule" or "Over Time"
  isOvertime?: boolean;
  applicableScope?: TaskScope; // 'all' (default), 'specific_days', or 'specific_date'
  daysOfWeek?: number[]; // [1, 2, 3, 4, 5] etc.
  specificDate?: string; // "YYYY-MM-DD"
}

export type Language = 'en' | 'km';

export interface UserProfile {
  employeeId?: string;
  employeeName: string;
  department: string;
  supervisorName: string;
  companyName?: string; // Company or Organization name
  companyLogoUrl?: string; // Cloudinary or persistent image URL
  cloudinaryCloudName?: string; // Custom Cloudinary Cloud Name
  cloudinaryUploadPreset?: string; // Custom Cloudinary Upload Preset (Unsigned)
  offDays: number[]; // 1 = Monday, 0 = Sunday, etc. Default [1] (Monday)
  googleSheetWebAppUrl?: string;
  googleSheetUrl?: string; // Direct Google Sheets document URL
  autoSyncGoogleSheets?: boolean;
  language?: Language;
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AppState {
  reports: Record<string, DayReport>; // Keyed by YYYY-MM-DD
  defaultSchedule: DefaultTimeSlotTemplate[];
  userProfile: UserProfile;
}
