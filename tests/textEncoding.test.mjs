import test from 'node:test';
import assert from 'node:assert/strict';
import { repairMojibakeText, repairMojibakeValue } from '../lib/utils/textEncoding.js';

test('repairs double-decoded Bangla text', () => {
    assert.equal(repairMojibakeText('à¦¡à§‡à¦®à§‹ à¦—à¦£à¦¿à¦¤'), 'ডেমো গণিত');
});

test('preserves valid Bangla and English text', () => {
    assert.equal(repairMojibakeText('নাগরিক সেবা'), 'নাগরিক সেবা');
    assert.equal(repairMojibakeText('DigiGram'), 'DigiGram');
});

test('normalizes nested market records before rendering', () => {
    const result = repairMojibakeValue({
        name: 'à¦¡à§‡à¦®à§‹ à¦¬à¦¾à¦œà¦¾à¦°',
        commodity: { name: 'à¦šà¦¾à¦²', unit: 'à¦•à§‡à¦œà¦¿' },
    });

    assert.deepEqual(result, {
        name: 'ডেমো বাজার',
        commodity: { name: 'চাল', unit: 'কেজি' },
    });
});
