import { describe, test, expect } from 'vitest';
import { loadHelpers } from '../helpers/loadFromSwiperInit.js';

// gallery-video-tile="thumbnail": the tile shows the video length bottom right.
const { buildVideoTileDurationHtml } = loadHelpers(['formatDurationText', 'jzsaEscapeAttr', 'buildVideoTileDurationHtml']);

describe('video tile duration label', () => {
    test('shows the length iCloud sent', () => {
        expect(buildVideoTileDurationHtml({ duration: 31.9, video: 'v.mp4' })).toContain('>0:31</span>');
    });

    test('stays empty for the prefetch to fill when the length is unknown', () => {
        const html = buildVideoTileDurationHtml({ video: 'https://x/v=dv' });
        expect(html).toContain('data-video-src="https://x/v=dv"');
        expect(html).toContain('"></span>');
    });
});
