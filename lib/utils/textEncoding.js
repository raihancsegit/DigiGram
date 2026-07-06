const CP1252_BYTES = {
    '€': 0x80,
    '‚': 0x82,
    'ƒ': 0x83,
    '„': 0x84,
    '…': 0x85,
    '†': 0x86,
    '‡': 0x87,
    'ˆ': 0x88,
    '‰': 0x89,
    'Š': 0x8a,
    '‹': 0x8b,
    'Œ': 0x8c,
    'Ž': 0x8e,
    '‘': 0x91,
    '’': 0x92,
    '“': 0x93,
    '”': 0x94,
    '•': 0x95,
    '–': 0x96,
    '—': 0x97,
    '˜': 0x98,
    '™': 0x99,
    'š': 0x9a,
    '›': 0x9b,
    'œ': 0x9c,
    'ž': 0x9e,
    'Ÿ': 0x9f
};

const MOJIBAKE_MARKERS = /[ÃÂâ€�˜€¦�]|à[¦§]/;

function mojibakeScore(value = '') {
    return (String(value).match(/[ÃÂâ€�˜€¦�]|à[¦§]/g) || []).length;
}

function decodeMojibakeOnce(value) {
    const bytes = [];

    for (const char of String(value)) {
        const code = char.charCodeAt(0);
        if (code <= 0xff) {
            bytes.push(code);
        } else if (CP1252_BYTES[char] !== undefined) {
            bytes.push(CP1252_BYTES[char]);
        } else {
            return value;
        }
    }

    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    } catch {
        return value;
    }
}

export function repairMojibakeText(value) {
    if (typeof value !== 'string' || !MOJIBAKE_MARKERS.test(value)) return value;

    let current = value;
    let currentScore = mojibakeScore(current);

    for (let step = 0; step < 3; step += 1) {
        const decoded = decodeMojibakeOnce(current);
        const decodedScore = mojibakeScore(decoded);
        if (decoded === current || decodedScore > currentScore) break;
        current = decoded;
        currentScore = decodedScore;
        if (currentScore === 0) break;
    }

    return current;
}

export function repairMojibakeValue(value) {
    if (typeof value === 'string') return repairMojibakeText(value);
    if (Array.isArray(value)) return value.map(repairMojibakeValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, repairMojibakeValue(entry)])
        );
    }
    return value;
}
