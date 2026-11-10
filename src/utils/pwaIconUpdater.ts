/**
 * Utility to dynamically update the Web App Manifest and Apple Touch Icons
 * with the user's custom Company Logo so when added to Home Screen on iOS or Android,
 * the mobile home screen uses the company's uploaded logo.
 */

// Default Fallback SVG Icon
const DEFAULT_ICON_SVG = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234F46E5'/><path d='M30 30h40v10H30zm0 15h40v10H30zm0 15h25v10H30z' fill='white'/></svg>`;

/**
 * Creates a square icon on a crisp padded canvas suitable for maskable/PWA icons
 */
export async function createPwaIconFromImage(
  imageUrl: string,
  size: number = 512,
  paddingRatio: number = 0.12,
  bgColor: string = '#FFFFFF'
): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(DEFAULT_ICON_SVG);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        // Draw solid background with subtle rounding for aesthetic contrast
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);

        // Calculate aspect-ratio preserved dimensions within padded inner square
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
        console.warn('Canvas icon generation error (fallback to raw url):', err);
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      resolve(imageUrl || DEFAULT_ICON_SVG);
    };

    img.src = imageUrl;
  });
}

// Keep track of active blob url to revoke previous allocations
let currentManifestBlobUrl: string | null = null;

/**
 * Updates DOM head tags and dynamically generates a PWA manifest blob
 * with the company logo and branding.
 */
export async function updatePwaManifestAndIcons(
  companyLogoUrl?: string,
  companyName?: string
): Promise<void> {
  try {
    const appName = companyName?.trim() 
      ? `${companyName.trim()} Daily Report` 
      : 'Daily Report Schedule Tracker';
    const shortName = companyName?.trim() || 'DailyReport';

    let icon192 = DEFAULT_ICON_SVG;
    let icon512 = DEFAULT_ICON_SVG;

    if (companyLogoUrl && companyLogoUrl.trim()) {
      // Generate crisp square PWA icons with comfortable maskable padding
      const logo = companyLogoUrl.trim();
      icon192 = await createPwaIconFromImage(logo, 192, 0.12, '#FFFFFF');
      icon512 = await createPwaIconFromImage(logo, 512, 0.12, '#FFFFFF');
    }

    // 1. Update Apple Touch Icons for iOS Safari Home Screen
    const appleIconLinks = ['apple-touch-icon', 'apple-touch-icon-precomposed'];
    appleIconLinks.forEach((rel) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = icon512;
    });

    // 2. Update Favicon & Shortcut Icon
    const favIconLinks = ['icon', 'shortcut icon'];
    favIconLinks.forEach((rel) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = icon192;
    });

    // 3. Update Apple Mobile Web App Title
    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.content = shortName;

    // 4. Generate and inject dynamic Web App Manifest
    const dynamicManifest = {
      short_name: shortName,
      name: appName,
      description: 'Automated daily schedule checklist and report generator with live sync, auto-holiday detection, and export.',
      icons: [
        {
          src: icon192,
          sizes: '192x192',
          type: icon192.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any maskable',
        },
        {
          src: icon512,
          sizes: '512x512',
          type: icon512.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any maskable',
        },
      ],
      start_url: '/',
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

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = currentManifestBlobUrl;
  } catch (err) {
    console.error('Failed to update dynamic PWA manifest and icons:', err);
  }
}
