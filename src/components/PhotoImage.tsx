import React, { useState, useEffect } from 'react';
import { getCachedPhotoDataUrl } from '../utils/imageUploadService';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { AlertCircle, Clock } from 'lucide-react';

interface PhotoImageProps {
  photoId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  localDataUrl?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
  uploadStatus?: 'uploaded' | 'queued' | 'failed';
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
  const [isLoading, setIsLoading] = useState(false);

  const effectiveUrl = imageUrl || thumbnailUrl || cachedUrl;
  const isPending = syncStatus === 'pending' || uploadStatus === 'queued' || uploadStatus === 'failed' || !effectiveUrl;
  const isFailed = syncStatus === 'failed' || uploadStatus === 'failed';

  useEffect(() => {
    let isMounted = true;
    if (!effectiveUrl && photoId) {
      setIsLoading(true);
      getCachedPhotoDataUrl(photoId)
        .then((url) => {
          if (isMounted && url) {
            setCachedUrl(url);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveUrl, photoId]);

  const displaySrc = effectiveUrl || cachedUrl;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-100">
      {displaySrc ? (
        <img src={displaySrc} alt={alt} className={className} loading="lazy" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-100 text-slate-500">
          {isLoading ? (
            <div className="animate-pulse text-xs">{t.loading || 'Loading...'}</div>
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
        <div className="absolute bottom-2 right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
          <Clock size={10} />
          <span>{isFailed ? (t.uploadFailed || 'Failed') : (t.waitingToUpload || 'Pending')}</span>
        </div>
      )}
    </div>
  );
};
