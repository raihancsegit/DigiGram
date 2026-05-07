/**
 * রাজশাহী জেলা → উপজেলা → ইউনিয়ন → ওয়াড → গ্রাম
 * প্রতিটি ওয়াডে একজন নির্বাচিত মেম্বার থাকে।
 * পরে API/DB দিয়ে প্রতিস্থাপন। `slug` = URL (`/u/[unionSlug]`)।
 */

export const RAJSHAHI_GEO = {
    district: {
        id: 'rajshahi',
        name: 'রাজশাহী',
    },
    upazilas: [
        {
            id: 'paba',
            name: 'পবা',
            unions: [
                {
                    slug: 'poba',
                    name: 'দামকুড়া',
                    wards: [
                        {
                            id: 'ward-1',
                            name: 'ওয়াড নং ১',
                            member: { name: 'মোঃ মেম্বার আলী', phone: '01700000000' },
                            villages: [
                                { name: 'নওহাটা', population: '৪,৫০০', voters: '২,৮০০', maleVoters: '১,৪০০', femaleVoters: '১,৪০০', schools: '২', mosques: '৩', madrassas: '১', orphanages: '০' },
                                { name: 'চৌমুহনী', population: '৩,২০০', voters: '১,৯০০', maleVoters: '৯৫০', femaleVoters: '৯৫০', schools: '১', mosques: '২', madrassas: '০', orphanages: '১' }
                            ],
                        },
                        {
                            id: 'ward-2',
                            name: 'ওয়াড নং ২',
                            member: { name: 'মোঃ রফিকুল ইসলাম', phone: '01711111111' },
                            villages: [
                                { name: 'কাজলা', population: '৫,১০০', voters: '৩,২০০', maleVoters: '১,৬২০', femaleVoters: '১,৫৮০', schools: '২', mosques: '৪', madrassas: '১', orphanages: '০' },
                                { name: 'হেমায়েতপুর', population: '২,৮০০', voters: '১,৭০০', maleVoters: '৮৫০', femaleVoters: '৮৫০', schools: '১', mosques: '২', madrassas: '০', orphanages: '০' }
                            ],
                        },
                        {
                            id: 'ward-3',
                            name: 'ওয়াড নং ৩',
                            member: { name: 'মোঃ আবুল হাসান', phone: '01722222222' },
                            villages: [
                                { name: 'বাজুপুর', population: '৩,৫00', voters: '২,১০০', maleVoters: '১,০৫০', femaleVoters: '১,০৫০', schools: '১', mosques: '২', madrassas: '১', orphanages: '০' },
                                { name: 'সাহাপুর', population: '২,১০০', voters: '১,৩০০', maleVoters: '৬৫০', femaleVoters: '৬৫০', schools: '১', mosques: '১', madrassas: '০', orphanages: '০' },
                                { name: 'দুর্গাপুর', population: '৪,১০০', voters: '২,৫০০', maleVoters: '১,২৫০', femaleVoters: '১,২৫০', schools: '২', mosques: '৩', madrassas: '১', orphanages: '১' },
                                { name: 'মাদরাসাপাড়া', population: '১,৮০০', voters: '১,১০০', maleVoters: '৫৫০', femaleVoters: '৫৫০', schools: '০', mosques: '১', madrassas: '২', orphanages: '১' }
                            ],
                        },
                    ],
                },
                {
                    slug: 'horipur',
                    name: 'হরিপুর',
                    wards: [
                        {
                            id: 'ward-1',
                            name: 'ওয়াড নং ১',
                            member: { name: 'মোঃ শাহজাহান আলী', phone: '01733333333' },
                            villages: ['হরিপুর পশ্চিম', 'হরিপুর পূর্ব'],
                        },
                        {
                            id: 'ward-2',
                            name: 'ওয়াড নং ২',
                            member: { name: 'মোঃ আজিজুর রহমান', phone: '01744444444' },
                            villages: ['নিতাইপুর', 'গোপালপুর'],
                        },
                        {
                            id: 'ward-3',
                            name: 'ওয়াড নং ৩',
                            member: { name: 'মোঃ মিজানুর রহমান', phone: '01755555555' },
                            villages: ['চন্ডিপুর', 'বাগডাঙ্গা'],
                        },
                    ],
                },
                {
                    slug: 'noasha',
                    name: 'নওশা',
                    wards: [
                        {
                            id: 'ward-1',
                            name: 'ওয়াড নং ১',
                            member: { name: 'মোঃ হাসান আলী', phone: '01766666666' },
                            villages: ['নওশা', 'চর নওশা'],
                        },
                        {
                            id: 'ward-2',
                            name: 'ওয়াড নং ২',
                            member: { name: 'মোঃ সেলিম রেজা', phone: '01777777777' },
                            villages: ['বেহুলা', 'মোহনপুর বাজার'],
                        },
                        {
                            id: 'ward-3',
                            name: 'ওয়াড নং ৩',
                            member: { name: 'মোঃ ফারুক হোসেন', phone: '01788888888' },
                            villages: ['কুসুম্বা', 'আটঘরিয়া'],
                        },
                    ],
                },
                {
                    slug: 'hujripara',
                    name: 'হুজুরিপাড়া',
                    wards: [
                        {
                            id: 'ward-1',
                            name: 'ওয়াড নং ১',
                            member: { name: 'মোঃ জামাল উদ্দিন', phone: '01799999999' },
                            villages: ['হুজুরিপাড়া', 'শ্যামপুর'],
                        },
                        {
                            id: 'ward-2',
                            name: 'ওয়াড নং ২',
                            member: { name: 'মোঃ কামাল হোসেন', phone: '01888000000' },
                            villages: ['রাজাপুর', 'নিমপাড়া', 'কুচিয়ামোড়'],
                        },
                    ],
                },
            ],
        },
        {
            id: 'mohanpur',
            name: 'মোহনপুর',
            unions: [
                {
                    slug: 'dhurail',
                    name: 'ধুরইল',
                    wards: [
                        {
                            id: 'ward-1',
                            name: 'ওয়াড নং ১',
                            member: { name: 'মোঃ আলাউদ্দিন', phone: '01888111111' },
                            villages: ['চকপাড়া', 'পাকুড়িয়া'],
                        },
                        {
                            id: 'ward-2',
                            name: 'ওয়াড নং ২',
                            member: { name: 'মোঃ সিরাজুল ইসলাম', phone: '01888222222' },
                            villages: ['আউচপাড়া', 'কেশরট', 'বাগমারা রোড সংলগ্ন'],
                        },
                    ],
                },
            ],
        },
        {
            id: 'bagmara',
            name: 'বাগমারা',
            unions: [
                {
                    slug: 'bhabaniganj',
                    name: 'ভবানীগঞ্জ',
                    wards: [
                        {
                            id: 'ward-1',
                            name: 'ওয়াড নং ১',
                            member: { name: 'মোঃ বদরুল আলম', phone: '01888333333' },
                            villages: ['ভবানীগঞ্জ বাজার', 'আড়ানী'],
                        },
                        {
                            id: 'ward-2',
                            name: 'ওয়াড নং ২',
                            member: { name: 'মোঃ নজরুল ইসলাম', phone: '01888444444' },
                            villages: ['তালন্দ', 'কালিকাপুর', 'রুপপুর রোড'],
                        },
                    ],
                },
            ],
        },
    ],
};

/** @returns {{ district: typeof RAJSHAHI_GEO.district, upazila: object, union: object } | null} */
export function findUnionBySlug(slug) {
    if (!slug) return null;
    for (const upazila of RAJSHAHI_GEO.upazilas) {
        const u = upazila.unions.find((x) => x.slug === slug);
        if (u) return { district: RAJSHAHI_GEO.district, upazila, union: u };
    }
    return null;
}

export function getAllUnionSlugs() {
    return RAJSHAHI_GEO.upazilas.flatMap((u) => u.unions.map((x) => x.slug));
}

export function getUpazilaById(id) {
    return RAJSHAHI_GEO.upazilas.find((u) => u.id === id) ?? null;
}

/** @deprecated — পুরনো আমদানি; নতুন কোডে RAJSHAHI_GEO ব্যবহার করুন */
export const RAJSHAHI_DATA = {
    districts: [
        {
            name: RAJSHAHI_GEO.district.name,
            upazilas: RAJSHAHI_GEO.upazilas.map((up) => ({
                name: up.name,
                unions: up.unions.map((un) => ({
                    name: un.name,
                    slug: un.slug,
                    wards: un.wards,
                })),
            })),
        },
    ],
};
