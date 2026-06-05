'use client';

import { householdService } from '@/lib/services/householdService';
import { supabase } from '@/lib/utils/supabase';

const OUTBOX_KEY = 'digigram-household-outbox:v1';
const OUTBOX_EVENT = 'digigram-household-outbox-change';
let activeSyncPromise = null;

function readEntries() {
    if (typeof window === 'undefined') return [];
    try {
        const value = JSON.parse(window.localStorage.getItem(OUTBOX_KEY) || '[]');
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function writeEntries(entries) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(OUTBOX_EVENT, { detail: entries }));
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

function updateEntry(id, patch) {
    const entries = readEntries();
    const index = entries.findIndex((entry) => entry.id === id);
    if (index === -1) return null;
    entries[index] = { ...entries[index], ...patch, updatedAt: new Date().toISOString() };
    writeEntries(entries);
    return entries[index];
}

async function syncEntry(originalEntry) {
    let entry = updateEntry(originalEntry.id, {
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
            entry = updateEntry(entry.id, { household: householdData }) || entry;
        }

        if (remoteHouseholdId) {
            await householdService.updateHousehold(remoteHouseholdId, householdData);
        } else {
            const created = await householdService.createHousehold(householdData);
            remoteHouseholdId = created.id;
        }

        entry = updateEntry(entry.id, { remoteHouseholdId }) || entry;

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
        writeEntries(readEntries().filter((item) => item.id !== entry.id));
        return { success: true, id: entry.id, householdId: remoteHouseholdId };
    } catch (error) {
        updateEntry(entry.id, {
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

    getEntries() {
        return readEntries();
    },

    getSummary() {
        const entries = readEntries();
        return {
            total: entries.length,
            pending: entries.filter((entry) => entry.status !== 'failed').length,
            failed: entries.filter((entry) => entry.status === 'failed').length,
            syncing: entries.filter((entry) => entry.status === 'syncing').length
        };
    },

    queue(snapshot) {
        const entries = readEntries();
        const identity = snapshot.household?.qr_code_id
            || snapshot.householdId
            || createLocalId('household');
        const existingIndex = entries.findIndex((entry) => entry.identity === identity);
        const entry = {
            id: existingIndex >= 0 ? entries[existingIndex].id : createLocalId('outbox'),
            identity,
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
        writeEntries(entries);
        return entry;
    },

    async syncAll() {
        if (activeSyncPromise) return activeSyncPromise;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { synced: 0, failed: readEntries().length, offline: true };
        }

        activeSyncPromise = (async () => {
            let synced = 0;
            let failed = 0;
            for (const entry of readEntries()) {
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
