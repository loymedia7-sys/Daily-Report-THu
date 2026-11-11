import React, { useState, useEffect } from 'react';
import { getCachedPhotoDataUrl } from '../utils/imageUploadService';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface PhotoImageProps {
  photoId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  localDataUrl?: string;
  syncStatus?: 'synced' | 'pending' | 'uploading' | 'failed';
  uploadStatus?: 'uploaded' | 'uploading' | 'queued' | 'failed';
  alt?: string;
  className?: string;
  lang?: Language;
}

export const PhotoImage: React.FC<PhotoImageProps> = ({
  photoId,
  imageUrl,
  thumbnailUrl,
  localDataUrl,
  syncStatus,
  uploadStatus,
  alt = 'Work Evidence',
  className = 'w-full h-full object-cover',
  lang = 'en',
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [cachedUrl, setCachedUrl] = useState<string | null>(localDataUrl || null);
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const remoteUrl = !remoteFailed ? (imageUrl || thumbnailUrl || '') : '';

  useEffect(() => {
    setRemoteFailed(false);
  }, [imageUrl, thumbnailUrl, photoId]);

  useEffect(() => {
    let isMounted = true;
    if (localDataUrl) {
      setCachedUrl(localDataUrl);
      return () => {
        isMounted = false;
      };
    }

    if (!photoId) {
      setCachedUrl(null);
      return () => {
        isMounted = false;
      };
    }

    if (!remoteUrl) {
      setIsLoading(true);
    }

    getCachedPhotoDataUrl(photoId)
      .then((url) => {
        if (isMounted) {
          setCachedUrl(url || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCachedUrl(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [photoId, localDataUrl, remoteUrl]);

  const displaySrc = remoteUrl || cachedUrl || '';
  const isUploading = syncStatus === 'uploading' || uploadStatus === 'uploading';
  const isFailed = syncStatus === 'failed' || uploadStatus === 'failed';
  const isPending =
    isUploading ||
    isFailed ||
    syncStatus === 'pending' ||
    uploadStatus === 'queued' ||
    !imageUrl;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-100">
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          className={className}
          loading="lazy"
          onError={() => {
            if (remoteUrl) {
              setRemoteFailed(true);
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-100 text-slate-500">
          {isLoading ? (
            <div className="animate-pulse text-xs">{t.loading || 'Loading...'}</div>
          ) : isUploading ? (
            <div className="flex flex-col items-center text-blue-600 space-y-1">
              <RefreshCw size={20} className="animate-spin" />
              <span className="text-[10px] font-bold">{t.uploadingPhoto || 'Uploading...'}</span>
            </div>
          ) : isFailed ? (
            <div className="flex flex-col items-center text-rose-600 space-y-1">
              <AlertCircle size={20} />
              <span className="text-[10px] font-bold">{t.uploadFailed || 'Upload failed'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-amber-600 space-y-1">
              <Clock size={20} />
              <span className="text-[10px] font-bold">{t.waitingToUpload || 'Waiting to upload'}</span>
            </div>
          )}
        </div>
      )}

      {/* Status Badge */}
      {isPending && displaySrc && (
        <div
          className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
            isUploading
              ? 'bg-blue-600 text-white'
              : isFailed
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 text-slate-950'
          }`}
        >
          {isUploading ? (
            <RefreshCw size={10} className="animate-spin" />
          ) : isFailed ? (
            <AlertCircle size={10} />
          ) : (
            <Clock size={10} />
          )}
          <span>
            {isUploading
              ? t.uploadingPhoto || 'Uploading'
              : isFailed
                ? t.uploadFailed || 'Failed'
                : t.waitingToUpload || 'Pending'}
          </span>
        </div>
      )}
    </div>
  );
};
