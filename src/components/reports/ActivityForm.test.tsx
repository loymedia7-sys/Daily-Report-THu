import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ActivityForm } from './ActivityForm';
import { PhotoPreviewModal } from '../camera/PhotoPreviewModal';
import { INITIAL_USER_PROFILE } from '../../utils/storage';
import { WorkActivity, WorkActivityPhoto } from '../../types/workReport';

describe('ActivityForm & PhotoPreviewModal Hooks & Behavior', () => {
  it('renders ActivityForm closed and open without Rules of Hooks errors and uses Design Poster default category', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    const closedHtml = renderToString(
      <ActivityForm
        isOpen={false}
        onClose={onClose}
        onSave={onSave}
        initialActivity={null}
        date="2026-11-10"
        userProfile={INITIAL_USER_PROFILE}
        language="en"
      />
    );
    expect(closedHtml).toBe('');

    const openHtml = renderToString(
      <ActivityForm
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        initialActivity={null}
        date="2026-11-10"
        userProfile={INITIAL_USER_PROFILE}
        language="en"
      />
    );
    expect(openHtml).toContain('Design Poster');
    expect(openHtml).toContain('selected=""');
  });

  it('supports async Promise<boolean> callback signature on ActivityForm onSave', async () => {
    const asyncOnSave: (activity: WorkActivity) => Promise<boolean> = vi.fn().mockResolvedValue(true);
    const html = renderToString(
      <ActivityForm
        isOpen={true}
        onClose={() => {}}
        onSave={asyncOnSave}
        initialActivity={null}
        date="2026-11-10"
        userProfile={INITIAL_USER_PROFILE}
        language="en"
      />
    );
    expect(html).toContain('role="dialog"');
  });

  it('renders PhotoPreviewModal when closed and when open with photo without Rules of Hooks errors', () => {
    const samplePhoto: WorkActivityPhoto = {
      photoId: 'photo_1',
      imageUrl: 'https://res.cloudinary.com/xivrejrq/image/upload/sample.jpg',
      description: 'Sample Work Photo',
      capturedAt: '2026-11-10T09:00:00.000Z',
      uploadedAt: '2026-11-10T09:00:05.000Z',
      syncStatus: 'synced',
    };

    const closedHtml = renderToString(
      <PhotoPreviewModal
        photo={null}
        isOpen={false}
        onClose={() => {}}
        onUpdateDescription={async () => true}
        onDeletePhoto={async () => true}
        language="en"
      />
    );
    expect(closedHtml).toBe('');

    const openHtml = renderToString(
      <PhotoPreviewModal
        photo={samplePhoto}
        isOpen={true}
        onClose={() => {}}
        onUpdateDescription={async () => true}
        onDeletePhoto={async () => true}
        language="en"
      />
    );
    expect(openHtml).toContain('Sample Work Photo');
    expect(openHtml).toContain('Cloud Synced');
  });
});
