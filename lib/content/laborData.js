export const LABOR_DIRECTORY = [
    {
        id: 'lab-1',
        name: 'মো. রফিকুল ইসলাম',
        profession: 'রাজমিস্ত্রি',
        expertise: ['বিল্ডিং এর কাজ', 'প্লাস্টার', 'টাইলস বাঁধানো'],
        location: 'কাজলা, মাস্টারপাড়া',
        dailyRate: '৭০০ - ৮০০ ৳',
        rating: 4.8,
        reviews: 24,
        available: true,
        phone: '০১৭০০-০০০০০১',
        image: 'https://images.unsplash.com/photo-1541888081682-1eeb5c8ed179?q=80&w=500&auto=format&fit=crop'
    },
    {
        id: 'lab-2',
        name: 'শরীফ উদ্দিন',
        profession: 'ইলেকট্রিশিয়ান',
        expertise: ['হাউজ ওয়্যারিং', 'ফ্যান/মটর মেরামত', 'এসি সার্ভিসিং'],
        location: 'তালুকদার পাড়া',
        dailyRate: 'কাজের ধরন অনুযায়ী',
        rating: 4.9,
        reviews: 45,
        available: true,
        phone: '০১৯০০-০০০০০২',
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=500&auto=format&fit=crop'
    },
    {
        id: 'lab-3',
        name: 'আব্দুল হালিম',
        profession: 'কৃষি শ্রমিক',
        expertise: ['ধান কাটা', 'জমি নিড়ানো', 'কীটনাশক ছিটানো'],
        location: 'বিনোদপুর',
        dailyRate: '৬০০ ৳ (৩ বেলা খাবার বাদে)',
        rating: 4.5,
        reviews: 18,
        available: false,
        phone: '০১৮০০-০০০০০৩',
        image: 'https://images.unsplash.com/photo-1595841696417-a16bf16a503f?q=80&w=500&auto=format&fit=crop'
    },
    {
        id: 'lab-4',
        name: 'জহিরুল ইসলাম',
        profession: 'প্লাম্বার',
        expertise: ['পানির লাইন ফিটিং', 'মোটর মেরামত', 'ট্যাংক পরিষ্কার'],
        location: 'ধরনহাটা',
        dailyRate: '৬০০ - ৮০০ ৳',
        rating: 4.7,
        reviews: 32,
        available: true,
        phone: '০১৫০০-০০০০০৪',
        image: 'https://images.unsplash.com/photo-1607427293702-036933bbf746?q=80&w=500&auto=format&fit=crop'
    },
    {
        id: 'lab-5',
        name: 'শামীম হোসেন',
        profession: 'রং মিস্ত্রি',
        expertise: ['ইন্টেরিয়র পেইন্ট', 'টেক্সচার পেইন্ট', 'আউটার ওয়াল পেইন্ট'],
        location: 'হরিপুর',
        dailyRate: 'চুক্তিভিত্তিক',
        rating: 5.0,
        reviews: 12,
        available: true,
        phone: '০১৭০০-০০০০০০৫',
        image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=500&auto=format&fit=crop'
    },
    {
        id: 'lab-6',
        name: 'আয়েশা আক্তার',
        profession: 'গৃহশিক্ষক (টিউটর)',
        expertise: ['ক্লাস ১-৫', 'আরবি ও ধর্ম শিক্ষা'],
        location: 'কাজলা',
        dailyRate: '১০০০-২০০০ ৳ (মাসিক)',
        rating: 4.9,
        reviews: 8,
        available: true,
        phone: '০১৬০০-০০০০০৬',
        image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=500&auto=format&fit=crop'
    }
];

export const getLaborers = () => {
    return LABOR_DIRECTORY;
};
