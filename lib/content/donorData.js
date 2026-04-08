export const ALL_DONORS = [
    {
        id: 'd-1',
        name: 'রাসেল আহমেদ',
        bloodGroup: 'A+',
        village: 'হরিপুর',
        wardId: 'ward-1',
        unionId: 'horipur',
        phone: '০১৭১১-২২৩৩৪৪',
        lastDonation: '২০২৪-০১-১৫',
        isAvailable: true,
        totalDonations: 12
    },
    {
        id: 'd-2',
        name: 'মোঃ কামরুল হাসান',
        bloodGroup: 'O+',
        village: 'দামকুড়া',
        wardId: 'ward-1',
        unionId: 'damkura',
        phone: '০১৭১২-৩৪৫৬৭৮',
        lastDonation: '২০২৪-০৩-১০',
        isAvailable: true,
        totalDonations: 5
    },
    {
        id: 'd-3',
        name: 'আব্দুল্লাহ আল মামুন',
        bloodGroup: 'B+',
        village: 'কয়রা',
        wardId: 'ward-3',
        unionId: 'horipur',
        phone: '০১৭১৩-৪৫৬৭৮৯',
        lastDonation: '২০২৩-১১-২০',
        isAvailable: true,
        totalDonations: 8
    },
    {
        id: 'd-4',
        name: 'সুমাইয়া আক্তার',
        bloodGroup: 'AB+',
        village: 'বালুবাড়ী',
        wardId: 'ward-2',
        unionId: 'balubari',
        phone: '০১৭১৪-৫৬৭৮৯০',
        lastDonation: '২০২৪-০২-০৫',
        isAvailable: true,
        totalDonations: 3
    },
    {
        id: 'd-5',
        name: 'সোহেল রানা',
        bloodGroup: 'A-',
        village: 'বড়গাছি',
        wardId: 'ward-5',
        unionId: 'paurashava',
        phone: '০১৭১৫-৬৭৮৯০১',
        lastDonation: '২০২৪-০৪-০১',
        isAvailable: false,
        totalDonations: 15
    }
];

export const getDonorsByUnion = (unionId) => {
    return ALL_DONORS.filter(d => d.unionId === unionId);
};
