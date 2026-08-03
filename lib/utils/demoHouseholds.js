function getDemoVillageKey(villageIdOrSlug) {
    const value = String(villageIdOrSlug || '').toLowerCase();
    if (!value.startsWith('demo-village')) return null;
    return value.includes('demo-village-b') ? 'b' : 'a';
}

function getDemoVillageSuffix(villageIdOrSlug) {
    const value = String(villageIdOrSlug || '');
    return value.replace(/^demo-village-[ab]-?/, '') || '1';
}

function buildStats(residents = []) {
    return residents.reduce((acc, resident) => {
        const isMale = resident.gender === 'male';
        const isFemale = resident.gender === 'female';
        return {
            total_members: acc.total_members + 1,
            population: acc.population + 1,
            voters: acc.voters + (resident.is_voter ? 1 : 0),
            male_voters: acc.male_voters + (resident.is_voter && isMale ? 1 : 0),
            female_voters: acc.female_voters + (resident.is_voter && isFemale ? 1 : 0),
            males: acc.males + (isMale ? 1 : 0),
            females: acc.females + (isFemale ? 1 : 0),
            blood_donors: acc.blood_donors + (resident.blood_group ? 1 : 0),
            birth_registered: acc.birth_registered + (resident.birth_reg_no ? 1 : 0),
            voter_eligible: acc.voter_eligible + (!resident.is_voter ? 1 : 0),
            blood_groups: resident.blood_group
                ? {
                    ...acc.blood_groups,
                    [resident.blood_group]: (acc.blood_groups[resident.blood_group] || 0) + 1
                }
                : acc.blood_groups
        };
    }, {
        total_members: 0,
        population: 0,
        voters: 0,
        male_voters: 0,
        female_voters: 0,
        males: 0,
        females: 0,
        blood_donors: 0,
        birth_registered: 0,
        voter_eligible: 0,
        blood_groups: {}
    });
}

function makeHouse(villageId, index, houseNo, ownerName, phone, residents, overrides = {}) {
    const stats = buildStats(residents);
    return {
        id: `${villageId}-house-${index}`,
        qr_code_id: `${villageId}-qr-${index}`,
        house_no: houseNo,
        owner_name: ownerName,
        phone,
        ward_id: `demo-ward-1-${getDemoVillageSuffix(villageId)}`,
        village_id: villageId,
        location_village_id: villageId,
        housing_type: overrides.housing_type || 'পাকা',
        electricity_meter: overrides.electricity_meter ?? true,
        latrine_status: overrides.latrine_status || 'স্বাস্থ্যসম্মত',
        water_source: overrides.water_source || 'টিউবওয়েল',
        created_at: `2026-01-${String(index).padStart(2, '0')}T00:00:00.000Z`,
        stats,
        residents: residents.map((resident, residentIndex) => ({
            id: `${villageId}-house-${index}-resident-${residentIndex + 1}`,
            household_id: `${villageId}-house-${index}`,
            ...resident
        }))
    };
}

const demoResidentSets = {
    a: [
        {
            owner: 'আব্দুল করিম',
            phone: '01700001001',
            houseNo: '১০১',
            residents: [
                { name: 'আব্দুল করিম', bn_name: 'আব্দুল করিম', gender: 'male', is_voter: true, blood_group: 'O+', birth_reg_no: 'BR-DEMO-101-1' },
                { name: 'রহিমা বেগম', bn_name: 'রহিমা বেগম', gender: 'female', is_voter: true, blood_group: 'A+', birth_reg_no: 'BR-DEMO-101-2' },
                { name: 'সাকিব হাসান', bn_name: 'সাকিব হাসান', gender: 'male', is_voter: false, blood_group: null, birth_reg_no: 'BR-DEMO-101-3' }
            ]
        },
        {
            owner: 'মোঃ সালাম',
            phone: '01700001002',
            houseNo: '১০২',
            residents: [
                { name: 'মোঃ সালাম', bn_name: 'মোঃ সালাম', gender: 'male', is_voter: true, blood_group: 'B+', birth_reg_no: 'BR-DEMO-102-1' },
                { name: 'নাসিমা আক্তার', bn_name: 'নাসিমা আক্তার', gender: 'female', is_voter: true, blood_group: null, birth_reg_no: 'BR-DEMO-102-2' },
                { name: 'রিয়াদ হাসান', bn_name: 'রিয়াদ হাসান', gender: 'male', is_voter: true, blood_group: 'AB+', birth_reg_no: 'BR-DEMO-102-3' },
                { name: 'মিম আক্তার', bn_name: 'মিম আক্তার', gender: 'female', is_voter: false, blood_group: null, birth_reg_no: 'BR-DEMO-102-4' }
            ],
            housing_type: 'আধা-পাকা'
        },
        {
            owner: 'জাহানারা খাতুন',
            phone: '01700001003',
            houseNo: '১০৩',
            residents: [
                { name: 'জাহানারা খাতুন', bn_name: 'জাহানারা খাতুন', gender: 'female', is_voter: true, blood_group: 'O-', birth_reg_no: 'BR-DEMO-103-1' },
                { name: 'তানভীর আহমেদ', bn_name: 'তানভীর আহমেদ', gender: 'male', is_voter: true, blood_group: null, birth_reg_no: 'BR-DEMO-103-2' }
            ],
            water_source: ''
        },
        {
            owner: 'হাফিজুর রহমান',
            phone: '01700001004',
            houseNo: '১০৪',
            residents: [
                { name: 'হাফিজুর রহমান', bn_name: 'হাফিজুর রহমান', gender: 'male', is_voter: true, blood_group: 'A-', birth_reg_no: 'BR-DEMO-104-1' },
                { name: 'শারমিন সুলতানা', bn_name: 'শারমিন সুলতানা', gender: 'female', is_voter: false, blood_group: null, birth_reg_no: 'BR-DEMO-104-2' },
                { name: 'রাফি রহমান', bn_name: 'রাফি রহমান', gender: 'male', is_voter: false, blood_group: null, birth_reg_no: 'BR-DEMO-104-3' }
            ],
            latrine_status: ''
        }
    ],
    b: [
        {
            owner: 'মোঃ আলমগীর',
            phone: '01700002001',
            houseNo: '২০১',
            residents: [
                { name: 'মোঃ আলমগীর', bn_name: 'মোঃ আলমগীর', gender: 'male', is_voter: true, blood_group: 'B-', birth_reg_no: 'BR-DEMO-201-1' },
                { name: 'আসমা বেগম', bn_name: 'আসমা বেগম', gender: 'female', is_voter: true, blood_group: null, birth_reg_no: 'BR-DEMO-201-2' },
                { name: 'নাইম ইসলাম', bn_name: 'নাইম ইসলাম', gender: 'male', is_voter: false, blood_group: 'O+', birth_reg_no: 'BR-DEMO-201-3' }
            ]
        },
        {
            owner: 'মর্জিনা বেগম',
            phone: '01700002002',
            houseNo: '২০২',
            residents: [
                { name: 'মর্জিনা বেগম', bn_name: 'মর্জিনা বেগম', gender: 'female', is_voter: true, blood_group: 'A+', birth_reg_no: 'BR-DEMO-202-1' },
                { name: 'ইমরান হোসেন', bn_name: 'ইমরান হোসেন', gender: 'male', is_voter: true, blood_group: null, birth_reg_no: 'BR-DEMO-202-2' },
                { name: 'ইশরাত জাহান', bn_name: 'ইশরাত জাহান', gender: 'female', is_voter: false, blood_group: null, birth_reg_no: 'BR-DEMO-202-3' }
            ],
            electricity_meter: false
        },
        {
            owner: 'মোঃ বেলাল',
            phone: '01700002003',
            houseNo: '২০৩',
            residents: [
                { name: 'মোঃ বেলাল', bn_name: 'মোঃ বেলাল', gender: 'male', is_voter: true, blood_group: 'AB-', birth_reg_no: 'BR-DEMO-203-1' },
                { name: 'ফারজানা ইয়াসমিন', bn_name: 'ফারজানা ইয়াসমিন', gender: 'female', is_voter: true, blood_group: 'O+', birth_reg_no: 'BR-DEMO-203-2' },
                { name: 'সাদিয়া আক্তার', bn_name: 'সাদিয়া আক্তার', gender: 'female', is_voter: false, blood_group: null, birth_reg_no: 'BR-DEMO-203-3' }
            ]
        }
    ]
};

export function buildDemoHouseholdsForVillage(villageIdOrSlug) {
    const key = getDemoVillageKey(villageIdOrSlug);
    if (!key) return [];

    const villageId = String(villageIdOrSlug || '');
    return demoResidentSets[key].map((house, index) => makeHouse(
        villageId,
        index + 1,
        house.houseNo,
        house.owner,
        house.phone,
        house.residents,
        house
    ));
}

export function buildDemoVillageStats(villageIdOrSlug) {
    const households = buildDemoHouseholdsForVillage(villageIdOrSlug);
    return households.reduce((acc, household) => ({
        population: acc.population + (household.stats?.total_members || 0),
        total_members: acc.total_members + (household.stats?.total_members || 0),
        voters: acc.voters + (household.stats?.voters || 0),
        males: acc.males + (household.stats?.males || 0),
        females: acc.females + (household.stats?.females || 0),
        maleVoters: acc.maleVoters + (household.stats?.male_voters || 0),
        femaleVoters: acc.femaleVoters + (household.stats?.female_voters || 0),
        male_voters: acc.male_voters + (household.stats?.male_voters || 0),
        female_voters: acc.female_voters + (household.stats?.female_voters || 0),
        total_houses: acc.total_houses + 1,
        blood_donors: acc.blood_donors + (household.stats?.blood_donors || 0),
        birth_registered: acc.birth_registered + (household.stats?.birth_registered || 0),
        voter_eligible: acc.voter_eligible + (household.stats?.voter_eligible || 0),
        blood_groups: {
            ...acc.blood_groups,
            ...Object.fromEntries(
                Object.entries(household.stats?.blood_groups || {}).map(([group, count]) => [
                    group,
                    (acc.blood_groups[group] || 0) + count
                ])
            )
        }
    }), {
        population: 0,
        total_members: 0,
        voters: 0,
        males: 0,
        females: 0,
        maleVoters: 0,
        femaleVoters: 0,
        male_voters: 0,
        female_voters: 0,
        total_houses: 0,
        blood_donors: 0,
        birth_registered: 0,
        voter_eligible: 0,
        blood_groups: {}
    });
}

export function buildDemoWardStats(wardIdOrSlug) {
    const suffix = String(wardIdOrSlug || '').replace(/^demo-ward-\d+-?/, '') || '1';
    return ['a', 'b'].reduce((acc, key) => {
        const stats = buildDemoVillageStats(`demo-village-${key}-${suffix}`);
        return {
            population: acc.population + stats.population,
            total_members: acc.total_members + stats.total_members,
            voters: acc.voters + stats.voters,
            males: acc.males + stats.males,
            females: acc.females + stats.females,
            maleVoters: acc.maleVoters + stats.maleVoters,
            femaleVoters: acc.femaleVoters + stats.femaleVoters,
            male_voters: acc.male_voters + stats.male_voters,
            female_voters: acc.female_voters + stats.female_voters,
            total_houses: acc.total_houses + stats.total_houses,
            blood_donors: acc.blood_donors + stats.blood_donors,
            birth_registered: acc.birth_registered + stats.birth_registered,
            voter_eligible: acc.voter_eligible + stats.voter_eligible,
            blood_groups: {
                ...acc.blood_groups,
                ...Object.fromEntries(
                    Object.entries(stats.blood_groups || {}).map(([group, count]) => [
                        group,
                        (acc.blood_groups[group] || 0) + count
                    ])
                )
            }
        };
    }, buildDemoVillageStats(''));
}

export function buildDemoHouseholdDonors(villageIdOrSlug) {
    return buildDemoHouseholdsForVillage(villageIdOrSlug).flatMap((household) => (
        household.residents
            .filter((resident) => resident.blood_group)
            .map((resident) => ({
                id: resident.id,
                name: resident.bn_name || resident.name,
                group: resident.blood_group,
                house_no: household.house_no,
                owner_name: household.owner_name
            }))
    ));
}
