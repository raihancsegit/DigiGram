export const POWER_SCHEDULE = {
    region: 'নর্দান পাওয়ার সাপ্লাই (নেসকো), রাজশাহী জোন',
    lastUpdate: '১২ এপ্রিল, ২০২৬ - সকাল ১০:০০ টা',
    overallStatus: 'normal', // 'normal' | 'crisis' | 'maintenance'
    message: 'বর্তমানে গ্রিডে কোনো বড় ধরনের সংকট নেই। তবে সংস্কার কাজের জন্য কিছু এলাকায় নির্ধারিত সময়ে লোডশেডিং হতে পারে।',
    
    areas: [
        {
            id: 'pw-1',
            name: 'রাজশাহী সদর ও বোয়ালিয়া',
            currentStatus: 'on', // 'on' or 'off'
            nextOutage: 'দুপুর ০২:০০',
            schedule: [
                { time: 'সকাল ১০:০০ - ১১:০০', status: 'maintenance' },
                { time: 'দুপুর ০২:০০ - ০৩:০০', status: 'scheduled' },
                { time: 'রাত ০৮:০০ - ০৯:০০', status: 'scheduled' },
            ]
        },
        {
            id: 'pw-2',
            name: 'মতিহার ও বিনোদপুর',
            currentStatus: 'off',
            nextOutage: 'চলমান',
            schedule: [
                { time: 'সকাল ১১:০০ - দুপুর ১২:০০', status: 'scheduled' },
                { time: 'বিকেল ০৪:০০ - ০৫:০০', status: 'scheduled' },
                { time: 'রাত ০৯:০০ - ১০:০০', status: 'scheduled' },
            ]
        },
        {
            id: 'pw-3',
            name: 'চাঁপাইনবাবগঞ্জ সদর',
            currentStatus: 'on',
            nextOutage: 'বিকেল ০৩:০০',
            schedule: [
                { time: 'দুপুর ১২:০০ - ০১:০০', status: 'scheduled' },
                { time: 'বিকেল ০৩:০০ - ০৪:০০', status: 'scheduled' },
                { time: 'রাত ১১:০০ - ১২:০০', status: 'scheduled' },
            ]
        },
        {
            id: 'pw-4',
            name: 'শিবগঞ্জ ও কানসাট',
            currentStatus: 'on',
            nextOutage: 'সন্ধ্যা ০৬:০০',
            schedule: [
                { time: 'সকাল ০৯:০০ - ১০:০০', status: 'scheduled' },
                { time: 'দুপুর ০১:০০ - ০২:০০', status: 'scheduled' },
                { time: 'সন্ধ্যা ০৬:০০ - ০৭:০০', status: 'scheduled' },
            ]
        }
    ]
};

export const getPowerSchedule = () => {
    return POWER_SCHEDULE;
};
