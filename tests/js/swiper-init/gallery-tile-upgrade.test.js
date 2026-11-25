import { describe, test, expect } from 'vitest';
import { loadHelpers } from '../helpers/loadFromSwiperInit.js';

// iCloud gallery tiles show the small thumbnail first and switch to the large
// rendition only when the screen needs more pixels than the thumbnail has.
function setup(fit = 'cover', dpr = 1) {
    return loadHelpers(['galleryTileLacksPixels', 'galleryTileNeedsUpgrade'], {
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

describe('gallery tile upgrade order', () => {
    const { galleryTileUpgradePriority: priority } = loadHelpers(['galleryTileUpgradePriority']);
    const rect = (top, height = 200) => ({ top, bottom: top + height, width: 300, height });
    const vh = 800;

    test('visible tiles first, top to bottom', () => {
        expect(priority(rect(0), vh)).toBeLessThan(priority(rect(500), vh));
        expect(priority(rect(-100), vh)).toBeLessThan(priority(rect(900), vh));
    });

    test('then the tiles below the screen, nearest first, then the ones above', () => {
        const below1 = priority(rect(850), vh);
        const below2 = priority(rect(1400), vh);
        const above1 = priority(rect(-300), vh);
        expect(priority(rect(700), vh)).toBeLessThan(below1);
        expect(below1).toBeLessThan(below2);
        expect(below2).toBeLessThan(above1);
    });

    test('tiles more than one screen away or without size wait', () => {
        expect(priority(rect(1700), vh)).toBe(Infinity);
        expect(priority(rect(-1100), vh)).toBe(Infinity);
        expect(priority({ top: 0, bottom: 0, width: 0, height: 0 }, vh)).toBe(Infinity);
    });
});

describe('gallery tile load plan', () => {
    const { galleryTileLoadPlan: plan } = loadHelpers(['galleryTileLoadPlan'], {
        GALLERY_TILE_EAGER_COUNT: 100,
        GALLERY_TILE_FIRST_SCREEN_COUNT: 12,
    });

    test('Google tiles on desktop and Android use the browser lazy loading', () => {
        expect(plan(false, 0)).toBe('lazy');
        expect(plan(false, 500)).toBe('lazy');
    });

    test('iCloud thumbnails and Google tiles on iOS: first 100 right away, first screen first', () => {
        expect(plan(true, 0)).toBe('high');
        expect(plan(true, 11)).toBe('high');
        expect(plan(true, 12)).toBe('low');
        expect(plan(true, 99)).toBe('low');
    });

    test('tiles after the first 100 load when they come within reach (no iOS flicker)', () => {
        expect(plan(true, 100)).toBe('near');
        expect(plan(true, 999)).toBe('near');
    });
});
