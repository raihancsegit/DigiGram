export const AGRI_EQUIPMENT = [
    {
        id: 'ag-1',
        name: 'মাহিন্দ্রা ট্রাক্টর (৫৫ এইচপি)',
        type: 'ট্রাক্টর',
        owner: 'খলিলুর রহমান',
        phone: '০১৭০০-০০০০০১',
        location: 'বিনোদপুর হাইস্কুল সংলগ্ন',
        rate: '১৪০০ ৳ / একর',
        available: true,
        features: ['জমি চাষ', 'মই দেওয়া', 'বীজ তলা তৈরি'],
        image: 'https://images.unsplash.com/photo-1592982537447-6f2cf336f06a?q=80&w=500&auto=format&fit=crop',
        condition: 'Excellent', // or 'Good'
        engineCapacity: '৫৫ এইচপি (অত্যধিক শক্তিশালী)',
        nextAvailableDate: 'আজই ফ্রি আছে',
        deliveryOption: 'ড্রাইভারসহ আপনার জমিতে পৌঁছে দেওয়া হবে'
    },
    {
        id: 'ag-2',
        name: 'কম্বাইন্ড হারভেস্টর (বড়)',
        type: 'হারভেস্টর',
        owner: 'কৃষি সমবায় সমিতি',
        phone: '০১৯০০-০০০০০২',
        location: 'ইউনিয়ন পরিষদ চত্বর',
        rate: '৬৫০০ ৳ / একর',
        available: false,
        features: ['ধান কাটা', 'মাড়াই করা', 'বস্তাবন্দি করা'],
        image: 'https://images.unsplash.com/photo-1629853381442-8356947ed02c?q=80&w=500&auto=format&fit=crop',
        condition: 'Good',
        engineCapacity: '১১০ এইচপি',
        nextAvailableDate: '১৪ এপ্রিল, ২০২৬', // Not available currently
        deliveryOption: 'অ্যাডভান্স বুকিং সাপেক্ষে মাঠে পাঠানো হবে'
    },
    {
        id: 'ag-3',
        name: 'শ্যালো ইঞ্জিন (সেচ পাম্প)',
        type: 'সেচ পাম্প',
        owner: 'হানিফ আলী',
        phone: '০১৮০০-০০০০০৩',
        location: 'তালুকদার পাড়া, পশ্চিম মাঠ',
        rate: '৩০০ ৳ / ঘণ্টা',
        available: true,
        features: ['ধান ক্ষেতে পানি দেওয়া', 'পুকুর সেঁচা'],
        image: 'https://images.unsplash.com/photo-1582281989062-11440d99fae5?q=80&w=500&auto=format&fit=crop',
        condition: 'Good',
        engineCapacity: '১৬ এইচপি (ডিজেল)',
        nextAvailableDate: 'আজ বিকেল পর্যন্ত',
        deliveryOption: 'নিজ দায়িত্বে এসে নিয়ে যেতে হবে'
    },
    {
        id: 'ag-4',
        name: 'পাওয়ার টিলার',
        type: 'পাওয়ার টিলার',
        owner: 'রফিকুল ইসলাম',
        phone: '০১৫০০-০০০০০৪',
        location: 'কাজলা',
        rate: '৮০০ ৳ / একর',
        available: true,
        features: ['কাদা করা', 'জমি সমতল করা'],
        image: 'https://images.unsplash.com/photo-1621287955502-ea0c354728f3?q=80&w=500&auto=format&fit=crop',
        condition: 'Excellent',
        engineCapacity: '১২ এইচপি (পেট্রোল)',
        nextAvailableDate: 'কাল সকাল থেকে ফ্রি',
        deliveryOption: 'ড্রাইভারসহ পাঠানো হবে'
    },
    {
        id: 'ag-5',
        name: 'কীটনাশক স্প্রেয়ার (ব্যাটারি চালিত)',
        type: 'স্প্রেয়ার',
        owner: 'মিজানুর রহমান',
        phone: '০১৭০০-০০০০০০৫',
        location: 'হরিপুর বাজার',
        rate: '২০০ ৳ / দিন',
        available: true,
        features: ['কীটনাশক স্প্রে', 'আগাছানাশক স্প্রে'],
        image: 'https://images.unsplash.com/photo-1605370258197-0f81d1baaaa2?q=80&w=500&auto=format&fit=crop',
        condition: 'Excellent',
        engineCapacity: '১৮ ভোল্ট ব্যাটারি (১ চার্জে ৩ ঘন্টা)',
        nextAvailableDate: 'যেকোনো সময়',
        deliveryOption: 'দোকান থেকে সংগ্রহ করতে হবে'
    }
];

export const getAgriEquipment = () => {
    return AGRI_EQUIPMENT;
};
