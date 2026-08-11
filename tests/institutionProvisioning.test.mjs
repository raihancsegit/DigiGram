import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const service = fs.readFileSync('lib/services/institutionService.js', 'utf8');

async function loadServiceInternals() {
    const instrumentedSource = service
        .replace(
            "import { supabase } from '../utils/supabase';",
            'const supabase = {};'
        )
        .replace(
            "import { getInstitutionDesignProfile } from '@/lib/constants/institutionDesignProfiles';",
            "const getInstitutionDesignProfile = () => ({ primaryColor: '#000000', fontFamily: 'system' });"
        )
        .replace(
            /import \{\s*buildInstitutionStarterNotices,\s*buildSchoolWebsiteDemoPage\s*\} from '@\/lib\/constants\/schoolWebsiteDefaults';/,
            `const buildInstitutionStarterNotices = (institution) => institution.__starterNotices || [];
const buildSchoolWebsiteDemoPage = (institution) => ({ hero_title: institution.name });`
        );

    assert.doesNotMatch(instrumentedSource, /^import /m);
    const testableSource = `${instrumentedSource}\nexport {
        isEducationInstitution,
        provisionEducationStarterContent,
        rollbackInstitutionProvisioning
    };`;
    return import(`data:text/javascript;base64,${Buffer.from(testableSource).toString('base64')}`);
}

function sourceBetween(start, end) {
    const startIndex = service.indexOf(start);
    const endIndex = service.indexOf(end, startIndex + start.length);
    assert.notEqual(startIndex, -1, `Missing source marker: ${start}`);
    assert.notEqual(endIndex, -1, `Missing source marker: ${end}`);
    return service.slice(startIndex, endIndex);
}

test('all supported education categories and legacy madrasa types receive starter content', () => {
    for (const category of [
        'school',
        'primary_school',
        'high_school',
        'college',
        'kindergarten',
        'dakhil_madrasa',
        'alim_madrasa',
        'madrasa',
        'madrassa'
    ]) {
        assert.match(service, new RegExp(`['"]${category}['"]`));
    }

    assert.match(service, /function normalizeInstitutionKind/);
    assert.match(service, /EDUCATION_TYPES\.has\(normalizeInstitutionKind\(institution\.type\)\)/);
    assert.match(service, /if \(isEducationInstitution\(data\)\)/);
});

test('starter notices are deduplicated in memory and against existing institution notices', () => {
    const preparation = sourceBetween(
        'export function prepareInstitutionStarterNotices',
        'async function rollbackInstitutionProvisioning'
    );
    const provisioning = sourceBetween(
        'async function provisionEducationStarterContent',
        '/**\n * Service to manage Institutions'
    );

    assert.match(preparation, /const seen = new Set\(\)/);
    assert.match(preparation, /seen\.has\(identity\)/);
    assert.match(preparation, /seen\.add\(identity\)/);
    assert.match(provisioning, /\.select\(['"]title, audience['"]\)/);
    assert.match(provisioning, /\.eq\(['"]institution_id['"], institution\.id\)/);
    assert.match(provisioning, /\.in\(['"]title['"], noticeTitles\)/);
    assert.match(provisioning, /existingNoticeIdentities/);
    assert.match(provisioning, /\.insert\(missingNotices\)/);
    assert.doesNotMatch(provisioning, /\.insert\(starterNotices\)/);
});

test('page and notice provisioning is ordered and every write error is surfaced', () => {
    const provisioning = sourceBetween(
        'async function provisionEducationStarterContent',
        '/**\n * Service to manage Institutions'
    );
    const pageWrite = provisioning.indexOf("from('institution_pages').upsert");
    const existingNoticeRead = provisioning.indexOf("from('institution_notices')");

    assert.notEqual(pageWrite, -1);
    assert.notEqual(existingNoticeRead, -1);
    assert.ok(pageWrite < existingNoticeRead, 'page creation must finish before notice writes begin');
    assert.match(provisioning, /if \(pageError\) throw pageError/);
    assert.match(provisioning, /if \(existingNoticeError\) throw existingNoticeError/);
    assert.match(provisioning, /if \(noticeError\) throw noticeError/);
    assert.doesNotMatch(provisioning, /Promise\.all/);
});

test('partial starter failure removes child content and verifies parent rollback', () => {
    const rollback = sourceBetween(
        'async function rollbackInstitutionProvisioning',
        'async function provisionEducationStarterContent'
    );
    const addInstitution = sourceBetween(
        'addInstitution: async',
        '// 3. Get Institutions by Union'
    );

    assert.match(rollback, /\['institution_notices', 'institution_pages'\]/);
    assert.match(rollback, /\.delete\(\)\.eq\(['"]institution_id['"], institutionId\)/);
    assert.match(rollback, /from\(['"]institutions['"]\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\(['"]id['"], institutionId\)[\s\S]*?\.select\(['"]id['"]\)/);
    assert.match(rollback, /institutionRemoved = !error && data\?\.length === 1/);
    assert.match(rollback, /throw new AggregateError\(cleanupErrors/);
    assert.match(addInstitution, /catch \(provisionError\)[\s\S]*?await rollbackInstitutionProvisioning\(supabase, data\.id\)/);
    assert.match(addInstitution, /\[provisionError, rollbackError\]/);
    assert.match(addInstitution, /throw provisionError/);
});

test('provisioning unit: only missing unique starter notices are inserted', async () => {
    const { provisionEducationStarterContent } = await loadServiceInternals();
    const writes = { page: [], notices: [] };
    const institution = {
        id: 'institution-1',
        name: 'Test Academy',
        category: 'school',
        __starterNotices: [
            { title: 'Admission', audience: 'public' },
            { title: 'Admission', audience: 'public' },
            { title: 'Routine', audience: 'public' },
            { title: 'Routine', audience: 'guardians' }
        ]
    };
    const client = {
        from(table) {
            if (table === 'institution_pages') {
                return {
                    upsert: async (payload) => {
                        writes.page.push(payload);
                        return { error: null };
                    }
                };
            }
            assert.equal(table, 'institution_notices');
            return {
                select: () => ({
                    eq: () => ({
                        in: async () => ({
                            data: [
                                { title: 'Admission', audience: 'public' },
                                { title: 'Routine', audience: 'guardians' }
                            ],
                            error: null
                        })
                    })
                }),
                insert: async (payload) => {
                    writes.notices.push(...payload);
                    return { error: null };
                }
            };
        }
    };

    await provisionEducationStarterContent(client, institution);

    assert.equal(writes.page.length, 1);
    assert.deepEqual(
        writes.notices.map(({ title, audience, institution_id }) => ({ title, audience, institution_id })),
        [{ title: 'Routine', audience: 'public', institution_id: 'institution-1' }]
    );
});

test('rollback unit: parent cascade is authoritative and a missing parent delete is reported', async () => {
    const { rollbackInstitutionProvisioning } = await loadServiceInternals();

    function rollbackClient(parentRows) {
        return {
            from(table) {
                if (table === 'institutions') {
                    return {
                        delete: () => ({
                            eq: () => ({
                                select: async () => ({ data: parentRows, error: null })
                            })
                        })
                    };
                }
                return {
                    delete: () => ({
                        eq: async () => ({ error: new Error(`${table} cleanup denied`) })
                    })
                };
            }
        };
    }

    await assert.doesNotReject(
        rollbackInstitutionProvisioning(rollbackClient([{ id: 'institution-1' }]), 'institution-1')
    );
    await assert.rejects(
        rollbackInstitutionProvisioning(rollbackClient([]), 'institution-1'),
        (error) => error instanceof AggregateError && error.errors.length >= 1
    );
});
