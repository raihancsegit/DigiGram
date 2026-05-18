export const INSTITUTION_PROFILES = {
    mosque: {
        type: 'mosque',
        label: 'মসজিদ',
        features: ['donations', 'jummah_accounts', 'imam_meal_schedule', 'announcements']
    },
    primary_school: {
        type: 'school',
        label: 'প্রাইমারি স্কুল',
        features: ['attendance', 'notices', 'results', 'guardian_sms']
    },
    high_school: {
        type: 'school',
        label: 'হাই স্কুল',
        features: ['attendance', 'notices', 'results', 'guardian_sms']
    },
    college: {
        type: 'college',
        label: 'কলেজ',
        features: ['attendance', 'notices', 'subject_results', 'guardian_sms']
    },
    alim_madrasa: {
        type: 'madrasa',
        label: 'আলিম মাদ্রাসা',
        features: ['attendance', 'notices', 'results', 'guardian_sms']
    },
    kindergarten: {
        type: 'school',
        label: 'কিন্ডারগার্টেন',
        features: ['attendance', 'notices', 'results', 'guardian_sms']
    }
};

export const INSTITUTION_PROFILE_OPTIONS = Object.entries(INSTITUTION_PROFILES).map(([value, profile]) => ({
    value,
    ...profile
}));
