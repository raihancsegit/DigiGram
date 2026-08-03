const EXPERIENCES = {
    kindergarten: {
        heroTitle: 'শিশুর আনন্দময় শেখার প্রথম ঠিকানা',
        heroSubtitle: 'নিরাপদ যত্ন, খেলাধুলার মাধ্যমে শেখা এবং প্রতিদিন অভিভাবক আপডেট।',
        template: 'modern',
        layout: 'centered',
        stats: [
            { value: 'নিরাপদ', label: 'শিশু ক্যাম্পাস' },
            { value: 'প্রতিদিন', label: 'Guardian update' },
            { value: 'খেলাধুলা', label: 'Activity learning' },
            { value: 'যত্ন', label: 'স্বাস্থ্য ও নিরাপত্তা' }
        ],
        classes: [
            { title: 'Play Group', description: 'খেলা, গল্প ও ছড়ার মাধ্যমে পরিচিতি', badge: 'PG' },
            { title: 'Nursery', description: 'ভাষা, সংখ্যা, ছবি ও আচরণ শিক্ষা', badge: 'Nursery' },
            { title: 'KG', description: 'প্রাইমারি স্কুলের জন্য আত্মবিশ্বাসী প্রস্তুতি', badge: 'KG' }
        ],
        facilities: [
            { title: 'নিরাপদ pickup', description: 'অনুমোদিত ব্যক্তির কাছে শিশু হস্তান্তরের তথ্য' },
            { title: 'শিশু স্বাস্থ্য নোট', description: 'Allergy, খাবার ও প্রয়োজনীয় যত্নের তথ্য' },
            { title: 'Activity room', description: 'খেলা, ছবি, গল্প ও হাতে-কলমে শেখা' },
            { title: 'অভিভাবক সংযোগ', description: 'উপস্থিতি ও অগ্রগতির নিয়মিত আপডেট' }
        ],
        admission: ['শিশুর জন্মনিবন্ধন', 'অভিভাবকের তথ্য', 'স্বাস্থ্য ও pickup তথ্য']
    },
    primary_school: {
        heroTitle: 'ভিত্তি শিক্ষা, নিয়মিত উপস্থিতি ও সুন্দর ভবিষ্যৎ',
        heroSubtitle: 'প্রাক-প্রাথমিক থেকে পঞ্চম শ্রেণি পর্যন্ত শিশু ও অভিভাবকের বিশ্বস্ত বিদ্যালয়।',
        template: 'modern',
        layout: 'split',
        stats: [
            { value: '১–৫', label: 'শ্রেণি' },
            { value: 'দৈনিক', label: 'উপস্থিতি' },
            { value: 'নিয়মিত', label: 'অভিভাবক যোগাযোগ' },
            { value: 'সবার জন্য', label: 'ভিত্তি শিক্ষা' }
        ],
        classes: [
            { title: 'প্রাক-প্রাথমিক', description: 'আনন্দময় পরিবেশে স্কুল প্রস্তুতি', badge: 'শুরু' },
            { title: '১ম–২য় শ্রেণি', description: 'বাংলা, ইংরেজি ও গণিতের শক্ত ভিত্তি', badge: 'ভিত্তি' },
            { title: '৩য়–৫ম শ্রেণি', description: 'জ্ঞান, শৃঙ্খলা ও পরবর্তী ধাপের প্রস্তুতি', badge: 'অগ্রগতি' }
        ],
        facilities: [
            { title: 'শিশুবান্ধব শ্রেণিকক্ষ', description: 'নিরাপদ ও অংশগ্রহণমূলক পাঠদান' },
            { title: 'উপস্থিতি সহায়তা', description: 'অনুপস্থিত হলে দ্রুত অভিভাবক যোগাযোগ' },
            { title: 'পাঠাগার কর্নার', description: 'বই পড়া ও ভাষা দক্ষতার চর্চা' },
            { title: 'সহশিক্ষা কার্যক্রম', description: 'খেলা, সংস্কৃতি ও সৃজনশীল অনুশীলন' }
        ],
        admission: ['জন্মনিবন্ধন', 'অভিভাবকের মোবাইল নম্বর', 'পূর্বের বিদ্যালয়ের তথ্য (প্রযোজ্য হলে)']
    },
    high_school: {
        heroTitle: 'শৃঙ্খলা, ফলাফল ও ভবিষ্যৎ প্রস্তুতির বিদ্যালয়',
        heroSubtitle: 'ষষ্ঠ থেকে দশম শ্রেণির পাঠদান, উপস্থিতি, পরীক্ষা ও অভিভাবক সংযোগ।',
        template: 'dark_school',
        layout: 'split',
        stats: [
            { value: '৬–১০', label: 'শ্রেণি' },
            { value: 'SSC', label: 'পরীক্ষা প্রস্তুতি' },
            { value: 'দৈনিক', label: 'উপস্থিতি' },
            { value: 'নিয়মিত', label: 'ফলাফল প্রকাশ' }
        ],
        classes: [
            { title: 'নিম্ন মাধ্যমিক', description: '৬ষ্ঠ–৮ম শ্রেণির ভিত্তি ও দক্ষতা', badge: '৬–৮' },
            { title: 'মাধ্যমিক', description: '৯ম–১০ম শ্রেণির বিভাগ ও SSC প্রস্তুতি', badge: '৯–১০' },
            { title: 'ক্লাব ও কার্যক্রম', description: 'বিজ্ঞান, বিতর্ক, খেলাধুলা ও সংস্কৃতি', badge: 'Club' }
        ],
        facilities: [
            { title: 'Science lab', description: 'প্র্যাকটিক্যাল ও অনুসন্ধানভিত্তিক শিক্ষা' },
            { title: 'ICT learning', description: 'ডিজিটাল দক্ষতা ও প্রযুক্তি শিক্ষা' },
            { title: 'পাঠাগার', description: 'পাঠ্য ও সহায়ক বইয়ের সংগ্রহ' },
            { title: 'Guardian desk', description: 'উপস্থিতি, ফলাফল ও পরামর্শ সেবা' }
        ],
        admission: ['জন্মনিবন্ধন', 'পূর্বের ফলাফল/সনদ', 'অভিভাবকের যোগাযোগ']
    },
    college: {
        heroTitle: 'উচ্চশিক্ষা ও ক্যারিয়ার প্রস্তুতির বিশ্বস্ত ক্যাম্পাস',
        heroSubtitle: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা—বিষয়ভিত্তিক ফলাফল এবং উচ্চশিক্ষা নির্দেশনা।',
        template: 'dark_college',
        layout: 'magazine',
        stats: [
            { value: '৩টি', label: 'বিভাগ' },
            { value: 'HSC', label: 'ফলাফল' },
            { value: 'নিয়মিত', label: 'ক্লাস ও পরীক্ষা' },
            { value: 'Career', label: 'উচ্চশিক্ষা সহায়তা' }
        ],
        classes: [
            { title: 'বিজ্ঞান', description: 'Physics, Chemistry, Biology ও Higher Math', badge: 'Science' },
            { title: 'মানবিক', description: 'ইতিহাস, সমাজবিজ্ঞান, যুক্তিবিদ্যা ও ভাষা', badge: 'Humanities' },
            { title: 'ব্যবসায় শিক্ষা', description: 'হিসাববিজ্ঞান, Finance ও Management', badge: 'Business' }
        ],
        facilities: [
            { title: 'বিভাগভিত্তিক lab', description: 'বিজ্ঞান ও ICT practical support' },
            { title: 'Admission guidance', description: 'বিশ্ববিদ্যালয় ভর্তি ও career counselling' },
            { title: 'সমৃদ্ধ পাঠাগার', description: 'Reference, journal ও প্রস্তুতি বই' },
            { title: 'Student affairs', description: 'ভর্তি, বৃত্তি ও একাডেমিক সহায়তা' }
        ],
        admission: ['SSC transcript', 'ছবি ও পরিচয়পত্র', 'বিভাগ পছন্দ ও যোগাযোগ']
    },
    madrasa: {
        heroTitle: 'দ্বীনি শিক্ষা ও আধুনিক জ্ঞানের সমন্বিত প্রতিষ্ঠান',
        heroSubtitle: 'কুরআন, হাদিস, আরবি ও সাধারণ শিক্ষার হাজিরা, সবক এবং ফলাফল একসাথে।',
        template: 'dark_madrasa',
        layout: 'centered',
        stats: [
            { value: 'দ্বীনি', label: 'মূল্যবোধ' },
            { value: 'সাধারণ', label: 'শিক্ষা' },
            { value: 'দৈনিক', label: 'হাজিরা ও সবক' },
            { value: 'দাখিল/আলিম', label: 'পরীক্ষা প্রস্তুতি' }
        ],
        classes: [
            { title: 'ইবতেদায়ি', description: 'প্রাথমিক দ্বীনি ও সাধারণ শিক্ষা', badge: 'শুরু' },
            { title: 'দাখিল', description: 'কিতাব, সাধারণ বিষয় ও বোর্ড প্রস্তুতি', badge: 'দাখিল' },
            { title: 'আলিম', description: 'উচ্চতর দ্বীনি ও সাধারণ শিক্ষা', badge: 'আলিম' }
        ],
        facilities: [
            { title: 'কুরআন ও তাজবিদ', description: 'শুদ্ধ তিলাওয়াত ও নিয়মিত মূল্যায়ন' },
            { title: 'আরবি শিক্ষা', description: 'ভাষা, কিতাব ও দ্বীনি জ্ঞান' },
            { title: 'সাধারণ বিষয়', description: 'বাংলা, ইংরেজি, গণিত ও বিজ্ঞান' },
            { title: 'অভিভাবক যোগাযোগ', description: 'হাজিরা, সবক ও ফলাফল আপডেট' }
        ],
        admission: ['জন্মনিবন্ধন', 'পূর্বের জামাত/শ্রেণির তথ্য', 'অভিভাবকের যোগাযোগ']
    }
};

export function getInstitutionWebsiteExperience(category) {
    if (category === 'dakhil_madrasa' || category === 'alim_madrasa') return EXPERIENCES.madrasa;
    return EXPERIENCES[category] || EXPERIENCES.high_school;
}
