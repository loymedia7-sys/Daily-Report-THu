import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mergeCloudAndLocalReports,
  enqueuePendingReportSync,
  removePendingReportSync,
  loadPendingCloudSyncQueue,
  clearAllPendingCloudSync,
  hasPendingCloudSync,
  saveDayReportToFirestore,
  saveUserProfileToFirestore,
  saveTemplatesToFirestore,
  resetAllFirestoreUserData,
} from './firestoreService';
import { DayReport } from '../types';
import { INITIAL_USER_PROFILE, INITIAL_DEFAULT_SCHEDULE, getFreshInitialState } from './storage';

// Provide an in-memory localStorage mock for node test environment
const memoryStore: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key: string, val: string) => {
    memoryStore[key] = val;
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  },
  clear: () => {
    for (const k of Object.keys(memoryStore)) delete memoryStore[k];
  },
});

describe('firestoreService synchronization & conflict resolution', () => {
  beforeEach(() => {
    for (const k of Object.keys(memoryStore)) delete memoryStore[k];
    clearAllPendingCloudSync();
  });

  it('mergeCloudAndLocalReports never overwrites newer local changes with older cloud snapshots', () => {
    const localReports: Record<string, DayReport> = {
      '2026-11-10': {
        date: '2026-11-10',
        dayOfWeek: 'Tuesday',
        isHoliday: false,
        lastUpdated: '2026-11-10T12:00:00.000Z',
        tasks: [{ id: 't1', timeSlot: '08:00 - 09:00', taskName: 'Local Updated Task', isCompleted: true }],
      },
    };

    const olderCloudReports: Record<string, DayReport> = {
      '2026-11-10': {
        date: '2026-11-10',
        dayOfWeek: 'Tuesday',
        isHoliday: false,
        lastUpdated: '2026-11-10T10:00:00.000Z',
        tasks: [{ id: 't1', timeSlot: '08:00 - 09:00', taskName: 'Stale Cloud Task', isCompleted: false }],
      },
    };

    const { merged, changed } = mergeCloudAndLocalReports(localReports, olderCloudReports, new Set());
    expect(changed).toBe(false);
    expect(merged['2026-11-10'].tasks[0].taskName).toBe('Local Updated Task');
    expect(merged['2026-11-10'].tasks[0].isCompleted).toBe(true);
  });

  it('mergeCloudAndLocalReports updates from newer cloud snapshot while preserving pending offline photos', () => {
    const localReports: Record<string, DayReport> = {
      '2026-11-10': {
        date: '2026-11-10',
        dayOfWeek: 'Tuesday',
        isHoliday: false,
        lastUpdated: '2026-11-10T10:00:00.000Z',
        tasks: [],
        activities: [
          {
            id: 'act1',
            reportDate: '2026-11-10',
            date: '2026-11-10',
            employeeId: 'EMP-001',
            employeeName: 'ROTH DARO',
            imageUrl: '',
            thumbnailUrl: '',
            workCategory: 'Design Poster',
            category: 'Design Poster',
            activityTitle: 'Design Poster',
            title: 'Design Poster',
            description: 'Old desc',
            capturedAt: '2026-11-10T10:00:00.000Z',
            createdAt: '2026-11-10T10:00:00.000Z',
            createdTimestamp: 1000,
            status: 'completed',
            photos: [
              {
                photoId: 'pending_photo_1',
                imageUrl: '',
                capturedAt: '2026-11-10T10:00:00.000Z',
                uploadedAt: '2026-11-10T10:00:00.000Z',
                syncStatus: 'pending',
              },
            ],
          },
        ],
      },
    };

    const newerCloudReports: Record<string, DayReport> = {
      '2026-11-10': {
        date: '2026-11-10',
        dayOfWeek: 'Tuesday',
        isHoliday: false,
        lastUpdated: '2026-11-10T14:00:00.000Z',
        tasks: [],
        activities: [
          {
            id: 'act1',
            reportDate: '2026-11-10',
            date: '2026-11-10',
            employeeId: 'EMP-001',
            employeeName: 'ROTH DARO',
            imageUrl: 'https://res.cloudinary.com/xivrejrq/image/upload/cloud.jpg',
            thumbnailUrl: 'https://res.cloudinary.com/xivrejrq/image/upload/cloud_thumb.jpg',
            workCategory: 'Design Poster',
            category: 'Design Poster',
            activityTitle: 'Design Poster',
            title: 'Design Poster',
            description: 'Newer cloud description',
            capturedAt: '2026-11-10T10:00:00.000Z',
            createdAt: '2026-11-10T10:00:00.000Z',
            createdTimestamp: 1000,
            status: 'completed',
            photos: [],
          },
        ],
      },
    };

    const { merged, changed } = mergeCloudAndLocalReports(localReports, newerCloudReports, new Set());
    expect(changed).toBe(true);
    expect(merged['2026-11-10'].activities?.[0].description).toBe('Newer cloud description');
    expect(merged['2026-11-10'].activities?.[0].photos.some((p) => p.photoId === 'pending_photo_1')).toBe(true);
  });

  it('removePendingReportSync preserves newer rapid local edits made while an older save was in-flight', () => {
    const reportV1: DayReport = {
      date: '2026-11-10',
      dayOfWeek: 'Tuesday',
      isHoliday: false,
      lastUpdated: '2026-11-10T10:00:00.000Z',
      tasks: [],
    };
    enqueuePendingReportSync(reportV1);
    expect(hasPendingCloudSync()).toBe(true);

    // Simulate rapid second edit before first network save finishes
    const reportV2: DayReport = {
      ...reportV1,
      lastUpdated: '2026-11-10T10:00:05.000Z',
    };
    enqueuePendingReportSync(reportV2);

    // First network save finishes and tries to clear using V1's timestamp
    removePendingReportSync('2026-11-10', reportV1.lastUpdated);
    const queueAfterV1 = loadPendingCloudSyncQueue();
    expect(queueAfterV1.reports['2026-11-10']?.lastUpdated).toBe(reportV2.lastUpdated);

    // Second network save finishes and clears V2
    removePendingReportSync('2026-11-10', reportV2.lastUpdated);
    expect(hasPendingCloudSync()).toBe(false);
  });

  it('save functions return structured failure results and queue writes when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    const profileRes = await saveUserProfileToFirestore('user_1', INITIAL_USER_PROFILE);
    expect(profileRes.success).toBe(false);
    expect(profileRes.code).toBe('offline');

    const tplRes = await saveTemplatesToFirestore('user_1', INITIAL_DEFAULT_SCHEDULE);
    expect(tplRes.success).toBe(false);
    expect(tplRes.code).toBe('offline');

    const report: DayReport = {
      date: '2026-11-10',
      dayOfWeek: 'Tuesday',
      isHoliday: false,
      lastUpdated: '2026-11-10T12:00:00.000Z',
      tasks: [],
    };
    const repRes = await saveDayReportToFirestore('user_1', report);
    expect(repRes.success).toBe(false);
    expect(repRes.code).toBe('offline');

    // Verify all 3 items are safely queued in PendingCloudSyncQueue
    const queue = loadPendingCloudSyncQueue();
    expect(queue.userProfile?.employeeName).toBe(INITIAL_USER_PROFILE.employeeName);
    expect(queue.templates?.length).toBe(INITIAL_DEFAULT_SCHEDULE.length);
    expect(queue.reports['2026-11-10']?.date).toBe('2026-11-10');

    // Verify resetAllFirestoreUserData does not claim success when offline
    const resetRes = await resetAllFirestoreUserData('user_1', getFreshInitialState());
    expect(resetRes.success).toBe(false);
    expect(resetRes.code).toBe('offline');

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});
