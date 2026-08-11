import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const experienceSource = fs.readFileSync('lib/constants/institutionWebsiteExperience.js', 'utf8');
const defaultsSource = fs.readFileSync('lib/constants/schoolWebsiteDefaults.js', 'utf8');
const rendererSource = fs.readFileSync('components/sections/institution/SchoolTenantWebsite.js', 'utf8');
const referenceHomeSource = fs.readFileSync('components/sections/institution/InstitutionReferenceHome.js', 'utf8');
const pageHeroSource = fs.readFileSync('components/sections/institution/InstitutionPageHero.js', 'utf8');
const managerSource = fs.readFileSync('components/sections/institution/InstitutionWebsiteManager.js', 'utf8');
const portalServiceSource = fs.readFileSync('lib/services/institutionPortalService.js', 'utf8');
const nextConfigSource = fs.readFileSync('next.config.mjs', 'utf8');

function importSource(source) {
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

async function loadPortalService(supabase) {
    globalThis.__institutionWebsiteTestSupabase = supabase;
    const instrumented = portalServiceSource.replace(
        "import { supabase } from '@/lib/utils/supabase';",
        'const supabase = globalThis.__institutionWebsiteTestSupabase;'
    );
    assert.doesNotMatch(instrumented, /^import /m);
    return importSource(`${instrumented}\n// test-load-${Date.now()}-${Math.random()}`);
}

async function loadSchoolDefaults(getInstitutionWebsiteExperience) {
    globalThis.__institutionWebsiteExperienceGetter = getInstitutionWebsiteExperience;
    const instrumented = defaultsSource.replace(
        "import { getInstitutionWebsiteExperience } from '@/lib/constants/institutionWebsiteExperience';",
        'const getInstitutionWebsiteExperience = globalThis.__institutionWebsiteExperienceGetter;'
    );
    assert.doesNotMatch(instrumented, /^import /m);
    return importSource(`${instrumented}\n// test-load-${Date.now()}-${Math.random()}`);
}

function assertValidDefaultImage(imageUrl) {
    const url = new URL(imageUrl);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'images.unsplash.com');
    assert.match(url.pathname, /^\/photo-[a-z0-9-]+$/);
    assert.equal(url.searchParams.get('auto'), 'format');
    assert.equal(url.searchParams.get('fit'), 'crop');
    assert.ok(Number(url.searchParams.get('w')) >= 500);
    assert.ok(Number(url.searchParams.get('q')) >= 60);
}

test('school, college, kindergarten and madrasa ship distinct complete home experiences', async () => {
    const { getInstitutionWebsiteExperience } = await importSource(experienceSource);
    const categories = ['high_school', 'college', 'kindergarten', 'dakhil_madrasa'];
    const experiences = categories.map((category) => getInstitutionWebsiteExperience(category));

    assert.equal(new Set(experiences.map(({ template }) => template)).size, categories.length);
    assert.equal(
        new Set(experiences.map(({ heroTitle, heroSubtitle }) => `${heroTitle}:${heroSubtitle}`)).size,
        categories.length
    );

    for (const experience of experiences) {
        assert.ok(experience.heroTitle);
        assert.ok(experience.heroSubtitle);
        assert.ok(experience.admissionText);
        assert.ok(experience.approvalText);
        assert.ok(experience.seoKeywords);
        for (const collection of [
            'ticker',
            'stats',
            'highlights',
            'classes',
            'teachers',
            'facilities',
            'admission',
            'slider',
            'gallery',
            'achievements',
            'events',
            'programs',
            'faqs'
        ]) {
            assert.ok(Array.isArray(experience[collection]), `${collection} must be editable list content`);
            assert.ok(experience[collection].length >= 3, `${collection} must have useful starter content`);
        }
        assert.ok(experience.slider.every((item) => /^https:\/\/images\.unsplash\.com\//.test(item.image_url)));
        assert.ok(experience.gallery.every((item) => /^https:\/\/images\.unsplash\.com\//.test(item.image_url)));
        assert.ok(experience.teachers.every((item) => /^https:\/\/images\.unsplash\.com\//.test(item.image_url)));
        assert.ok(experience.cta?.title);
        assert.ok(experience.cta?.button);
    }
});

test('renderer uses category template defaults while allowing persisted theme overrides', () => {
    assert.match(rendererSource, /const experience = getInstitutionWebsiteExperience\(institution\.category\)/);
    assert.match(
        rendererSource,
        /template: institution\.theme\?\.template \|\| experience\.template \|\| design\.defaultTemplate \|\| ['"]classic['"]/
    );
    assert.match(
        rendererSource,
        /layout_variant: institution\.theme\?\.layout_variant \|\| experience\.layout/
    );
    assert.match(rendererSource, /const template = getSchoolWebsiteTemplate\(theme\.template\)/);
    assert.match(rendererSource, /const isDarkTemplate = template\.tone === ['"]dark['"]/);
});

test('draft and publish persistence retain editable text, images and explicit empty lists', async () => {
    const writes = [];
    const supabase = {
        from(table) {
            assert.equal(table, 'institution_pages');
            return {
                upsert(payload, options) {
                    writes.push({ payload, options });
                    return {
                        select: () => ({
                            single: async () => ({ data: payload, error: null })
                        })
                    };
                }
            };
        }
    };
    const { institutionPortalService } = await loadPortalService(supabase);
    const content = {
        hero_title: 'Saved custom hero',
        banner_image_url: 'https://cdn.example.test/custom-hero.webp',
        public_teachers: [{ name: 'Saved teacher', image_url: 'https://cdn.example.test/teacher.webp' }],
        facilities: [],
        footer_links: {
            extra_sections: {
                slider: [],
                gallery: [{ title: 'Saved gallery', image_url: 'https://cdn.example.test/gallery.webp' }]
            }
        }
    };
    const theme = { template: 'dark_college', layout_variant: 'magazine' };

    await institutionPortalService.savePageDraft('institution-1', content, theme);
    await institutionPortalService.publishPage('institution-1', content, theme);

    assert.equal(writes.length, 2);
    assert.deepEqual(writes[0].payload.draft_content, content);
    assert.deepEqual(writes[0].payload.draft_theme, theme);
    assert.deepEqual(writes[1].payload.published_content, content);
    assert.deepEqual(writes[1].payload.draft_content, content);
    assert.deepEqual(writes[1].payload.draft_theme, theme);
    assert.equal(writes[1].payload.banner_image_url, content.banner_image_url);
    assert.deepEqual(writes[1].payload.facilities, []);
    assert.deepEqual(writes[1].payload.footer_links.extra_sections.slider, []);
    assert.ok(writes.every(({ options }) => options.onConflict === 'institution_id'));
});

test('public page hydration prefers the published snapshot including images and empty arrays', async () => {
    const storedPage = {
        institution_id: 'institution-1',
        hero_title: 'Old database column',
        banner_image_url: 'https://cdn.example.test/old.webp',
        facilities: [{ title: 'Old fallback facility' }],
        published_content: {
            hero_title: 'Live published hero',
            banner_image_url: 'https://cdn.example.test/live.webp',
            facilities: [],
            public_teachers: [],
            footer_links: { extra_sections: { slider: [], gallery: [] } }
        }
    };
    const supabase = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: async () => ({ data: storedPage, error: null })
                })
            })
        })
    };
    const { institutionPortalService } = await loadPortalService(supabase);

    const page = await institutionPortalService.getPublishedPage('institution-1');

    assert.equal(page.hero_title, 'Live published hero');
    assert.equal(page.banner_image_url, 'https://cdn.example.test/live.webp');
    assert.deepEqual(page.facilities, []);
    assert.deepEqual(page.public_teachers, []);
    assert.deepEqual(page.footer_links.extra_sections.slider, []);
    assert.deepEqual(page.footer_links.extra_sections.gallery, []);
});

test('CMS and renderer treat explicitly saved empty arrays as intentional content', () => {
    assert.match(managerSource, /function listValue\(value, fallback\) \{\s*return Array\.isArray\(value\) \? value : fallback;\s*\}/);
    assert.match(rendererSource, /function safeArray\(value, fallback = \[\]\) \{\s*return Array\.isArray\(value\) \? value : fallback;\s*\}/);
    assert.match(rendererSource, /function minimumArray\(value, fallback = \[\]\) \{\s*return Array\.isArray\(value\) \? value : fallback;\s*\}/);

    for (const field of ['stats', 'class_sections', 'public_teachers', 'facilities', 'admission_features']) {
        assert.match(rendererSource, new RegExp(`page\\?\\.${field}`));
    }
    for (const field of ['slider', 'gallery', 'events', 'programs']) {
        assert.match(rendererSource, new RegExp(`extraSections\\.${field}`));
    }

    assert.doesNotMatch(rendererSource, /Array\.isArray\(value\) && value\.length \? value : fallback/);
    assert.doesNotMatch(managerSource, /Array\.isArray\(value\) && value\.length \? value : fallback/);
});

test('reference homepage does not read removed or undeclared content props', () => {
    assert.doesNotMatch(referenceHomeSource, /teachers\?\./);
    assert.doesNotMatch(referenceHomeSource, /facilities\?\./);
});

test('inner pages share category-aware hero and template design primitives', () => {
    for (const page of ['about', 'classes', 'teachers', 'guardian', 'facilities', 'gallery', 'admission', 'notices', 'contact']) {
        assert.match(rendererSource, new RegExp(`${page}: \\{ title:`), `${page} needs inner-page metadata`);
        assert.match(rendererSource, new RegExp(`activePage === ['"]${page}['"]`), `${page} needs its own rendered page`);
    }

    assert.match(rendererSource, /const institutionKind = institution\.category === ['"]college['"]/);
    assert.match(rendererSource, /\['dakhil_madrasa', 'alim_madrasa'\]\.includes\(institution\.category\)/);
    assert.match(rendererSource, /institution\.category === ['"]kindergarten['"]/);
    assert.match(rendererSource, /activePage !== ['"]home['"] && <InstitutionPageHero/);
    assert.match(rendererSource, /category=\{institution\.category\}/);
    assert.match(rendererSource, /kind=\{institutionKind\}/);
    assert.match(rendererSource, /title=\{activeMenuItem\?\.label \|\| activeMeta\.title\}/);
    assert.match(rendererSource, /subtitle=\{activeMeta\.subtitle\}/);
    assert.match(rendererSource, /image=\{pageHeroImage\}/);

    for (const category of ['school', 'college', 'kindergarten', 'madrasa']) {
        assert.match(pageHeroSource, new RegExp(`${category}: \\{ shell:`));
        assert.match(pageHeroSource, new RegExp(`data-page-hero=\\{key\\}`));
    }
    assert.match(pageHeroSource, /function categoryKey\(category\)/);
    assert.match(pageHeroSource, /\['dakhil_madrasa', 'alim_madrasa'\]\.includes\(category\)/);
    assert.match(pageHeroSource, /const light = key === ['"]kindergarten['"] \|\| key === ['"]madrasa['"]/);
    assert.match(pageHeroSource, /onNavigate\(['"]admission['"]\)/);
    assert.match(pageHeroSource, /onNavigate\(['"]notices['"]\)/);

    for (const primitive of [
        'template.shellClass',
        'template.headerClass',
        'template.cardClass',
        'panelClass',
        'softPanelClass',
        'altSectionClass',
        'plainSectionClass',
        'sectionLeadClass'
    ]) {
        assert.match(rendererSource, new RegExp(primitive.replace('.', '\\.')));
    }
});

test('freshly provisioned category pages receive valid distinct default images', async () => {
    const { getInstitutionWebsiteExperience } = await importSource(experienceSource);
    const { buildSchoolWebsiteDemoPage } = await loadSchoolDefaults(getInstitutionWebsiteExperience);
    const categories = ['high_school', 'college', 'kindergarten', 'dakhil_madrasa'];
    const pages = categories.map((category) => buildSchoolWebsiteDemoPage({
        id: `${category}-1`,
        name: `${category} demo`,
        category,
        village: 'Demo village'
    }, category));

    assert.equal(new Set(pages.map((page) => page.banner_image_url)).size, categories.length);
    for (const page of pages) {
        assertValidDefaultImage(page.banner_image_url);
        assert.equal(page.banner_image_url, page.footer_links.extra_sections.slider[0].image_url);
        for (const imageUrl of [
            ...page.footer_links.extra_sections.slider.map((item) => item.image_url),
            ...page.footer_links.extra_sections.gallery.map((item) => item.image_url),
            ...page.public_teachers.map((item) => item.image_url)
        ]) {
            assertValidDefaultImage(imageUrl);
        }
    }

    assert.match(nextConfigSource, /hostname: ['"]images\.unsplash\.com['"]/);
    assert.match(nextConfigSource, /qualities: \[60, 75, 85\]/);
});

test('existing websites resolve saved imagery first and remain usable without any image', () => {
    assert.match(
        rendererSource,
        /const pageHeroImage = page\?\.banner_image_url \|\| sliderItems\[0\]\?\.image_url \|\| galleryItems\[0\]\?\.image_url \|\| ['"]['"];/
    );
    assert.match(rendererSource, /\{page\?\.logo_url \? \(/);
    assert.match(rendererSource, /<Image src=\{page\.logo_url\}/);
    assert.match(rendererSource, /image=\{pageHeroImage\}/);
    assert.match(rendererSource, /style=\{!pageHeroImage \? brandGradient : undefined\}/);
    assert.match(pageHeroSource, /const \[failedImageUrls, setFailedImageUrls\] = useState\(\[\]\)/);
    assert.match(pageHeroSource, /const displayImage = \[image, \.\.\.fallbackImages\]/);
    assert.match(pageHeroSource, /displayImage && <Image src=\{displayImage\}/);
    assert.match(pageHeroSource, /onError=\{\(\) => setFailedImageUrls/);
    assert.match(pageHeroSource, /!displayImage && <div/);
    assert.match(nextConfigSource, /hostname: ['"]\*\*\.supabase\.co['"]/);
    assert.match(nextConfigSource, /pathname: ['"]\/storage\/v1\/object\/\*\*['"]/);
});
