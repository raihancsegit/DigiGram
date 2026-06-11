export const SCHOOL_WEBSITE_HOME_SECTION_SETTINGS = {
    hero: { enabled: true, order: 1 },
    intro: { enabled: true, order: 2 },
    teachers: { enabled: true, order: 3 },
    journey: { enabled: true, order: 4 },
    professional: { enabled: true, order: 5 },
    cta: { enabled: true, order: 6 },
    updates: { enabled: true, order: 7 }
};

export const SCHOOL_WEBSITE_EXTRA_SECTIONS = {
    home_sections: SCHOOL_WEBSITE_HOME_SECTION_SETTINGS,
    slider: [
        {
            title: 'ভর্তি, ফলাফল ও অভিভাবক আপডেট একসাথে',
            subtitle: 'প্রতিষ্ঠানের গুরুত্বপূর্ণ খবর, ক্যাম্পাসের ছবি এবং ভর্তি তথ্য প্রথম স্ক্রিনেই সুন্দরভাবে দেখান।',
            badge: 'প্রধান আপডেট',
            image_url: '',
            button_label: 'ভর্তি তথ্য'
        },
        {
            title: 'শ্রেণিকক্ষ, শিক্ষক ও ক্যাম্পাস জীবন',
            subtitle: 'স্কুল, কলেজ বা মাদ্রাসার নিজস্ব ছবি দিয়ে visitor-দের কাছে প্রতিষ্ঠানের পরিবেশ তুলে ধরুন।',
            badge: 'ক্যাম্পাস স্লাইড',
            image_url: '',
            button_label: 'আরও জানুন'
        },
        {
            title: 'নোটিশ বোর্ড ও শিক্ষার্থী সেবা',
            subtitle: 'পরীক্ষা, ছুটি, ভর্তি, ফলাফল এবং জরুরি ঘোষণা দ্রুত প্রকাশ করুন।',
            badge: 'নোটিশ',
            image_url: '',
            button_label: 'নোটিশ দেখুন'
        }
    ],
    achievements: [
        { title: 'বোর্ড ফলাফল', value: '৯৮%', description: 'সাম্প্রতিক পাবলিক পরীক্ষায় ধারাবাহিক সাফল্য।' },
        { title: 'মেধা সহায়তা', value: '১২০+', description: 'বৃত্তি, পরামর্শ ও দুর্বল শিক্ষার্থীর আলাদা care।' },
        { title: 'উপস্থিতি ট্র্যাকিং', value: 'Daily', description: 'ক্লাস উপস্থিতি ও অভিভাবক আপডেট নিয়মিত রাখা হয়।' },
        { title: 'ডিজিটাল পাঠ', value: 'Smart', description: 'Topic, homework, quiz এবং lesson progress একই জায়গায়।' }
    ],
    events: [
        { title: 'অভিভাবক সভা', date: 'প্রতি মাসে', description: 'শিক্ষার্থী অগ্রগতি, উপস্থিতি ও ফলাফল নিয়ে আলোচনা।' },
        { title: 'বিজ্ঞান ও বইমেলা', date: 'বার্ষিক', description: 'Project, reading habit এবং উপস্থাপনা দক্ষতার আয়োজন।' },
        { title: 'ক্রীড়া ও সংস্কৃতি', date: 'Seasonal', description: 'খেলাধুলা, বিতর্ক, আবৃত্তি ও সাংস্কৃতিক অংশগ্রহণ।' }
    ],
    gallery: [
        { title: 'ক্লাসরুম', image_url: '', caption: 'শিক্ষক, পাঠ এবং lesson progress-এর যত্নশীল পরিবেশ।' },
        { title: 'লাইব্রেরি', image_url: '', caption: 'পাঠাভ্যাস, রেফারেন্স বই এবং quiet study support।' },
        { title: 'ক্যাম্পাস', image_url: '', caption: 'শৃঙ্খলা, নিরাপত্তা এবং সহশিক্ষা কার্যক্রম।' },
        { title: 'ল্যাব', image_url: '', caption: 'Science, ICT এবং হাতে-কলমে শেখার সুযোগ।' }
    ],
    programs: [
        { title: 'Class-wise Academic Care', description: 'শ্রেণি, বিষয়, শিক্ষক ও topic অনুযায়ী পড়াশোনা গুছিয়ে রাখা।' },
        { title: 'Guardian Progress Desk', description: 'হোমওয়ার্ক, উপস্থিতি ও ফলাফলের আপডেট অভিভাবকের কাছে পৌঁছানো।' },
        { title: 'Result & Merit Review', description: 'পরীক্ষার ফলাফল বিশ্লেষণ করে পরবর্তী প্রস্তুতি ঠিক করা।' },
        { title: 'Clubs & Life Skills', description: 'বিজ্ঞান, ভাষা, খেলাধুলা ও নেতৃত্বের চর্চা।' }
    ],
    faqs: [
        { question: 'ভর্তি আবেদন কোথা থেকে করা যাবে?', answer: 'ভর্তি page থেকে প্রাথমিক আবেদন জমা দিন। Office review শেষে অভিভাবকের সাথে যোগাযোগ করবে।' },
        { question: 'অভিভাবক কীভাবে update দেখবেন?', answer: 'Guardian update page-এ class, roll এবং অভিভাবকের ফোন যাচাই করে lesson, attendance ও result দেখা যাবে।' },
        { question: 'শিক্ষকের দেওয়া topic কোথায় পাওয়া যাবে?', answer: 'Student portal এবং class update view-তে published topic, homework, resource ও quiz পাওয়া যাবে।' },
        { question: 'নোটিশ ও জরুরি খবর কোথায় দেখব?', answer: 'উপরের notice ticker এবং Notice Board page-এ সর্বশেষ ঘোষণা প্রকাশিত থাকে।' }
    ],
    downloads: [
        { title: 'ভর্তি নির্দেশিকা', url: '', note: 'কাগজপত্র, বয়সসীমা ও office যোগাযোগ।' },
        { title: 'Academic calendar', url: '', note: 'পরীক্ষা, ছুটি ও গুরুত্বপূর্ণ কার্যক্রমের তালিকা।' },
        { title: 'Guardian guideline', url: '', note: 'Portal update বুঝতে অভিভাবকের ছোট guide।' }
    ],
    cta: {
        title: 'ভর্তি, ফলাফল ও অগ্রগতির তথ্য এক জায়গায়',
        text: 'Office-এর সাথে যোগাযোগ করুন অথবা online application দিন। শিক্ষার্থী, শিক্ষক ও অভিভাবকের কাজ সহজ করার জন্য portal প্রস্তুত।',
        button: 'যোগাযোগ করুন'
    }
};

export const SCHOOL_WEBSITE_DEMO_CONTENT = {
    ticker: [
        'নতুন শিক্ষাবর্ষে ভর্তি আবেদন চলছে',
        'Notice Board-এ পরীক্ষার সময়সূচি ও জরুরি ঘোষণা দেখুন',
        'অভিভাবক সভা: মাসিক অগ্রগতি পর্যালোচনা',
        'Student portal-এ topic, homework ও quiz update প্রকাশিত হচ্ছে',
        'বকেয়া তথ্য ও ফলাফল সংক্রান্ত SMS service প্রস্তুত'
    ],
    stats: [
        { value: '২৫+', label: 'বছরের অভিজ্ঞতা' },
        { value: '১২০০+', label: 'শিক্ষার্থী' },
        { value: '৪০+', label: 'শিক্ষক' },
        { value: '৯৮%', label: 'পাসের হার' }
    ],
    highlights: [
        'অভিজ্ঞ শিক্ষক ও class-wise academic care',
        'নিয়মিত উপস্থিতি, homework ও lesson progress tracking',
        'অভিভাবকের জন্য result, notice ও student update',
        'শিক্ষা, শৃঙ্খলা, সহশিক্ষা ও নিরাপদ পরিবেশ'
    ],
    classes: [
        { title: 'প্রাক-প্রাথমিক ও প্রাথমিক', description: 'ভাষা, সংখ্যা, আচরণ ও ভিত্তি গঠনের যত্নশীল পাঠক্রম।', badge: 'Play-5' },
        { title: 'নিম্ন মাধ্যমিক', description: '৬ষ্ঠ থেকে ৮ম শ্রেণিতে বিষয়ভিত্তিক foundation ও নিয়মিত মূল্যায়ন।', badge: '৬-৮' },
        { title: 'মাধ্যমিক', description: 'SSC প্রস্তুতি, class test, topic review ও ফলাফল বিশ্লেষণ।', badge: '৯-১০' },
        { title: 'উচ্চ মাধ্যমিক', description: 'কলেজ প্রস্তুতি, বিভাগভিত্তিক পাঠ ও career guidance।', badge: '১১-১২' },
        { title: 'Language & ICT', description: 'বাংলা, ইংরেজি, presentation ও digital skill practice।', badge: 'Skill' },
        { title: 'Clubs & Activities', description: 'বিজ্ঞান, পাঠাগার, খেলাধুলা ও সাংস্কৃতিক অংশগ্রহণ।', badge: 'Club' }
    ],
    teachers: [
        { name: 'অধ্যাপক আহমেদ হোসেন', subject: 'প্রধান শিক্ষক', experience: 'প্রশাসন ও academic leadership' },
        { name: 'ফারহানা বেগম', subject: 'বাংলা ও ভাষা শিক্ষা', experience: 'পাঠাভ্যাস ও লিখন দক্ষতা' },
        { name: 'মোঃ রফিকুল ইসলাম', subject: 'গণিত', experience: 'Problem solving ও quiz care' },
        { name: 'সুমাইয়া নূর', subject: 'ইংরেজি', experience: 'Grammar, speaking ও reading' },
        { name: 'নাসরিন সুলতানা', subject: 'বিজ্ঞান', experience: 'Practical ও project-based learning' },
        { name: 'মোস্তফা কামাল', subject: 'ICT ও skill support', experience: 'Digital class ও student guidance' }
    ],
    facilities: [
        { title: 'ডিজিটাল ক্লাসরুম', description: 'Lesson topic, resource এবং smart attendance support।' },
        { title: 'পাঠাগার', description: 'বই, reference material এবং reading habit তৈরি।' },
        { title: 'Science ও ICT Lab', description: 'প্র্যাকটিক্যাল, project ও প্রযুক্তি শেখার সুযোগ।' },
        { title: 'অভিভাবক ডেস্ক', description: 'ভর্তি, ফলাফল, attendance এবং নিয়মিত যোগাযোগ।' },
        { title: 'নিরাপদ ক্যাম্পাস', description: 'শৃঙ্খলাপূর্ণ পরিবেশ, দায়িত্বশীল শিক্ষক ও supervision।' },
        { title: 'সহশিক্ষা কার্যক্রম', description: 'খেলা, debate, culture ও leadership practice।' }
    ],
    admissionFeatures: [
        'অনলাইন প্রাথমিক ভর্তি আবেদন',
        'প্রয়োজনীয় কাগজপত্র ও office যোগাযোগ',
        'শ্রেণি অনুযায়ী seat availability review',
        'অভিভাবকের ফোনে follow-up update'
    ]
};

export function buildSchoolWebsiteDemoPage(institution = {}, seedTag = 'school') {
    const siteName = institution.name || 'DigiGram Academy';
    const village = institution.village || 'আপনার গ্রাম';

    return {
        hero_title: siteName,
        hero_subtitle: 'শৃঙ্খলা, ফলাফল, উপস্থিতি এবং ভবিষ্যৎ প্রস্তুতির পূর্ণ ডিজিটাল শিক্ষা কেন্দ্র।',
        about_text: `${siteName} ${village}-এর শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য class update, result, notice, admission এবং portal সুবিধা একসাথে দিচ্ছে।`,
        principal_message: 'ভর্তি, ফলাফল, উপস্থিতি এবং প্রতিটি শিক্ষার্থীর অগ্রগতি নিয়মিত জানাতে আমাদের office ও digital portal পাশে আছে।',
        admission_text: 'নতুন শিক্ষাবর্ষে ভর্তি চলছে। প্রাথমিক আবেদন জমা দিলে office প্রয়োজনীয় কাগজপত্র, seat এবং পরবর্তী ধাপ জানাবে।',
        approval_text: 'শিক্ষা, শৃঙ্খলা ও যত্নের সমন্বিত পরিবেশ',
        contact_phone: '01711000000',
        contact_email: `${seedTag}@example.com`,
        address: `${village}, ডিজিগ্রাম ইউনিয়ন`,
        office_hours: 'শনি-বৃহস্পতিবার: সকাল ৮টা - বিকেল ৪টা',
        notice_ticker: SCHOOL_WEBSITE_DEMO_CONTENT.ticker,
        stats: SCHOOL_WEBSITE_DEMO_CONTENT.stats,
        about_highlights: SCHOOL_WEBSITE_DEMO_CONTENT.highlights,
        class_sections: SCHOOL_WEBSITE_DEMO_CONTENT.classes,
        public_teachers: SCHOOL_WEBSITE_DEMO_CONTENT.teachers,
        facilities: SCHOOL_WEBSITE_DEMO_CONTENT.facilities,
        admission_features: SCHOOL_WEBSITE_DEMO_CONTENT.admissionFeatures,
        footer_links: {
            site_name: siteName,
            footer_description: `${siteName} এখন DigiGram-এর মাধ্যমে website, portal, attendance, lesson progress এবং result management একসাথে ব্যবহার করছে।`,
            quick_links: ['ভর্তি তথ্য', 'নোটিশ বোর্ড', 'অভিভাবক আপডেট', 'যোগাযোগ'],
            academic_links: ['শ্রেণি ও বিভাগ', 'শিক্ষকমণ্ডলী', 'ফলাফল', 'সহশিক্ষা কার্যক্রম'],
            social_links: { facebook: '', youtube: '', website: '' },
            developer: { name: 'DigiGram', url: '', facebook: '', phone: '' },
            seo: {
                title: `${siteName} | DigiGram`,
                description: `${siteName}-এর ভর্তি, নোটিশ, শিক্ষক, ক্লাস আপডেট এবং অভিভাবক যোগাযোগ।`,
                keywords: 'school, admission, result, notice, digigram'
            },
            extra_sections: SCHOOL_WEBSITE_EXTRA_SECTIONS
        }
    };
}
