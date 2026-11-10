import { WorkActivity, WorkActivityPhoto, WorkCategory, ActivityStatus } from '../types/workReport';
import { DayReport } from '../types';

export function createNewWorkActivity(
  date: string,
  employeeName: string,
  initialData?: Partial<WorkActivity>
): WorkActivity {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const nextHour = String((now.getHours() + 1) % 24).padStart(2, '0');

  const cat = initialData?.workCategory || initialData?.category || 'Design Poster';
  const actTitle = initialData?.activityTitle || initialData?.title || (cat || 'Work Record');

  return {
    id: initialData?.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    reportDate: date,
    date,
    employeeId: initialData?.employeeId || 'EMP-001',
    employeeName,
    imageUrl: initialData?.imageUrl || '',
    thumbnailUrl: initialData?.thumbnailUrl || '',
    workCategory: initialData?.workCategory !== undefined ? initialData.workCategory : (cat || null),
    category: cat || 'Other',
    activityTitle: actTitle,
    title: actTitle,
    description: initialData?.description || '',
    startTime: initialData?.startTime || `${hours}:${minutes}`,
    endTime: initialData?.endTime || `${nextHour}:${minutes}`,
    status: initialData?.status || 'completed',
    photos: initialData?.photos || [],
    capturedAt: initialData?.capturedAt || now.toISOString(),
    createdTimestamp: Date.now(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Calculates total photos across all activities in a day report
 */
export function countEvidencePhotosInReport(report: DayReport): number {
  if (!report.activities || !Array.isArray(report.activities)) return 0;
  return report.activities.reduce((sum, act) => {
    const photoCount = act.photos && act.photos.length > 0 ? act.photos.length : (act.imageUrl ? 1 : 0);
    return sum + photoCount;
  }, 0);
}

/**
 * Calculates completed vs total activities
 */
export function calculateActivityStats(report: DayReport): {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  delayed: number;
  completionRate: number;
} {
  const activities = report.activities || [];
  const total = activities.length;
  const completed = activities.filter((a) => a.status === 'completed').length;
  const inProgress = activities.filter((a) => a.status === 'in_progress').length;
  const pending = activities.filter((a) => a.status === 'pending').length;
  const delayed = activities.filter((a) => a.status === 'delayed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    delayed,
    completionRate,
  };
}

/**
 * Draft autosave storage keys
 */
const ACTIVITY_DRAFT_KEY_PREFIX = 'tivhuor_activity_draft_';

export function saveActivityDraft(date: string, draft: Partial<WorkActivity>): void {
  try {
    localStorage.setItem(`${ACTIVITY_DRAFT_KEY_PREFIX}${date}`, JSON.stringify(draft));
  } catch {
    // Ignore storage quota
  }
}

export function loadActivityDraft(date: string): Partial<WorkActivity> | null {
  try {
    const raw = localStorage.getItem(`${ACTIVITY_DRAFT_KEY_PREFIX}${date}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActivityDraft(date: string): void {
  try {
    localStorage.removeItem(`${ACTIVITY_DRAFT_KEY_PREFIX}${date}`);
  } catch {
    // Ignore
  }
}
