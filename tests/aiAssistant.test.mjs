import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const assistant = fs.readFileSync('components/ai/AiAssistant.js', 'utf8');
const route = fs.readFileSync('app/api/ai/assistant/route.js', 'utf8');
const service = fs.readFileSync('lib/services/aiService.js', 'utf8');

test('assistant panel respects header, viewport and device safe areas', () => {
    assert.match(assistant, /top-\[calc\(4\.75rem\+env\(safe-area-inset-top\)\)\]/);
    assert.match(assistant, /bottom-\[calc\(1rem\+env\(safe-area-inset-bottom\)\)\]/);
    assert.match(assistant, /100dvh-8rem/);
    assert.match(assistant, /aria-modal="true"/);
});

test('assistant answers arbitrary questions through a protected server endpoint', () => {
    assert.match(service, /fetch\('\/api\/ai\/assistant'/);
    assert.match(route, /GEMINI_API_KEY/);
    assert.match(route, /consumeRateLimit/);
    assert.match(route, /maxLength: 1000/);
    assert.match(route, /Never invent live prices/);
});

test('assistant keeps useful local fallbacks when AI is unavailable', () => {
    for (const keyword of ['রক্ত', 'বাজার', 'ভাতা', 'অভিযোগ', 'স্কুল']) {
        assert.ok(service.includes(keyword));
    }
    assert.match(service, /AI সেবা সাময়িকভাবে পাওয়া যাচ্ছে না/);
});
