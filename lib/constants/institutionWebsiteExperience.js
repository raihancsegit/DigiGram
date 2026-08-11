const unsplash = (id, width = 1600) => (
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`
);

const KINDERGARTEN_IMAGES = {
    hero: unsplash('photo-1503454537195-1dcabb73ffb9b'),
    activity: unsplash('photo-1503919545889-aef636e10ad4'),
    classroom: unsplash('photo-1587654780291-39c9404d746b'),
    reading: unsplash('photo-1602030028438-4cf153cbae9e'),
    play: unsplash('photo-1596464716127-f2a82984de30')
};

const SCHOOL_IMAGES = {
    hero: unsplash('photo-1580582932707-520aed937b7b'),
    classroom: unsplash('photo-1509062522246-3755977927d7'),
    students: unsplash('photo-1523050854058-8df90110c9f1'),
    library: unsplash('photo-1521587760476-6c12a4b040da'),
    science: unsplash('photo-1532094349884-543bc11b234d')
};

const COLLEGE_IMAGES = {
    hero: unsplash('photo-1562774053-701939374585'),
    students: unsplash('photo-1523240795612-9a054b0db644'),
    campus: unsplash('photo-1541339907198-e08756dedf3b'),
    library: unsplash('photo-1524995997946-a1c2e315a42f'),
    laboratory: unsplash('photo-1532094349884-543bc11b234d')
};

const MADRASA_IMAGES = {
    hero: unsplash('photo-1564769662533-4f00a87b4056'),
    quran: unsplash('photo-1609599006353-e629aaabfeae'),
    mosque: unsplash('photo-1519817650390-64a93db51149'),
    study: unsplash('photo-1523050854058-8df90110c9f1'),
    library: unsplash('photo-1521587760476-6c12a4b040da')
};

const TEACHER_IMAGES = {
    womanOne: unsplash('photo-1494790108377-be9c29b29330', 500),
    manOne: unsplash('photo-1500648767791-00dcc994a43e', 500),
    womanTwo: unsplash('photo-1534528741775-53994a69daeb', 500),
    manTwo: unsplash('photo-1507003211169-0a1dd7228f2d', 500)
};

const EXPERIENCES = {
    kindergarten: {
        heroTitle: 'শিশুর আনন্দময় শেখার প্রথম ঠিকানা',
        heroSubtitle: 'নিরাপদ যত্ন, খেলা ও সৃজনশীলতায় প্রতিটি শিশুর আত্মবিশ্বাসী শুরু।',
        template: 'modern',
        layout: 'centered',
        approvalText: 'খেলতে খেলতে শেখা, ভালোবাসায় বেড়ে ওঠা',
        admissionText: 'Play, Nursery ও KG-তে সীমিত আসনে ভর্তি চলছে। ক্যাম্পাস ভিজিট বুক করতে আজই যোগাযোগ করুন।',
        seoKeywords: 'kindergarten, play group, nursery, kg, child learning, admission',
        ticker: [
            'Play, Nursery ও KG-তে নতুন শিক্ষাবর্ষের ভর্তি চলছে',
            'প্রতি বৃহস্পতিবার অভিভাবকদের জন্য campus visit',
            'শিশুর দৈনিক activity ও wellbeing update guardian portal-এ পাওয়া যাবে',
            'আগামী সপ্তাহে রং, গল্প ও ছড়া উৎসব'
        ],
        stats: [
            { value: '৩টি', label: 'শিশুবান্ধব ধাপ' },
            { value: '১:১৫', label: 'Teacher care ratio' },
            { value: 'প্রতিদিন', label: 'Guardian update' },
            { value: '১০০%', label: 'নিরাপদ pickup' }
        ],
        highlights: [
            'খেলা, গল্প, ছড়া ও হাতে-কলমে আনন্দময় শিক্ষা',
            'শিশুবান্ধব classroom এবং প্রশিক্ষিত caring teacher',
            'নিরাপদ pickup, health note ও guardian communication',
            'ভাষা, সংখ্যা, আচরণ ও আত্মবিশ্বাসের শক্ত ভিত্তি'
        ],
        classes: [
            { title: 'Play Group', description: 'খেলা, গল্প ও ছড়ার মাধ্যমে স্কুলের সঙ্গে আনন্দময় পরিচয়।', badge: 'PG' },
            { title: 'Nursery', description: 'ভাষা, সংখ্যা, রং, ছবি ও সুন্দর আচরণের প্রাথমিক চর্চা।', badge: 'Nursery' },
            { title: 'KG', description: 'পড়া, লেখা, গণনা ও আত্মবিশ্বাসে প্রাথমিক বিদ্যালয়ের প্রস্তুতি।', badge: 'KG' }
        ],
        teachers: [
            { name: 'তাসনিম জাহান', subject: 'Early Years Coordinator', experience: 'শিশু বিকাশ ও play-based learning', image_url: TEACHER_IMAGES.womanOne },
            { name: 'সাবিহা রহমান', subject: 'Play Group Teacher', experience: 'গল্প, ছড়া ও sensory activity', image_url: TEACHER_IMAGES.womanTwo },
            { name: 'মাহিনুল ইসলাম', subject: 'Creative Activity Teacher', experience: 'Art, movement ও child engagement', image_url: TEACHER_IMAGES.manOne }
        ],
        facilities: [
            { title: 'নিরাপদ pickup', description: 'অনুমোদিত অভিভাবকের কাছে যাচাই করে শিশু হস্তান্তর।' },
            { title: 'Activity room', description: 'খেলা, ছবি, গল্প, music ও হাতে-কলমে শেখার জায়গা।' },
            { title: 'শিশু স্বাস্থ্য নোট', description: 'Allergy, খাবার ও প্রয়োজনীয় যত্নের তথ্য সংরক্ষণ।' },
            { title: 'Guardian corner', description: 'উপস্থিতি, wellbeing ও শেখার অগ্রগতির নিয়মিত আপডেট।' }
        ],
        admission: ['শিশুর জন্মনিবন্ধন', 'অভিভাবকের ছবি ও যোগাযোগ', 'স্বাস্থ্য, allergy ও pickup তথ্য'],
        slider: [
            { title: 'আনন্দে শেখে, আত্মবিশ্বাসে বেড়ে ওঠে', subtitle: 'খেলা, গল্প, রং ও আবিষ্কারের মধ্য দিয়ে শিশুর সুন্দর শৈশব গড়ে তুলি।', badge: 'Happy learning', image_url: KINDERGARTEN_IMAGES.hero, button_label: 'ভর্তি তথ্য' },
            { title: 'প্রতিটি শিশুর জন্য যত্নশীল পরিবেশ', subtitle: 'ছোট class, caring teacher এবং guardian-এর সঙ্গে প্রতিদিনের যোগাযোগ।', badge: 'Safe & caring', image_url: KINDERGARTEN_IMAGES.classroom, button_label: 'আমাদের সম্পর্কে' },
            { title: 'সৃজনশীলতার রঙিন জগৎ', subtitle: 'Art, music, movement ও outdoor play-তে শিশু খুঁজে পায় নিজের সম্ভাবনা।', badge: 'Creative days', image_url: KINDERGARTEN_IMAGES.activity, button_label: 'কার্যক্রম দেখুন' }
        ],
        gallery: [
            { title: 'Activity classroom', image_url: KINDERGARTEN_IMAGES.classroom, caption: 'নিরাপদ, রঙিন ও অংশগ্রহণমূলক শেখার ঘর।' },
            { title: 'গল্পের সময়', image_url: KINDERGARTEN_IMAGES.reading, caption: 'ছবি ও গল্পে ভাষা, কল্পনা এবং মনোযোগের বিকাশ।' },
            { title: 'Creative play', image_url: KINDERGARTEN_IMAGES.activity, caption: 'রং, craft ও sensory activity-তে আনন্দময় অনুশীলন।' },
            { title: 'Play corner', image_url: KINDERGARTEN_IMAGES.play, caption: 'বন্ধুত্ব, sharing ও physical movement-এর নিরাপদ জায়গা।' }
        ],
        achievements: [
            { title: 'শিশু নিরাপত্তা', value: '১০০%', description: 'Verified pickup ও নিয়মিত wellbeing care।' },
            { title: 'অভিভাবক সংযোগ', value: 'Daily', description: 'প্রতিদিন activity ও progress update।' },
            { title: 'শেখার ধরন', value: 'Play', description: 'খেলা ও অনুসন্ধানভিত্তিক পাঠক্রম।' },
            { title: 'সৃজনশীল আয়োজন', value: '১২+', description: 'বছরজুড়ে theme day ও শিশু উৎসব।' }
        ],
        events: [
            { title: 'রং ও গল্প উৎসব', date: 'ফেব্রুয়ারি', description: 'শিশুদের আঁকা, গল্প বলা ও costume activity।' },
            { title: 'Family Fun Day', date: 'প্রতি টার্মে', description: 'শিশু, শিক্ষক ও অভিভাবকের আনন্দময় মিলন।' },
            { title: 'Little Explorers Day', date: 'মাসিক', description: 'প্রকৃতি, সংখ্যা ও সহজ science activity।' }
        ],
        programs: [
            { title: 'Play & Discover', description: 'খেলা ও sensory activity-তে নতুন ধারণা আবিষ্কার।' },
            { title: 'Language Steps', description: 'গল্প, ছড়া ও কথোপকথনে বাংলা-ইংরেজির ভিত্তি।' },
            { title: 'Creative Hands', description: 'Art, craft, music ও movement-এর নিয়মিত চর্চা।' },
            { title: 'Ready for Primary', description: 'KG শিক্ষার্থীর পড়া, লেখা, গণনা ও আত্মবিশ্বাসের প্রস্তুতি।' }
        ],
        faqs: [
            { question: 'কোন বয়সে ভর্তি করা যায়?', answer: 'শিশুর বয়স ও readiness দেখে Play, Nursery অথবা KG-তে ভর্তি পরামর্শ দেওয়া হয়।' },
            { question: 'Pickup নিরাপত্তা কীভাবে নিশ্চিত করা হয়?', answer: 'শুধু অনুমোদিত guardian-এর পরিচয় যাচাই করে শিশু হস্তান্তর করা হয়।' },
            { question: 'দৈনিক update কোথায় পাব?', answer: 'Guardian portal-এ উপস্থিতি, activity এবং প্রয়োজনীয় wellbeing note দেখা যাবে।' }
        ],
        cta: { title: 'শিশুর আনন্দময় শুরু আজই', text: 'ক্যাম্পাস ঘুরে দেখুন, শিক্ষকদের সঙ্গে কথা বলুন এবং উপযুক্ত class সম্পর্কে জানুন।', button: 'Campus visit বুক করুন' }
    },
    primary_school: {
        heroTitle: 'ভিত্তি শিক্ষা, সুন্দর মূল্যবোধ ও আত্মবিশ্বাসী ভবিষ্যৎ',
        heroSubtitle: 'প্রাক-প্রাথমিক থেকে পঞ্চম শ্রেণি—যত্নশীল পাঠদান ও নিয়মিত অভিভাবক সংযোগ।',
        template: 'modern',
        layout: 'split',
        approvalText: 'শক্ত ভিত্তি, সুন্দর মানুষ, উজ্জ্বল আগামী',
        admissionText: 'প্রাক-প্রাথমিক থেকে পঞ্চম শ্রেণিতে নতুন শিক্ষাবর্ষের ভর্তি চলছে। আসন ও প্রয়োজনীয় কাগজপত্র জানতে যোগাযোগ করুন।',
        seoKeywords: 'primary school, প্রাথমিক বিদ্যালয়, admission, classes, result',
        ticker: ['প্রাক-প্রাথমিক থেকে পঞ্চম শ্রেণিতে ভর্তি চলছে', 'মাসিক মূল্যায়নের ফল guardian portal-এ প্রকাশিত', 'শুক্রবার বইপড়া ও সৃজনশীল কার্যক্রম', 'অভিভাবক সভার সময়সূচি Notice Board-এ দেখুন'],
        stats: [
            { value: '১–৫', label: 'শ্রেণি' },
            { value: '২৫+', label: 'অভিজ্ঞ শিক্ষক' },
            { value: 'প্রতিদিন', label: 'উপস্থিতি আপডেট' },
            { value: '৯৭%', label: 'সন্তুষ্ট অভিভাবক' }
        ],
        highlights: ['বাংলা, ইংরেজি ও গণিতের শক্ত ভিত্তি', 'আনন্দময় এবং অংশগ্রহণমূলক classroom', 'নিয়মিত মূল্যায়ন ও guardian feedback', 'পাঠাভ্যাস, সৃজনশীলতা ও সুন্দর আচরণের চর্চা'],
        classes: [
            { title: 'প্রাক-প্রাথমিক', description: 'আনন্দময় পরিবেশে ভাষা, সংখ্যা ও school readiness।', badge: 'শুরু' },
            { title: '১ম–২য় শ্রেণি', description: 'পড়া, লেখা, গণনা ও শেখার অভ্যাসের শক্ত ভিত্তি।', badge: 'ভিত্তি' },
            { title: '৩য়–৫ম শ্রেণি', description: 'বিষয়ভিত্তিক জ্ঞান, সৃজনশীলতা ও পরবর্তী ধাপের প্রস্তুতি।', badge: 'অগ্রগতি' }
        ],
        teachers: [
            { name: 'ফারহানা ইয়াসমিন', subject: 'প্রধান শিক্ষক', experience: 'Primary leadership ও child care', image_url: TEACHER_IMAGES.womanOne },
            { name: 'মোঃ রাশেদুল ইসলাম', subject: 'গণিত ও বিজ্ঞান', experience: 'Activity-based foundation learning', image_url: TEACHER_IMAGES.manOne },
            { name: 'সুমাইয়া আক্তার', subject: 'বাংলা ও ইংরেজি', experience: 'Reading, phonics ও creative writing', image_url: TEACHER_IMAGES.womanTwo }
        ],
        facilities: [
            { title: 'শিশুবান্ধব শ্রেণিকক্ষ', description: 'নিরাপদ ও অংশগ্রহণমূলক পাঠদানের পরিবেশ।' },
            { title: 'পাঠাগার কর্নার', description: 'বই পড়া, গল্প বলা ও ভাষা দক্ষতার চর্চা।' },
            { title: 'Digital learning', description: 'Visual lesson, quiz ও interactive practice।' },
            { title: 'Guardian desk', description: 'উপস্থিতি, ফলাফল ও অগ্রগতির নিয়মিত যোগাযোগ।' }
        ],
        admission: ['জন্মনিবন্ধনের কপি', 'অভিভাবকের ছবি ও মোবাইল নম্বর', 'পূর্বের বিদ্যালয়ের ছাড়পত্র (প্রযোজ্য হলে)'],
        slider: [
            { title: 'শেখার শক্ত ভিত্তি, স্বপ্নের সুন্দর শুরু', subtitle: 'যত্নশীল শিক্ষক, নিয়মিত মূল্যায়ন ও আনন্দময় শিক্ষায় শিশুর পূর্ণ বিকাশ।', badge: 'ভর্তি চলছে', image_url: SCHOOL_IMAGES.hero, button_label: 'ভর্তি তথ্য' },
            { title: 'প্রতিটি শিশুর অগ্রগতিতে সমান যত্ন', subtitle: 'Classwork, attendance ও result-এর update অভিভাবকের কাছে নিয়মিত পৌঁছে যায়।', badge: 'Guardian care', image_url: SCHOOL_IMAGES.classroom, button_label: 'আমাদের পদ্ধতি' },
            { title: 'বই, বিজ্ঞান ও সৃজনশীলতার ক্যাম্পাস', subtitle: 'পাঠ্যবইয়ের পাশাপাশি reading, project ও co-curricular activity।', badge: 'Campus life', image_url: SCHOOL_IMAGES.students, button_label: 'Gallery দেখুন' }
        ],
        gallery: [
            { title: 'আনন্দময় classroom', image_url: SCHOOL_IMAGES.classroom, caption: 'প্রশ্ন, আলোচনা ও হাতে-কলমে শেখার পরিবেশ।' },
            { title: 'পাঠাগার সময়', image_url: SCHOOL_IMAGES.library, caption: 'গল্প ও বয়সভিত্তিক বইয়ে পাঠাভ্যাস তৈরি।' },
            { title: 'বন্ধুত্ব ও দলীয় কাজ', image_url: SCHOOL_IMAGES.students, caption: 'সহযোগিতা, নেতৃত্ব ও সামাজিক দক্ষতার চর্চা।' },
            { title: 'Little science lab', image_url: SCHOOL_IMAGES.science, caption: 'নিরাপদ ছোট experiment-এ বিজ্ঞানের আনন্দ।' }
        ],
        achievements: [
            { title: 'শিক্ষার্থী উপস্থিতি', value: '৯৬%', description: 'নিয়মিত follow-up ও guardian support।' },
            { title: 'পাঠাগার কার্যক্রম', value: 'Weekly', description: 'প্রতি সপ্তাহে guided reading session।' },
            { title: 'মূল্যায়ন', value: 'Monthly', description: 'অগ্রগতি বুঝতে ছোট ও সহায়ক assessment।' },
            { title: 'সহশিক্ষা', value: '১০+', description: 'বছরজুড়ে সৃজনশীল ও ক্রীড়া আয়োজন।' }
        ],
        events: [
            { title: 'বইপড়া সপ্তাহ', date: 'প্রতি টার্মে', description: 'গল্পপাঠ, book review ও ছোটদের বইমেলা।' },
            { title: 'Science Discovery Day', date: 'বার্ষিক', description: 'সহজ experiment ও শিক্ষার্থীদের project display।' },
            { title: 'অভিভাবক সভা', date: 'মাসিক', description: 'উপস্থিতি, ফলাফল ও শিশুর অগ্রগতি নিয়ে আলোচনা।' }
        ],
        programs: [
            { title: 'Foundation Literacy', description: 'পড়া, লেখা ও ভাষা প্রকাশের বয়সভিত্তিক সহায়তা।' },
            { title: 'Everyday Mathematics', description: 'বাস্তব উদাহরণ ও activity-তে গণিত শেখা।' },
            { title: 'Young Explorers', description: 'বিজ্ঞান, প্রকৃতি ও প্রশ্ন করার অভ্যাস গড়ে তোলা।' },
            { title: 'Values & Life Skills', description: 'শৃঙ্খলা, সহমর্মিতা ও দায়িত্বশীলতার চর্চা।' }
        ],
        faqs: [
            { question: 'ভর্তি পরীক্ষার প্রয়োজন আছে?', answer: 'শ্রেণি অনুযায়ী শিশুর readiness বুঝতে একটি সহজ পরিচিতিমূলক assessment নেওয়া হতে পারে।' },
            { question: 'অভিভাবক result কীভাবে দেখবেন?', answer: 'Guardian portal-এ উপস্থিতি, class update ও published result দেখা যাবে।' },
            { question: 'স্কুলের সময়সূচি কোথায় পাওয়া যাবে?', answer: 'Academic page ও Notice Board-এ class এবং পরীক্ষার সময়সূচি প্রকাশ করা হয়।' }
        ],
        cta: { title: 'সন্তানের সুন্দর শিক্ষাযাত্রা শুরু করুন', text: 'ভর্তি, class placement ও campus visit সম্পর্কে আমাদের admission desk-এর সঙ্গে কথা বলুন।', button: 'ভর্তি আবেদন করুন' }
    },
    high_school: {
        heroTitle: 'শৃঙ্খলা, ফলাফল ও ভবিষ্যৎ প্রস্তুতির বিদ্যালয়',
        heroSubtitle: 'ষষ্ঠ থেকে দশম শ্রেণি—বিষয়ভিত্তিক শিক্ষা, নিয়মিত মূল্যায়ন ও SSC প্রস্তুতি।',
        template: 'dark_school',
        layout: 'split',
        approvalText: 'জ্ঞান, শৃঙ্খলা ও নেতৃত্বে এগিয়ে চলা',
        admissionText: 'ষষ্ঠ থেকে দশম শ্রেণিতে সীমিত আসনে ভর্তি চলছে। বিভাগ, seat ও ভর্তি পরীক্ষার তথ্য admission desk-এ পাওয়া যাবে।',
        seoKeywords: 'high school, secondary school, SSC, admission, result, notice',
        ticker: ['ষষ্ঠ থেকে নবম শ্রেণিতে ভর্তি আবেদন চলছে', 'SSC প্রস্তুতি model test-এর সময়সূচি প্রকাশিত', 'Science Club registration শুরু হয়েছে', 'মাসিক ফলাফল ও attendance guardian portal-এ দেখুন'],
        stats: [
            { value: '৬–১০', label: 'শ্রেণি' },
            { value: '৯৮%', label: 'SSC পাসের হার' },
            { value: '৪০+', label: 'অভিজ্ঞ শিক্ষক' },
            { value: '১২+', label: 'Club ও activity' }
        ],
        highlights: ['বিষয়ভিত্তিক অভিজ্ঞ শিক্ষক ও structured lesson plan', 'SSC প্রস্তুতি, model test ও ফলাফল বিশ্লেষণ', 'Science, ICT, language ও leadership club', 'Guardian portal-এ attendance, notice ও result'],
        classes: [
            { title: 'নিম্ন মাধ্যমিক', description: 'ষষ্ঠ–অষ্টম শ্রেণিতে ধারণা, দক্ষতা ও নিয়মিত মূল্যায়নের শক্ত ভিত্তি।', badge: '৬–৮' },
            { title: 'বিজ্ঞান বিভাগ', description: 'Physics, Chemistry, Biology ও Higher Math-এর প্রস্তুতি।', badge: 'Science' },
            { title: 'মানবিক ও ব্যবসায় শিক্ষা', description: 'বিভাগভিত্তিক পাঠ, পরীক্ষা ও ভবিষ্যৎ পরিকল্পনা।', badge: '৯–১০' }
        ],
        teachers: [
            { name: 'মোঃ আনিসুর রহমান', subject: 'প্রধান শিক্ষক', experience: 'Academic leadership ও SSC planning', image_url: TEACHER_IMAGES.manOne },
            { name: 'নাসরিন সুলতানা', subject: 'বিজ্ঞান', experience: 'Practical ও inquiry-based learning', image_url: TEACHER_IMAGES.womanOne },
            { name: 'সুমাইয়া নূর', subject: 'ইংরেজি', experience: 'Language skill ও board preparation', image_url: TEACHER_IMAGES.womanTwo },
            { name: 'মোস্তফা কামাল', subject: 'গণিত ও ICT', experience: 'Problem solving ও digital skill', image_url: TEACHER_IMAGES.manTwo }
        ],
        facilities: [
            { title: 'Science laboratory', description: 'Physics, Chemistry ও Biology practical-এর প্রয়োজনীয় support।' },
            { title: 'ICT lab', description: 'Digital literacy, programming ধারণা ও technology practice।' },
            { title: 'সমৃদ্ধ পাঠাগার', description: 'Text, reference, fiction ও exam preparation বই।' },
            { title: 'Career & guardian desk', description: 'ফলাফল review, subject choice ও অভিভাবক পরামর্শ।' }
        ],
        admission: ['জন্মনিবন্ধন ও শিক্ষার্থীর ছবি', 'পূর্বের পরীক্ষার ফলাফল/ছাড়পত্র', 'অভিভাবকের পরিচয় ও যোগাযোগ'],
        slider: [
            { title: 'শিক্ষায় উৎকর্ষ, চরিত্রে দৃঢ়তা', subtitle: 'অভিজ্ঞ শিক্ষক, আধুনিক learning support এবং প্রতিটি শিক্ষার্থীর অগ্রগতির নিয়মিত যত্ন।', badge: 'Academic excellence', image_url: SCHOOL_IMAGES.hero, button_label: 'ভর্তি তথ্য' },
            { title: 'SSC প্রস্তুতিতে পরিকল্পিত পথচলা', subtitle: 'Topic review, model test, result analysis ও দুর্বল বিষয়ে আলাদা support।', badge: 'SSC readiness', image_url: SCHOOL_IMAGES.classroom, button_label: 'Academic program' },
            { title: 'ক্লাসের বাইরে নেতৃত্ব ও দক্ষতা', subtitle: 'Science, debate, sports, culture ও ICT activity-তে প্রাণবন্ত campus life।', badge: 'Beyond classroom', image_url: SCHOOL_IMAGES.students, button_label: 'Campus life' }
        ],
        gallery: [
            { title: 'Smart classroom', image_url: SCHOOL_IMAGES.classroom, caption: 'আলোচনা, visual lesson ও focused learning।' },
            { title: 'Science practical', image_url: SCHOOL_IMAGES.science, caption: 'বোর্ড প্রস্তুতির পাশাপাশি হাতে-কলমে science learning।' },
            { title: 'পাঠাগার', image_url: SCHOOL_IMAGES.library, caption: 'Reference, সাহিত্য ও exam preparation-এর সমৃদ্ধ সংগ্রহ।' },
            { title: 'Student activities', image_url: SCHOOL_IMAGES.students, caption: 'দলীয় কাজ, club ও leadership-এর প্রাণবন্ত আয়োজন।' }
        ],
        achievements: [
            { title: 'SSC ফলাফল', value: '৯৮%', description: 'সাম্প্রতিক বোর্ড পরীক্ষায় গর্বিত সাফল্য।' },
            { title: 'মেধাবৃত্তি', value: '৩২+', description: 'গত শিক্ষাবর্ষে merit support পাওয়া শিক্ষার্থী।' },
            { title: 'Model test', value: '১২', description: 'বছরজুড়ে পরিকল্পিত পরীক্ষা ও feedback।' },
            { title: 'Club', value: '১২+', description: 'Science, debate, sports ও cultural club।' }
        ],
        events: [
            { title: 'Science & Innovation Fair', date: 'ফেব্রুয়ারি', description: 'শিক্ষার্থীদের project, prototype ও presentation।' },
            { title: 'SSC Career Session', date: 'প্রতি টার্মে', description: 'বিভাগ, উচ্চশিক্ষা ও career pathway আলোচনা।' },
            { title: 'Annual Sports & Culture', date: 'ডিসেম্বর', description: 'খেলাধুলা, বিতর্ক, আবৃত্তি ও সাংস্কৃতিক অনুষ্ঠান।' }
        ],
        programs: [
            { title: 'SSC Success Track', description: 'Syllabus map, weekly test, model test ও result review।' },
            { title: 'Science & ICT', description: 'Lab practical, digital skill ও problem-solving project।' },
            { title: 'Language & Communication', description: 'বাংলা-ইংরেজি লেখা, speaking ও presentation practice।' },
            { title: 'Leadership & Clubs', description: 'Debate, sports, culture ও community activity।' }
        ],
        faqs: [
            { question: 'কোন কোন শ্রেণিতে ভর্তি চলছে?', answer: 'Seat availability অনুযায়ী ষষ্ঠ থেকে নবম শ্রেণিতে আবেদন নেওয়া হয়।' },
            { question: 'SSC প্রস্তুতিতে কী support আছে?', answer: 'পরিকল্পিত syllabus completion, model test, result analysis ও দুর্বল বিষয়ে extra care দেওয়া হয়।' },
            { question: 'Result ও attendance কোথায় পাওয়া যাবে?', answer: 'Guardian portal-এ verified account দিয়ে published result এবং attendance দেখা যাবে।' }
        ],
        cta: { title: 'সাফল্যের পরবর্তী অধ্যায় শুরু হোক এখানে', text: 'ভর্তি, বিভাগ, seat এবং campus visit-এর জন্য admission office-এর সঙ্গে যোগাযোগ করুন।', button: 'ভর্তি আবেদন করুন' }
    },
    college: {
        heroTitle: 'উচ্চশিক্ষা ও ক্যারিয়ার প্রস্তুতির বিশ্বস্ত ক্যাম্পাস',
        heroSubtitle: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা—ফলাফল, দক্ষতা ও বিশ্ববিদ্যালয় প্রস্তুতির সমন্বিত পথচলা।',
        template: 'dark_college',
        layout: 'magazine',
        approvalText: 'Think beyond. Learn with purpose.',
        admissionText: 'একাদশ শ্রেণিতে বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগে ভর্তি চলছে। যোগ্যতা ও আসনসংখ্যা জানতে admission desk-এ যোগাযোগ করুন।',
        seoKeywords: 'college, HSC admission, science, humanities, business studies, campus',
        ticker: ['একাদশ শ্রেণিতে online admission শুরু হয়েছে', 'HSC model test routine Academic page-এ প্রকাশিত', 'University admission mentoring registration চলছে', 'Scholarship application-এর শেষ তারিখ Notice Board-এ দেখুন'],
        stats: [
            { value: '৩টি', label: 'Academic group' },
            { value: '৯৭%', label: 'HSC পাসের হার' },
            { value: '৫০+', label: 'Faculty member' },
            { value: '১৮+', label: 'Club & society' }
        ],
        highlights: ['বিভাগভিত্তিক অভিজ্ঞ faculty ও structured academic plan', 'HSC result review ও university admission mentoring', 'Science lab, ICT lab, library এবং seminar support', 'Scholarship, club, career ও student affairs service'],
        classes: [
            { title: 'বিজ্ঞান', description: 'Physics, Chemistry, Biology, Higher Math ও lab practical।', badge: 'Science' },
            { title: 'মানবিক', description: 'ইতিহাস, সমাজবিজ্ঞান, যুক্তিবিদ্যা, অর্থনীতি ও ভাষা।', badge: 'Humanities' },
            { title: 'ব্যবসায় শিক্ষা', description: 'হিসাববিজ্ঞান, Finance, Management ও business foundation।', badge: 'Business' }
        ],
        teachers: [
            { name: 'অধ্যাপক মাহবুবুর রহমান', subject: 'অধ্যক্ষ', experience: 'Higher secondary leadership ও mentoring', image_url: TEACHER_IMAGES.manTwo },
            { name: 'ড. নুসরাত জাহান', subject: 'জীববিজ্ঞান', experience: 'Lab learning ও research guidance', image_url: TEACHER_IMAGES.womanOne },
            { name: 'শারমিন আক্তার', subject: 'ইংরেজি', experience: 'Academic writing ও communication', image_url: TEACHER_IMAGES.womanTwo },
            { name: 'মোঃ সাইফুল ইসলাম', subject: 'হিসাববিজ্ঞান', experience: 'Business studies ও career mentoring', image_url: TEACHER_IMAGES.manOne }
        ],
        facilities: [
            { title: 'Advanced laboratories', description: 'Physics, Chemistry, Biology ও ICT practical facilities।' },
            { title: 'Knowledge library', description: 'Textbook, reference, journal ও admission preparation resources।' },
            { title: 'Career centre', description: 'University admission, subject choice ও career counselling।' },
            { title: 'Student affairs', description: 'ভর্তি, scholarship, club এবং academic support।' }
        ],
        admission: ['SSC transcript ও registration তথ্য', 'ছবি, জন্মনিবন্ধন/NID তথ্য', 'পছন্দের বিভাগ ও guardian contact'],
        slider: [
            { title: 'জ্ঞান থেকে সম্ভাবনার নতুন দিগন্ত', subtitle: 'মানসম্মত HSC শিক্ষা, আধুনিক campus এবং উচ্চশিক্ষা প্রস্তুতির সমন্বিত অভিজ্ঞতা।', badge: 'Admission open', image_url: COLLEGE_IMAGES.hero, button_label: 'Apply now' },
            { title: 'Campus life that shapes the future', subtitle: 'Club, seminar, leadership ও collaborative learning-এ গড়ে উঠুক ভবিষ্যতের দক্ষতা।', badge: 'Student life', image_url: COLLEGE_IMAGES.students, button_label: 'Campus explore' },
            { title: 'HSC থেকে university—পরিকল্পিত প্রস্তুতি', subtitle: 'Model test, result analytics, mentoring ও admission guidance একই academic journey-তে।', badge: 'Future ready', image_url: COLLEGE_IMAGES.campus, button_label: 'Programs দেখুন' }
        ],
        gallery: [
            { title: 'College campus', image_url: COLLEGE_IMAGES.campus, caption: 'আধুনিক, প্রাণবন্ত ও শিক্ষার্থী-কেন্দ্রিক campus environment।' },
            { title: 'Collaborative learning', image_url: COLLEGE_IMAGES.students, caption: 'দলীয় project, seminar ও peer learning experience।' },
            { title: 'Central library', image_url: COLLEGE_IMAGES.library, caption: 'Text, reference, journal ও quiet study space।' },
            { title: 'Science laboratory', image_url: COLLEGE_IMAGES.laboratory, caption: 'HSC practical ও অনুসন্ধানভিত্তিক শেখার support।' }
        ],
        achievements: [
            { title: 'HSC ফলাফল', value: '৯৭%', description: 'সাম্প্রতিক বোর্ড পরীক্ষায় ধারাবাহিক সাফল্য।' },
            { title: 'University placement', value: '১৮০+', description: 'গত তিন বছরে public ও private university-তে সুযোগ।' },
            { title: 'Scholarship', value: '৭৫+', description: 'Merit ও need-based সহায়তা পাওয়া শিক্ষার্থী।' },
            { title: 'Club & society', value: '১৮+', description: 'Leadership, culture, science ও community engagement।' }
        ],
        events: [
            { title: 'University Admission Summit', date: 'সেপ্টেম্বর', description: 'Subject choice, preparation ও alumni mentoring।' },
            { title: 'Research & Science Expo', date: 'মার্চ', description: 'Project, poster ও experimental presentation।' },
            { title: 'Career & Skills Week', date: 'বার্ষিক', description: 'Communication, CV, digital skill ও industry talk।' }
        ],
        programs: [
            { title: 'HSC Academic Excellence', description: 'Group-wise class, practical, tutorial ও model test plan।' },
            { title: 'University Readiness', description: 'Admission mentoring, subject selection ও practice test।' },
            { title: 'Research & Innovation', description: 'Science project, seminar এবং inquiry-based learning।' },
            { title: 'Career & Leadership', description: 'Club, volunteering, communication ও future skill development।' }
        ],
        faqs: [
            { question: 'কোন বিভাগে ভর্তি হওয়া যায়?', answer: 'যোগ্যতা ও আসন অনুযায়ী বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগে আবেদন করা যায়।' },
            { question: 'Scholarship সুবিধা আছে?', answer: 'ফলাফল ও আর্থিক প্রয়োজন অনুযায়ী বিভিন্ন merit এবং need-based সহায়তা দেওয়া হয়।' },
            { question: 'University admission support কীভাবে পাওয়া যাবে?', answer: 'Career centre-এর mentoring, practice test ও admission information session-এ অংশ নেওয়া যায়।' }
        ],
        cta: { title: 'আপনার উচ্চশিক্ষার যাত্রা এখান থেকেই', text: 'বিভাগ, admission requirement, scholarship ও campus visit সম্পর্কে counsellor-এর সঙ্গে কথা বলুন।', button: 'Admission desk' }
    },
    dakhil_madrasa: {
        heroTitle: 'দ্বীনি মূল্যবোধ ও আধুনিক শিক্ষায় সুন্দর ভবিষ্যৎ',
        heroSubtitle: 'ইবতেদায়ি থেকে দাখিল—কুরআন, আরবি ও সাধারণ শিক্ষার সুশৃঙ্খল সমন্বয়।',
        template: 'dark_madrasa',
        layout: 'centered',
        approvalText: 'ইলম, আদব ও আমলে আলোকিত প্রজন্ম',
        admissionText: 'ইবতেদায়ি ও দাখিল শ্রেণিতে নতুন শিক্ষাবর্ষের ভর্তি চলছে। জামাত ও seat সম্পর্কে admission office-এ যোগাযোগ করুন।',
        seoKeywords: 'dakhil madrasa, ibtedayi, Quran, Arabic, madrasa admission',
        ticker: ['ইবতেদায়ি ও দাখিল শ্রেণিতে ভর্তি চলছে', 'দৈনিক হাজিরা ও সবক guardian portal-এ প্রকাশিত', 'দাখিল model test-এর সময়সূচি Notice Board-এ', 'বার্ষিক কিরাত ও হামদ-নাত প্রতিযোগিতার নিবন্ধন শুরু'],
        stats: [
            { value: '১–১০', label: 'শ্রেণি ও জামাত' },
            { value: 'দৈনিক', label: 'কুরআন ও সবক' },
            { value: '৯৬%', label: 'দাখিল পাসের হার' },
            { value: '৩০+', label: 'অভিজ্ঞ উস্তাদ' }
        ],
        highlights: ['কুরআন, তাজবিদ, হাদিস ও আরবি ভাষার যত্নশীল শিক্ষা', 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান ও ICT-এর সমন্বিত পাঠ', 'দৈনিক হাজিরা, সবক ও guardian update', 'আদব, আখলাক এবং বোর্ড পরীক্ষার পরিকল্পিত প্রস্তুতি'],
        classes: [
            { title: 'ইবতেদায়ি', description: 'কুরআন, আদব ও সাধারণ শিক্ষার আনন্দময় প্রাথমিক ভিত্তি।', badge: '১–৫' },
            { title: 'জুনিয়র দাখিল', description: 'আরবি, দ্বীনি বিষয় ও সাধারণ বিষয়ে সুসংগঠিত প্রস্তুতি।', badge: '৬–৮' },
            { title: 'দাখিল', description: 'বিভাগভিত্তিক পাঠ, board syllabus ও model test support।', badge: '৯–১০' }
        ],
        teachers: [
            { name: 'মাওলানা আবদুল হাকিম', subject: 'সুপারিনটেনডেন্ট', experience: 'দ্বীনি ও একাডেমিক নেতৃত্ব', image_url: TEACHER_IMAGES.manTwo },
            { name: 'কারি মোঃ ইউসুফ', subject: 'কুরআন ও তাজবিদ', experience: 'শুদ্ধ তিলাওয়াত ও কিরাত প্রশিক্ষণ', image_url: TEACHER_IMAGES.manOne },
            { name: 'মোছাঃ আয়েশা সিদ্দিকা', subject: 'বাংলা ও ইংরেজি', experience: 'ভাষা শিক্ষা ও board preparation', image_url: TEACHER_IMAGES.womanOne }
        ],
        facilities: [
            { title: 'কুরআন ও তাজবিদ বিভাগ', description: 'শুদ্ধ তিলাওয়াত, হিফজ support ও নিয়মিত মূল্যায়ন।' },
            { title: 'আরবি ভাষা শিক্ষা', description: 'নাহু-সরফ, কিতাব পাঠ ও ভাষা অনুশীলন।' },
            { title: 'Science ও ICT support', description: 'সাধারণ বিষয়ের practical এবং digital learning।' },
            { title: 'হাজিরা ও guardian desk', description: 'দৈনিক উপস্থিতি, সবক, ফলাফল ও পরামর্শ সেবা।' }
        ],
        admission: ['জন্মনিবন্ধন ও শিক্ষার্থীর ছবি', 'পূর্বের জামাত/শ্রেণির ফলাফল', 'অভিভাবকের পরিচয় ও যোগাযোগ'],
        slider: [
            { title: 'দ্বীনি শিক্ষায় দৃঢ়, আধুনিক জ্ঞানে সমৃদ্ধ', subtitle: 'কুরআন, সুন্নাহ, আরবি ও সাধারণ শিক্ষায় আদর্শ মানুষ গড়ার বিশ্বস্ত প্রতিষ্ঠান।', badge: 'ভর্তি চলছে', image_url: MADRASA_IMAGES.hero, button_label: 'ভর্তি তথ্য' },
            { title: 'শুদ্ধ তিলাওয়াত ও সুন্দর আখলাক', subtitle: 'যোগ্য উস্তাদের তত্ত্বাবধানে কুরআন, তাজবিদ, আদব ও দৈনন্দিন আমলের চর্চা।', badge: 'Quran learning', image_url: MADRASA_IMAGES.quran, button_label: 'আমাদের শিক্ষা' },
            { title: 'দাখিল পরীক্ষায় পরিকল্পিত প্রস্তুতি', subtitle: 'দ্বীনি ও সাধারণ বিষয়ে class, model test, result review ও guardian support।', badge: 'Board readiness', image_url: MADRASA_IMAGES.study, button_label: 'Academic program' }
        ],
        gallery: [
            { title: 'কুরআন শিক্ষা', image_url: MADRASA_IMAGES.quran, caption: 'শুদ্ধ তিলাওয়াত, তাজবিদ ও নিয়মিত সবকের যত্ন।' },
            { title: 'শান্ত ক্যাম্পাস', image_url: MADRASA_IMAGES.mosque, caption: 'ইবাদত, শৃঙ্খলা ও শিক্ষার প্রশান্ত পরিবেশ।' },
            { title: 'সাধারণ শিক্ষা', image_url: MADRASA_IMAGES.study, caption: 'বোর্ড syllabus অনুযায়ী বাংলা, ইংরেজি, গণিত ও বিজ্ঞান।' },
            { title: 'ইসলামিক লাইব্রেরি', image_url: MADRASA_IMAGES.library, caption: 'তাফসির, হাদিস, আরবি ও সাধারণ জ্ঞানের বই।' }
        ],
        achievements: [
            { title: 'দাখিল ফলাফল', value: '৯৬%', description: 'বোর্ড পরীক্ষায় ধারাবাহিক সাফল্য।' },
            { title: 'কুরআন পাঠ', value: 'Daily', description: 'তাজবিদসহ নিয়মিত তিলাওয়াত ও সবক।' },
            { title: 'বৃত্তি', value: '২৫+', description: 'মেধা ও আর্থিক সহায়তা পাওয়া শিক্ষার্থী।' },
            { title: 'দ্বীনি আয়োজন', value: '১২+', description: 'কিরাত, হামদ-নাত ও সীরাত অনুষ্ঠান।' }
        ],
        events: [
            { title: 'কিরাত প্রতিযোগিতা', date: 'রমজানের আগে', description: 'তিলাওয়াত, তাজবিদ ও সুন্দর কণ্ঠের আয়োজন।' },
            { title: 'সীরাতুন্নবী আলোচনা', date: 'বার্ষিক', description: 'সীরাত, আখলাক ও জীবনে সুন্নাহর শিক্ষা।' },
            { title: 'দাখিল প্রস্তুতি সভা', date: 'প্রতি টার্মে', description: 'শিক্ষার্থী, শিক্ষক ও guardian-এর result review।' }
        ],
        programs: [
            { title: 'Quran & Tajweed', description: 'শুদ্ধ তিলাওয়াত, প্রয়োজনীয় সূরা এবং নিয়মিত মূল্যায়ন।' },
            { title: 'Arabic & Islamic Studies', description: 'আরবি ভাষা, হাদিস, ফিকহ ও আকাইদের ভিত্তি।' },
            { title: 'Dakhil Academic Track', description: 'বোর্ড syllabus, model test ও result analysis।' },
            { title: 'Adab & Life Skills', description: 'শৃঙ্খলা, দায়িত্ব, সুন্দর আচরণ ও সামাজিক দক্ষতা।' }
        ],
        faqs: [
            { question: 'ইবতেদায়িতে কোন বয়সে ভর্তি করা হয়?', answer: 'বয়স, পূর্বের শেখা ও readiness দেখে উপযুক্ত শ্রেণিতে ভর্তি পরামর্শ দেওয়া হয়।' },
            { question: 'সাধারণ বিষয়গুলো পড়ানো হয়?', answer: 'হ্যাঁ, বোর্ড curriculum অনুযায়ী বাংলা, ইংরেজি, গণিত, বিজ্ঞানসহ সাধারণ বিষয় পড়ানো হয়।' },
            { question: 'হাজিরা ও সবক কীভাবে জানা যাবে?', answer: 'Guardian portal-এ verified account দিয়ে দৈনিক হাজিরা ও প্রকাশিত lesson update দেখা যাবে।' }
        ],
        cta: { title: 'ইলম ও আখলাকের সুন্দর যাত্রায় যুক্ত হোন', text: 'জামাত, ভর্তি যোগ্যতা ও campus visit সম্পর্কে admission office-এর সঙ্গে কথা বলুন।', button: 'ভর্তি আবেদন করুন' }
    },
    alim_madrasa: {
        heroTitle: 'ইলম, প্রজ্ঞা ও উচ্চশিক্ষার সমন্বিত পথচলা',
        heroSubtitle: 'দাখিল থেকে আলিম—দ্বীনি জ্ঞান, সাধারণ শিক্ষা ও উচ্চশিক্ষা প্রস্তুতির পরিপূর্ণ পরিবেশ।',
        template: 'dark_madrasa',
        layout: 'centered',
        approvalText: 'ইলমে গভীরতা, চরিত্রে সৌন্দর্য, সেবায় অঙ্গীকার',
        admissionText: 'দাখিল ও আলিম শ্রেণিতে ভর্তি চলছে। বিভাগ, যোগ্যতা এবং আসনসংখ্যা জানতে admission office-এ যোগাযোগ করুন।',
        seoKeywords: 'alim madrasa, dakhil, Islamic studies, Arabic, alim admission',
        ticker: ['আলিম প্রথম বর্ষে ভর্তি আবেদন চলছে', 'আলিম model test ও revision routine প্রকাশিত', 'Arabic seminar-এর registration শুরু হয়েছে', 'Board result ও guardian update portal-এ পাওয়া যাবে'],
        stats: [
            { value: 'দাখিল–আলিম', label: 'Academic pathway' },
            { value: '৯৭%', label: 'আলিম পাসের হার' },
            { value: '৩৫+', label: 'শিক্ষক ও মুহাদ্দিস' },
            { value: '১৫+', label: 'বৃত্তি ও সহায়তা' }
        ],
        highlights: ['কুরআন, হাদিস, ফিকহ, আরবি সাহিত্য ও সাধারণ শিক্ষা', 'আলিম board preparation ও higher education guidance', 'যোগ্য মুহাদ্দিস, মুফাসসির ও subject teacher', 'Library, seminar, ICT ও student mentoring support'],
        classes: [
            { title: 'দাখিল', description: 'দ্বীনি ও সাধারণ বিষয়ে board curriculum-এর সুগঠিত ভিত্তি।', badge: '৯–১০' },
            { title: 'আলিম সাধারণ', description: 'ইসলামি শিক্ষা, আরবি ও সাধারণ বিষয়ের উচ্চমাধ্যমিক পাঠ।', badge: 'Alim' },
            { title: 'Higher Study Track', description: 'বিশ্ববিদ্যালয়, ফাজিল ও উচ্চতর দ্বীনি শিক্ষার প্রস্তুতি।', badge: 'Future' }
        ],
        teachers: [
            { name: 'মাওলানা ড. আবদুর রউফ', subject: 'অধ্যক্ষ', experience: 'Islamic studies ও academic leadership', image_url: TEACHER_IMAGES.manTwo },
            { name: 'মুফতি মোঃ সালমান', subject: 'হাদিস ও ফিকহ', experience: 'উচ্চতর দ্বীনি পাঠ ও research guidance', image_url: TEACHER_IMAGES.manOne },
            { name: 'ড. নাজমা খাতুন', subject: 'আরবি ও ইংরেজি', experience: 'Language, translation ও higher study support', image_url: TEACHER_IMAGES.womanOne }
        ],
        facilities: [
            { title: 'Hadith & Arabic faculty', description: 'কিতাব, গবেষণা, ভাষা ও advanced Islamic studies support।' },
            { title: 'সমৃদ্ধ ইসলামিক লাইব্রেরি', description: 'তাফসির, হাদিস, ফিকহ, আরবি সাহিত্য ও reference book।' },
            { title: 'ICT & language lab', description: 'Digital research, typing, presentation ও language practice।' },
            { title: 'Higher study guidance', description: 'University, Fazil এবং career pathway পরামর্শ।' }
        ],
        admission: ['দাখিল/সমমান transcript ও registration', 'ছবি, জন্মনিবন্ধন/NID তথ্য', 'বিভাগ পছন্দ ও guardian contact'],
        slider: [
            { title: 'দ্বীনি জ্ঞান ও উচ্চশিক্ষার আলোকিত পথ', subtitle: 'কুরআন-সুন্নাহর গভীরতা, আধুনিক শিক্ষা এবং ভবিষ্যৎ নেতৃত্বের সমন্বিত প্রস্তুতি।', badge: 'Alim admission', image_url: MADRASA_IMAGES.hero, button_label: 'ভর্তি তথ্য' },
            { title: 'গবেষণা, ভাষা ও প্রজ্ঞার চর্চা', subtitle: 'হাদিস, ফিকহ, আরবি সাহিত্য ও general studies-এ অভিজ্ঞ শিক্ষকের নিবিড় দিকনির্দেশনা।', badge: 'Academic depth', image_url: MADRASA_IMAGES.library, button_label: 'বিভাগ দেখুন' },
            { title: 'আলিমের পর উচ্চশিক্ষার প্রস্তুতি', subtitle: 'Board result, university pathway, scholarship ও career mentoring একই journey-তে।', badge: 'Higher study', image_url: MADRASA_IMAGES.study, button_label: 'Guidance দেখুন' }
        ],
        gallery: [
            { title: 'Islamic studies', image_url: MADRASA_IMAGES.quran, caption: 'কুরআন, হাদিস, ফিকহ ও গবেষণার নিয়মিত চর্চা।' },
            { title: 'Academic environment', image_url: MADRASA_IMAGES.study, caption: 'দ্বীনি ও সাধারণ বিষয়ে focused higher secondary learning।' },
            { title: 'Library & research', image_url: MADRASA_IMAGES.library, caption: 'কিতাব, reference এবং higher study resources।' },
            { title: 'Spiritual campus', image_url: MADRASA_IMAGES.mosque, caption: 'ইবাদত, ইলম ও সুন্দর আখলাকের প্রশান্ত পরিবেশ।' }
        ],
        achievements: [
            { title: 'আলিম ফলাফল', value: '৯৭%', description: 'বোর্ড পরীক্ষায় ধারাবাহিক সাফল্য।' },
            { title: 'Higher study', value: '৮৫+', description: 'বিশ্ববিদ্যালয় ও উচ্চতর দ্বীনি শিক্ষায় অগ্রসর alumni।' },
            { title: 'Scholarship', value: '১৫+', description: 'Merit ও need-based সহায়তা।' },
            { title: 'Seminar', value: 'Monthly', description: 'আরবি, গবেষণা ও contemporary issue আলোচনা।' }
        ],
        events: [
            { title: 'Arabic Language Seminar', date: 'মাসিক', description: 'আরবি বক্তব্য, translation ও সাহিত্য আলোচনা।' },
            { title: 'Hadith Research Forum', date: 'প্রতি টার্মে', description: 'পাঠ, উপস্থাপনা ও guided research session।' },
            { title: 'Higher Study Conference', date: 'বার্ষিক', description: 'University, Fazil, scholarship ও career pathway।' }
        ],
        programs: [
            { title: 'Alim Board Excellence', description: 'Syllabus plan, tutorial, model test ও result review।' },
            { title: 'Hadith & Fiqh Studies', description: 'কিতাব পাঠ, মূলনীতি ও contemporary application।' },
            { title: 'Arabic Language & Literature', description: 'Grammar, speaking, translation ও সাহিত্যচর্চা।' },
            { title: 'Higher Study Readiness', description: 'University, Fazil, scholarship ও career mentoring।' }
        ],
        faqs: [
            { question: 'আলিমে ভর্তির যোগ্যতা কী?', answer: 'দাখিল বা সমমান পরীক্ষার ফল এবং বিভাগভিত্তিক শর্ত অনুযায়ী আবেদন করা যায়।' },
            { question: 'উচ্চশিক্ষা guidance আছে?', answer: 'University, Fazil, subject choice ও scholarship বিষয়ে mentoring session থাকে।' },
            { question: 'আবাসিক সুবিধা আছে?', answer: 'প্রতিষ্ঠানের বর্তমান আবাসিক seat ও নিয়ম admission office থেকে নিশ্চিত করা যাবে।' }
        ],
        cta: { title: 'ইলম ও উচ্চশিক্ষার পরবর্তী ধাপে এগিয়ে চলুন', text: 'আলিম বিভাগ, যোগ্যতা, scholarship ও higher study support সম্পর্কে counsellor-এর সঙ্গে কথা বলুন।', button: 'Admission desk' }
    }
};

export function getInstitutionWebsiteExperience(category) {
    return EXPERIENCES[category] || EXPERIENCES.high_school;
}
