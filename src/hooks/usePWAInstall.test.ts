import { describe, it, expect } from 'vitest';
import { detectPWAPlatform } from './usePWAInstall';
import {
  getCloudinaryPwaIconUrl,
  DEFAULT_APPLE_TOUCH_ICON,
  DEFAULT_ICON_192,
  DEFAULT_ICON_512,
  createPwaIconFromImage,
} from '../utils/pwaIconUpdater';

describe('PWA Platform & Installation Detection', () => {
  it('detects iPhone Safari accurately', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    const info = detectPWAPlatform(ua, 'iPhone', 5, false, false, '');

    expect(info.isIOS).toBe(true);
    expect(info.isIPhone).toBe(true);
    expect(info.isIPad).toBe(false);
    expect(info.isSafari).toBe(true);
    expect(info.isIOSNonSafari).toBe(false);
    expect(info.isStandalone).toBe(false);
    expect(info.browserName).toBe('Safari');
  });

  it('detects iPadOS 13+ desktop-mode Safari (MacIntel + multi-touch)', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    const info = detectPWAPlatform(ua, 'MacIntel', 5, false, false, '');

    expect(info.isIOS).toBe(true);
    expect(info.isIPad).toBe(true);
    expect(info.isIPhone).toBe(false);
    expect(info.isSafari).toBe(true);
    expect(info.isIOSNonSafari).toBe(false);
  });

  it('does not misclassify a real macOS desktop without touch points as iPad', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    const info = detectPWAPlatform(ua, 'MacIntel', 0, false, false, '');

    expect(info.isIOS).toBe(false);
    expect(info.isIPad).toBe(false);
    expect(info.isSafari).toBe(true);
  });

  it('detects when iPhone user opens the app in Chrome on iOS (CriOS) and flags isIOSNonSafari', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1';
    const info = detectPWAPlatform(ua, 'iPhone', 5, false, false, '');

    expect(info.isIOS).toBe(true);
    expect(info.isIPhone).toBe(true);
    expect(info.isSafari).toBe(false);
    expect(info.isIOSNonSafari).toBe(true);
    expect(info.browserName).toBe('Chrome');
  });

  it('detects Android Chrome accurately', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36';
    const info = detectPWAPlatform(ua, 'Linux armv81', 5, false, false, '');

    expect(info.isAndroid).toBe(true);
    expect(info.isIOS).toBe(false);
    expect(info.browserName).toBe('Chrome');
  });

  it('detects standalone installed mode via display-mode media query or navigator.standalone', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    const standaloneIOS = detectPWAPlatform(ua, 'iPhone', 5, false, true, '');
    expect(standaloneIOS.isStandalone).toBe(true);

    const standaloneDisplayMode = detectPWAPlatform(ua, 'iPhone', 5, true, false, '');
    expect(standaloneDisplayMode.isStandalone).toBe(true);

    const standaloneAndroidTwa = detectPWAPlatform(ua, 'Linux', 5, false, false, 'android-app://com.example.app');
    expect(standaloneAndroidTwa.isStandalone).toBe(true);
  });
});

describe('PWA Icon Generation & Cloudinary PNG Transformation', () => {
  it('returns static PNG defaults when no custom company logo is provided', async () => {
    expect(await createPwaIconFromImage('', 180)).toBe(DEFAULT_APPLE_TOUCH_ICON);
    expect(await createPwaIconFromImage('', 192)).toBe(DEFAULT_ICON_192);
    expect(await createPwaIconFromImage('', 512)).toBe(DEFAULT_ICON_512);
  });

  it('transforms a Cloudinary logo URL into a padded server-side PNG URL for iOS and Android', () => {
    const rawLogo = 'https://res.cloudinary.com/xivrejrq/image/upload/v1710000000/company_logo.webp';
    const apple180 = getCloudinaryPwaIconUrl(rawLogo, 180, 0.1);

    expect(apple180).toBe(
      'https://res.cloudinary.com/xivrejrq/image/upload/c_fit,w_144,h_144/c_pad,w_180,h_180,b_white,f_png,q_auto/v1710000000/company_logo.webp'
    );
  });
});
