const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

function toEnglishDigits(value = '') {
    return String(value).replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)));
}

function extractDigits(text, keywords) {
    const keywordPattern = keywords.join('|');
    const match = toEnglishDigits(text).match(new RegExp(`(?:${keywordPattern})[^0-9]{0,12}([0-9\\s-]{8,22})`, 'i'));
    return match?.[1]?.replace(/\D/g, '') || '';
}

export function parseBanglaResidentVoice(transcript = '') {
    const normalized = toEnglishDigits(transcript).replace(/\s+/g, ' ').trim();
    const phone = normalized.match(/(?:\+?88)?(01\d{9})/)?.[1] || '';
    const nid = extractDigits(normalized, ['nid', 'এনআইডি', 'জাতীয় পরিচয়পত্র']);
    const birthRegNo = extractDigits(normalized, ['জন্ম নিবন্ধন', 'জন্ম সনদ', 'birth']);
    const ageMatch = normalized.match(/(?:বয়স|বয়স|age)\s*(?:হলো|হচ্ছে|প্রায়|প্রায়)?\s*(\d{1,3})/i);
    const bloodMatch = normalized.match(/(?:রক্তের গ্রুপ|ব্লাড গ্রুপ|blood group)\s*(a|b|ab|o)\s*([+-]|পজিটিভ|নেগেটিভ)?/i);
    const gender = /মহিলা|নারী|মেয়ে|মেয়ে|female/i.test(normalized)
        ? 'Female'
        : /পুরুষ|ছেলে|male/i.test(normalized)
            ? 'Male'
            : '';
    const relationMap = [
        [/খানা প্রধান|পরিবারের প্রধান|head/i, 'Head'],
        [/স্ত্রী|wife/i, 'Wife'],
        [/স্বামী|husband/i, 'Husband'],
        [/পুত্র|ছেলে|son/i, 'Son'],
        [/কন্যা|মেয়ে|মেয়ে|daughter/i, 'Daughter'],
        [/মা|mother/i, 'Mother'],
        [/বাবা|পিতা|father/i, 'Father']
    ];
    const relation = relationMap.find(([pattern]) => pattern.test(normalized))?.[1] || '';
    const nameMatch = normalized.match(/^(.*?)(?=,|।| বয়স| বয়স| age| এনআইডি| nid| জন্ম| রক্ত| ব্লাড| ফোন| মোবাইল| পুরুষ| মহিলা| নারী| ভোটার)/i);
    const name = (nameMatch?.[1] || '')
        .replace(/^(নাম|সদস্যের নাম)\s*[:\-]?\s*/i, '')
        .trim();

    let dob = '';
    const age = ageMatch ? Number(ageMatch[1]) : null;
    if (age && age > 0 && age < 130) {
        dob = `${new Date().getFullYear() - age}-01-01`;
    }

    let bloodGroup = '';
    if (bloodMatch) {
        const suffix = bloodMatch[2];
        const sign = suffix === '-' || /নেগেটিভ/i.test(suffix || '') ? '-' : '+';
        bloodGroup = `${bloodMatch[1].toUpperCase()}${sign}`;
    }

    return {
        name,
        phone,
        dob,
        age,
        nid: [10, 13, 17].includes(nid.length) ? nid : '',
        birth_reg_no: birthRegNo.length === 17 ? birthRegNo : '',
        blood_group: bloodGroup,
        gender,
        relation_with_head: relation,
        is_voter: /ভোটার|voter/i.test(normalized) && !/ভোটার নয়|ভোটার না|not voter/i.test(normalized)
    };
}
