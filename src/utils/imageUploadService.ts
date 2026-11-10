import { WorkActivityPhoto } from '../types/workReport';

export const DEFAULT_CLOUDINARY_CLOUD_NAME = 'dismpss5e';
export const DEFAULT_CLOUDINARY_UPLOAD_PRESET = 'REPORT';

/**
 * Resizes and compresses an image (File or Blob or DataURL) on canvas
 * Produces crisp high-definition images while keeping file size small (~200KB-400KB)
 */
export async function compressWorkPhoto(
  imageSource: File | Blob | string,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.85
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

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

      // Smooth interpolation for crisp photo detail
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob'));
            return;
          }
          resolve({
            dataUrl,
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
// IndexedDB for Offline Photo Drafts & Queue
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
  description: string;
  capturedAt: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'synced' | 'failed';
  error?: string;
  retryCount: number;
  uploadedUrl?: string;
  thumbnailUrl?: string;
}

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
    request.onerror = () => reject(request.error);
  });
}

export async function savePhotoToIndexedDBQueue(item: QueuedUploadItem): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([QUEUE_STORE, CACHE_STORE], 'readwrite');
    tx.objectStore(QUEUE_STORE).put(item);
    tx.objectStore(CACHE_STORE).put({
      photoId: item.photoId,
      dataUrl: item.dataUrl,
      capturedAt: item.capturedAt,
      date: item.date,
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB queue:', err);
  }
}

export async function getCachedPhotoDataUrl(photoId: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(CACHE_STORE, 'readonly');
    const store = tx.objectStore(CACHE_STORE);
    return new Promise((resolve) => {
      const req = store.get(photoId);
      req.onsuccess = () => {
        resolve(req.result ? req.result.dataUrl : null);
      };
      req.onerror = () => resolve(null);
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
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedUpload(photoId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(photoId);
  } catch (err) {
    console.warn('Error removing from queue:', err);
  }
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
  const cloudName = (config?.cloudName?.trim() || DEFAULT_CLOUDINARY_CLOUD_NAME).trim();
  const uploadPreset = (config?.uploadPreset?.trim() || DEFAULT_CLOUDINARY_UPLOAD_PRESET).trim();

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
 * 1. Compress image to high-quality HD
 * 2. Generate local instant preview
 * 3. Save to IndexedDB queue for offline protection
 * 4. Attempt Cloudinary upload (if online)
 * 5. Return complete WorkActivityPhoto metadata
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

  // Compress
  const compressed = await compressWorkPhoto(fileOrBlob, 1600, 1600, 0.85);

  const queuedItem: QueuedUploadItem = {
    photoId,
    activityId: meta.activityId,
    date: meta.date,
    blob: compressed.blob,
    dataUrl: compressed.dataUrl,
    description: meta.description || '',
    capturedAt,
    fileSize: compressed.sizeBytes,
    status: 'pending',
    retryCount: 0,
  };

  // Save to offline queue first (protect user data)
  await savePhotoToIndexedDBQueue(queuedItem);

  // If online, upload immediately to Cloudinary
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const uploadRes = await uploadWorkPhotoToCloudinary(compressed.blob, {
        cloudName: meta.cloudName,
        uploadPreset: meta.uploadPreset,
      });

      // Update queue to synced or remove
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
        localDataUrl: compressed.dataUrl,
      };
    } catch (err) {
      console.warn('Direct upload failed, keeping in offline queue:', err);
    }
  }

  // Offline or upload error: return with local data URL
  return {
    photoId,
    imageUrl: compressed.dataUrl,
    thumbnailUrl: compressed.dataUrl,
    description: meta.description || '',
    capturedAt,
    uploadedAt: new Date().toISOString(),
    fileSize: compressed.sizeBytes,
    syncStatus: 'pending',
    localDataUrl: compressed.dataUrl,
  };
}

/**
 * Background queue drainer: syncs any pending photos when online
 */
export async function drainUploadQueue(
  onSynced?: (photoId: string, cloudUrl: string, thumbnailUrl: string) => void
): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
  
  const pending = await getAllQueuedUploads();
  let syncedCount = 0;

  for (const item of pending) {
    if (item.status === 'uploading') continue;
    try {
      item.status = 'uploading';
      const uploadRes = await uploadWorkPhotoToCloudinary(item.blob);
      await removeQueuedUpload(item.photoId);
      syncedCount++;
      if (onSynced) {
        onSynced(item.photoId, uploadRes.secureUrl, uploadRes.thumbnailUrl);
      }
    } catch {
      item.status = 'failed';
      item.retryCount = (item.retryCount || 0) + 1;
    }
  }

  return syncedCount;
}

// Setup auto-drain on window 'online' event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    drainUploadQueue().catch(console.error);
  });
}
