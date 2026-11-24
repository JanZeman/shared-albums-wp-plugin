import { describe, test, expect } from 'vitest';
import { loadHelpers } from '../helpers/loadFromSwiperInit.js';

// iCloud gallery tiles use the small thumbnail and switch to the large rendition
// only when the screen needs more pixels than the thumbnail has.
function load(fit = 'cover', dpr = 1) {
    return loadHelpers(['galleryTileLacksPixels', 'galleryTileNeedsUpgrade', 'chooseGalleryTileStart'], {
        window: { getComputedStyle: () => ({ objectFit: fit }), devicePixelRatio: dpr },
        directMediaUrl: (url) => 'direct:' + url,
    });
}

function setup(fit = 'cover', dpr = 1) {
    return load(fit, dpr).galleryTileNeedsUpgrade;
}

// A tile image before it loads, with the thumbnail size it would get.
function tileImg(w, h, attrs) {
    const a = { 'data-jzsa-upgrade-src': 'large', 'data-jzsa-tile-w': '374', 'data-jzsa-tile-h': '460', ...attrs };
    return {
        clientWidth: w,
        clientHeight: h,
        getAttribute: (k) => (k in a ? a[k] : null),
        hasAttribute: (k) => k in a,
        setAttribute: (k, v) => { a[k] = v; },
        removeAttribute: (k) => { delete a[k]; },
        attrs: a,
    };
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

describe('gallery tile start', () => {
    test('keeps the thumbnail where it has enough pixels', () => {
        const el = tileImg(280, 210, { src: 'thumb' });
        load('cover', 1).chooseGalleryTileStart(el);
        expect(el.attrs.src).toBe('thumb');
        expect(el.attrs['data-jzsa-upgrade-src']).toBe('large');
    });

    test('loads the large rendition straight away on high-density screens', () => {
        const el = tileImg(280, 210, { src: 'thumb' });
        load('cover', 2).chooseGalleryTileStart(el);
        expect(el.attrs.src).toBe('direct:large');
        expect(el.attrs['data-jzsa-upgrade-src']).toBeUndefined();
    });

    test('a tile still waiting for direct URLs gets the large URL to load later', () => {
        const el = tileImg(280, 210, { 'data-jzsa-src': 'thumb' });
        load('cover', 2).chooseGalleryTileStart(el);
        expect(el.attrs['data-jzsa-src']).toBe('large');
        expect(el.attrs.src).toBeUndefined();
    });

    test('keeps the thumbnail while the tile has no size or the thumbnail size is unknown', () => {
        const hidden = tileImg(0, 0, { src: 'thumb' });
        load('cover', 2).chooseGalleryTileStart(hidden);
        expect(hidden.attrs.src).toBe('thumb');
        const unknown = tileImg(280, 210, { src: 'thumb', 'data-jzsa-tile-w': null });
        delete unknown.attrs['data-jzsa-tile-w'];
        load('cover', 2).chooseGalleryTileStart(unknown);
        expect(unknown.attrs.src).toBe('thumb');
    });
});
