const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

function toEnglishDigits(value = '') {
    return String(value).replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)));
}

function cleanValue(value = '') {
    return toEnglishDigits(value)
        .replace(/\s+/g, ' ')
        .replace(/^[\s:：=\-–—]+|[\s,।;]+$/g, '')
        .trim();
}

function getLineValue(lines, labels) {
    for (const line of lines) {
        for (const label of labels) {
            const pattern = new RegExp(`^\\s*(?:${label})\\s*[:：=\\-–—]?\\s*(.+)$`, 'i');
            const match = line.match(pattern);
            if (match?.[1]) return cleanValue(match[1]);
        }
    }
    return '';
}

function extractDigits(text, labels, minLength = 8, maxLength = 22) {
    const labelPattern = labels.join('|');
    const match = text.match(new RegExp(`(?:${labelPattern})[^0-9]{0,16}([0-9\\s\\-]{${minLength},${maxLength + 8}})`, 'i'));
    return match?.[1]?.replace(/\D/g, '') || '';
}

function extractPhone(text) {
    return text.match(/(?:\+?88)?(01\d{9})/)?.[1] || '';
}

function extractAge(text) {
    const match = text.match(/(?:বয়স|বয়স|age)[^\d]{0,8}(\d{1,3})/i);
    const age = match ? Number(match[1]) : null;
    return age && age > 0 && age < 130 ? age : null;
}

function dobFromAge(age) {
    if (!age) return '';
    return `${new Date().getFullYear() - age}-01-01`;
}

function parseGender(text) {
    if (/নারী|মহিলা|মেয়ে|মেয়ে|female/i.test(text)) return 'Female';
    if (/পুরুষ|ছেলে|male/i.test(text)) return 'Male';
    return '';
}

function parseRelation(text, index) {
    const relationRules = [
        [/খানা প্রধান|পরিবার প্রধান|প্রধান|head/i, 'Head'],
        [/স্ত্রী|wife/i, 'Wife'],
        [/স্বামী|husband/i, 'Husband'],
        [/পুত্র|ছেলে|son/i, 'Son'],
        [/কন্যা|মেয়ে|মেয়ে|daughter/i, 'Daughter'],
        [/মাতার নাম|মাতা|mother/i, 'Mother'],
        [/পিতার নাম|পিতা|father/i, 'Father']
    ];
    return relationRules.find(([pattern]) => pattern.test(text))?.[1] || (index === 0 ? 'Head' : 'Other');
}

function parseBloodGroup(text) {
    const match = text.match(/(?:রক্ত|ব্লাড|blood)[^ABO]{0,16}(AB|A|B|O)\s*([+\-]|পজিটিভ|নেগেটিভ)/i)
        || text.match(/\b(AB|A|B|O)\s*([+\-])\b/i);
    if (!match) return '';
    const sign = match[2] === '-' || /নেগেটিভ/i.test(match[2]) ? '-' : '+';
    return `${match[1].toUpperCase()}${sign}`;
}

function parseVoter(text, age) {
    if (/ভোটার\s*(না|নয়|নয়)|not voter/i.test(text)) return false;
    if (/ভোটার|voter/i.test(text)) return true;
    return Boolean(age && age >= 18);
}

function stripMemberPrefix(line) {
    return line
        .replace(/^\s*(?:সদস্য\s*)?\d+[\).।\-]\s*/i, '')
        .replace(/^\s*[-*•]\s*/, '')
        .trim();
}

function parseMemberName(line) {
    const withoutPrefix = stripMemberPrefix(line);
    const firstPart = withoutPrefix.split(/[,।;]/)[0] || '';
    return cleanValue(firstPart.replace(/^(নাম|সদস্যের নাম)\s*[:：=\-–—]?\s*/i, ''));
}

function parseMemberLine(line, index, fallbackAddress = '') {
    const normalized = cleanValue(stripMemberPrefix(line));
    const age = extractAge(normalized);
    const nid = extractDigits(normalized, ['nid', 'এনআইডি', 'জাতীয় পরিচয়পত্র', 'জাতীয় পরিচয়পত্র'], 8, 22);
    const birthRegNo = extractDigits(normalized, ['জন্ম নিবন্ধন', 'জন্ম সনদ', 'birth'], 8, 22);

    return {
        name: parseMemberName(line),
        gender: parseGender(normalized) || 'Male',
        is_voter: parseVoter(normalized, age),
        relation_with_head: parseRelation(normalized, index),
        dob: dobFromAge(age),
        nid: [10, 13, 17].includes(nid.length) ? nid : '',
        birth_reg_no: birthRegNo.length === 17 ? birthRegNo : '',
        father_name: getInlineValue(normalized, ['পিতার নাম', 'পিতা', 'father']),
        mother_name: getInlineValue(normalized, ['মাতার নাম', 'মাতা', 'mother']),
        address: fallbackAddress,
        blood_group: parseBloodGroup(normalized),
        occupation: getInlineValue(normalized, ['পেশা', 'occupation']),
        education_level: getInlineValue(normalized, ['শিক্ষা', 'education']),
        marital_status: /অবিবাহিত|unmarried/i.test(normalized) ? 'Unmarried' : 'Married',
        disability_status: /প্রতিবন্ধী|disability/i.test(normalized) ? 'Yes' : 'None',
        student_status: /ছাত্র|ছাত্রী|student|school/i.test(normalized) ? 'student' : 'not_student',
        expanded: index === 0
    };
}

function getInlineValue(text, labels) {
    const labelPattern = labels.join('|');
    const match = text.match(new RegExp(`(?:${labelPattern})\\s*[:：=\\-–—]?\\s*([^,।;]+)`, 'i'));
    return cleanValue(match?.[1] || '');
}

function splitMemberLines(lines) {
    const memberStart = lines.findIndex((line) => /^সদস্য|^members?/i.test(line.trim()));
    const sourceLines = memberStart >= 0 ? lines.slice(memberStart + 1) : lines;

    return sourceLines
        .map(stripMemberPrefix)
        .filter((line) => {
            if (!line) return false;
            if (/^(গ্রাম|village|বাড়ি|বাড়ি|house|পরিবার প্রধান|খানা প্রধান|মোবাইল|phone|ঠিকানা|address)\b/i.test(line)) return false;
            return /,|।|;|বয়স|বয়স|age|nid|এনআইডি|ভোটার|পিতা|মাতা|স্বামী|স্ত্রী|পুত্র|কন্যা/i.test(line);
        });
}

export function parseHouseholdNotebookText(text = '') {
    const normalizedText = toEnglishDigits(text).replace(/\r/g, '\n');
    const lines = normalizedText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const villageName = getLineValue(lines, ['গ্রাম', 'village']);
    const address = getLineValue(lines, ['ঠিকানা', 'address']);
    const houseNo = getLineValue(lines, ['বাড়ি নং', 'বাড়ি নং', 'বাড়ি নম্বর', 'বাড়ি নম্বর', 'হোল্ডিং', 'house no', 'holding']);
    const ownerName = getLineValue(lines, ['পরিবার প্রধান', 'খানা প্রধান', 'গৃহপ্রধান', 'head', 'owner']);
    const phone = getLineValue(lines, ['মোবাইল', 'ফোন', 'phone', 'mobile']) || extractPhone(normalizedText);
    const religion = getLineValue(lines, ['ধর্ম', 'religion']);

    const memberLines = splitMemberLines(lines);
    const residents = memberLines
        .map((line, index) => parseMemberLine(line, index, address))
        .filter((resident) => resident.name);

    if (residents.length > 0 && ownerName && !residents.some((resident) => resident.relation_with_head === 'Head')) {
        residents[0].relation_with_head = 'Head';
    }

    return {
        household: {
            house_no: houseNo,
            owner_name: ownerName || residents.find((resident) => resident.relation_with_head === 'Head')?.name || residents[0]?.name || '',
            phone,
            religion: religion || ''
        },
        residents,
        meta: {
            villageName,
            address,
            memberLines: memberLines.length,
            warnings: buildWarnings({ villageName, houseNo, ownerName, phone, residents })
        }
    };
}

export function parseBulkHouseholdNotebookText(text = '') {
    const normalized = String(text || '').replace(/\r/g, '\n').trim();
    if (!normalized) return [];

    const separatedBlocks = normalized
        .split(/\n\s*(?:---+|={3,}|#{3,}|নতুন\s+বাড়ি|নতুন\s+বাড়ি|new\s+home|new\s+house)\s*\n/gi)
        .map((block) => block.trim())
        .filter(Boolean);

    const blocks = separatedBlocks.flatMap((block) => {
        const starts = [...block.matchAll(/(?:^|\n)(?=\s*(?:বাড়ি নং|বাড়ি নং|বাড়ি নম্বর|বাড়ি নম্বর|হোল্ডিং|house no)\s*[:：=\-–—])/gi)];
        if (starts.length <= 1) return [block];
        return starts.map((match, index) => {
            const start = match.index + (match[0].startsWith('\n') ? 1 : 0);
            const endMatch = starts[index + 1];
            const end = endMatch ? endMatch.index : block.length;
            return block.slice(start, end).trim();
        }).filter(Boolean);
    });

    return blocks
        .map((block, index) => ({
            id: `draft-${index + 1}`,
            raw: block,
            ...parseHouseholdNotebookText(block)
        }))
        .filter((draft) => draft.household?.owner_name || draft.household?.house_no || draft.residents?.length);
}

function buildWarnings({ villageName, houseNo, ownerName, phone, residents }) {
    const warnings = [];
    if (!villageName) warnings.push('Village name missing.');
    if (!houseNo) warnings.push('House/holding number missing.');
    if (!ownerName && !residents.length) warnings.push('Household head missing.');
    if (!phone) warnings.push('Mobile number missing.');
    if (!residents.length) warnings.push('No member lines detected.');

    const seenNids = new Set();
    residents.forEach((resident) => {
        if (!resident.nid) return;
        if (seenNids.has(resident.nid)) warnings.push(`Duplicate NID found: ${resident.nid}`);
        seenNids.add(resident.nid);
    });

    return warnings;
}
