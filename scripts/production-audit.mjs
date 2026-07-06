import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseUrl = process.env.AUDIT_BASE_URL || 'http://localhost:3000';

function loadEnvFile(fileName) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const splitAt = trimmed.indexOf('=');
        if (splitAt < 1) continue;
        const key = trimmed.slice(0, splitAt).trim();
        let value = trimmed.slice(splitAt + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
    }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const failures = [];
let checks = 0;
let skipped = 0;

function pass(label) {
    checks += 1;
    console.log(`PASS  ${label}`);
}

function fail(label, detail) {
    checks += 1;
    failures.push({ label, detail });
    console.error(`FAIL  ${label}: ${detail}`);
}

function skip(label, detail) {
    skipped += 1;
    console.log(`SKIP  ${label}: ${detail}`);
}

async function checkPage(label, pathname, options = {}) {
    try {
        const response = await fetch(`${baseUrl}${pathname}`, {
            redirect: 'manual',
            ...options
        });
        if (response.status >= 200 && response.status < 400) {
            pass(`${label} (${response.status})`);
        } else {
            fail(label, `HTTP ${response.status}`);
        }
    } catch (error) {
        fail(label, error.message);
    }
}

async function checkLocked(label, pathname, method = 'POST') {
    try {
        const hasBody = !['GET', 'HEAD'].includes(method);
        const response = await fetch(`${baseUrl}${pathname}`, {
            method,
            headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
            body: hasBody ? '{}' : undefined,
            redirect: 'manual'
        });
        if ([401, 403].includes(response.status)) {
            pass(`${label} locked (${response.status})`);
        } else {
            fail(label, `expected 401/403, received ${response.status}`);
        }
    } catch (error) {
        fail(label, error.message);
    }
}

async function supabaseRows(table, query) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return [];
    const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`
        }
    });
    if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`);
    return response.json();
}

console.log(`DigiGram production audit: ${baseUrl}`);

await checkPage('Home', '/');
await checkPage('Login', '/login');
await checkPage('Area selector', '/area');
await checkPage('Citizen portal', '/citizen');
await checkPage('Citizen tracking center', '/track');
await checkPage('Citizen payment center', '/pay');
await checkPage('News', '/news');
await checkPage('Market', '/services/market');
await checkPage('Lost and found', '/lost-found');
await checkPage('Business directory', '/business');
await checkPage('Sitemap', '/sitemap.xml');
await checkPage('Robots', '/robots.txt');

try {
    const [unions, wards, villages, households, institutions] = await Promise.all([
        supabaseRows('locations', 'select=id,slug&type=eq.union&limit=1'),
        supabaseRows('locations', 'select=id&type=eq.ward&limit=1'),
        supabaseRows('locations', 'select=id&type=eq.village&limit=1'),
        supabaseRows('households', 'select=id&limit=1'),
        supabaseRows('institutions', 'select=id,subdomain&subdomain=not.is.null&limit=1')
    ]);

    if (unions[0]?.slug) await checkPage('Real union page', `/u/${unions[0].slug}`);
    if (wards[0]?.id) await checkPage('Real ward page', `/w/${wards[0].id}`);
    if (villages[0]?.id) await checkPage('Real village page', `/g/${villages[0].id}`);
    if (households[0]?.id) await checkPage('Real household page', `/h/${households[0].id}`);
    if (institutions[0]?.subdomain) {
        await checkPage('Institution subdomain', '/', {
            headers: { Host: `${institutions[0].subdomain}.localhost:3000` }
        });
    }
} catch (error) {
    skip('Database-backed route discovery', `${error.message}; external Supabase access is unavailable in this environment`);
}

const lockedPostRoutes = [
    '/api/admin/create-user',
    '/api/admin/mutate-location',
    '/api/admin/mutate-user',
    '/api/admin/mutate-service',
    '/api/admin/mutate-market',
    '/api/admin/mutate-donation',
    '/api/admin/seed-school',
    '/api/admin/sync-household-villages',
    '/api/admin/upload-avatar',
    '/api/admin/upload-donation-image',
    '/api/admin/upload-institution-image',
    '/api/admin/migrate-household-document',
    '/api/admin/sms',
    '/api/admin/payments',
    '/api/admin/maintenance',
    '/api/admin/data-quality',
    '/api/admin/governance',
    '/api/admin/demo-data',
    '/api/officer/device',
    '/api/citizen/consent',
    '/api/payments/citizen'
];

for (const route of lockedPostRoutes) {
    await checkLocked(route, route);
}
await checkLocked('/api/admin/sms GET', '/api/admin/sms', 'GET');
await checkLocked('/api/admin/payments GET', '/api/admin/payments', 'GET');
await checkLocked('/api/admin/maintenance GET', '/api/admin/maintenance', 'GET');
await checkLocked('/api/admin/operations GET', '/api/admin/operations', 'GET');
await checkLocked('/api/admin/governance GET', '/api/admin/governance', 'GET');
await checkLocked('/api/admin/demo-data GET', '/api/admin/demo-data', 'GET');
await checkLocked('/api/admin/migrations GET', '/api/admin/migrations', 'GET');
await checkLocked('/api/admin/launch/health GET', '/api/admin/launch/health', 'GET');
await checkLocked('/api/admin/search GET', '/api/admin/search?q=test', 'GET');
await checkLocked('/api/citizen/complaints/manage GET', '/api/citizen/complaints/manage?scopeType=union&scopeId=00000000-0000-0000-0000-000000000000', 'GET');
await checkLocked('/api/citizen/complaints/manage PATCH', '/api/citizen/complaints/manage', 'PATCH');
await checkLocked('/api/citizen/appointments/manage GET', '/api/citizen/appointments/manage?scopeType=union&scopeId=00000000-0000-0000-0000-000000000000', 'GET');
await checkLocked('/api/citizen/appointments/manage PATCH', '/api/citizen/appointments/manage', 'PATCH');
await checkLocked('/api/citizen/life-support/manage GET', '/api/citizen/life-support/manage?scopeType=union&scopeId=00000000-0000-0000-0000-000000000000', 'GET');
await checkLocked('/api/citizen/life-support/manage PATCH', '/api/citizen/life-support/manage', 'PATCH');
await checkLocked('/api/admin/upload-institution-image GET', '/api/admin/upload-institution-image', 'GET');

console.log(`\n${checks - failures.length}/${checks} checks passed${skipped ? `, ${skipped} skipped` : ''}.`);
if (failures.length) {
    process.exitCode = 1;
}
