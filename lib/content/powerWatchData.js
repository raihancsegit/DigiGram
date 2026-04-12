export const POWER_SCHEDULE = {
    region: 'নর্দান পাওয়ার সাপ্লাই (নেসকো), রাজশাহী জোন',
    lastUpdate: '১২ এপ্রিল, ২০২৬ - সকাল ১০:০০ টা',
    overallStatus: 'normal', // 'normal' | 'crisis' | 'maintenance'
    message: 'বর্তমানে গ্রিডে কোনো বড় ধরনের সংকট নেই। তবে সংস্কার কাজের জন্য কিছু এলাকায় নির্ধারিত সময়ে লোডশেডিং হতে পারে।',
    localOfficePhone: '১৬১১৬ (নেসকো হটলাইন)',
    
    areas: [
        {
            id: 'pw-1',
            name: 'রাজশাহী সদর ও বোয়ালিয়া',
            currentStatus: 'on', // 'on' or 'off'
            nextOutage: 'দুপুর ০২:০০',
            reliabilityScore: 98,
            nextMaintenance: '১৫ এপ্রিল, শাখা লাইন সংস্কার',
            schedule: [
                { time: 'সকাল ১০:০০ - ১১:০০', status: 'maintenance', detail: 'বনলতা গ্রিড রক্ষণাবেক্ষণ' },
                { time: 'দুপুর ০২:০০ - ০৩:০০', status: 'scheduled', detail: 'সম্ভাব্য পিক-আওয়ার শেডিং' },
                { time: 'রাত ০৮:০০ - ০৯:০০', status: 'scheduled', detail: 'সম্ভাব্য পিক-আওয়ার শেডিং' },
            ]
        },
        {
            id: 'pw-2',
            name: 'মতিহার ও বিনোদপুর',
            currentStatus: 'off',
            nextOutage: 'চলমান',
            reliabilityScore: 85,
            nextMaintenance: 'আজ বিকেল ০৪:০০ (ট্রান্সফরমার বদল)',
            schedule: [
                { time: 'সকাল ১১:০০ - দুপুর ১২:০০', status: 'scheduled', detail: 'গ্রিড ব্যালান্সিং' },
                { time: 'বিকেল ০৪:০০ - ০৫:০০', status: 'maintenance', detail: 'ট্রান্সফরমার পরিবর্তন' },
                { time: 'রাত ০৯:০০ - ১০:০০', status: 'scheduled', detail: 'সম্ভাব্য শেডিং' },
            ]
        },
        {
            id: 'pw-3',
            name: 'চাঁপাইনবাবগঞ্জ সদর',
            currentStatus: 'on',
            nextOutage: 'বিকেল ০৩:০০',
            reliabilityScore: 92,
            nextMaintenance: 'পরবর্তী মাসে নির্ধারিত',
            schedule: [
                { time: 'দুপুর ১২:০০ - ০১:০০', status: 'scheduled', detail: 'গ্রিড লিমিটেশন' },
                { time: 'বিকেল ০৩:০০ - ০৪:০০', status: 'scheduled', detail: 'গ্রিড লিমিটেশন' },
                { time: 'রাত ১১:০০ - ১২:০০', status: 'scheduled', detail: 'লো-ভোল্টেজ চেক' },
            ]
        },
        {
            id: 'pw-4',
            name: 'শিবগঞ্জ ও কানসাট',
            currentStatus: 'on',
            nextOutage: 'সন্ধ্যা ০৬:০০',
            reliabilityScore: 88,
            nextMaintenance: '২০ এপ্রিল (খুঁটি স্থানান্তর)',
            schedule: [
                { time: 'সকাল ০৯:০০ - ১০:০০', status: 'scheduled', detail: 'পল্লীবিদ্যুৎ সমলয়' },
                { time: 'দুপুর ০১:০০ - ০২:০০', status: 'maintenance', detail: 'ফাঁকা রাস্তার কাজ' },
                { time: 'সন্ধ্যা ০৬:০০ - ০৭:০০', status: 'scheduled', detail: 'সান্ধ্যকালীন শেডিং' },
            ]
        }
    ]
};

export const getPowerSchedule = () => {
    return POWER_SCHEDULE;
};
