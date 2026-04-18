export const FUEL_PUMPS = [
    {
        id: 'p-1',
        name: 'বিসমিল্লাহ ফিলিং স্টেশন',
        location: 'দামকুড়া মোড়, রাজশাহী',
        unionSlug: 'dumuria', // Assuming union context
        distance: '২.৫ কি.মি.',
        status: 'Available', // Available, Low, Empty
        octane: { price: 130, status: 'Available' },
        diesel: { price: 106, status: 'Low' },
        petrol: { price: 125, status: 'Empty' },
        lastUpdated: '১ ঘণ্টা আগে',
        mapUrl: '#'
    },
    {
        id: 'p-2',
        name: 'সততা ট্রেডার্স এন্ড ফুয়েল',
        location: 'পবা রোড, হরিপুর',
        unionSlug: 'horipur',
        distance: '৫.১ কি.মি.',
        status: 'Low',
        octane: { price: 130, status: 'Empty' },
        diesel: { price: 106, status: 'Available' },
        petrol: { price: 125, status: 'Low' },
        lastUpdated: '২ ঘণ্টা আগে',
        mapUrl: '#'
    },
    {
        id: 'p-3',
        name: 'পদ্মা ওয়েল সার্ভিস',
        location: 'কুষ্টিয়া হাইওয়ে',
        unionSlug: 'dumuria',
        distance: '৯.০ কি.মি.',
        status: 'Empty',
        octane: { price: 130, status: 'Empty' },
        diesel: { price: 106, status: 'Empty' },
        petrol: { price: 125, status: 'Empty' },
        lastUpdated: '৩০ মিনিট আগে',
        mapUrl: '#'
    }
];

export const FUEL_RETAILERS = [
    {
        id: 'r-1',
        name: 'আব্দুস সোবহান স্টোর',
        location: 'বালুঘাট বাজার',
        unionSlug: 'dumuria',
        phone: '01711-223344',
        type: 'Diesel Only',
        authorized: true,
        currentStock: '২০০ লিটার'
    },
    {
        id: 'r-2',
        name: 'মালেক ট্রেডার্স',
        location: 'চৌমুহনী মোড়',
        unionSlug: 'dumuria',
        phone: '01855-667788',
        type: 'Petrol & Diesel',
        authorized: true,
        currentStock: '৫০ লিটার'
    }
];

export const FUEL_TOKENS_MOCK = [
    { id: 'T-101', serial: '৪৫', slot: 'দুপুর ২:০০ - ৩:০০', date: '১৭ এপ্রিল, ২০২৪' },
    { id: 'T-102', serial: '৮২', slot: 'বিকাল ৪:৩০ - ৫:৩০', date: '১৭ এপ্রিল, ২০২৪' }
];
