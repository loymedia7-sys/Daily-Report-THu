import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Monitor,
  Sparkles,
  Compass,
  Copy,
  Check,
  Tablet,
  Home,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { safeImgSrc } from '../utils/dateUtils';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall: () => void;
  deferredPromptAvailable: boolean;
  isIOS: boolean;
  isIPad?: boolean;
  isAndroid?: boolean;
  isSafari?: boolean;
  isIOSNonSafari?: boolean;
  browserName?: string;
  isInstalled: boolean;
  userProfile: UserProfile;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  deferredPromptAvailable,
  isIOS,
  isIPad = false,
  isAndroid = false,
  isIOSNonSafari = false,
  browserName = 'Browser',
  isInstalled,
  userProfile,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const appDisplayName = userProfile.companyName?.trim()
    ? `${userProfile.companyName.trim()} Daily Report`
    : 'Daily Report Schedule Tracker';

  const handleCopyLinkForSafari = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback if clipboard API restricted
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {safeImgSrc(userProfile.companyLogoUrl) ? (
              <img
                src={safeImgSrc(userProfile.companyLogoUrl)}
                alt="App Icon"
                className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-indigo-300/40 shrink-0"
              />
            ) : (
              <img
                src="/apple-touch-icon.png"
                alt="App Icon"
                className="w-10 h-10 rounded-xl object-cover border border-indigo-300/40 shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
                <span>Install to Home Screen</span>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                {appDisplayName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
            aria-label="Close installation guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {isInstalled ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-950">Application Is Installed</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                You are running the full-screen standalone mobile application directly from your Home Screen.
              </p>
            </div>
          ) : (
            <>
              {/* App Identity & Icon Preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200/90 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  {safeImgSrc(userProfile.companyLogoUrl) ? (
                    <img
                      src={safeImgSrc(userProfile.companyLogoUrl)}
                      alt="Company App Icon"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <img
                      src="/apple-touch-icon.png"
                      alt="Daily Report App Icon"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {isIPad ? 'iPad App' : isIOS ? 'iPhone App' : isAndroid ? 'Android App' : 'Web App'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      • Standalone Mode
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate mt-1">
                    {appDisplayName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {userProfile.companyLogoUrl
                      ? 'Uses your custom company logo on your device Home Screen.'
                      : 'Automated daily schedule, work evidence camera, and offline sync.'}
                  </p>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-sm">⚡</span>
                  <p className="text-[11px] font-bold text-indigo-950 mt-0.5">1-Tap Launch</p>
                  <p className="text-[10px] text-slate-600 leading-tight">Open straight from Home Screen.</p>
                </div>
                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-sm">📱</span>
                  <p className="text-[11px] font-bold text-indigo-950 mt-0.5">Full Screen</p>
                  <p className="text-[10px] text-slate-600 leading-tight">No browser URL bar or tabs.</p>
                </div>
                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-sm">☁️</span>
                  <p className="text-[11px] font-bold text-indigo-950 mt-0.5">Offline Ready</p>
                  <p className="text-[10px] text-slate-600 leading-tight">Queues photos & reports offline.</p>
                </div>
              </div>

              {/* Device-Specific Installation Flow */}
              {deferredPromptAvailable ? (
                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                    {isAndroid ? <Smartphone className="w-4 h-4 text-indigo-600" /> : <Monitor className="w-4 h-4 text-indigo-600" />}
                    <span>Ready for Instant Installation</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tap the button below to install <strong>{appDisplayName}</strong> directly onto your {isAndroid ? 'Android Home Screen' : 'device'}:
                  </p>
                  <button
                    onClick={onNativeInstall}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install Application Now</span>
                  </button>
                </div>
              ) : isIOS ? (
                /* 5-Step iOS / iPadOS Visual Installation Guide */
                <div className="space-y-3">
                  {/* Alert if opened in Chrome/Firefox/In-App Browser on iOS */}
                  {isIOSNonSafari && (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-950">
                          <p className="font-bold">Switch to Safari to Install on {isIPad ? 'iPad' : 'iPhone'}</p>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            You are currently viewing this app in <strong>{browserName}</strong>. For best Home Screen installation on iOS, copy this link and open it in <strong>Safari</strong>.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyLinkForSafari}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Link Copied! Paste in Safari' : 'Copy Link to Open in Safari'}</span>
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        {isIPad ? <Tablet className="w-4 h-4 text-indigo-600" /> : <Smartphone className="w-4 h-4 text-indigo-600" />}
                        <span>{isIPad ? 'iPad Safari Installation Guide' : 'iPhone Safari Installation Guide'}</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                        5 Easy Steps
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700">
                      {/* Step 1 */}
                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-100/80">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Open the application using Safari</span>
                            <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Ensure you are browsing in Apple Safari on your {isIPad ? 'iPad' : 'iPhone'}.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-100/80">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Tap the Share icon</span>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600">
                              <Share className="w-3 h-3" />
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Located in the {isIPad ? 'top-right toolbar' : 'bottom navigation bar'} of Safari.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-100/80">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Select "Add to Home Screen"</span>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600">
                              <PlusSquare className="w-3 h-3" />
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Scroll down the Share sheet menu and tap <strong>Add to Home Screen</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-100/80">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          4
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Choose the application name and tap Add</span>
                            <Edit3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Confirm the app name and tap <strong>Add</strong> in the top-right corner.
                          </p>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-100/80">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          5
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Return to the Home Screen and open the app</span>
                            <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Launch the installed icon from your Home Screen for full-screen standalone mode.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Chrome / Edge / Android Browser Menu Guide */
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    {isAndroid ? <Smartphone className="w-4 h-4 text-indigo-600" /> : <Monitor className="w-4 h-4 text-indigo-600" />}
                    <span>{isAndroid ? 'Android Chrome Installation' : 'Desktop Chrome & Edge Installation'}</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600">
                    <li>
                      Look for the <strong>Install</strong> icon (<Download className="w-3.5 h-3.5 inline text-indigo-600" />) in the right side of the address bar, or open the browser menu (<strong>⋮</strong>).
                    </li>
                    <li>
                      Select <strong>"{isAndroid ? 'Install app / Add to Home screen' : 'Install Daily Report Schedule Tracker'}"</strong>.
                    </li>
                    <li>
                      Confirm <strong>Install</strong> to launch the app in its own standalone window.
                    </li>
                  </ol>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            {isInstalled ? 'Standalone PWA Active' : 'Works on iPhone, iPad, Android & Desktop'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {isInstalled ? 'Done' : 'Maybe Later'}
          </button>
        </div>

      </div>
    </div>
  );
};

