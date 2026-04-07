export const COMMODITIES = [
    { id: 'cow', name: 'গরু', unit: 'প্রতিটি', icon: '🐄', category: 'Livestock' },
    { id: 'goat', name: 'ছাগল', unit: 'প্রতিটি', icon: '🐐', category: 'Livestock' },
    { id: 'mango', name: 'আম', unit: 'মণ', icon: '🥭', category: 'Fruits' },
    { id: 'paddy', name: 'ধান', unit: 'মণ', icon: '🌾', category: 'Crops' },
    { id: 'jute', name: 'পাট', unit: 'মণ', icon: '🌿', category: 'Crops' },
];

export const MARKETS_LIST = [
    { id: 'dumuria-1', unionSlug: 'dumuria', name: 'দামকুড়া বড় হাট', days: ['Saturday', 'Wednesday'], type: 'Mixed' },
    { id: 'dumuria-2', unionSlug: 'dumuria', name: 'নওহাটা দৈনিক বাজার', days: ['Everyday'], type: 'Vegetables' },
    { id: 'horipur-1', unionSlug: 'horipur', name: 'হরিপুর গরুর হাট', days: ['Tuesday', 'Friday'], type: 'Livestock Specialist' },
    { id: 'horipur-2', unionSlug: 'horipur', name: 'নিতাইপুর ধানের আড়ত', days: ['Everyday'], type: 'Crops' },
    { id: 'horipur-3', unionSlug: 'horipur', name: 'গোপালপুর মিশ্র হাট', days: ['Sunday', 'Thursday'], type: 'Mixed' },
    { id: 'noasha-1', unionSlug: 'noasha', name: 'নওশা সাপ্তাহিক হাট', days: ['Monday', 'Thursday'], type: 'Mixed' },
    { id: 'noasha-2', unionSlug: 'noasha', name: 'মোহনপুর বাজার', days: ['Everyday'], type: 'Mixed' },
    { id: 'hujuripara-1', unionSlug: 'hujuripara', name: 'শ্যামপুর হাট', days: ['Sunday', 'Wednesday'], type: 'Mixed' },
    { id: 'hujuripara-2', unionSlug: 'hujuripara', name: 'রাজাপুর বাজার', days: ['Everyday'], type: 'Vegetables' },
];

export const DAILY_PRICES = {
    'dumuria-1': {
        cow: { price: 82000, supply: 'Medium', trend: 'stable' },
        paddy: { price: 1150, supply: 'Normal', trend: 'stable' },
        goat: { price: 15500, supply: 'Low', trend: 'up' },
    },
    'dumuria-2': {
        mango: { price: 3200, supply: 'High', trend: 'down' },
        paddy: { price: 1140, supply: 'High', trend: 'down' },
    },
    'horipur-1': {
        cow: { price: 79000, supply: 'High', trend: 'down' },
        goat: { price: 14000, supply: 'High', trend: 'stable' },
    },
    'horipur-2': {
        paddy: { price: 1180, supply: 'Low', trend: 'up' },
        jute: { price: 2900, supply: 'Normal', trend: 'stable' },
    },
    'horipur-3': {
        cow: { price: 83000, supply: 'Medium', trend: 'stable' },
        mango: { price: 3000, supply: 'Normal', trend: 'stable' },
        goat: { price: 14500, supply: 'Normal', trend: 'up' },
    },
    'noasha-1': {
        cow: { price: 85000, supply: 'Low', trend: 'up' },
        paddy: { price: 1120, supply: 'High', trend: 'down' },
    },
    'noasha-2': {
        cow: { price: 81000, supply: 'Normal', trend: 'stable' },
        paddy: { price: 1160, supply: 'Normal', trend: 'stable' },
    },
    'hujuripara-1': {
        cow: { price: 80000, supply: 'Normal', trend: 'down' },
        mango: { price: 3100, supply: 'High', trend: 'down' },
    },
    'hujuripara-2': {
        mango: { price: 2900, supply: 'Very High', trend: 'down' },
        paddy: { price: 1145, supply: 'Normal', trend: 'stable' },
    },
};

export const MOCK_REVIEWS = [
    { id: 1, hatId: 'horipur-1', user: 'রহিম উদ্দিন', rating: 5, comment: 'আজকের হাটে গরুর দাম বেশ ভালো, সরবরাহও প্রচুর।', date: '2023-11-05' },
    { id: 2, hatId: 'dumuria-1', user: 'করিম শেখ', rating: 4, comment: 'রাস্তা খারাপ থাকায় হাটে আসতে কষ্ট হয়েছে, তবে ধানের দাম ভালো পেলাম।', date: '2023-11-04' },
];
