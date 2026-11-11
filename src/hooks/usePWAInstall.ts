import { useState, useEffect, useCallback, useRef } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAPlatformInfo {
  isIOS: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isIOSNonSafari: boolean;
  isStandalone: boolean;
  browserName: 'Safari' | 'Chrome' | 'Firefox' | 'Edge' | 'Opera' | 'InApp' | 'Browser';
}

const DISMISS_STORAGE_KEY = 'daily_report_pwa_install_dismissed_at';

/**
 * Pure helper to detect iOS (iPhone, iPod, iPad, including iPadOS 13+ desktop mode),
 * Android, browser type, and standalone installation status.
 */
export function detectPWAPlatform(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  platform: string = typeof navigator !== 'undefined' ? navigator.platform || '' : '',
  maxTouchPoints: number = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0,
  standaloneMediaMatch: boolean = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false,
  navigatorStandalone: boolean = typeof navigator !== 'undefined' && (navigator as { standalone?: boolean }).standalone === true,
  referrer: string = typeof document !== 'undefined' ? document.referrer || '' : ''
): PWAPlatformInfo {
  const ua = userAgent || '';
  const uaLower = ua.toLowerCase();

  const isIPhone = /iphone|ipod/i.test(ua);
  // iPadOS 13+ requests desktop site by default with platform 'MacIntel' and maxTouchPoints > 1
  const isIPadUA = /ipad/i.test(ua);
  const isIPadOSDesktopMode =
    !isIPhone &&
    !isIPadUA &&
    (platform === 'MacIntel' || /macintosh/i.test(ua)) &&
    maxTouchPoints > 1;

  const isIPad = isIPadUA || isIPadOSDesktopMode;
  const isIOS = isIPhone || isIPad;
  const isAndroid = /android/i.test(uaLower);

  // Detect specific iOS/Mobile browsers
  const isChrome = /crios|chrome/i.test(ua) && !/edg|edgios|opr|opios/i.test(ua);
  const isFirefox = /fxios|firefox/i.test(ua);
  const isEdge = /edgios|edga|edg/i.test(ua);
  const isOpera = /opios|opr/i.test(ua);
  const isInApp = /fbav|fban|instagram|line|wv|gsa|micromessenger|tiktok/i.test(uaLower);

  const isSafari =
    /safari/i.test(ua) &&
    !/crios|fxios|edgios|opios|chrome|chromium|android|edg|opr|gsa|fbav|fban|instagram|line/i.test(ua);

  const isIOSNonSafari = isIOS && !isSafari;

  let browserName: PWAPlatformInfo['browserName'] = 'Browser';
  if (isInApp) browserName = 'InApp';
  else if (isSafari) browserName = 'Safari';
  else if (isChrome) browserName = 'Chrome';
  else if (isFirefox) browserName = 'Firefox';
  else if (isEdge) browserName = 'Edge';
  else if (isOpera) browserName = 'Opera';

  const isStandalone =
    Boolean(standaloneMediaMatch) ||
    Boolean(navigatorStandalone) ||
    referrer.includes('android-app://');

  return {
    isIOS,
    isIPhone,
    isIPad,
    isAndroid,
    isSafari,
    isIOSNonSafari,
    isStandalone,
    browserName,
  };
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platformInfo, setPlatformInfo] = useState<PWAPlatformInfo>(() => detectPWAPlatform());
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(DISMISS_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // Service worker update state
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const isReloadingForUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    const refreshPlatform = () => {
      setPlatformInfo(detectPWAPlatform());
    };
    refreshPlatform();

    // Listen to display-mode changes (e.g., when user installs and switches to standalone)
    let mediaQuery: MediaQueryList | null = null;
    const handleDisplayModeChange = () => {
      refreshPlatform();
    };
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('(display-mode: standalone)');
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleDisplayModeChange);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setPlatformInfo((prev) => ({ ...prev, isStandalone: true }));
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, []);

  // Register Service Worker & detect updates safely without interrupting active user work
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let isMounted = true;

    const handleControllerChange = () => {
      if (isReloadingForUpdateRef.current) {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        if (!isMounted) return;

        if (registration.waiting) {
          waitingWorkerRef.current = registration.waiting;
          setIsUpdateAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              isMounted
            ) {
              waitingWorkerRef.current = registration.waiting || newWorker;
              setIsUpdateAvailable(true);
            }
          });
        });
      } catch (err) {
        console.warn('ServiceWorker registration warning:', err);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const dismissInstallModal = useCallback(() => {
    setIsInstallModalOpen(false);
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setPlatformInfo((prev) => ({ ...prev, isStandalone: true }));
          setDeferredPrompt(null);
          setIsInstallModalOpen(false);
        } else {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Error triggering PWA install prompt:', err);
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    const waiting = waitingWorkerRef.current;
    if (waiting) {
      isReloadingForUpdateRef.current = true;
      waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    } else {
      window.location.reload();
    }
  }, []);

  const dismissUpdateBanner = useCallback(() => {
    setIsUpdateAvailable(false);
  }, []);

  const isInstalled = platformInfo.isStandalone;

  return {
    canInstall: !isInstalled && (Boolean(deferredPrompt) || platformInfo.isIOS || platformInfo.isAndroid),
    deferredPromptAvailable: Boolean(deferredPrompt),
    isInstalled,
    isIOS: platformInfo.isIOS,
    isIPhone: platformInfo.isIPhone,
    isIPad: platformInfo.isIPad,
    isAndroid: platformInfo.isAndroid,
    isSafari: platformInfo.isSafari,
    isIOSNonSafari: platformInfo.isIOSNonSafari,
    browserName: platformInfo.browserName,
    isDismissed,
    isInstallModalOpen,
    openInstallModal: () => setIsInstallModalOpen(true),
    closeInstallModal: dismissInstallModal,
    triggerInstall,
    isUpdateAvailable,
    applyUpdate,
    dismissUpdateBanner,
  };
}

