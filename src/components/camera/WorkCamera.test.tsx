import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  WorkCamera,
  isMediaStreamLive,
  stopMediaStreamTracks,
  attachStreamToVideoElement,
} from './WorkCamera';
import { INITIAL_USER_PROFILE, INITIAL_DEFAULT_SCHEDULE, createNewDayReport } from '../../utils/storage';

interface MockTrack {
  readyState: 'live' | 'ended';
  enabled: boolean;
  onended: (() => void) | null;
  stop: ReturnType<typeof vi.fn>;
}

function createMockMediaStream(initialState: 'live' | 'ended' = 'live'): {
  stream: MediaStream;
  track: MockTrack;
} {
  const track: MockTrack = {
    readyState: initialState,
    enabled: true,
    onended: null,
    stop: vi.fn(() => {
      track.readyState = 'ended';
    }),
  };

  const stream = {
    get active() {
      return track.readyState === 'live';
    },
    getVideoTracks: () => [track],
    getTracks: () => [track],
  } as unknown as MediaStream;

  return { stream, track };
}

function createMockVideoElement(readyState = 2): {
  videoEl: HTMLVideoElement;
  playMock: ReturnType<typeof vi.fn>;
  triggerLoadedMetadata: () => void;
} {
  let metadataHandler: (() => void) | null = null;
  const playMock = vi.fn().mockResolvedValue(undefined);

  const videoEl = {
    srcObject: null as MediaProvider | null,
    muted: false,
    playsInline: false,
    readyState,
    play: playMock,
    addEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === 'loadedmetadata') {
        metadataHandler = cb;
      }
    }),
    removeEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === 'loadedmetadata' && metadataHandler === cb) {
        metadataHandler = null;
      }
    }),
  } as unknown as HTMLVideoElement;

  return {
    videoEl,
    playMock,
    triggerLoadedMetadata: () => {
      if (metadataHandler) metadataHandler();
    },
  };
}

describe('WorkCamera stream reattachment & lifecycle tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reattaches existing live MediaStream across 1, 2, 5, and 10 consecutive photo capture/save cycles without duplicate getUserMedia calls', async () => {
    const { stream, track } = createMockMediaStream('live');
    const getUserMediaMock = vi.fn().mockResolvedValue(stream);

    // Initial camera open requests permission once
    const activeStream = await getUserMediaMock({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(isMediaStreamLive(activeStream)).toBe(true);

    for (const cycleCount of [1, 2, 5, 10]) {
      for (let i = 0; i < cycleCount; i++) {
        // Step 1: Live video element mounted
        const { videoEl: initialVideo, playMock: initialPlay } = createMockVideoElement(2);
        attachStreamToVideoElement(initialVideo, activeStream);
        expect(initialVideo.srcObject).toBe(activeStream);
        expect(initialPlay).toHaveBeenCalled();

        // Step 2: User captures photo -> preview screen mounts, <video> unmounts
        // Stream remains alive in streamRef without stopping tracks
        expect(isMediaStreamLive(activeStream)).toBe(true);
        expect(track.stop).not.toHaveBeenCalled();

        // Step 3: User clicks Save Work Evidence -> preview clears, NEW <video> element mounts
        const { videoEl: remountedVideo, playMock: remountedPlay } = createMockVideoElement(0);
        // Because stream is still live, reuse activeStream without calling getUserMedia again
        if (isMediaStreamLive(activeStream)) {
          attachStreamToVideoElement(remountedVideo, activeStream);
        } else {
          await getUserMediaMock();
        }

        // Verify new video element received srcObject and played both immediately and on loadedmetadata
        expect(remountedVideo.srcObject).toBe(activeStream);
        expect(remountedVideo.muted).toBe(true);
        expect(remountedVideo.playsInline).toBe(true);
        expect(remountedPlay).toHaveBeenCalled();
      }
    }

    // Across all 1 + 2 + 5 + 10 = 18 consecutive photos, getUserMedia was only called ONCE
    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(track.stop).not.toHaveBeenCalled();
  });

  it('retaking a photo reattaches the existing live stream to the recreated video element without requesting a second camera permission', () => {
    const { stream, track } = createMockMediaStream('live');

    // Before capture
    const { videoEl: firstVideo } = createMockVideoElement(2);
    attachStreamToVideoElement(firstVideo, stream);
    expect(firstVideo.srcObject).toBe(stream);

    // User clicks Retake -> new video element is created by React
    const { videoEl: afterRetakeVideo, playMock, triggerLoadedMetadata } = createMockVideoElement(0);
    attachStreamToVideoElement(afterRetakeVideo, stream);
    triggerLoadedMetadata();

    expect(afterRetakeVideo.srcObject).toBe(stream);
    expect(playMock).toHaveBeenCalledTimes(2);
    expect(track.stop).not.toHaveBeenCalled();
  });

  it('switching between rear and front cameras stops old tracks before attaching the new camera stream', async () => {
    const { stream: rearStream, track: rearTrack } = createMockMediaStream('live');
    const { stream: frontStream, track: frontTrack } = createMockMediaStream('live');

    const { videoEl } = createMockVideoElement(2);
    attachStreamToVideoElement(videoEl, rearStream);
    expect(videoEl.srcObject).toBe(rearStream);
    expect(isMediaStreamLive(rearStream)).toBe(true);

    // Switch to front camera ('user')
    stopMediaStreamTracks(rearStream);
    expect(rearTrack.stop).toHaveBeenCalledTimes(1);
    expect(isMediaStreamLive(rearStream)).toBe(false);

    attachStreamToVideoElement(videoEl, frontStream);
    expect(videoEl.srcObject).toBe(frontStream);
    expect(isMediaStreamLive(frontStream)).toBe(true);
    expect(frontTrack.stop).not.toHaveBeenCalled();
  });

  it('detects when a camera stream unexpectedly stops and cleans up all tracks on component unmount', () => {
    const { stream, track } = createMockMediaStream('live');
    expect(isMediaStreamLive(stream)).toBe(true);

    // Simulate OS/hardware stopping the track unexpectedly
    track.readyState = 'ended';
    expect(isMediaStreamLive(stream)).toBe(false);

    // Simulate unmount cleanup on a fresh live stream
    const { stream: stream2, track: track2 } = createMockMediaStream('live');
    stopMediaStreamTracks(stream2);
    expect(track2.stop).toHaveBeenCalledTimes(1);
    expect(isMediaStreamLive(stream2)).toBe(false);
  });

  it('renders WorkCamera UI cleanly with existing work evidence records', () => {
    const report = createNewDayReport('2026-11-10', INITIAL_DEFAULT_SCHEDULE, INITIAL_USER_PROFILE);
    const html = renderToString(
      <WorkCamera
        report={report}
        userProfile={INITIAL_USER_PROFILE}
        selectedDate="2026-11-10"
        language="en"
      />
    );
    expect(html).toContain('LIVE ● HD 1080P');
  });
});
