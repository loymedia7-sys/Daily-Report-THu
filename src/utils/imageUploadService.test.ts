import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAndUploadWorkPhoto } from './imageUploadService';

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Mock document and canvas
vi.stubGlobal('document', {
  createElement: vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,fake'),
        toBlob: vi.fn((cb) => cb(new Blob(['fake'], { type: 'image/jpeg' }))),
      };
    }
    return {};
  }),
});

// Mock FileReader
vi.stubGlobal('FileReader', class {
  readAsDataURL() {
    if (this.onload) {
      this.onload({ target: { result: 'data:image/png;base64,fake' } } as any);
    }
  }
  onload: ((e: any) => void) | null = null;
});

// Mock Image
vi.stubGlobal('Image', class {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  constructor() {
    setTimeout(() => { if (this.onload) this.onload(); }, 5);
  }
});

describe('imageUploadService tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('(a) when upload succeeds, photo gets secure URL and synced status', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: 'https://cloudinary.com/test.jpg', bytes: 1234 })
    });

    const dummyBlob = new Blob(['test'], { type: 'image/png' });
    const result = await processAndUploadWorkPhoto(dummyBlob, { date: '2026-11-10' });

    expect(result.imageUrl).toBe('https://cloudinary.com/test.jpg');
    expect(result.syncStatus).toBe('synced');
    expect(result.uploadStatus).toBe('uploaded');
  });

  it('(b) when upload fails, photo returns empty URL and pending status', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    const dummyBlob = new Blob(['test'], { type: 'image/png' });
    const result = await processAndUploadWorkPhoto(dummyBlob, { date: '2026-11-10' });

    expect(result.imageUrl).toBe('');
    expect(result.syncStatus).toBe('pending');
    expect(result.uploadStatus).toBe('failed');
  });
});
