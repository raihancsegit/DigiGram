export const DOCTORS_LIST = [
    {
        id: 'doc-1',
        name: 'ডাঃ তানিয়া আহমেদ',
        qual: 'MBBS, BCS (Health)',
        specialty: 'মেডিসিন বিশেষজ্ঞ',
        unionSlug: 'dumuria',
        availableDays: ['Saturday', 'Monday', 'Wednesday'],
        time: 'সকাল ১০টা - দুপুর ২টা',
        image: null
    },
    {
        id: 'doc-2',
        name: 'ডাঃ মোঃ আব্দুল কুদ্দুস',
        qual: 'MBBS, FCPS (Medicine)',
        specialty: 'হৃদরোগ বিশেষজ্ঞ',
        unionSlug: 'dumuria',
        availableDays: ['Sunday', 'Tuesday', 'Thursday'],
        time: 'বিকাল ৪টা - রাত ৮টা',
        image: null
    },
    {
        id: 'doc-3',
        name: 'ডাঃ মারুফ হোসেন',
        qual: 'MBBS, D-Card',
        specialty: 'শিশু বিশেষজ্ঞ',
        unionSlug: 'dumuria',
        availableDays: ['Everyday'],
        time: 'সকাল ৯টা - দুপুর ১টা',
        image: null
    }
];

export const AMBULANCE_LIST = [
    {
        id: 'amb-1',
        provider: 'ইউনিয়ন স্বাস্থ্য কেন্দ্র',
        driver: 'আব্দুস সাত্তার',
        phone: '01700-112233',
        type: 'Standard',
        unionSlug: 'dumuria',
        status: 'Available'
    },
    {
        id: 'amb-2',
        provider: 'সেবা ফাউন্ডেশন',
        driver: 'মোবারক হোসেন',
        phone: '01888-445566',
        type: 'ICU Support',
        unionSlug: 'dumuria',
        status: 'On Mission'
    }
];

export const PHARMACY_LIST = [
    {
        id: 'ph-1',
        name: 'মদিনা ফার্মেসি',
        location: 'দামকুড়া বাজার',
        phone: '01900-556677',
        unionSlug: 'dumuria',
        emergencyStock: ['Insulin', 'Oxygen Cylinder', 'Antivenom']
    },
    {
        id: 'ph-2',
        name: 'সততা মেডিকেল হল',
        location: 'চৌমুহনী মোড়',
        phone: '01500-889900',
        unionSlug: 'dumuria',
        emergencyStock: ['Paracetamol Syrup', 'Nebulizer Solution']
    }
];
