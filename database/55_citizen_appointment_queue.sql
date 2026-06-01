-- DigiGram citizen appointment / office serial queue
-- Safe to run more than once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS citizen_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    citizen_name TEXT,
    appointment_type TEXT NOT NULL DEFAULT 'office_visit',
    title TEXT NOT NULL,
    description TEXT,
    location_text TEXT,
    assigned_scope_type TEXT CHECK (assigned_scope_type IN ('union', 'ward', 'village')),
    assigned_scope_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    preferred_date DATE,
    preferred_time_slot TEXT,
    scheduled_at TIMESTAMPTZ,
    serial_no INTEGER,
    officer_name TEXT,
    officer_note TEXT,
    feedback TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'emergency')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'scheduled', 'completed', 'rejected', 'no_show')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_appointments_phone_created
    ON citizen_appointments(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_appointments_scope_status
    ON citizen_appointments(assigned_scope_type, assigned_scope_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_appointments_preferred_date
    ON citizen_appointments(preferred_date, status);

CREATE INDEX IF NOT EXISTS idx_citizen_appointments_scheduled_at
    ON citizen_appointments(scheduled_at);

CREATE OR REPLACE FUNCTION public.set_citizen_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_citizen_appointments_updated_at ON citizen_appointments;
CREATE TRIGGER trigger_citizen_appointments_updated_at
    BEFORE UPDATE ON citizen_appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_citizen_appointments_updated_at();

COMMENT ON TABLE citizen_appointments IS
    'Citizen office serial and appointment queue for union/ward/village officer follow-up with SMS/inbox updates.';
