export const INSTITUTION_PROFILES = {
    mosque: {
        type: 'mosque',
        label: 'মসজিদ',
        features: ['donations', 'jummah_accounts', 'imam_meal_schedule', 'announcements']
    },
    primary_school: {
        type: 'school',
        label: 'প্রাইমারি স্কুল',
        shortLabel: 'প্রাইমারি',
        leadershipLabel: 'প্রধান শিক্ষক',
        staffLabel: 'শিক্ষক',
        campusLabel: 'বিদ্যালয়',
        features: ['attendance', 'notices', 'results', 'guardian_sms'],
        academicSettings: {
            model: 'general',
            start_grade: 1,
            end_grade: 5
        },
        portal: {
            classLabel: 'শ্রেণি',
            subjectLabel: 'বিষয়',
            resultLabel: 'ফলাফল',
            studentLabel: 'শিক্ষার্থী',
            focus: ['ভিত্তি শিক্ষা', 'অভিভাবক SMS', 'দৈনিক উপস্থিতি'],
            websiteMenu: { classes: 'শ্রেণি ও পাঠদান', teachers: 'শিক্ষকমণ্ডলী', guardian: 'অভিভাবক কর্নার' },
            setupSteps: ['শ্রেণি ও শাখা তৈরি', 'শিক্ষক দায়িত্ব বণ্টন', 'শিক্ষার্থী ভর্তি', 'দৈনিক উপস্থিতি'],
            dailyPriorities: ['উপস্থিতি নেওয়া', 'অনুপস্থিত অভিভাবককে জানানো', 'বাড়ির কাজ প্রকাশ', 'মিড-ডে/সহায়তা নোট']
        }
    },
    high_school: {
        type: 'school',
        label: 'হাই স্কুল',
        shortLabel: 'মাধ্যমিক বিদ্যালয়',
        leadershipLabel: 'প্রধান শিক্ষক',
        staffLabel: 'শিক্ষক',
        campusLabel: 'বিদ্যালয়',
        features: ['attendance', 'notices', 'results', 'guardian_sms'],
        academicSettings: {
            model: 'general',
            start_grade: 6,
            end_grade: 10
        },
        portal: {
            classLabel: 'শ্রেণি',
            subjectLabel: 'বিষয়',
            resultLabel: 'ফলাফল',
            studentLabel: 'শিক্ষার্থী',
            focus: ['বিভাগ প্রস্তুতি', 'পরীক্ষা', 'উপস্থিতি'],
            websiteMenu: { classes: 'শ্রেণি ও বিভাগ', teachers: 'শিক্ষকমণ্ডলী', guardian: 'শিক্ষার্থী সেবা' },
            setupSteps: ['শ্রেণি ও শাখা তৈরি', 'বিষয় ও শিক্ষক বণ্টন', 'শিক্ষার্থী ভর্তি', 'পরীক্ষা কাঠামো'],
            dailyPriorities: ['উপস্থিতি নেওয়া', 'ক্লাস রুটিন দেখা', 'বাড়ির কাজ প্রকাশ', 'ফলাফল ও নোটিশ']
        }
    },
    college: {
        type: 'college',
        label: 'কলেজ',
        shortLabel: 'কলেজ',
        leadershipLabel: 'অধ্যক্ষ',
        staffLabel: 'শিক্ষক',
        campusLabel: 'ক্যাম্পাস',
        features: ['attendance', 'notices', 'subject_results', 'guardian_sms'],
        academicSettings: {
            model: 'general',
            start_grade: 11,
            end_grade: 12
        },
        portal: {
            classLabel: 'বর্ষ / শ্রেণি',
            subjectLabel: 'বিষয় ও বিভাগ',
            resultLabel: 'বিষয়ভিত্তিক ফলাফল',
            studentLabel: 'শিক্ষার্থী',
            focus: ['বিজ্ঞান / মানবিক / ব্যবসায়', 'বিষয়ভিত্তিক নম্বর', 'ভর্তি'],
            websiteMenu: { classes: 'বিভাগ ও বর্ষ', teachers: 'শিক্ষকবৃন্দ', guardian: 'শিক্ষার্থী ডেস্ক' },
            setupSteps: ['শিক্ষাবর্ষ ও বিভাগ তৈরি', 'বিষয় ও শিক্ষক বণ্টন', 'শিক্ষার্থী ভর্তি', 'পরীক্ষা ও ফলাফল'],
            dailyPriorities: ['ক্লাস উপস্থিতি', 'বিভাগভিত্তিক রুটিন', 'অ্যাসাইনমেন্ট', 'ভর্তি ও ফলাফল']
        }
    },
    dakhil_madrasa: {
        type: 'madrasa',
        label: 'দাখিল মাদ্রাসা',
        shortLabel: 'দাখিল মাদ্রাসা',
        leadershipLabel: 'সুপার',
        staffLabel: 'উস্তাদ/শিক্ষক',
        campusLabel: 'মাদ্রাসা',
        features: ['attendance', 'notices', 'results', 'guardian_sms'],
        academicSettings: {
            model: 'madrasa',
            start_grade: 0,
            end_grade: 10
        },
        portal: {
            classLabel: 'জামাত / শ্রেণি',
            subjectLabel: 'কিতাব ও বিষয়',
            resultLabel: 'ফলাফল',
            studentLabel: 'তালিবে ইলম',
            focus: ['ইবতেদায়ি থেকে দাখিল', 'দ্বীনি + সাধারণ শিক্ষা', 'অভিভাবক যোগাযোগ'],
            websiteMenu: { classes: 'জামাত ও শ্রেণি', teachers: 'উস্তাদ ও শিক্ষক', guardian: 'অভিভাবক কর্নার' },
            setupSteps: ['জামাত ও শ্রেণি তৈরি', 'কিতাব/বিষয় বণ্টন', 'তালিবে ইলম ভর্তি', 'পরীক্ষা কাঠামো'],
            dailyPriorities: ['হাজিরা নেওয়া', 'সবক ও বাড়ির কাজ', 'অভিভাবক যোগাযোগ', 'পরীক্ষা ও নোটিশ']
        }
    },
    alim_madrasa: {
        type: 'madrasa',
        label: 'আলিম মাদ্রাসা',
        shortLabel: 'আলিম মাদ্রাসা',
        leadershipLabel: 'অধ্যক্ষ',
        staffLabel: 'উস্তাদ/শিক্ষক',
        campusLabel: 'মাদ্রাসা',
        features: ['attendance', 'notices', 'results', 'guardian_sms'],
        academicSettings: {
            model: 'madrasa',
            start_grade: 0,
            end_grade: 12
        },
        portal: {
            classLabel: 'জামাত / শ্রেণি',
            subjectLabel: 'কিতাব ও বিষয়',
            resultLabel: 'ফলাফল',
            studentLabel: 'তালিবে ইলম',
            focus: ['ইবতেদায়ি থেকে আলিম', 'দ্বীনি + সাধারণ শিক্ষা', 'উচ্চতর প্রস্তুতি'],
            websiteMenu: { classes: 'জামাত ও বিভাগ', teachers: 'উস্তাদ ও শিক্ষক', guardian: 'শিক্ষার্থী সেবা' },
            setupSteps: ['জামাত ও বর্ষ তৈরি', 'কিতাব/বিষয় বণ্টন', 'তালিবে ইলম ভর্তি', 'পরীক্ষা কাঠামো'],
            dailyPriorities: ['হাজিরা নেওয়া', 'সবক ও অ্যাসাইনমেন্ট', 'অভিভাবক যোগাযোগ', 'ফলাফল ও নোটিশ']
        }
    },
    kindergarten: {
        type: 'school',
        label: 'কিন্ডারগার্টেন',
        shortLabel: 'কিন্ডারগার্টেন',
        leadershipLabel: 'পরিচালক/প্রধান শিক্ষক',
        staffLabel: 'শিক্ষক/কেয়ারগিভার',
        campusLabel: 'শিশু ক্যাম্পাস',
        features: ['attendance', 'notices', 'results', 'guardian_sms'],
        academicSettings: {
            model: 'general',
            start_grade: 0,
            end_grade: 5
        },
        portal: {
            classLabel: 'গ্রুপ / শ্রেণি',
            subjectLabel: 'কার্যক্রম',
            resultLabel: 'অগ্রগতি',
            studentLabel: 'শিশু',
            focus: ['শিশু অগ্রগতি', 'অভিভাবক আপডেট', 'দৈনিক উপস্থিতি'],
            websiteMenu: { classes: 'গ্রুপ ও কার্যক্রম', teachers: 'শিক্ষক ও কেয়ারগিভার', guardian: 'অভিভাবক কর্নার' },
            setupSteps: ['গ্রুপ/শ্রেণি তৈরি', 'শিক্ষক ও কেয়ারগিভার যোগ', 'শিশু ভর্তি', 'অগ্রগতি সূচক ঠিক করা'],
            dailyPriorities: ['শিশুর উপস্থিতি', 'খাবার/স্বাস্থ্য নোট', 'শেখার অগ্রগতি', 'অভিভাবক আপডেট']
        }
    }
};

export const INSTITUTION_PROFILE_OPTIONS = Object.entries(INSTITUTION_PROFILES).map(([value, profile]) => ({
    value,
    ...profile
}));

export function getInstitutionProfile(category) {
    return INSTITUTION_PROFILES[category] || INSTITUTION_PROFILES.high_school;
}
