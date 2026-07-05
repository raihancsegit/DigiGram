'use client';

const DATABASE_NAME = 'digigram-secure-offline';
const DATABASE_VERSION = 1;
const KEY_STORE = 'crypto-keys';
const DEVICE_KEY_ID = 'household-field-data:v1';
const ENVELOPE_VERSION = 1;

let deviceKeyPromise = null;

function requireBrowserCrypto() {
    if (
        typeof window === 'undefined'
        || !window.crypto?.subtle
        || typeof window.indexedDB === 'undefined'
    ) {
        throw new Error('Secure offline storage is not supported on this device.');
    }
}

function openKeyDatabase() {
    requireBrowserCrypto();

    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(KEY_STORE)) {
                database.createObjectStore(KEY_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Unable to open secure storage.'));
    });
}

async function loadOrCreateDeviceKey() {
    const database = await openKeyDatabase();

    try {
        const existingKey = await new Promise((resolve, reject) => {
            const transaction = database.transaction(KEY_STORE, 'readonly');
            const request = transaction.objectStore(KEY_STORE).get(DEVICE_KEY_ID);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
        if (existingKey) return existingKey;

        const generatedKey = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        await new Promise((resolve, reject) => {
            const transaction = database.transaction(KEY_STORE, 'readwrite');
            transaction.objectStore(KEY_STORE).put(generatedKey, DEVICE_KEY_ID);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });

        return generatedKey;
    } finally {
        database.close();
    }
}

function getDeviceKey() {
    if (!deviceKeyPromise) {
        deviceKeyPromise = loadOrCreateDeviceKey().catch((error) => {
            deviceKeyPromise = null;
            throw error;
        });
    }
    return deviceKeyPromise;
}

function bytesToBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return window.btoa(binary);
}

function base64ToBytes(value) {
    const binary = window.atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function additionalData(namespace, recordId) {
    return new TextEncoder().encode(`${namespace}:${recordId}:v${ENVELOPE_VERSION}`);
}

export function isSecureOfflineEnvelope(value) {
    return value?.secure === true
        && value?.version === ENVELOPE_VERSION
        && typeof value?.iv === 'string'
        && typeof value?.ciphertext === 'string';
}

export async function encryptOfflineJson(namespace, recordId, value) {
    requireBrowserCrypto();
    const key = await getDeviceKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            additionalData: additionalData(namespace, recordId)
        },
        key,
        plaintext
    );

    return {
        secure: true,
        version: ENVELOPE_VERSION,
        algorithm: 'AES-GCM',
        iv: bytesToBase64(iv),
        ciphertext: bytesToBase64(new Uint8Array(ciphertext))
    };
}

export async function decryptOfflineJson(namespace, recordId, envelope) {
    if (!isSecureOfflineEnvelope(envelope)) {
        throw new Error('Invalid secure offline data.');
    }

    requireBrowserCrypto();
    const key = await getDeviceKey();
    const plaintext = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: base64ToBytes(envelope.iv),
            additionalData: additionalData(namespace, recordId)
        },
        key,
        base64ToBytes(envelope.ciphertext)
    );

    return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function readSecureLocalJson(storageKey, namespace = storageKey) {
    if (typeof window === 'undefined') return null;
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (isSecureOfflineEnvelope(parsed)) {
        return decryptOfflineJson(namespace, storageKey, parsed);
    }

    await writeSecureLocalJson(storageKey, parsed, namespace);
    return parsed;
}

export async function writeSecureLocalJson(storageKey, value, namespace = storageKey) {
    if (typeof window === 'undefined') return;
    const envelope = await encryptOfflineJson(namespace, storageKey, value);
    window.localStorage.setItem(storageKey, JSON.stringify(envelope));
}

export function removeSecureLocalJson(storageKey) {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(storageKey);
    }
}
