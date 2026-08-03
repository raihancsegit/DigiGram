import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = fs.readFileSync('lib/constants/citizenServices.js', 'utf8');
const hub = fs.readFileSync('components/citizen/CitizenServicesHub.js', 'utf8');
const detail = fs.readFileSync('app/(site)/citizen/services/[serviceId]/page.js', 'utf8');
const homeActions = fs.readFileSync('components/sections/home/HomeCitizenQuickActions.js', 'utf8');
const homeServices = fs.readFileSync('components/sections/home/HomeCitizenServicesSection.js', 'utf8');
const homePage = fs.readFileSync('app/(site)/page.js', 'utf8');
const householdPage = fs.readFileSync('app/(site)/h/[id]/page.js', 'utf8');
const serviceModal = fs.readFileSync('components/sections/service/ServiceRequestModal.js', 'utf8');

const serviceIds = ['certificates', 'benefits', 'complaints', 'emergency', 'documents', 'farmers', 'jobs', 'health', 'education', 'fees'];

test('citizen service catalog covers all ten public-service priorities', () => {
    for (const serviceId of serviceIds) assert.match(catalog, new RegExp(`id: '${serviceId}'`));
    assert.equal((catalog.match(/primaryHref:/g) || []).length, serviceIds.length);
    assert.equal((catalog.match(/documents:/g) || []).length, serviceIds.length);
    assert.equal((catalog.match(/steps:/g) || []).length, serviceIds.length);
});

test('citizen hub supports search, grouping and direct service details', () => {
    assert.match(hub, /setQuery/);
    assert.match(hub, /setGroup/);
    assert.match(hub, /\/citizen\/services\/\$\{service\.id\}/);
    assert.match(detail, /generateStaticParams/);
    assert.match(detail, /service\.primaryHref/);
    assert.match(detail, /service\.secondaryHref/);
});

test('home sends citizens through their household before applying', () => {
    assert.match(homeActions, /href: '\/#citizen-services'/);
    assert.match(homePage, /<HomeCitizenServicesSection \/>/);
    assert.match(homeServices, /router\.push\(`\/h\/\$\{encodeURIComponent\(value\)\}`\)/);
    assert.match(homeServices, /সব আবেদন নিজের বাড়ি থেকেই/);
    assert.doesNotMatch(homePage, /<HomeCitizenQuickActions \/>/);
    assert.doesNotMatch(homePage, /<HomeCitizenGateway \/>/);
});

test('household profile exposes every common service with family autofill', () => {
    for (const requestType of ['benefit_support', 'local_problem', 'emergency_support', 'document_update', 'farmer_support', 'job_training', 'health_support', 'education_support', 'fee_support']) {
        assert.ok(householdPage.includes(`key: '${requestType}'`));
        assert.ok(serviceModal.includes(`${requestType}:`));
    }
    assert.match(householdPage, /householdServices\.map/);
    assert.match(householdPage, /এই বাড়ির সব সেবা/);
    assert.match(serviceModal, /selectedResidentId/);
});
