export const CLOUDINARY_CLOUD_NAME = 'xivrejrq';
export const CLOUDINARY_UPLOAD_PRESET = 'daily-report';

const LEGACY_CLOUD_NAMES = new Set(['dismpss5e', '']);
const LEGACY_PRESETS = new Set(['REPORT', 'daily_report', '']);

export function normalizeCloudinaryConfig(cloudName?: string, uploadPreset?: string): {
  cloudName: string;
  uploadPreset: string;
} {
  const trimmedCloud = (cloudName ?? '').trim();
  const trimmedPreset = (uploadPreset ?? '').trim();
  return {
    cloudName: LEGACY_CLOUD_NAMES.has(trimmedCloud) ? CLOUDINARY_CLOUD_NAME : trimmedCloud,
    uploadPreset: LEGACY_PRESETS.has(trimmedPreset) ? CLOUDINARY_UPLOAD_PRESET : trimmedPreset,
  };
}

