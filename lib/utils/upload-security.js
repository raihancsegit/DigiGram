const IMAGE_RULES = {
    'image/jpeg': {
        extension: 'jpg',
        matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    },
    'image/png': {
        extension: 'png',
        matches: (bytes) => [
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
        ].every((value, index) => bytes[index] === value)
    },
    'image/webp': {
        extension: 'webp',
        matches: (bytes) => (
            ascii(bytes, 0, 4) === 'RIFF'
            && ascii(bytes, 8, 12) === 'WEBP'
        )
    },
    'image/gif': {
        extension: 'gif',
        matches: (bytes) => ['GIF87a', 'GIF89a'].includes(ascii(bytes, 0, 6))
    }
};

const DOCUMENT_RULES = {
    ...IMAGE_RULES,
    'application/pdf': {
        extension: 'pdf',
        matches: (bytes) => ascii(bytes, 0, 5) === '%PDF-'
    }
};

function ascii(bytes, start, end) {
    return String.fromCharCode(...bytes.slice(start, end));
}

export async function validateUploadedFile(file, {
    kind = 'image',
    maxBytes = 5 * 1024 * 1024
} = {}) {
    if (!file || typeof file.slice !== 'function' || typeof file.arrayBuffer !== 'function') {
        return { error: 'A valid file is required' };
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
        return { error: 'The selected file is empty' };
    }
    if (file.size > maxBytes) {
        return { error: `File size must be ${formatMegabytes(maxBytes)}MB or less` };
    }

    const rules = kind === 'document' ? DOCUMENT_RULES : IMAGE_RULES;
    const rule = rules[file.type];
    if (!rule) {
        return {
            error: kind === 'document'
                ? 'Only JPG, PNG, WebP, GIF, or PDF files are allowed'
                : 'Only JPG, PNG, WebP, or GIF images are allowed'
        };
    }

    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!rule.matches(bytes)) {
        return { error: 'File content does not match its declared type' };
    }

    return {
        extension: rule.extension,
        mimeType: file.type
    };
}

export function createSafeUploadName(extension) {
    return `${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

export function sanitizeStorageSegment(value, fallback = 'file') {
    const sanitized = String(value || '')
        .normalize('NFKC')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
    return sanitized || fallback;
}

function formatMegabytes(bytes) {
    return Number((bytes / (1024 * 1024)).toFixed(1));
}
