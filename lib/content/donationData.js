export const DONATION_CAMPAIGNS = [
    {
        id: 'don-1',
        title: 'মসজিদের ছাদ ঢালাই ফান্ড',
        category: 'মসজিদ নির্মাণ',
        location: 'কাজলা কেন্দ্রীয় জামে মসজিদ',
        description: 'কাজলা কেন্দ্রীয় জামে মসজিদের ২য় তলার ছাদ ঢালাইয়ের কাজ অর্থাভাবে আটকে আছে। সর্বমোট ৫ লাখ টাকা প্রয়োজন। আপনাদের ক্ষুদ্র দানে এই মহৎ কাজ সম্পন্ন হতে পারে।',
        targetAmount: 500000,
        raisedAmount: 320000,
        donorsCount: 145,
        deadline: '১০ মে, ২০২৬',
        verified: true,
        image: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?q=80&w=1000&auto=format&fit=crop',
        recentDonors: ['আব্দুর রহমান - ৫,০০০ ৳', 'বেনামী - ১,০০০ ৳', 'করিম উল্লাহ - ২,০০০ ৳'],
        impactStatement: '১,২০০ মুসল্লি একসাথে নামাজ পড়তে পারবেন',
        minDonation: 100,
        recentComments: [
            { name: 'আব্দুর রহমান', comment: 'আল্লাহ এই উদ্যোগ কবুল করুন।', amount: '৫,০০০ ৳' },
            { name: 'বেনামী', comment: 'আমার মৃত পিতার জন্য দোয়া করবেন।', amount: '১,০০০ ৳' }
        ]
    },
    {
        id: 'don-2',
        title: 'অসুস্থ রফিকের হার্ট সার্জারি',
        category: 'চিকিৎসা সহায়তা',
        location: 'বিনোদপুর',
        description: 'আমাদের এলাকার রফিক ভাইয়ের হার্টে ব্লক ধরা পড়েছে। আগামী সপ্তাহে অপারেশন করতে হবে। তার পরিবারের পক্ষে এত টাকা বহন করা সম্ভব নয়। আসুন আমরা সবাই মিলে তার সাহায্যে এগিয়ে আসি।',
        targetAmount: 200000,
        raisedAmount: 185000,
        donorsCount: 210,
        deadline: '১৫ এপ্রিল, ২০২৬',
        verified: true,
        image: 'https://images.unsplash.com/photo-1538356111053-748a48e1acb8?q=80&w=1000&auto=format&fit=crop',
        recentDonors: ['শফিক আহমেদ - ১০,০০০ ৳', 'বেনামী - ৫০০ ৳'],
        impactStatement: 'একটি পরিবারের একমাত্র উপার্জনক্ষম ব্যক্তিকে বাঁচানো সম্ভব হবে',
        minDonation: 50,
        recentComments: [
            { name: 'শফিক আহমেদ', comment: 'ইনশাআল্লাহ রফিক ভাই দ্রুত সুস্থ হয়ে উঠবেন।', amount: '১০,০০০ ৳' }
        ]
    },
    {
        id: 'don-3',
        title: 'গরীব মেধাবী ছাত্রীর ভর্তি ফি',
        category: 'শিক্ষা সহায়তা',
        location: 'হরিপুর',
        description: 'হরিপুরের মেয়ে সুমাইয়া এবার মেডিকেলে চান্স পেয়েছে। কিন্তু ভর্তির জন্য তার পরিবারের কাছে টাকা নেই। তার স্বপ্ন পূরণে আপনার দান হতে পারে একটি মাইলফলক।',
        targetAmount: 30000,
        raisedAmount: 30000,
        donorsCount: 45,
        deadline: 'সম্পূর্ণ',
        verified: true,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1000&auto=format&fit=crop',
        recentDonors: ['প্রবাসী সাহায্য ফোরাম - ২০,০০০ ৳', 'লোকাল এসোসিয়েশন - ১০,০০০ ৳'],
        impactStatement: 'ভবিষ্যতের একজন আদর্শ চিকিৎসক তৈরি হবে',
        minDonation: 500,
        recentComments: [
            { name: 'প্রবাসী ফোরাম', comment: 'মেডিক্যালে চান্স পাওয়া গর্বের বিষয়। শুভকামনা।', amount: '২০,০০০ ৳' }
        ]
    },
    {
        id: 'don-4',
        title: 'এতিমখানার শিশুদের ইফতার',
        category: 'রমজান মাস',
        location: 'তালুকদার পাড়া এতিমখানা',
        description: 'তালুকদার পাড়া এতিমখানার প্রায় ৪০ জন নিবাসী শিশুর জন্য পুরো রমজান মাস ব্যাপী ইফতারের আয়োজন করা হচ্ছে। একদিনের ইফতার খরচ ২,০০০ টাকা মাত্র।',
        targetAmount: 60000,
        raisedAmount: 15000,
        donorsCount: 12,
        deadline: 'চলমান',
        verified: true,
        image: 'https://images.unsplash.com/photo-1543360407-353d262d0dd3?q=80&w=1000&auto=format&fit=crop',
        recentDonors: [],
        impactStatement: '৪০ জন এতিম শিশু পুরো মাস পুষ্টিকর ইফতার পাবে',
        minDonation: 200,
        recentComments: []
    }
];

export const getDonations = () => {
    return DONATION_CAMPAIGNS;
};
