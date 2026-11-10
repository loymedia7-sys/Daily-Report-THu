import React from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Monitor, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall: () => void;
  deferredPromptAvailable: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  userProfile: UserProfile;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  deferredPromptAvailable,
  isIOS,
  isInstalled,
  userProfile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userProfile.companyLogoUrl ? (
              <img
                src={userProfile.companyLogoUrl}
                alt="Logo"
                className="w-9 h-9 rounded-xl object-cover bg-white p-0.5 border border-indigo-300/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Install to Home Screen</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-[11px] text-slate-300">
                {userProfile.companyName || 'Daily Report Schedule App'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-900">App Is Already Installed!</h3>
              <p className="text-xs text-emerald-700">
                You are currently running the full-screen standalone version from your Home Screen.
              </p>
            </div>
          ) : (
            <>
              {/* Feature Highlights */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/90 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                  {userProfile.companyLogoUrl ? (
                    <img
                      src={userProfile.companyLogoUrl}
                      alt="Company App Icon"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                      <Smartphone className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                    Home Screen App Icon
                  </p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {userProfile.companyName || 'Daily Report App'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {userProfile.companyLogoUrl 
                      ? 'Your custom company logo will be used on your phone home screen.' 
                      : 'Upload a logo in Settings to customize this app icon.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-base">⚡</span>
                  <p className="text-xs font-bold text-indigo-950 mt-0.5">1-Tap Instant Launch</p>
                  <p className="text-[10px] text-slate-600">Opens like a native mobile application.</p>
                </div>
                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-base">📱</span>
                  <p className="text-xs font-bold text-indigo-950 mt-0.5">Full Standalone Mode</p>
                  <p className="text-[10px] text-slate-600">Maximized screen space, no address bar.</p>
                </div>
              </div>

              {/* Install instructions based on device */}
              {deferredPromptAvailable ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Click the button below to add this app to your Home Screen or Desktop immediately:
                  </p>
                  <button
                    onClick={() => {
                      onNativeInstall();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install App Now</span>
                  </button>
                </div>
              ) : isIOS ? (
                /* iOS Safari Guide */
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    How to Install on iPhone / iPad (Safari)
                  </h4>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </div>
                      <p>
                        Tap the <strong className="text-indigo-900">Share button</strong> (
                        <Share className="w-3.5 h-3.5 inline text-indigo-600 mx-0.5" />
                        ) at the bottom or top of your Safari browser.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </div>
                      <p>
                        Scroll down and tap <strong className="text-indigo-900">"Add to Home Screen"</strong> (
                        <PlusSquare className="w-3.5 h-3.5 inline text-indigo-600 mx-0.5" />
                        ).
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </div>
                      <p>
                        Tap <strong className="text-indigo-900">"Add"</strong> in the top right corner to finish!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Chrome / Android generic Guide */
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    <span>Desktop & Android Chrome Installation</span>
                  </div>
                  <p>
                    In your browser toolbar or address bar, click the <strong>Install</strong> icon (<Download className="w-3.5 h-3.5 inline text-indigo-600" />) or open the browser menu (⋮) and select <strong>"Install / Add to Home screen"</strong>.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
