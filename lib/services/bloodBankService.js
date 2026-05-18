import { supabase } from '@/lib/utils/supabase';

export const bloodBankService = {
    async getDonors(filters = {}, page = 1, limit = 20) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('public_blood_donors')
            .select('*', { count: 'exact' })
            .not('blood_group', 'is', null)
            .not('blood_group', 'eq', '')
            .not('blood_group', 'eq', 'Unknown');

        if (filters.bloodGroup) {
            query = query.eq('blood_group', filters.bloodGroup);
        }

        if (filters.villageId) {
            query = query.eq('village_id', filters.villageId);
        } else if (filters.wardId) {
            query = query.eq('ward_id', filters.wardId);
        } else if (filters.unionId) {
            query = query.eq('union_id', filters.unionId);
        }

        const { data, error, count } = await query
            .order('name', { ascending: true })
            .range(from, to);

        if (error) {
            console.error("BloodBank Filter Error:", error);
            throw error;
        }

        return {
            donors: (data || []).map((donor) => ({
                id: donor.id,
                name: donor.name,
                gender: donor.gender,
                blood_group: donor.blood_group,
                dob: donor.dob,
                household: {
                    id: donor.household_id,
                    phone: donor.phone,
                    house_no: donor.house_no,
                    village_id: donor.village_id,
                    ward_id: donor.ward_id,
                    village: {
                        id: donor.village_id,
                        name: donor.village_name,
                        bn_name: donor.village_bn_name
                    },
                    ward: {
                        id: donor.ward_id,
                        name_en: donor.ward_name_en,
                        name_bn: donor.ward_name_bn,
                        parent: {
                            id: donor.union_id,
                            name_en: donor.union_name_en,
                            name_bn: donor.union_name_bn
                        }
                    }
                }
            })),
            totalCount: count || 0
        };
    },

    async getStats() {
        const { data, error } = await supabase
            .from('public_blood_donors')
            .select('blood_group')
            .not('blood_group', 'is', null)
            .not('blood_group', 'eq', '')
            .not('blood_group', 'eq', 'Unknown');

        if (error) throw error;

        const stats = (data || []).reduce((acc, r) => {
            acc[r.blood_group] = (acc[r.blood_group] || 0) + 1;
            acc.total = (acc.total || 0) + 1;
            return acc;
        }, { total: 0 });

        return stats;
    }
};
