'use client';

import { householdService } from '@/lib/services/householdService';
import { supabase } from '@/lib/utils/supabase';
import {
    decryptOfflineJson,
    encryptOfflineJson,
    isSecureOfflineEnvelope
} from '@/lib/utils/secureOfflineStorage';

const LEGACY_OUTBOX_KEY = 'digigram-household-outbox:v1';
const OUTBOX_KEY = 'digigram-household-outbox:v2';
const OUTBOX_NAMESPACE = 'digigram-household-outbox';
const OUTBOX_EVENT = 'digigram-household-outbox-change';
let activeSyncPromise = null;

function parseArray(value) {
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function readStoredRecords() {
    if (typeof window === 'undefined') return [];
    return parseArray(window.localStorage.getItem(OUTBOX_KEY));
}

function readLegacyEntries() {
    if (typeof window === 'undefined') return [];
    return parseArray(window.localStorage.getItem(LEGACY_OUTBOX_KEY));
}

function recordMetadata(entry) {
    return {
        id: entry.id,
        identity: entry.identity,
        ownerId: entry.ownerId || null,
        status: entry.status || 'pending',
        attempts: entry.attempts || 0,
        lastError: entry.lastError || null,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
    };
}

function summarizeRecords(records = readStoredRecords()) {
    const metadata = [...records, ...readLegacyEntries()];
    return {
        total: metadata.length,
        pending: metadata.filter((entry) => entry.status !== 'failed').length,
        failed: metadata.filter((entry) => entry.status === 'failed').length,
        syncing: metadata.filter((entry) => entry.status === 'syncing').length,
        encrypted: records.length
    };
}

async function encryptEntry(entry) {
    return {
        ...recordMetadata(entry),
        payload: await encryptOfflineJson(OUTBOX_NAMESPACE, entry.id, entry)
    };
}

async function decryptRecord(record) {
    if (isSecureOfflineEnvelope(record?.payload)) {
        return decryptOfflineJson(OUTBOX_NAMESPACE, record.id, record.payload);
    }
    return record;
}

async function writeEntries(entries) {
    if (typeof window === 'undefined') return;
    const records = [];
    for (const entry of entries) records.push(await encryptEntry(entry));
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(OUTBOX_EVENT, { detail: summarizeRecords(records) }));
}

async function readEntries() {
    const entries = [];
    for (const record of readStoredRecords()) {
        try {
            entries.push(await decryptRecord(record));
        } catch (error) {
            console.warn('Unable to decrypt an offline household entry:', error);
        }
    }

    const legacyEntries = readLegacyEntries();
    if (legacyEntries.length === 0) return entries;

    const merged = [...entries];
    for (const legacyEntry of legacyEntries) {
        if (!merged.some((entry) => entry.id === legacyEntry.id)) merged.push(legacyEntry);
    }
    await writeEntries(merged);
    window.localStorage.removeItem(LEGACY_OUTBOX_KEY);
    return merged;
}

function createLocalId(prefix = 'offline') {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}:${crypto.randomUUID()}`;
    }
    return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function cleanHouseholdData(data = {}) {
    const {
        id,
        residents,
        village,
        stats,
        locker_pin,
        created_at,
        updated_at,
        ...clean
    } = data;

    return {
        ...clean,
        lat: clean.lat === '' ? null : clean.lat,
        lng: clean.lng === '' ? null : clean.lng
    };
}

function cleanResidentData(resident = {}, householdId) {
    return {
        name: resident.name?.trim(),
        name_en: resident.name_en || null,
        gender: resident.gender || 'Male',
        is_voter: !!resident.is_voter,
        relation_with_head: resident.relation_with_head || 'Other',
        dob: resident.dob || null,
        nid: resident.nid || null,
        birth_reg_no: resident.birth_reg_no || null,
        father_name: resident.father_name || null,
        mother_name: resident.mother_name || null,
        address: resident.address || null,
        blood_group: resident.blood_group || null,
        occupation: resident.occupation || null,
        education_level: resident.education_level || null,
        marital_status: resident.marital_status || 'Married',
        disability_status: resident.disability_status || 'None',
        household_id: householdId
    };
}

async function findExistingHousehold(entry) {
    if (entry.remoteHouseholdId) return entry.remoteHouseholdId;
    if (entry.mode === 'edit' && entry.householdId && !entry.householdId.startsWith('offline:')) {
        return entry.householdId;
    }

    const qrCodeId = entry.household?.qr_code_id;
    if (!qrCodeId) return null;

    const { data } = await supabase
        .from('households')
        .select('id')
        .eq('qr_code_id', qrCodeId)
        .maybeSingle();

    return data?.id || null;
}

async function findExistingResident(householdId, resident) {
    if (resident.id) return resident.id;

    let query = supabase
        .from('residents')
        .select('id,name,dob,relation_with_head,nid,birth_reg_no')
        .eq('household_id', householdId);

    if (resident.nid) query = query.eq('nid', resident.nid);
    else if (resident.birth_reg_no) query = query.eq('birth_reg_no', resident.birth_reg_no);
    else {
        query = query
            .eq('name', resident.name)
            .eq('relation_with_head', resident.relation_with_head || 'Other');
        if (resident.dob) query = query.eq('dob', resident.dob);
    }

    const { data } = await query.limit(1).maybeSingle();
    return data?.id || null;
}

async function updateEntry(id, patch) {
    const entries = await readEntries();
    const index = entries.findIndex((entry) => entry.id === id);
    if (index === -1) return null;
    entries[index] = { ...entries[index], ...patch, updatedAt: new Date().toISOString() };
    await writeEntries(entries);
    return entries[index];
}

async function syncEntry(originalEntry) {
    let entry = await updateEntry(originalEntry.id, {
        status: 'syncing',
        lastError: null,
        attempts: (originalEntry.attempts || 0) + 1
    }) || originalEntry;

    try {
        let remoteHouseholdId = await findExistingHousehold(entry);
        let householdData = cleanHouseholdData(entry.household);

        if (!remoteHouseholdId && (!householdData.qr_code_id || !householdData.house_no)) {
            const { data: identifiers, error: identifierError } = await supabase.rpc('reserve_household_identifiers', {
                target_ward_id: entry.wardId,
                target_village_id: entry.villageId,
                target_location_village_id: entry.locationVillageId || householdData.location_village_id || null
            });
            if (identifierError) throw identifierError;
            householdData = {
                ...householdData,
                qr_code_id: householdData.qr_code_id || identifiers?.qr_code_id,
                house_no: householdData.house_no || identifiers?.house_no
            };
            entry = await updateEntry(entry.id, { household: householdData }) || entry;
        }

        if (remoteHouseholdId) {
            await householdService.updateHousehold(remoteHouseholdId, householdData);
        } else {
            const created = await householdService.createHousehold(householdData);
            remoteHouseholdId = created.id;
        }

        entry = await updateEntry(entry.id, { remoteHouseholdId }) || entry;

        for (const resident of entry.residents || []) {
            if (!resident.name?.trim()) continue;
            const residentData = cleanResidentData(resident, remoteHouseholdId);
            const existingId = await findExistingResident(remoteHouseholdId, resident);
            if (existingId) await householdService.updateResident(existingId, residentData);
            else await householdService.createResident(residentData);
        }

        for (const residentId of entry.deletedResidentIds || []) {
            await householdService.deleteResident(residentId, remoteHouseholdId);
        }

        await householdService.syncHouseholdStats(remoteHouseholdId);
        await writeEntries((await readEntries()).filter((item) => item.id !== entry.id));
        return { success: true, id: entry.id, householdId: remoteHouseholdId };
    } catch (error) {
        await updateEntry(entry.id, {
            status: 'failed',
            lastError: error?.message || 'Sync failed'
        });
        return { success: false, id: entry.id, error };
    }
}

export const householdOfflineOutbox = {
    createTemporaryHouseholdId() {
        return createLocalId('offline');
    },

    async getEntries() {
        return readEntries();
    },

    getSummary() {
        return summarizeRecords();
    },

    async queue(snapshot) {
        const entries = await readEntries();
        const identity = snapshot.household?.qr_code_id
            || snapshot.householdId
            || createLocalId('household');
        const existingIndex = entries.findIndex((entry) => entry.identity === identity);
        const entry = {
            id: existingIndex >= 0 ? entries[existingIndex].id : createLocalId('outbox'),
            identity,
            ownerId: snapshot.ownerId || null,
            mode: snapshot.mode || 'create',
            householdId: snapshot.householdId || null,
            remoteHouseholdId: snapshot.remoteHouseholdId || null,
            household: cleanHouseholdData(snapshot.household),
            residents: (snapshot.residents || []).map((resident) => ({ ...resident, expanded: undefined })),
            deletedResidentIds: snapshot.deletedResidentIds || [],
            lockerPinRequired: !!snapshot.lockerPin,
            wardId: snapshot.wardId || null,
            villageId: snapshot.villageId || null,
            locationVillageId: snapshot.locationVillageId || null,
            status: 'pending',
            attempts: existingIndex >= 0 ? entries[existingIndex].attempts || 0 : 0,
            lastError: null,
            createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) entries[existingIndex] = entry;
        else entries.push(entry);
        await writeEntries(entries);
        return entry;
    },

    async syncAll(ownerId = null) {
        if (activeSyncPromise) return activeSyncPromise;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { synced: 0, failed: summarizeRecords().total, offline: true };
        }

        activeSyncPromise = (async () => {
            let synced = 0;
            let failed = 0;
            const entries = await readEntries();
            for (const entry of entries) {
                if (entry.ownerId && ownerId && entry.ownerId !== ownerId) continue;
                const result = await syncEntry(entry);
                if (result.success) synced += 1;
                else failed += 1;
            }
            return { synced, failed, offline: false };
        })();

        try {
            return await activeSyncPromise;
        } finally {
            activeSyncPromise = null;
        }
    },

    subscribe(callback) {
        if (typeof window === 'undefined') return () => {};
        const handler = () => callback(this.getSummary());
        window.addEventListener(OUTBOX_EVENT, handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener(OUTBOX_EVENT, handler);
            window.removeEventListener('storage', handler);
        };
    }
};
