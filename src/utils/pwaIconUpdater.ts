/**
 * Utility to dynamically update Apple Touch Icons, Favicons, and Web App Manifest
 * with the user's custom Company Logo while guaranteeing valid HTTPS PNG URLs
 * for iOS Safari Home Screen installation and Android/Desktop WebAPK.
 *
 * NOTE ON iOS SAFARI ICON BEHAVIOR:
 * iOS Safari fetches `<link rel="apple-touch-icon">` over HTTP/HTTPS at the moment
 * the user taps "Add to Home Screen", and caches that icon on the iOS SpringBoard.
 * iOS Safari does NOT support SVG touch icons and ignores `blob:` manifests.
 * Therefore:
 * 1. Default icons always point to static PNG files (`/apple-touch-icon.png`, `/pwa-192x192.png`, `/pwa-512x512.png`).
 * 2. When a company logo is hosted on Cloudinary, we generate a real HTTPS PNG transformation URL
 *    (`c_pad,w_180,h_180,b_white,f_png`) so iOS Safari can fetch a genuine PNG directly from the CDN.
 */

export const DEFAULT_APPLE_TOUCH_ICON = '/apple-touch-icon.png';
export const DEFAULT_ICON_192 = '/pwa-192x192.png';
export const DEFAULT_ICON_512 = '/pwa-512x512.png';
export const DEFAULT_MASKABLE_ICON_512 = '/pwa-maskable-512x512.png';

/**
 * If the image URL is a Cloudinary upload URL, returns a server-rendered square PNG URL
 * with clean white padding so iOS Safari and Android can download a real HTTPS PNG icon.
 */
export function getCloudinaryPwaIconUrl(
  imageUrl: string,
  size: number = 512,
  paddingRatio: number = 0.12
): string | null {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  const uploadMarker = '/image/upload/';
  const markerIdx = trimmed.indexOf(uploadMarker);
  if (!trimmed.includes('res.cloudinary.com') || markerIdx === -1) {
    return null;
  }

  const prefix = trimmed.slice(0, markerIdx + uploadMarker.length);
  let rest = trimmed.slice(markerIdx + uploadMarker.length);

  // Strip existing transformation segment if present before version segment (e.g., v17123456/)
  const versionMatch = rest.match(/(v\d+\/.+)$/);
  if (versionMatch) {
    rest = versionMatch[1];
  }

  const innerSize = Math.max(32, Math.round(size * (1 - paddingRatio * 2)));
  // Render inside innerSize box, then pad to exact square `size x size` in PNG format
  const transformation = `c_fit,w_${innerSize},h_${innerSize}/c_pad,w_${size},h_${size},b_white,f_png,q_auto`;
  return `${prefix}${transformation}/${rest}`;
}

/**
 * Creates a square icon on a crisp padded canvas suitable for maskable/PWA icons
 */
export async function createPwaIconFromImage(
  imageUrl: string,
  size: number = 512,
  paddingRatio: number = 0.12,
  bgColor: string = '#FFFFFF'
): Promise<string> {
  const defaultIcon = size <= 180 ? DEFAULT_APPLE_TOUCH_ICON : size <= 192 ? DEFAULT_ICON_192 : DEFAULT_ICON_512;

  if (!imageUrl || !imageUrl.trim()) {
    return defaultIcon;
  }

  // Prefer real HTTPS PNG URL from Cloudinary when available
  const cloudinaryPngUrl = getCloudinaryPwaIconUrl(imageUrl, size, paddingRatio);
  if (cloudinaryPngUrl) {
    return cloudinaryPngUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(defaultIcon);
          return;
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);

        const innerSize = size * (1 - paddingRatio * 2);
        const padding = size * paddingRatio;

        let drawWidth = innerSize;
        let drawHeight = innerSize;

        const imgAspect = img.width / (img.height || 1);
        if (imgAspect > 1) {
          drawHeight = innerSize / imgAspect;
        } else {
          drawWidth = innerSize * imgAspect;
        }

        const offsetX = padding + (innerSize - drawWidth) / 2;
        const offsetY = padding + (innerSize - drawHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        resolve(canvas.toDataURL('image/png', 0.95));
      } catch (err) {
        console.warn('Canvas icon generation error (fallback to default PNG):', err);
        resolve(defaultIcon);
      }
    };

    img.onerror = () => {
      resolve(defaultIcon);
    };

    img.src = imageUrl;
  });
}

let currentManifestBlobUrl: string | null = null;

/**
 * Updates DOM head tags and PWA icons with the company logo and branding.
 * Preserves the canonical `/manifest.json` unless custom branding is active,
 * and always uses absolute URLs inside any dynamic manifest so relative paths never break.
 */
export async function updatePwaManifestAndIcons(
  companyLogoUrl?: string,
  companyName?: string
): Promise<void> {
  try {
    const trimmedName = companyName?.trim() || '';
    const trimmedLogo = companyLogoUrl?.trim() || '';

    const appName = trimmedName
      ? `${trimmedName} Daily Report`
      : 'Daily Report Schedule Tracker';
    const shortName = trimmedName || 'DailyReport';

    const origin = window.location.origin;
    let appleIcon180 = `${origin}${DEFAULT_APPLE_TOUCH_ICON}`;
    let icon192 = `${origin}${DEFAULT_ICON_192}`;
    let icon512 = `${origin}${DEFAULT_ICON_512}`;
    let maskable512 = `${origin}${DEFAULT_MASKABLE_ICON_512}`;

    if (trimmedLogo) {
      appleIcon180 = await createPwaIconFromImage(trimmedLogo, 180, 0.1, '#FFFFFF');
      icon192 = await createPwaIconFromImage(trimmedLogo, 192, 0.1, '#FFFFFF');
      icon512 = await createPwaIconFromImage(trimmedLogo, 512, 0.1, '#FFFFFF');
      maskable512 = await createPwaIconFromImage(trimmedLogo, 512, 0.15, '#FFFFFF');
    }

    // 1. Update Apple Touch Icons for iOS Safari Home Screen (180x180 PNG)
    const appleIconLinks = ['apple-touch-icon', 'apple-touch-icon-precomposed'];
    appleIconLinks.forEach((rel) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.sizes.value = '180x180';
      el.href = appleIcon180;
    });

    // 2. Update Favicon
    let favIconEl = document.querySelector('link[rel="icon"][type="image/png"]') as HTMLLinkElement | null;
    if (!favIconEl) {
      favIconEl = document.createElement('link');
      favIconEl.rel = 'icon';
      favIconEl.type = 'image/png';
      document.head.appendChild(favIconEl);
    }
    favIconEl.href = icon192;

    // 3. Update Apple Mobile Web App Title
    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.content = shortName;

    // 4. If using default branding, keep static /manifest.json for maximum browser installability
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    if (!trimmedLogo && !trimmedName) {
      if (currentManifestBlobUrl) {
        URL.revokeObjectURL(currentManifestBlobUrl);
        currentManifestBlobUrl = null;
      }
      manifestLink.href = '/manifest.json';
      return;
    }

    // When custom branding is set, build a manifest with absolute URLs
    const dynamicManifest = {
      id: `${origin}/`,
      short_name: shortName,
      name: appName,
      description:
        'Automated daily schedule checklist and report generator with live sync, auto-holiday detection, and export.',
      icons: [
        {
          src: icon192,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: icon512,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: maskable512,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      start_url: `${origin}/`,
      scope: `${origin}/`,
      background_color: '#0F172A',
      theme_color: '#4F46E5',
      display: 'standalone',
      orientation: 'portrait',
    };

    const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
      type: 'application/json',
    });

    if (currentManifestBlobUrl) {
      URL.revokeObjectURL(currentManifestBlobUrl);
    }
    currentManifestBlobUrl = URL.createObjectURL(manifestBlob);
    manifestLink.href = currentManifestBlobUrl;
  } catch (err) {
    console.error('Failed to update dynamic PWA manifest and icons:', err);
  }
}

