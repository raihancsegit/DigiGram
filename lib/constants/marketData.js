export const COMMODITIES = [
    { id: 'cow', name: 'গরু', unit: 'প্রতিটি', icon: '🐄', category: 'Livestock' },
    { id: 'goat', name: 'ছাগল', unit: 'প্রতিটি', icon: '🐐', category: 'Livestock' },
    { id: 'mango', name: 'আম', unit: 'মণ', icon: '🥭', category: 'Fruits' },
    { id: 'paddy', name: 'ধান (মিনিকেট)', unit: 'মণ', icon: '🌾', category: 'Crops' },
    { id: 'jute', name: 'পাট', unit: 'মণ', icon: '🌿', category: 'Crops' },
    { id: 'onion', name: 'পেঁয়াজ (দেশি)', unit: 'মণ', icon: '🧅', category: 'Vegetables' },
];

export const MARKETS_LIST = [
    { 
        id: 'dumuria-1', unionSlug: 'dumuria', name: 'দামকুড়া বড় হাট', days: ['Saturday', 'Wednesday'], type: 'Mixed',
        bestTimeToVisit: 'সকাল ৭টা - ১০টা', traderVolume: 'High', qualityIndex: 4.8 
    },
    { 
        id: 'dumuria-2', unionSlug: 'dumuria', name: 'নওহাটা দৈনিক বাজার', days: ['Everyday'], type: 'Vegetables',
        bestTimeToVisit: 'সকাল ৬টা', traderVolume: 'Medium', qualityIndex: 4.5 
    },
    { 
        id: 'horipur-1', unionSlug: 'horipur', name: 'হরিপুর গরুর হাট', days: ['Tuesday', 'Friday'], type: 'Livestock Specialist',
        bestTimeToVisit: 'দুপুর ২টা - ৫টা', traderVolume: 'Very High', qualityIndex: 4.9 
    },
    { 
        id: 'horipur-2', unionSlug: 'horipur', name: 'নিতাইপুর ধানের আড়ত', days: ['Everyday'], type: 'Crops',
        bestTimeToVisit: 'সকাল ৮টা - দুপুর ১২টা', traderVolume: 'High', qualityIndex: 4.6 
    },
    { 
        id: 'hujuripara-1', unionSlug: 'hujuripara', name: 'শ্যামপুর হাট (আমের মোকাম)', days: ['Sunday', 'Wednesday'], type: 'Mixed',
        bestTimeToVisit: 'সকাল ৯টা', traderVolume: 'Very High', qualityIndex: 5.0 
    },
];

export const DAILY_PRICES = {
    'dumuria-1': {
        cow: { price: 82000, previousPrice: 80000, supply: 'Medium', trend: 'up' },
        paddy: { price: 1150, previousPrice: 1150, supply: 'Normal', trend: 'stable' },
        goat: { price: 15500, previousPrice: 16000, supply: 'Low', trend: 'down' },
        onion: { price: 3200, previousPrice: 3000, supply: 'Low', trend: 'up' },
    },
    'dumuria-2': {
        mango: { price: 3200, previousPrice: 3500, supply: 'High', trend: 'down' },
        onion: { price: 2800, previousPrice: 2800, supply: 'High', trend: 'stable' },
    },
    'horipur-1': {
        cow: { price: 79000, previousPrice: 83000, supply: 'High', trend: 'down' },
        goat: { price: 14000, previousPrice: 14000, supply: 'High', trend: 'stable' },
    },
    'horipur-2': {
        paddy: { price: 1180, previousPrice: 1150, supply: 'Low', trend: 'up' },
        jute: { price: 2900, previousPrice: 2900, supply: 'Normal', trend: 'stable' },
    },
    'hujuripara-1': {
        mango: { price: 3100, previousPrice: 3500, supply: 'High', trend: 'down' },
        paddy: { price: 1145, previousPrice: 1120, supply: 'Normal', trend: 'up' },
    },
};

export const MOCK_REVIEWS = [
    { id: 1, hatId: 'horipur-1', user: 'রহিম উদ্দিন', rating: 5, comment: 'আজকের হাটে গরুর দাম বেশ ভালো, সরবরাহও প্রচুর।', date: '2023-11-05' },
    { id: 2, hatId: 'dumuria-1', user: 'করিম শেখ', rating: 4, comment: 'রাস্তা খারাপ থাকায় হাটে আসতে কষ্ট হয়েছে, তবে ধানের দাম ভালো পেলাম।', date: '2023-11-04' },
];
