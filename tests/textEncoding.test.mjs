import test from 'node:test';
import assert from 'node:assert/strict';
import { repairMojibakeText } from '../lib/utils/textEncoding.js';

test('repairs double-decoded Bangla text', () => {
    assert.equal(repairMojibakeText('à¦¡à§‡à¦®à§‹ à¦—à¦£à¦¿à¦¤'), 'ডেমো গণিত');
});

test('preserves valid Bangla and English text', () => {
    assert.equal(repairMojibakeText('নাগরিক সেবা'), 'নাগরিক সেবা');
    assert.equal(repairMojibakeText('DigiGram'), 'DigiGram');
});
