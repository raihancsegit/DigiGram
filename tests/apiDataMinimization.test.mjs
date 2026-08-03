import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('public API queries select only fields needed by their clients', () => {
    for (const file of [
        'app/api/payments/citizen/route.js',
        'app/api/household/documents/route.js',
        'app/api/business-directory/route.js'
    ]) {
        assert.doesNotMatch(read(file), /\.select\(\s*['"`]\*['"`]\s*\)/, `${file} must not select every column`);
    }

    const directory = read('app/api/business-directory/route.js');
    assert.match(directory, /PUBLIC_BUSINESS_FIELDS/);
    assert.match(directory, /MANAGED_BUSINESS_FIELDS/);
    const publicFields = directory.match(/const PUBLIC_BUSINESS_FIELDS = `([\s\S]*?)`;/)?.[1] || '';
    assert.doesNotMatch(publicFields, /owner_name|rejection_reason|approved_by/);
});

test('blood request returns only a donor count, never donor identities or phones', () => {
    const route = read('app/api/citizen/blood/route.js');
    assert.match(route, /possibleDonorCount/);
    assert.doesNotMatch(route, /possibleDonors|household:households|item\.phone/);

    const page = read('app/(site)/citizen/page.js');
    assert.match(page, /result\.possibleDonorCount/);
    assert.doesNotMatch(page, /result\.possibleDonors/);
});
