export function canManageHousehold(user, household, assignedVillage = null) {
    if (!user || !household) return false;

    if (user.role === 'super_admin') {
        return true;
    }

    if (user.role === 'ward_member') {
        return Boolean(user.access_scope_id && household.ward_id === user.access_scope_id);
    }

    if (user.role === 'volunteer') {
        const profileVillageId = user.access_scope_id;
        if (!profileVillageId) return false;

        if (household.location_village_id) {
            return household.location_village_id === profileVillageId;
        }

        // Legacy households created before location_village_id existed can still be
        // managed only from the volunteer's currently assigned village view.
        return Boolean(assignedVillage?.id && household.village_id === assignedVillage.id);
    }

    return false;
}

export function canCreateHouseholdInScope(user, wardId, locationVillageId = null) {
    if (!user) return false;

    if (user.role === 'super_admin') {
        return Boolean(wardId);
    }

    if (user.role === 'ward_member') {
        return Boolean(user.access_scope_id && wardId === user.access_scope_id);
    }

    if (user.role === 'volunteer') {
        return Boolean(user.access_scope_id && locationVillageId === user.access_scope_id);
    }

    return false;
}
