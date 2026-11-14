import { describe, test, expect } from 'vitest';
import { loadHelpers } from '../helpers/loadFromSwiperInit.js';

// Movies most browsers cannot play (AVI, ...) arrive as stills with alt_video.
// Like iCloud web, they become videos only where canPlayType says the browser can play them.
function setup(answers) {
    const document = { createElement: () => ({ canPlayType: (type) => answers[type] || '' }) };
    const $ = { extend: (...objects) => Object.assign(...objects) };
    return loadHelpers(['browserCanPlayVideoType', 'applyBrowserPlayableVideos'], { _canPlayVideoType: {}, document, $ });
}

const avi = { type: 'image', full: 'full.jpg', alt_video: 'orig.avi', alt_video_type: 'video/avi' };

describe('browser playable videos', () => {
    test('turns the still into a video where the browser can play the type', () => {
        const { applyBrowserPlayableVideos } = setup({ 'video/avi': 'maybe' });
        const [photo] = applyBrowserPlayableVideos([avi]);

        expect(photo.type).toBe('video');
        expect(photo.video).toBe('orig.avi');
        expect(photo.full).toBe('full.jpg');
        expect(photo.alt_video).toBeUndefined();
    });

    test('keeps the still where the browser cannot play the type', () => {
        const { applyBrowserPlayableVideos } = setup({});

        expect(applyBrowserPlayableVideos([avi])[0]).toBe(avi);
    });

    test('leaves ordinary photos and videos alone', () => {
        const { applyBrowserPlayableVideos } = setup({ 'video/avi': 'probably' });
        const photo = { type: 'image', full: 'a.jpg' };
        const video = { type: 'video', video: 'v.mp4', alt_video: 'x', alt_video_type: 'video/avi' };

        expect(applyBrowserPlayableVideos([photo, video])).toEqual([photo, video]);
    });
});
