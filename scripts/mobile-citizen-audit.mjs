import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseUrl = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const failures = [];
let checks = 0;

function pass(label) {
    checks += 1;
    console.log(`PASS  ${label}`);
}

function fail(label, detail) {
    checks += 1;
    failures.push({ label, detail });
    console.error(`FAIL  ${label}: ${detail}`);
}

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

function expectSource(label, file, patterns) {
    const source = read(file);
    const missing = patterns.filter((pattern) => !pattern.test(source));
    if (missing.length) fail(label, `missing ${missing.map(String).join(', ')}`);
    else pass(label);
}

async function request(pathname, options = {}, expected = [200]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
        const response = await fetch(`${baseUrl}${pathname}`, {
            redirect: 'manual',
            headers: {
                'User-Agent': 'DigiGram-Mobile-Audit/1.0',
                ...(options.headers || {})
            },
            ...options,
            signal: controller.signal
        });
        if (expected.includes(response.status)) pass(`${pathname} returned ${response.status}`);
        else fail(pathname, `expected ${expected.join('/')}, received ${response.status}`);
    } catch (error) {
        fail(pathname, error instanceof Error ? error.message : 'request failed');
    } finally {
        clearTimeout(timer);
    }
}

expectSource('Mobile viewport is constrained', 'app/layout.js', [
    /width:\s*["']device-width["']/,
    /maximumScale:\s*1/
]);
expectSource('Global mobile controls meet touch and overflow rules', 'app/globals.css', [
    /overflow-x:\s*hidden/,
    /min-height:\s*44px/,
    /safe-area-inset-bottom/
]);
expectSource('Bottom navigation respects device safe area', 'components/layout/BottomNav.js', [
    /safe-area-inset-bottom/,
    /sm:hidden/
]);
expectSource('Citizen portal exposes a mobile task navigator', 'app/(site)/citizen/page.js', [
    /grid-cols-5/,
    /md:hidden/,
    /min-h-14/
]);
expectSource('Household forms use mobile-height modals', 'components/sections/ward/HouseholdEntryForm.js', [
    /100dvh/,
    /overflow-y-auto/,
    /safe-area-inset-bottom/
]);
expectSource('Footer subscription input can shrink on narrow screens', 'components/layout/SiteFooter.js', [
    /w-full min-w-0/,
    /sm:min-w-\[280px\]/
]);

for (const pathname of ['/citizen', '/pay', '/track', '/business', '/services/market']) {
    await request(pathname);
}

const jsonPost = (body) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

await request('/api/citizen/otp', jsonPost({ phone: 'invalid' }), [400]);
await request('/api/citizen/inbox', jsonPost({}), [400]);
await request('/api/citizen/complaints', jsonPost({}), [400, 422]);
await request('/api/citizen/appointments', jsonPost({}), [400, 422]);
await request('/api/citizen/life-support', jsonPost({}), [400, 422]);
await request('/api/citizen/blood', jsonPost({}), [400, 422]);
await request('/api/payments/citizen', jsonPost({}), [400, 401]);

console.log(`\n${checks - failures.length}/${checks} mobile/citizen checks passed.`);
if (failures.length) process.exitCode = 1;
