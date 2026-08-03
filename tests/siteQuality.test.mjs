import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('PWA manifest and offline fallback are configured', () => {
    const manifest = JSON.parse(read('app/manifest.json'));
    assert.equal(manifest.lang, 'bn-BD');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.scope, '/');
    assert.ok(manifest.icons.length >= 2);

    const worker = read('public/sw.js');
    assert.match(worker, /['"]\/offline['"]/);
    assert.match(worker, /event\.request\.mode === ['"]navigate['"]/);
    assert.ok(fs.existsSync('app/(site)/offline/page.js'));

    const pwaRegistration = read('components/PWARegistration.js');
    assert.match(pwaRegistration, /INSTALL_PROMPT_DISMISSED_KEY/);
    assert.match(pwaRegistration, /!localHost && !updateReady && installPrompt && !installDismissed/);
    assert.match(pwaRegistration, /dismissInstallPrompt/);
});

test('global recovery and monitoring surfaces exist', () => {
    assert.ok(fs.existsSync('app/error.js'));
    assert.ok(fs.existsSync('app/global-error.js'));
    assert.ok(fs.existsSync('app/api/monitoring/client-event/route.js'));
    assert.ok(fs.existsSync('components/common/WebVitalsReporter.js'));
    assert.ok(fs.existsSync('components/common/ClientErrorReporter.js'));
});

test('public hierarchy pages provide dynamic metadata', () => {
    for (const file of [
        'app/(site)/u/[unionSlug]/page.js',
        'app/(site)/w/[id]/page.js',
        'app/(site)/g/[villageId]/page.js',
    ]) {
        assert.match(read(file), /export async function generateMetadata/);
    }
});

test('accessibility foundation includes skip link and focus styles', () => {
    assert.match(read('app/layout.js'), /href="#main-content"/);
    assert.match(read('components/layout/SiteShell.js'), /id="main-content"/);
    assert.match(read('app/globals.css'), /:focus-visible/);
    assert.match(read('app/globals.css'), /min-height:\s*44px/);
});

test('business directory tracks sponsored ad performance', () => {
    const directoryRoute = read('app/api/business-directory/route.js');
    assert.match(directoryRoute, /canReadAds/);
    assert.match(directoryRoute, /officer\?\.role === ['"]chairman['"]/);
    assert.match(directoryRoute, /adsQuery\.eq\(['"]union_id['"], officer\.access_scope_id\)/);
    assert.match(directoryRoute, /BUSINESS_DIRECTORY_MIGRATION_REQUIRED/);
    assert.match(directoryRoute, /61_local_business_directory_and_ads\.sql/);
    assert.match(directoryRoute, /BUSINESS_DIRECTORY_BACKEND_UNAVAILABLE/);

    const route = read('app/api/business-directory/track/route.js');
    assert.match(route, /body\.target === ['"]ad['"]/);
    assert.match(route, /\['impression', 'click'\]/);
    assert.match(route, /business_ads/);
    assert.match(route, /impression_count/);
    assert.match(route, /click_count/);

    const directory = read('components/sections/business/LocalBusinessDirectory.js');
    assert.match(directory, /trackAd\(ad, ['"]impression['"]\)/);
    assert.match(directory, /trackAd\(ad, ['"]click['"]\)/);
    assert.match(directory, /formatCtr\(ad\.click_count, ad\.impression_count\)/);
});

test('location routes keep demo ward selections reachable', () => {
    const paths = read('lib/constants/paths.js');
    assert.match(paths, /wardPortal: \(_unionSlug, wardIdOrSlug\) => `\/w\/\$\{wardIdOrSlug\}`/);
    assert.match(paths, /villagePortal: \(_unionSlug, _wardIdOrSlug, villageIdOrSlug\) => `\/g\/\$\{villageIdOrSlug\}`/);

    const hierarchy = read('lib/services/hierarchyService.js');
    assert.match(hierarchy, /buildCleanDemoUnionContext/);
    assert.match(hierarchy, /buildCleanDemoVillageContext/);
    assert.match(hierarchy, /buildDemoUnionContext/);
    assert.match(hierarchy, /buildDemoWardContext/);
    assert.match(hierarchy, /buildAccurateDemoWardContext/);
    assert.match(hierarchy, /demoEmptyStats/);
    assert.match(hierarchy, /startsWith\('demo-ward'\)/);

    const unionPage = read('app/(site)/u/[unionSlug]/page.js');
    assert.match(unionPage, /buildCleanDemoUnionContext\(unionSlug\)/);

    const nestedWardPage = read('app/(site)/u/[unionSlug]/w/[wardId]/page.js');
    assert.match(nestedWardPage, /startsWith\('demo-union'\)/);
    assert.match(nestedWardPage, /getWardFullContext\(wardId\)/);

    const nestedVillagePage = read('app/(site)/u/[unionSlug]/w/[wardId]/v/[villageId]/page.js');
    assert.match(nestedVillagePage, /getVillageFullContext\(villageId\)/);

    const demoHouseholds = read('lib/utils/demoHouseholds.js');
    assert.match(demoHouseholds, /buildDemoHouseholdsForVillage/);
    assert.match(demoHouseholds, /buildDemoVillageStats/);
    assert.match(demoHouseholds, /demo-village-\$\{key\}/);

    const publicHouseholds = read('app/api/public/households/route.js');
    assert.match(publicHouseholds, /startsWith\('demo-village'\)/);
    assert.match(publicHouseholds, /buildDemoHouseholdsForVillage\(villageId\)/);
    assert.match(publicHouseholds, /demo: true/);

    const householdService = read('lib/services/householdService.js');
    assert.match(householdService, /isDemoVillageId\(villageId\)/);
    assert.match(householdService, /buildDemoHouseholdsForVillage\(villageId\)/);
    assert.match(householdService, /isDemoWardId\(wardId\)/);
});

test('navigation shows immediate loading feedback', () => {
    assert.ok(fs.existsSync('app/(site)/loading.js'));

    const loading = read('app/(site)/loading.js');
    assert.match(loading, /fixed inset-0/);
    assert.match(loading, /min-h-\[100dvh\]/);
    assert.match(loading, /role="status"/);

    const rootLayout = read('app/layout.js');
    assert.doesNotMatch(
        rootLayout,
        /RouteChangeListener/,
        'custom navigation overlays must not compete with the native loading boundary'
    );
});

test('portal login roles have stable dashboard routes and auth fallbacks', () => {
    const routes = read('lib/utils/portalRoutes.js');
    assert.match(routes, /super_admin'\) return '\/admin'/);
    assert.match(routes, /chairman'\) return '\/chairman\/dashboard'/);
    assert.match(routes, /ward_member'\) return '\/ward-member\/dashboard'/);
    assert.match(routes, /volunteer'\) return '\/volunteer\/dashboard'/);
    assert.match(routes, /market_manager'\) return '\/market-manager'/);
    assert.match(routes, /institution_admin/);

    const loginModal = read('components/modals/PortalLoginModal.js');
    assert.match(loginModal, /getPortalRouteForRole\(profile\.role\)/);
    assert.match(loginModal, /getPortalRouteForRole\(existingProfile\.role\)/);

    const loginPage = read('app/(site)/login/page.js');
    assert.match(loginPage, /getPortalRouteForRole\(profile\.role\)/);
    assert.match(loginPage, /getPortalRouteForRole\(existingProfile\.role\)/);

    const chairmanDashboard = read('app/(site)/chairman/dashboard/page.js');
    assert.match(chairmanDashboard, /getPortalRouteForRole\(profile\.role\)/);
    assert.match(chairmanDashboard, /getPortalRouteForRole\(currentUser\.role\)/);

    const wardMemberDashboard = read('app/(site)/ward-member/dashboard/page.js');
    assert.match(wardMemberDashboard, /getPortalRouteForRole\(profile\.role\)/);
    assert.match(wardMemberDashboard, /getPortalRouteForRole\(currentUser\.role\)/);

    const volunteerDashboard = read('app/(site)/volunteer/dashboard/page.js');
    assert.match(volunteerDashboard, /performLogout/);
    assert.match(volunteerDashboard, /setLoading\(false\);\s*return;/);

    const siteShell = read('components/layout/SiteShell.js');
    assert.match(siteShell, /\['\/admin', '\/chairman', '\/ward-member', '\/volunteer', '\/market-manager'\]/);
    assert.match(siteShell, /pathname === '\/login'/);
    assert.match(siteShell, /showPublicChrome \? "dg-content-stack outline-none" : "min-h-screen bg-slate-50 outline-none"/);

    const adminLayout = read('app/(site)/admin/layout.js');
    assert.match(adminLayout, /Admin auth check timed out/);
    assert.match(adminLayout, /authError/);

    const marketLayout = read('app/(site)/market-manager/layout.js');
    assert.match(marketLayout, /Market manager auth check timed out/);

    const volunteerLayout = read('app/(site)/volunteer/layout.js');
    assert.match(volunteerLayout, /Volunteer auth check timed out/);
    assert.match(volunteerLayout, /authService\.getProfile/);
});
