import { describe, test, expect } from 'vitest';
import { loadHelpers } from '../helpers/loadFromSwiperInit.js';

const { buildJustifiedRows } = loadHelpers(['buildJustifiedRows']);

const items = (ratios) => ratios.map((ratio, index) => ({ ratio, index }));
const sizes = (rows) => rows.map((row) => row.length);

describe('buildJustifiedRows', () => {
    test('portraits and landscapes give rows of different lengths', () => {
        // 1000px wide, 200px rows: four portraits (150px) or two wide photos (400px+) fill a row.
        const rows = buildJustifiedRows(items([0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 2, 2, 1.5]), 1000, 200, 0);
        expect(sizes(rows)).toEqual([6, 3]);
    });

    test('closes a row before a photo that would overshoot more than the row falls short', () => {
        // 300 + 300 = 600 (40% short) vs 600 + 600 = 1200 (20% over): keep the third photo in.
        expect(sizes(buildJustifiedRows(items([1.5, 1.5, 3, 1]), 1000, 200, 0))).toEqual([3, 1]);
        // 450 + 450 = 900 (10% short) vs 900 + 600 = 1500 (50% over): start a new row.
        expect(sizes(buildJustifiedRows(items([2.25, 2.25, 3]), 1000, 200, 0))).toEqual([2, 1]);
    });
});
