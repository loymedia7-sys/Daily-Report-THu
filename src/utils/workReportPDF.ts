import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DayReport, UserProfile, Language } from '../types';
import { WORK_CATEGORIES } from '../types/workReport';
import { formatKhmerDate } from './translations';
import { formatDateToScreenshotBanner } from './dateUtils';
import { calculateActivityStats, countEvidencePhotosInReport } from './workEvidenceService';
import { getCachedPhotoDataUrl } from './imageUploadService';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats captured timestamp to clean 12-hour format e.g. "11:12:17 AM"
 */
function formatPhotoTime(dateVal?: string | number): string {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Converts an image URL to a base64 Data URL for reliable html2canvas rendering
 */
async function ensureDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Creates an offscreen DOM container with A4 dimensions (794px width)
 * and renders it to a high-resolution canvas.
 */
async function renderPageToCanvas(pageHtml: string): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-20000px';
  container.style.left = '-20000px';
  container.style.width = '794px';
  container.style.minHeight = '1120px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.boxSizing = 'border-box';
  container.style.padding = '34px 38px';
  container.style.fontFamily =
    "'Battambang', 'Kantumruy Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  container.innerHTML = pageHtml;

  document.body.appendChild(container);

  if (document.fonts) {
    await document.fonts.ready;
  }

  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((res) => {
        img.onload = () => res(null);
        img.onerror = () => res(null);
      });
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 80));

  const canvas = await html2canvas(container, {
    scale: 2, // High resolution for crisp photo printing
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  document.body.removeChild(container);
  return canvas;
}

interface PhotoItem {
  photoIndex: number;
  recordNumber: number;
  categoryLabelEn: string;
  categoryLabelKm: string;
  isSkippedCategory: boolean;
  description: string;
  activityTitle: string;
  imageUrl: string;
  capturedAt: string | number;
  startTime: string;
  endTime: string;
  status: string;
}

export async function exportWorkReportWithPhotosPDF(
  report: DayReport,
  userProfile: UserProfile,
  language: Language = 'en'
): Promise<void> {
  const companyName = userProfile.companyName || 'TIV-HUOR REPORT';
  const employeeName = userProfile.employeeName || 'ROTH DARO';
  const department = userProfile.department || 'Operations Lead';
  const supervisor = userProfile.supervisorName || 'Department Head';

  const stats = calculateActivityStats(report);
  const totalPhotosCount = countEvidencePhotosInReport(report);
  const rawActivities = report.activities || [];

  const isCheckedIn = Boolean(report.isCheckedIn);
  const isPermission = Boolean(report.isPermission);
  const dateFormatted =
    language === 'km' ? formatKhmerDate(report.date) : formatDateToScreenshotBanner(report.date);

  const photoItems: PhotoItem[] = [];
  let recordCounter = 1;
  let photoCounter = 1;

  for (const act of rawActivities) {
    const rawCat =
      act.workCategory ||
      (act.category !== 'Other Activities' && act.category !== 'Other' ? act.category : null);
    const catItem = WORK_CATEGORIES.find(
      (c) => c.id === rawCat || c.labelEn.toLowerCase() === (rawCat || '').toLowerCase()
    );
    const isSkippedCategory = !rawCat;
    const categoryLabelEn = catItem ? catItem.labelEn : rawCat || 'Not Selected';
    const categoryLabelKm = catItem ? catItem.labelKm : '';

    const photos = act.photos || [];
    if (photos.length > 0) {
      for (const p of photos) {
        let rawUrl = p.localDataUrl || p.thumbnailUrl || p.imageUrl || act.imageUrl || '';
        if (!rawUrl && p.photoId) {
          try {
            const cached = await getCachedPhotoDataUrl(p.photoId);
            if (cached) rawUrl = cached;
          } catch {
            // ignore IndexedDB lookup failure
          }
        }
        const convertedUrl = await ensureDataUrl(rawUrl);
        photoItems.push({
          photoIndex: photoCounter++,
          recordNumber: recordCounter++,
          categoryLabelEn,
          categoryLabelKm,
          isSkippedCategory,
          description: p.description || act.description || '',
          activityTitle: act.activityTitle || act.title || categoryLabelEn,
          imageUrl: convertedUrl,
          capturedAt: p.capturedAt || act.capturedAt || '',
          startTime: act.startTime || '08:00',
          endTime: act.endTime || '09:00',
          status: act.status || 'completed',
        });
      }
    } else if (act.imageUrl) {
      const convertedUrl = await ensureDataUrl(act.imageUrl);
      photoItems.push({
        photoIndex: photoCounter++,
        recordNumber: recordCounter++,
        categoryLabelEn,
        categoryLabelKm,
        isSkippedCategory,
        description: act.description || '',
        activityTitle: act.activityTitle || act.title || categoryLabelEn,
        imageUrl: convertedUrl,
        capturedAt: act.capturedAt || '',
        startTime: act.startTime || '08:00',
        endTime: act.endTime || '09:00',
        status: act.status || 'completed',
      });
    }
  }

  const photosWithImages = photoItems.filter((p) => Boolean(p.imageUrl));

  // Calculate how many photos fit in the free space at the bottom of Page 1:
  // - 0 to 3 activity rows: enough vertical free space for 2 rows of photos (up to 6 photos)
  // - 4 to 9 activity rows: enough vertical free space for 1 row of photos (up to 3 photos)
  const page1PhotoCapacity =
    rawActivities.length <= 3 ? 6 : rawActivities.length <= 9 ? 3 : 0;
  const page1PhotoCount = Math.min(page1PhotoCapacity, photosWithImages.length);
  const page1Photos = photosWithImages.slice(0, page1PhotoCount);
  const remainingPhotos = photosWithImages.slice(page1PhotoCount);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Each dedicated photo evidence page fits 3 rows x 3 columns = 9 photos, filling the bottom free space
  const BATCH_SIZE = 9;
  const photoPages: PhotoItem[][] = [];
  for (let i = 0; i < remainingPhotos.length; i += BATCH_SIZE) {
    photoPages.push(remainingPhotos.slice(i, i + BATCH_SIZE));
  }

  const totalPdfPages = 1 + photoPages.length;
  let currentPageNum = 1;

  const renderPhotoGridHtml = (photos: PhotoItem[]) => {
    if (photos.length === 0) return '';
    return `
      <div style="margin-top: 14px;">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
          <span>${language === 'km' ? 'រូបភាពភស្តុតាងការងារ' : 'Work Evidence Photographs'} (${photosWithImages.length})</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          ${photos
            .map(
              (p) => `
            <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column;">
              <!-- Photo on Top (215px height with #1 badge) -->
              <div style="position: relative; width: 100%; height: 215px; background: #f8fafc; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <img src="${p.imageUrl}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: #ffffff; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 12px; font-family: monospace; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  #${p.photoIndex}
                </div>
              </div>

              <!-- Caption & 12-Hour AM/PM Timestamp underneath -->
              <div style="padding: 8px 11px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff;">
                <div style="font-size: 11px; font-weight: 700; color: #0f172a; line-height: 1.35; word-break: break-word;">
                  ${escapeHtml(p.description || p.activityTitle || p.categoryLabelEn || 'Work Evidence')}
                </div>
                <div style="font-size: 9.5px; color: #64748b; font-family: monospace; margin-top: 4px;">
                  ${formatPhotoTime(p.capturedAt)}
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  };

  const page1Html = `
    <div style="width: 100%; min-height: 1040px; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">
      <div>
        <!-- Company Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${
              userProfile.companyLogoUrl
                ? `<img src="${userProfile.companyLogoUrl}" crossorigin="anonymous" style="width: 50px; height: 50px; object-fit: contain; border-radius: 12px; border: 1px solid #cbd5e1;" />`
                : `<div style="width: 46px; height: 46px; background: #312e81; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; border-radius: 12px;">TH</div>`
            }
            <div>
              <h1 style="margin: 0; font-size: 18.5px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                ${escapeHtml(companyName)}
              </h1>
              <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${language === 'km' ? 'របាយការណ៍សកម្មភាពការងារប្រចាំថ្ងៃ' : 'Daily Work Report & Evidence Dossier'}
              </div>
            </div>
          </div>

          <div style="text-align: right; font-size: 11px; color: #334155; line-height: 1.45;">
            <div><strong style="color: #0f172a;">${language === 'km' ? 'កាលបរិច្ឆេទ' : 'Report Date'}:</strong> ${dateFormatted}</div>
            <div><strong style="color: #0f172a;">${language === 'km' ? 'ស្ថានភាពវត្តមាន' : 'Attendance'}:</strong> 
              ${
                isCheckedIn
                  ? `<span style="color: #16a34a; font-weight: bold;">${language === 'km' ? 'វត្តមាន (Present)' : 'Present'}</span>`
                  : isPermission
                    ? `<span style="color: #b45309; font-weight: bold;">${language === 'km' ? 'មានច្បាប់ (Permission)' : 'Permission (Leave)'}</span>`
                    : `<span style="color: #dc2626; font-weight: bold;">${language === 'km' ? 'អវត្តមាន (Absent)' : 'Absent'}</span>`
              }
            </div>
          </div>
        </div>

        <!-- Employee Info Card -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; font-size: 11px;">
            <div>
              <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${language === 'km' ? 'ឈ្មោះបុគ្គលិក (Employee)' : 'Employee Name'}</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${escapeHtml(employeeName)}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${language === 'km' ? 'ផ្នែក / តួនាទី (Department)' : 'Department / Role'}</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${escapeHtml(department)}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${language === 'km' ? 'ប្រធានគ្រប់គ្រង (Supervisor)' : 'Supervisor / Lead'}</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${escapeHtml(supervisor)}</div>
            </div>
          </div>
        </div>

        <!-- Daily Metrics Summary Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 10px; text-align: center;">
            <div style="font-size: 10px; font-weight: bold; color: #475569;">${language === 'km' ? 'សកម្មភាពសរុប' : 'Total Activities'}</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 1px;">${rawActivities.length}</div>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 8px 10px; text-align: center;">
            <div style="font-size: 10px; font-weight: bold; color: #047857;">${language === 'km' ? 'ការងារបានសម្រេច' : 'Completed'}</div>
            <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 1px;">${stats.completed}</div>
          </div>
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 8px 10px; text-align: center;">
            <div style="font-size: 10px; font-weight: bold; color: #4338ca;">${language === 'km' ? 'រូបភាពភស្តុតាង' : 'Evidence Photos'}</div>
            <div style="font-size: 18px; font-weight: 800; color: #4f46e5; margin-top: 1px;">${totalPhotosCount}</div>
          </div>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 8px 10px; text-align: center;">
            <div style="font-size: 10px; font-weight: bold; color: #b45309;">${language === 'km' ? 'អត្រាសម្រេច' : 'Completion Rate'}</div>
            <div style="font-size: 18px; font-weight: 800; color: #d97706; margin-top: 1px;">${stats.completionRate}%</div>
          </div>
        </div>

        <!-- Daily Work Activity Report Table (Without Time & Status, with Number of Images e.g. 1) -->
        <div style="margin-bottom: 14px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 8px; border-left: 4px solid #4f46e5; padding-left: 10px;">
            ${language === 'km' ? 'តារាងសកម្មភាពការងារប្រចាំថ្ងៃ (Daily Activities)' : 'Daily Work Activity Report'}
          </h3>

          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1.5px solid #0f172a;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff; text-align: left;">
                <th style="padding: 7px 6px; border: 1px solid #334155; width: 45px; text-align: center;">${language === 'km' ? 'ល.រ' : 'No.'}</th>
                <th style="padding: 7px 10px; border: 1px solid #334155; width: 170px;">${language === 'km' ? 'ផ្នែកការងារ' : 'Work Category'}</th>
                <th style="padding: 7px 10px; border: 1px solid #334155;">${language === 'km' ? 'ពិពណ៌នាការងារ' : 'Work Description'}</th>
                <th style="padding: 7px 8px; border: 1px solid #334155; width: 85px; text-align: center;">${language === 'km' ? 'ចំនួនរូបភាព' : 'Images'}</th>
              </tr>
            </thead>
            <tbody>
              ${
                rawActivities.length > 0
                  ? rawActivities
                      .map((act, idx) => {
                        const rawCat =
                          act.workCategory ||
                          (act.category !== 'Other Activities' && act.category !== 'Other' ? act.category : null);
                        const isSkipped = !rawCat;
                        const actPhotos =
                          act.photos && act.photos.length > 0
                            ? act.photos
                            : act.imageUrl
                              ? [act.imageUrl]
                              : [];
                        const imgCount = actPhotos.length > 0 ? actPhotos.length : '-';
                        return `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                          <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
                          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #4338ca;">
                            ${
                              isSkipped
                                ? `<span style="color: #64748b; font-style: italic; font-weight: normal;">${language === 'km' ? 'មិនបានជ្រើសរើស' : 'Not Selected'}</span>`
                                : escapeHtml(rawCat)
                            }
                          </td>
                          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 500; color: #1e293b; line-height: 1.35;">
                            ${escapeHtml(act.description || act.title || '—')}
                          </td>
                          <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a;">
                            ${imgCount}
                          </td>
                        </tr>
                      `;
                      })
                      .join('')
                  : `
                    <tr>
                      <td colspan="4" style="padding: 16px; text-align: center; color: #64748b; border: 1px solid #cbd5e1;">
                        ${language === 'km' ? 'មិនមានសកម្មភាពការងារសម្រាប់ថ្ងៃនេះទេ' : 'No activities recorded for this date.'}
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>

        <!-- Render first batch of photos in the free space on Page 1 -->
        ${page1Photos.length > 0 ? renderPhotoGridHtml(page1Photos) : ''}
      </div>

      <!-- Page 1 Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px;">
        <span>${escapeHtml(companyName)} • Official Daily Work Report</span>
        <span>Page ${currentPageNum} of ${totalPdfPages}</span>
      </div>
    </div>
  `;

  const canvas1 = await renderPageToCanvas(page1Html);
  const imgData1 = canvas1.toDataURL('image/jpeg', 0.96);
  doc.addImage(imgData1, 'JPEG', 0, 0, 210, 297);

  if (photoPages.length > 0) {
    for (let pIdx = 0; pIdx < photoPages.length; pIdx++) {
      currentPageNum++;
      doc.addPage();
      const batchPhotos = photoPages[pIdx];
      const pageNHtml = `
        <div style="width: 100%; min-height: 1040px; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">
          <div>
            <!-- Running Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; font-size: 11px; color: #64748b;">
              <span><strong style="color: #0f172a;">${escapeHtml(companyName)}</strong> • ${language === 'km' ? 'រូបភាពភស្តុតាងការងារ' : 'Work Evidence Photographs'}</span>
              <span><strong>${escapeHtml(employeeName)}</strong> • ${dateFormatted}</span>
            </div>

            <!-- Section Title -->
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <h2 style="margin: 0; font-size: 14.5px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                  ${language === 'km' ? 'រូបភាពភស្តុតាងការងារ' : 'Work Evidence Photographs'} (${photosWithImages.length})
                </h2>
                <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">
                  ${language === 'km' ? 'ភស្តុតាងជាក់ស្ដែងដែលបានកត់ត្រាពេលកំពុងបំពេញការងារ' : 'Photographic evidence captured during work execution'}
                </div>
              </div>
              <div style="font-size: 11px; font-weight: 600; color: #4338ca;">
                ${language === 'km' ? `ទំព័រទី ${pIdx + 1} នៃ ${photoPages.length}` : `Evidence Page ${pIdx + 1} of ${photoPages.length}`}
              </div>
            </div>

            <!-- 3-Column x 3-Row Photo Grid (Up to 9 Photos per Page) -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              ${batchPhotos
                .map(
                  (p) => `
                <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column;">
                  <!-- Photo on Top (215px height with #1 badge) -->
                  <div style="position: relative; width: 100%; height: 215px; background: #f8fafc; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <img src="${p.imageUrl}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: #ffffff; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 12px; font-family: monospace; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      #${p.photoIndex}
                    </div>
                  </div>

                  <!-- Caption & 12-Hour AM/PM Timestamp underneath -->
                  <div style="padding: 8px 11px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff;">
                    <div style="font-size: 11px; font-weight: 700; color: #0f172a; line-height: 1.35; word-break: break-word;">
                      ${escapeHtml(p.description || p.activityTitle || p.categoryLabelEn || 'Work Evidence')}
                    </div>
                    <div style="font-size: 9.5px; color: #64748b; font-family: monospace; margin-top: 4px;">
                      ${formatPhotoTime(p.capturedAt)}
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Page N Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px;">
            <span>${escapeHtml(companyName)} • Official Daily Work Report</span>
            <span>Page ${currentPageNum} of ${totalPdfPages}</span>
          </div>
        </div>
      `;
      const canvasN = await renderPageToCanvas(pageNHtml);
      const imgDataN = canvasN.toDataURL('image/jpeg', 0.96);
      doc.addImage(imgDataN, 'JPEG', 0, 0, 210, 297);
    }
  }

  const cleanName = (userProfile.employeeName || 'Employee').replace(/\s+/g, '_');
  const fileName = `Daily_Work_Report_${report.date}_${cleanName}.pdf`;
  doc.save(fileName);
}
