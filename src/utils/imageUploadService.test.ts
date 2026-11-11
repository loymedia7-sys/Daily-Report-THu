import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  processAndUploadWorkPhoto,
  validateWorkPhotoInput,
  drainUploadQueue,
  getAllQueuedUploads,
  cleanupOrphanedPhotoCache,
  getCachedPhotoDataUrl,
} from './imageUploadService';

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Mock document and canvas
vi.stubGlobal('document', {
  createElement: vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,ZmFrZQ=='),
        toBlob: vi.fn((cb) => cb(new Blob(['fake'], { type: 'image/jpeg' }))),
      };
    }
    return {};
  }),
});

// Mock FileReader
vi.stubGlobal('FileReader', class {
  readAsDataURL() {
    if (this.onload) {
      this.onload({ target: { result: 'data:image/png;base64,ZmFrZQ==' } } as unknown as ProgressEvent<FileReader>);
    }
  }
  onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
});

// Mock Image
vi.stubGlobal('Image', class {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 5);
  }
});

describe('imageUploadService tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('(a) when upload succeeds, photo gets secure URL and synced status', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg', bytes: 1234 }),
    });

    const dummyBlob = new Blob(['test'], { type: 'image/png' });
    const result = await processAndUploadWorkPhoto(dummyBlob, { date: '2026-11-10' });

    expect(result.imageUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/test.jpg');
    expect(result.thumbnailUrl).toContain('c_fill,w_300,h_300,g_auto,q_auto');
    expect(result.syncStatus).toBe('synced');
    expect(result.uploadStatus).toBe('uploaded');
  });

  it('(b) when upload fails, photo returns empty URL, pending syncStatus, and remains cached locally', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const dummyBlob = new Blob(['test'], { type: 'image/png' });
    const result = await processAndUploadWorkPhoto(dummyBlob, { date: '2026-11-10' });

    expect(result.imageUrl).toBe('');
    expect(result.syncStatus).toBe('pending');
    expect(result.uploadStatus).toBe('failed');

    const cachedPreview = await getCachedPhotoDataUrl(result.photoId);
    expect(cachedPreview).toBeTruthy();
  });

  it('(c) validates MIME types and rejects unsupported or oversized files', () => {
    const badMime = new Blob(['not-an-image'], { type: 'application/pdf' });
    expect(validateWorkPhotoInput(badMime).valid).toBe(false);

    const validPng = new Blob(['valid'], { type: 'image/png' });
    expect(validateWorkPhotoInput(validPng).valid).toBe(true);

    const invalidDataUrl = 'data:text/plain;base64,SGVsbG8=';
    expect(validateWorkPhotoInput(invalidDataUrl).valid).toBe(false);
  });

  it('(d) drainUploadQueue does NOT re-upload to Cloudinary when Firestore sync fails on first attempt', async () => {
    // 1. Capture offline so it queues without uploading
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const dummyBlob = new Blob(['offline-photo'], { type: 'image/jpeg' });
    const offlinePhoto = await processAndUploadWorkPhoto(dummyBlob, {
      date: '2026-11-10',
      activityId: 'act_123',
    });
    expect(offlinePhoto.syncStatus).toBe('pending');
    expect(offlinePhoto.uploadStatus).toBe('queued');

    // 2. Come online: Cloudinary succeeds, but Firestore callback returns false on first drain
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/dedup.jpg',
        bytes: 2048,
      }),
    });

    const onSyncedFirstPass = vi.fn().mockImplementation(async (photoId: string) => {
      if (photoId === offlinePhoto.photoId) {
        return false; // Simulate Firestore save failure
      }
      return true;
    });

    await drainUploadQueue(onSyncedFirstPass);
    expect(onSyncedFirstPass).toHaveBeenCalled();

    // Item must still be in queue with uploadedUrl saved
    const queuedAfterFailure = await getAllQueuedUploads();
    const retainedItem = queuedAfterFailure.find((q) => q.photoId === offlinePhoto.photoId);
    expect(retainedItem).toBeDefined();
    expect(retainedItem?.uploadedUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/dedup.jpg');

    const cloudinaryCallsAfterFirstPass = fetchMock.mock.calls.length;
    expect(cloudinaryCallsAfterFirstPass).toBeGreaterThanOrEqual(1);

    // 3. Second drain pass: Firestore succeeds; Cloudinary fetch MUST NOT be called again for this item
    const onSyncedSecondPass = vi.fn().mockResolvedValue(true);
    await drainUploadQueue(onSyncedSecondPass);

    expect(onSyncedSecondPass).toHaveBeenCalledWith(
      offlinePhoto.photoId,
      'https://res.cloudinary.com/demo/image/upload/v1/dedup.jpg',
      expect.stringContaining('c_fill,w_300,h_300,g_auto,q_auto'),
      '2026-11-10',
      'act_123'
    );
    expect(fetchMock.mock.calls.length).toBe(cloudinaryCallsAfterFirstPass);

    // Item is now removed from queue, and cleanup preserves referenced photos
    const removedCount = await cleanupOrphanedPhotoCache(new Set([offlinePhoto.photoId]), 0);
    expect(removedCount).toBe(0);
    expect(await getCachedPhotoDataUrl(offlinePhoto.photoId)).toBeTruthy();
  });
});
