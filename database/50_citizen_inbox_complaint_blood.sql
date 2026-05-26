-- DigiGram citizen inbox, complaint ticket and blood emergency foundation
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS citizen_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'citizen_inbox',
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_otps_phone_created
    ON citizen_otps(phone, created_at DESC);

CREATE TABLE IF NOT EXISTS citizen_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    citizen_name TEXT,
    complaint_type TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    description TEXT,
    location_text TEXT,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'assigned', 'resolved', 'rejected')),
    assigned_scope_type TEXT CHECK (assigned_scope_type IN ('union', 'ward', 'village')),
    assigned_scope_id UUID,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_complaints_phone_created
    ON citizen_complaints(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_complaints_scope_status
    ON citizen_complaints(assigned_scope_type, assigned_scope_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS citizen_blood_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_name TEXT,
    phone TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    patient_name TEXT,
    hospital_or_location TEXT,
    needed_at TIMESTAMPTZ,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_blood_requests_phone_created
    ON citizen_blood_requests(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_blood_requests_group_status
    ON citizen_blood_requests(blood_group, status, created_at DESC);

CREATE TABLE IF NOT EXISTS citizen_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    reminder_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    source_type TEXT,
    source_id UUID,
    due_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_reminders_phone_status
    ON citizen_reminders(phone, status, due_at);
