import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.env.ENV_AUDIT_STRICT === '1';
const failures = [];
const warnings = [];

function loadEnvFile(fileName) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) return;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const splitAt = trimmed.indexOf('=');
        if (splitAt < 1) continue;
        const key = trimmed.slice(0, splitAt).trim();
        let value = trimmed.slice(splitAt + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'"))
        ) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
    }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function pass(label) {
    console.log(`PASS  ${label}`);
}

function issue(label, detail, required = true) {
    if (strict && required) {
        failures.push({ label, detail });
        console.error(`FAIL  ${label}: ${detail}`);
    } else {
        warnings.push({ label, detail });
        console.warn(`WARN  ${label}: ${detail}`);
    }
}

function has(name) {
    return typeof process.env[name] === 'string' && process.env[name].trim().length > 0;
}

function requireValue(name) {
    if (has(name)) pass(`${name} is configured`);
    else issue(name, 'missing');
}

function requireUrl(name, { httpsInStrict = false } = {}) {
    if (!has(name)) return issue(name, 'missing');
    try {
        const url = new URL(process.env[name]);
        if (httpsInStrict && strict && url.protocol !== 'https:') {
            return issue(name, 'must use HTTPS in production');
        }
        pass(`${name} is a valid URL`);
    } catch {
        issue(name, 'invalid URL');
    }
}

function requireSecret(name, minimumLength) {
    if (!has(name)) return issue(name, 'missing');
    if (process.env[name].length < minimumLength) {
        return issue(name, `must be at least ${minimumLength} characters`);
    }
    pass(`${name} meets minimum length`);
}

requireUrl('NEXT_PUBLIC_SUPABASE_URL', { httpsInStrict: true });
requireValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');
requireValue('SUPABASE_SERVICE_ROLE_KEY');
requireUrl('NEXT_PUBLIC_SITE_URL', { httpsInStrict: true });
requireValue('NEXT_PUBLIC_ROOT_DOMAIN');
requireSecret('CITIZEN_SESSION_SECRET', 32);
requireSecret('FUEL_OPERATOR_SESSION_SECRET', 32);
requireSecret('CRON_SECRET', 16);
requireSecret('SMS_WORKER_SECRET', 16);
requireSecret('SMS_WEBHOOK_SECRET', 16);

if (
    has('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    && has('SUPABASE_SERVICE_ROLE_KEY')
    && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY
) {
    failures.push({ label: 'Supabase keys', detail: 'anon and service-role keys must differ' });
    console.error('FAIL  Supabase keys: anon and service-role keys must differ');
} else if (has('NEXT_PUBLIC_SUPABASE_ANON_KEY') && has('SUPABASE_SERVICE_ROLE_KEY')) {
    pass('Supabase anon and service-role keys differ');
}

for (const optionalName of ['GEMINI_API_KEY', 'ERROR_MONITOR_WEBHOOK_URL', 'SMS_PROVIDER_API_KEY', 'BULKSMSBD_API_KEY']) {
    if (has(optionalName)) pass(`${optionalName} optional integration is configured`);
    else console.log(`SKIP  ${optionalName} optional integration is not configured`);
}

const publicSecretNames = Object.keys(process.env).filter(
    (name) => name.startsWith('NEXT_PUBLIC_') && /(SECRET|SERVICE_ROLE|PASSWORD|TOKEN|API_KEY)/i.test(name)
);
if (publicSecretNames.length) {
    failures.push({ label: 'Public environment variables', detail: 'secret-like names use NEXT_PUBLIC_' });
    console.error(`FAIL  Public environment variables: ${publicSecretNames.length} secret-like name(s) use NEXT_PUBLIC_`);
} else {
    pass('No secret-like environment names use NEXT_PUBLIC_');
}

console.log(`\n${failures.length ? 'NOT READY' : 'READY'}: ${failures.length} failure(s), ${warnings.length} warning(s).`);
if (!strict && warnings.length) console.log('Run with ENV_AUDIT_STRICT=1 for production release enforcement.');
if (failures.length) process.exitCode = 1;
