import { describe, test, expect } from 'vitest';
import { loadHelpers } from '../helpers/loadFromSwiperInit.js';

// iCloud gallery tiles start with the small thumbnail and switch to the large
// rendition only when the screen needs more pixels than the thumbnail has.
function setup(fit = 'cover', dpr = 1) {
    return loadHelpers(['galleryTileNeedsUpgrade'], {
        window: { getComputedStyle: () => ({ objectFit: fit }), devicePixelRatio: dpr },
    }).galleryTileNeedsUpgrade;
}

const img = (w, h, nw, nh) => ({ clientWidth: w, clientHeight: h, naturalWidth: nw, naturalHeight: nh });

describe('gallery tile upgrade', () => {
    test('keeps the thumbnail when it covers the tile', () => {
        expect(setup()(img(280, 210, 374, 460))).toBe(false);
    });

    test('upgrades when the tile is larger than the thumbnail', () => {
        expect(setup()(img(645, 484, 374, 460))).toBe(true);
    });

    test('cover needs both sides covered, contain only one', () => {
        // 300x500 tile, 374x460 thumbnail: height is 9% short.
        expect(setup('cover')(img(300, 500, 374, 460))).toBe(true);
        expect(setup('contain')(img(300, 500, 374, 460))).toBe(false);
    });

    test('tolerates a few percent of upscaling', () => {
        expect(setup()(img(390, 300, 374, 460))).toBe(false);
    });

    test('upgrades on high-density screens when the thumbnail lacks pixels', () => {
        expect(setup('cover', 2)(img(240, 180, 374, 460))).toBe(true);
        expect(setup('cover', 2)(img(150, 110, 374, 460))).toBe(false);
    });

    test('does nothing while the image or the tile has no size yet', () => {
        expect(setup()(img(0, 0, 374, 460))).toBe(false);
        expect(setup()(img(280, 210, 0, 0))).toBe(false);
    });
});
