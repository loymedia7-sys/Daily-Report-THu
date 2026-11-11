import { describe, it, expect } from 'vitest';
import { stripInlineImages, stripReportImages } from './storage';
import { DayReport } from '../types';

describe('storage utility functions', () => {
  it('stripInlineImages removes data: URLs from image fields without mutating input', () => {
    const report: DayReport = {
      date: '2026-11-10',
      dayOfWeek: 'Tuesday',
      isHoliday: false,
      lastUpdated: 'now',
      tasks: [],
      activities: [
        {
          id: 'a1',
          reportDate: '2026-11-10',
          date: '2026-11-10',
          employeeId: 'emp1',
          employeeName: 'Test',
          imageUrl: 'data:image/png;base64,ABC123xyz',
          thumbnailUrl: 'data:image/jpeg;base64,DEF456uvw',
          workCategory: 'Design Poster',
          category: 'Design Poster',
          activityTitle: 'Title',
          title: 'Title',
          description: 'Desc',
          capturedAt: 'now',
          createdAt: 'now',
          createdTimestamp: Date.now(),
          status: 'completed',
          photos: [
            {
              photoId: 'p1',
              imageUrl: '',
              capturedAt: 'now',
              uploadedAt: 'now',
              localDataUrl: 'data:image/png;base64,PHOTO123',
              syncStatus: 'pending',
            },
          ],
        },
      ],
    };

    const originalReportCopy = JSON.parse(JSON.stringify(report));
    const cleaned = stripInlineImages(report);

    // Verify input object was not mutated
    expect(report).toEqual(originalReportCopy);

    // Verify data URLs are stripped in cleaned result
    expect(cleaned.activities?.[0].imageUrl).toBe('');
    expect(cleaned.activities?.[0].thumbnailUrl).toBe('');
    expect(cleaned.activities?.[0].photos?.[0].localDataUrl).toBe('');

    // Verify photoId and syncStatus are preserved
    expect(cleaned.activities?.[0].photos?.[0].photoId).toBe('p1');
    expect(cleaned.activities?.[0].photos?.[0].syncStatus).toBe('pending');
  });

  it('stripReportImages works identically', () => {
    const report: DayReport = {
      date: '2026-11-10',
      dayOfWeek: 'Tuesday',
      isHoliday: false,
      lastUpdated: 'now',
      tasks: [],
      activities: [
        {
          id: 'a2',
          reportDate: '2026-11-10',
          date: '2026-11-10',
          employeeId: 'emp1',
          employeeName: 'Test',
          imageUrl: 'data:image/png;base64,test',
          thumbnailUrl: '',
          workCategory: 'Other',
          category: 'Other',
          activityTitle: 'Title',
          title: 'Title',
          description: 'Desc',
          capturedAt: 'now',
          createdAt: 'now',
          createdTimestamp: Date.now(),
          status: 'completed',
          photos: [],
        },
      ],
    };

    const cleaned = stripReportImages(report);
    expect(cleaned.activities?.[0].imageUrl).toBe('');
  });

  it('INITIAL_USER_PROFILE includes employeeId and Cloudinary xivrejrq / daily-report defaults', async () => {
    const { INITIAL_USER_PROFILE } = await import('./storage');
    expect(INITIAL_USER_PROFILE.employeeId).toBe('EMP-001');
    expect(INITIAL_USER_PROFILE.cloudinaryCloudName).toBe('xivrejrq');
    expect(INITIAL_USER_PROFILE.cloudinaryUploadPreset).toBe('daily-report');
  });

  it('normalizeCloudinaryConfig migrates legacy dismpss5e and REPORT to xivrejrq and daily-report', async () => {
    const { normalizeCloudinaryConfig } = await import('../config/cloudinary');
    expect(normalizeCloudinaryConfig('dismpss5e', 'REPORT')).toEqual({
      cloudName: 'xivrejrq',
      uploadPreset: 'daily-report',
    });
    expect(normalizeCloudinaryConfig('', '')).toEqual({
      cloudName: 'xivrejrq',
      uploadPreset: 'daily-report',
    });
    expect(normalizeCloudinaryConfig('xivrejrq', 'daily-report')).toEqual({
      cloudName: 'xivrejrq',
      uploadPreset: 'daily-report',
    });
  });
});

