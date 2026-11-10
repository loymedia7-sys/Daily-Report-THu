/**
 * Utility functions for uploading and processing company logos
 * with Cloudinary unsigned preset uploads and high-performance base64 fallback.
 */

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/cloudinary';

// Default Cloudinary configuration (unsigned only)
export const DEFAULT_CLOUDINARY_CONFIG = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET,
};

/**
 * Resizes and compresses an image file on the client-side
 */
export async function compressImage(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
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

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

export interface UploadResult {
  url: string;
  source: 'cloudinary' | 'local_storage';
  error?: string;
}

/**
 * Uploads a logo image to Cloudinary using unsigned preset or falls back to optimized Base64
 */
export async function uploadLogoImage(
  file: File,
  config?: {
    cloudName?: string;
    uploadPreset?: string;
  }
): Promise<UploadResult> {
  const compressedBase64 = await compressImage(file, 400, 400);

  const cloudName = (config?.cloudName?.trim() || CLOUDINARY_CLOUD_NAME).trim();
  const uploadPreset = (config?.uploadPreset?.trim() || CLOUDINARY_UPLOAD_PRESET).trim();

  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          return {
            url: data.secure_url,
            source: 'cloudinary',
          };
        }
      } else {
        const errText = await response.text();
        console.error('[Cloudinary Logo Upload]', response.status, errText);
      }
    } catch (err) {
      console.error('[Cloudinary Logo Upload Exception]', err);
    }
  }

  // Fallback to Base64
  return {
    url: compressedBase64,
    source: 'local_storage',
  };
}
