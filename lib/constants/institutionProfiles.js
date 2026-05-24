export const INSTITUTION_PROFILES = {
    mosque: {
        type: 'mosque',
        label: 'মসজিদ',
        features: ['donations', 'jummah_accounts', 'imam_meal_schedule', 'announcements']
    },
    primary_school: {
        type: 'school',
        label: 'প্রাইমারি স্কুল',
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
            focus: ['ভিত্তি শিক্ষা', 'অভিভাবক SMS', 'দৈনিক উপস্থিতি']
        }
    },
    high_school: {
        type: 'school',
        label: 'হাই স্কুল',
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
            focus: ['বিভাগ প্রস্তুতি', 'পরীক্ষা', 'উপস্থিতি']
        }
    },
    college: {
        type: 'college',
        label: 'কলেজ',
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
            focus: ['বিজ্ঞান / মানবিক / ব্যবসায়', 'বিষয়ভিত্তিক নম্বর', 'ভর্তি']
        }
    },
    dakhil_madrasa: {
        type: 'madrasa',
        label: 'দাখিল মাদ্রাসা',
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
            focus: ['ইবতেদায়ি থেকে দাখিল', 'দ্বীনি + সাধারণ শিক্ষা', 'অভিভাবক যোগাযোগ']
        }
    },
    alim_madrasa: {
        type: 'madrasa',
        label: 'আলিম মাদ্রাসা',
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
            focus: ['ইবতেদায়ি থেকে আলিম', 'দ্বীনি + সাধারণ শিক্ষা', 'উচ্চতর প্রস্তুতি']
        }
    },
    kindergarten: {
        type: 'school',
        label: 'কিন্ডারগার্টেন',
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
            focus: ['শিশু অগ্রগতি', 'অভিভাবক আপডেট', 'দৈনিক উপস্থিতি']
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
