import { WorkActivityPhoto } from '../types/workReport';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, normalizeCloudinaryConfig } from '../config/cloudinary';

export const DEFAULT_CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
export const DEFAULT_CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET;

export const MAX_UPLOAD_RETRIES = 5;
export const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB max raw file
const STALE_UPLOADING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/bmp',
]);

/**
 * Validates image file/blob/dataURL type and size before processing
 */
export function validateWorkPhotoInput(
  imageSource: File | Blob | string
): { valid: boolean; error?: string } {
  if (!imageSource) {
    return { valid: false, error: 'No image data provided.' };
  }

  if (typeof imageSource === 'string') {
    const trimmed = imageSource.trim();
    if (!trimmed) {
      return { valid: false, error: 'Empty image source string.' };
    }
    if (trimmed.startsWith('data:')) {
      const mimeMatch = /^data:([^;,]+)[;,]/.exec(trimmed);
      const mime = mimeMatch ? mimeMatch[1].toLowerCase() : '';
      if (mime && !mime.startsWith('image/')) {
        return { valid: false, error: `Unsupported file format (${mime}). Please select an image file.` };
      }
      // Approximate byte size of base64 payload
      const base64Idx = trimmed.indexOf(',');
      if (base64Idx !== -1) {
        const approxBytes = Math.floor(((trimmed.length - base64Idx - 1) * 3) / 4);
        if (approxBytes > MAX_IMAGE_FILE_SIZE_BYTES) {
          return {
            valid: false,
            error: `Image size (${Math.round(approxBytes / 1024 / 1024)} MB) exceeds the 15 MB maximum limit.`,
          };
        }
      }
    }
    return { valid: true };
  }

  if (imageSource.size === 0) {
    return { valid: false, error: 'Selected image file is empty (0 bytes).' };
  }

  if (imageSource.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image file size (${Math.round((imageSource.size / 1024 / 1024) * 10) / 10} MB) exceeds the 15 MB limit.`,
    };
  }

  const mimeType = (imageSource.type || '').toLowerCase();
  if (mimeType && !SUPPORTED_IMAGE_MIME_TYPES.has(mimeType) && !mimeType.startsWith('image/')) {
    return {
      valid: false,
      error: `Unsupported image format "${mimeType}". Please use JPG, PNG, WebP, or HEIC.`,
    };
  }

  return { valid: true };
}

/**
 * Resizes and compresses an image (File or Blob or DataURL) on canvas.
 * Produces crisp high-definition images (~200KB-400KB) plus a fast local thumbnail.
 */
export async function compressWorkPhoto(
  imageSource: File | Blob | string,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.85
): Promise<{
  dataUrl: string;
  thumbnailDataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
}> {
  const validation = validateWorkPhotoInput(imageSource);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image input');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width || 1280;
      let height = img.height || 720;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Generate lightweight thumbnail (max 320px) for fast local preview
      let thumbnailDataUrl = dataUrl;
      try {
        const thumbMax = 320;
        let thumbW = width;
        let thumbH = height;
        if (thumbW > thumbH) {
          if (thumbW > thumbMax) {
            thumbH = Math.round((thumbH * thumbMax) / thumbW);
            thumbW = thumbMax;
          }
        } else if (thumbH > thumbMax) {
          thumbW = Math.round((thumbW * thumbMax) / thumbH);
          thumbH = thumbMax;
        }
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbW;
        thumbCanvas.height = thumbH;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.imageSmoothingEnabled = true;
          thumbCtx.imageSmoothingQuality = 'medium';
          thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
          thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.75);
        }
      } catch {
        thumbnailDataUrl = dataUrl;
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate compressed image blob'));
            return;
          }
          resolve({
            dataUrl,
            thumbnailDataUrl,
            blob,
            width,
            height,
            sizeBytes: blob.size,
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (e) => reject(new Error('Failed to load image for compression: ' + String(e)));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(imageSource);
    }
  });
}

// ==========================================
// IndexedDB + In-Memory Fallback for Offline Photo Queue & Cache
// ==========================================

const DB_NAME = 'TivHuorReportDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'photo_upload_queue';
const CACHE_STORE = 'photo_cache';

export interface QueuedUploadItem {
  photoId: string;
  activityId?: string;
  date: string;
  blob: Blob;
  dataUrl: string;
  thumbnailDataUrl?: string;
  description: string;
  capturedAt: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'synced' | 'failed';
  error?: string;
  retryCount: number;
  lastAttemptAt?: string;
  uploadedUrl?: string;
  thumbnailUrl?: string;
  cloudName?: string;
  uploadPreset?: string;
}

interface CachedPhotoEntry {
  photoId: string;
  dataUrl: string;
  thumbnailDataUrl?: string;
  capturedAt: string;
  date: string;
}

// Session fallback caches so previews and queue work even if IndexedDB is restricted
const memoryQueueStore = new Map<string, QueuedUploadItem>();
const memoryCacheStore = new Map<string, CachedPhotoEntry>();

// Concurrency locks to prevent duplicate simultaneous uploads
let isDrainingQueue = false;
let pendingFollowUpDrain = false;
const inFlightPhotoIds = new Set<string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'photoId' });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'photoId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Persists a photo item to both the upload queue and local preview cache in IndexedDB.
 * Returns structured persistence status and never silently discards data.
 */
export async function savePhotoToIndexedDBQueue(
  item: QueuedUploadItem
): Promise<{ persistedToIndexedDB: boolean; error?: string }> {
  const cacheEntry: CachedPhotoEntry = {
    photoId: item.photoId,
    dataUrl: item.dataUrl,
    thumbnailDataUrl: item.thumbnailDataUrl || item.dataUrl,
    capturedAt: item.capturedAt,
    date: item.date,
  };

  // Always update in-memory session stores immediately
  memoryQueueStore.set(item.photoId, { ...item });
  memoryCacheStore.set(item.photoId, cacheEntry);

  try {
    const db = await openDB();
    const tx = db.transaction([QUEUE_STORE, CACHE_STORE], 'readwrite');
    tx.objectStore(QUEUE_STORE).put(item);
    tx.objectStore(CACHE_STORE).put(cacheEntry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
    return { persistedToIndexedDB: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('Could not save to IndexedDB queue:', err);
    return { persistedToIndexedDB: false, error: errMsg };
  }
}

export async function getCachedPhotoDataUrl(photoId: string): Promise<string | null> {
  if (!photoId) return null;

  const memCached = memoryCacheStore.get(photoId);
  if (memCached?.dataUrl) {
    return memCached.dataUrl;
  }
  const memQueued = memoryQueueStore.get(photoId);
  if (memQueued?.dataUrl) {
    return memQueued.dataUrl;
  }

  try {
    const db = await openDB();
    const tx = db.transaction([CACHE_STORE, QUEUE_STORE], 'readonly');
    const cacheStore = tx.objectStore(CACHE_STORE);
    const queueStore = tx.objectStore(QUEUE_STORE);

    return await new Promise<string | null>((resolve) => {
      const cacheReq = cacheStore.get(photoId);
      cacheReq.onsuccess = () => {
        if (cacheReq.result && cacheReq.result.dataUrl) {
          memoryCacheStore.set(photoId, cacheReq.result as CachedPhotoEntry);
          resolve(cacheReq.result.dataUrl as string);
          return;
        }
        const queueReq = queueStore.get(photoId);
        queueReq.onsuccess = () => {
          if (queueReq.result && queueReq.result.dataUrl) {
            resolve(queueReq.result.dataUrl as string);
          } else {
            resolve(null);
          }
        };
        queueReq.onerror = () => resolve(null);
      };
      cacheReq.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllQueuedUploads(): Promise<QueuedUploadItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    const idbItems = await new Promise<QueuedUploadItem[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as QueuedUploadItem[]) || []);
      req.onerror = () => resolve([]);
    });

    const combined = new Map<string, QueuedUploadItem>();
    for (const item of idbItems) {
      combined.set(item.photoId, item);
      memoryQueueStore.set(item.photoId, item);
    }
    for (const [id, memItem] of memoryQueueStore.entries()) {
      if (!combined.has(id)) {
        combined.set(id, memItem);
      }
    }
    return Array.from(combined.values());
  } catch {
    return Array.from(memoryQueueStore.values());
  }
}

export async function removeQueuedUpload(photoId: string): Promise<boolean> {
  memoryQueueStore.delete(photoId);
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(photoId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch (err) {
    console.warn('Error removing from queue:', err);
    return false;
  }
}

/**
 * Safely removes orphaned cached photo previews that are:
 * 1. Not in the upload queue (already synced),
 * 2. Not referenced by any existing report, and
 * 3. Older than minAgeMs (default 24 hours).
 * Never deletes unsynchronized or referenced images.
 */
export async function cleanupOrphanedPhotoCache(
  referencedPhotoIds: Set<string>,
  minAgeMs: number = 24 * 60 * 60 * 1000
): Promise<number> {
  const now = Date.now();
  let removedCount = 0;

  try {
    const queuedItems = await getAllQueuedUploads();
    const queuedIds = new Set(queuedItems.map((q) => q.photoId));

    for (const [photoId, entry] of memoryCacheStore.entries()) {
      const capturedTime = Date.parse(entry.capturedAt || '') || 0;
      const isOldEnough = now - capturedTime > minAgeMs;
      if (!queuedIds.has(photoId) && !referencedPhotoIds.has(photoId) && isOldEnough) {
        memoryCacheStore.delete(photoId);
      }
    }

    const db = await openDB();
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    const store = tx.objectStore(CACHE_STORE);
    const allCached = await new Promise<CachedPhotoEntry[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as CachedPhotoEntry[]) || []);
      req.onerror = () => resolve([]);
    });

    for (const entry of allCached) {
      if (!entry || !entry.photoId) continue;
      if (queuedIds.has(entry.photoId)) continue;
      if (referencedPhotoIds.has(entry.photoId)) continue;

      const capturedTime = Date.parse(entry.capturedAt || '') || 0;
      if (now - capturedTime > minAgeMs) {
        store.delete(entry.photoId);
        removedCount++;
      }
    }

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore cleanup errors if IndexedDB is unavailable
  }

  return removedCount;
}

// ==========================================
// Cloudinary Unsigned Upload
// ==========================================

export async function uploadWorkPhotoToCloudinary(
  blob: Blob,
  config?: {
    cloudName?: string;
    uploadPreset?: string;
  }
): Promise<{ secureUrl: string; thumbnailUrl: string; bytes: number }> {
  const { cloudName, uploadPreset } = normalizeCloudinaryConfig(config?.cloudName, config?.uploadPreset);

  const formData = new FormData();
  formData.append('file', blob, `work_${Date.now()}.jpg`);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'tiv_huor_work_evidence');

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (
      response.status === 400 &&
      errorText.includes('Upload preset not found') &&
      uploadPreset !== 'ml_default'
    ) {
      console.warn(`[Cloudinary] Preset "${uploadPreset}" not found. Retrying with fallback "ml_default"...`);
      const fallbackFormData = new FormData();
      fallbackFormData.append('file', blob, `work_${Date.now()}.jpg`);
      fallbackFormData.append('upload_preset', 'ml_default');
      fallbackFormData.append('folder', 'tiv_huor_work_evidence');

      const fallbackResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        body: fallbackFormData,
      });

      if (fallbackResponse.ok) {
        const result = await fallbackResponse.json();
        const secureUrl = result.secure_url;
        let thumbnailUrl = secureUrl;
        if (secureUrl && secureUrl.includes('/image/upload/')) {
          thumbnailUrl = secureUrl.replace(
            '/image/upload/',
            '/image/upload/c_fill,w_300,h_300,g_auto,q_auto/'
          );
        }
        return {
          secureUrl,
          thumbnailUrl,
          bytes: result.bytes || blob.size,
        };
      }
    }

    console.error('[Cloudinary]', response.status, errorText);
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const secureUrl = result.secure_url;

  // Generate thumbnail URL via Cloudinary URL transformation
  let thumbnailUrl = secureUrl;
  if (secureUrl && secureUrl.includes('/image/upload/')) {
    thumbnailUrl = secureUrl.replace('/image/upload/', '/image/upload/c_fill,w_300,h_300,g_auto,q_auto/');
  }

  return {
    secureUrl,
    thumbnailUrl,
    bytes: result.bytes || blob.size,
  };
}

/**
 * High-level function to process a captured/selected work photo:
 * 1. Validate & compress image to high-quality HD + local thumbnail
 * 2. Persist compressed image to IndexedDB queue before attempting network upload
 * 3. Attempt Cloudinary upload (if online) with per-photo concurrency lock
 * 4. Return complete WorkActivityPhoto metadata
 */
export async function processAndUploadWorkPhoto(
  fileOrBlob: File | Blob | string,
  meta: {
    description?: string;
    capturedAt?: string;
    date: string;
    activityId?: string;
    cloudName?: string;
    uploadPreset?: string;
  }
): Promise<WorkActivityPhoto> {
  const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const capturedAt = meta.capturedAt || new Date().toISOString();

  // 1. Validate & Compress
  const compressed = await compressWorkPhoto(fileOrBlob, 1600, 1600, 0.85);

  const queuedItem: QueuedUploadItem = {
    photoId,
    activityId: meta.activityId,
    date: meta.date,
    blob: compressed.blob,
    dataUrl: compressed.dataUrl,
    thumbnailDataUrl: compressed.thumbnailDataUrl,
    description: meta.description || '',
    capturedAt,
    fileSize: compressed.sizeBytes,
    status: 'pending',
    retryCount: 0,
    cloudName: meta.cloudName,
    uploadPreset: meta.uploadPreset,
  };

  // 2. Save to offline queue first before network upload
  const idbResult = await savePhotoToIndexedDBQueue(queuedItem);

  // 3. If online, attempt direct Cloudinary upload under per-photo lock
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    inFlightPhotoIds.add(photoId);
    try {
      queuedItem.status = 'uploading';
      queuedItem.lastAttemptAt = new Date().toISOString();
      await savePhotoToIndexedDBQueue(queuedItem);

      const uploadRes = await uploadWorkPhotoToCloudinary(compressed.blob, {
        cloudName: meta.cloudName,
        uploadPreset: meta.uploadPreset,
      });

      queuedItem.status = 'synced';
      queuedItem.uploadedUrl = uploadRes.secureUrl;
      queuedItem.thumbnailUrl = uploadRes.thumbnailUrl;
      await removeQueuedUpload(photoId);

      return {
        photoId,
        imageUrl: uploadRes.secureUrl,
        thumbnailUrl: uploadRes.thumbnailUrl,
        description: meta.description || '',
        capturedAt,
        uploadedAt: new Date().toISOString(),
        fileSize: uploadRes.bytes,
        syncStatus: 'synced',
        uploadStatus: 'uploaded',
      };
    } catch (err: unknown) {
      console.warn('Direct upload failed, keeping in offline queue:', err);
      const errMessage = err instanceof Error ? err.message : String(err);
      queuedItem.status = 'failed';
      queuedItem.error = errMessage;
      queuedItem.retryCount = 1;
      queuedItem.lastAttemptAt = new Date().toISOString();
      await savePhotoToIndexedDBQueue(queuedItem);

      return {
        photoId,
        imageUrl: '',
        thumbnailUrl: '',
        description: meta.description || '',
        capturedAt,
        uploadedAt: new Date().toISOString(),
        fileSize: compressed.sizeBytes,
        syncStatus: 'pending',
        uploadStatus: 'failed',
        error: idbResult.persistedToIndexedDB
          ? errMessage
          : `${errMessage} (Warning: IndexedDB offline storage unavailable: ${idbResult.error})`,
      };
    } finally {
      inFlightPhotoIds.delete(photoId);
    }
  }

  // Offline: return with empty imageUrl/thumbnailUrl and pending status, keeping blob in IndexedDB queue
  return {
    photoId,
    imageUrl: '',
    thumbnailUrl: '',
    description: meta.description || '',
    capturedAt,
    uploadedAt: new Date().toISOString(),
    fileSize: compressed.sizeBytes,
    syncStatus: 'pending',
    uploadStatus: 'queued',
    error: idbResult.persistedToIndexedDB ? undefined : idbResult.error,
  };
}

/**
 * Centralized background queue processor:
 * - Prevents concurrent queue runs and duplicate uploads of the same photoId.
 * - Reuses `item.uploadedUrl` if Cloudinary upload already succeeded previously
 *   (e.g., when Firestore sync failed), avoiding duplicate Cloudinary uploads.
 * - Waits for `onSynced` confirmation before removing the item from the queue.
 */
export async function drainUploadQueue(
  onSynced?: (
    photoId: string,
    cloudUrl: string,
    thumbnailUrl: string,
    date?: string,
    activityId?: string
  ) => boolean | void | Promise<boolean | void>,
  options?: { forceRetryFailed?: boolean }
): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  if (isDrainingQueue) {
    pendingFollowUpDrain = true;
    return 0;
  }

  isDrainingQueue = true;
  let totalSyncedCount = 0;

  try {
    do {
      pendingFollowUpDrain = false;
      const pendingItems = await getAllQueuedUploads();
      const now = Date.now();

      for (const item of pendingItems) {
        if (!item || !item.photoId) continue;

        // Skip if this photo is currently being uploaded by another call
        if (inFlightPhotoIds.has(item.photoId)) {
          continue;
        }

        // If marked 'uploading', check if it is still actively uploading or stale from a previous session
        if (item.status === 'uploading') {
          const lastAttempt = Date.parse(item.lastAttemptAt || '') || 0;
          if (lastAttempt > 0 && now - lastAttempt < STALE_UPLOADING_TIMEOUT_MS) {
            continue;
          }
          // Recover stale uploading item
          item.status = 'pending';
        }

        // Respect retry limit unless forceRetryFailed is requested
        if (
          !options?.forceRetryFailed &&
          item.status === 'failed' &&
          (item.retryCount || 0) >= MAX_UPLOAD_RETRIES
        ) {
          continue;
        }

        inFlightPhotoIds.add(item.photoId);
        try {
          let secureUrl = item.uploadedUrl || '';
          let thumbnailUrl = item.thumbnailUrl || '';

          // Only upload to Cloudinary if we don't already have an uploaded URL for this item
          if (!secureUrl) {
            item.status = 'uploading';
            item.lastAttemptAt = new Date().toISOString();
            await savePhotoToIndexedDBQueue(item);

            const uploadRes = await uploadWorkPhotoToCloudinary(item.blob, {
              cloudName: item.cloudName,
              uploadPreset: item.uploadPreset,
            });

            secureUrl = uploadRes.secureUrl;
            thumbnailUrl = uploadRes.thumbnailUrl;

            // Persist the Cloudinary URLs immediately so if Firestore sync fails,
            // we never upload a duplicate image to Cloudinary on the next retry!
            item.uploadedUrl = secureUrl;
            item.thumbnailUrl = thumbnailUrl;
            item.status = 'synced';
            await savePhotoToIndexedDBQueue(item);
          }

          let reportUpdated = true;
          if (onSynced) {
            const syncResult = await Promise.resolve(
              onSynced(item.photoId, secureUrl, thumbnailUrl, item.date, item.activityId)
            );
            if (syncResult === false) {
              reportUpdated = false;
            }
          }

          if (reportUpdated) {
            // Only remove the queue item after the report & Firestore have been updated
            await removeQueuedUpload(item.photoId);
            totalSyncedCount++;
          } else {
            // Keep in queue with uploadedUrl intact so next drain retries Firestore save without re-uploading
            item.status = 'pending';
            item.lastAttemptAt = new Date().toISOString();
            await savePhotoToIndexedDBQueue(item);
          }
        } catch (err: unknown) {
          item.status = 'failed';
          item.error = err instanceof Error ? err.message : String(err);
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastAttemptAt = new Date().toISOString();
          await savePhotoToIndexedDBQueue(item);
        } finally {
          inFlightPhotoIds.delete(item.photoId);
        }
      }
    } while (pendingFollowUpDrain && (typeof navigator === 'undefined' || navigator.onLine));
  } finally {
    isDrainingQueue = false;
  }

  return totalSyncedCount;
}
