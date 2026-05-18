-- DigiGram citizen quality dashboard support indexes

CREATE INDEX IF NOT EXISTS idx_residents_household_id
    ON residents(household_id);

CREATE INDEX IF NOT EXISTS idx_residents_dob
    ON residents(dob);

CREATE INDEX IF NOT EXISTS idx_residents_nid_null
    ON residents(household_id)
    WHERE nid IS NULL;

CREATE INDEX IF NOT EXISTS idx_residents_birth_reg_null
    ON residents(household_id)
    WHERE birth_reg_no IS NULL;

CREATE INDEX IF NOT EXISTS idx_residents_blood_group_null
    ON residents(household_id)
    WHERE blood_group IS NULL;
