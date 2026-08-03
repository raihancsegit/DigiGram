# DigiGram

DigiGram is a Bangla-first rural digital governance platform for Bangladesh. It is designed as a multi-tenant "Union Parishad OS" where a union can run local services, citizen workflows, SMS operations, institutions, markets, household records, and public trust modules from one Next.js app.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase PostgreSQL, Auth, and RLS
- Google Gemini API for AI-assisted document and image analysis
- Vercel deployment target

## Local Setup

Create `.env.local` from `.env.example` and provide the required Supabase, Gemini, SMS, and service secrets for the modules you want to test.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run lint
npm test
npm run quality:audit
npm run build
npm run security:audit
npm run database:audit
npm run env:audit
npm run audit
```

`npm run audit` expects the app to be running at `http://localhost:3000`.

## Database

The platform depends on Supabase migrations in `database/`. For a launch or demo environment, run migrations in order and finish with the security/audit migrations noted in `docs/launch_readiness_checklist.md`.

Important launch migrations include:

- `database/63_role_rls_security_audit.sql`
- `database/66_migration_registry.sql`
- `database/73_demo_data_registry.sql`
- `database/78_distributed_api_rate_limits.sql`
- `database/79_school_operations_foundation.sql`
- `database/80_school_academic_organization.sql`
- `database/81_school_student_lifecycle.sql`
- `database/82_school_finance_and_payroll.sql`

After all numbered feature migrations, rerun `66_migration_registry.sql`, then rerun
`63_role_rls_security_audit.sql` as the final RLS hardening step. Do not run
`update_schema.sql` or `household_documents.sql` in a new deployment; they are
legacy compatibility files.

## Main Product Areas

- Citizen portal: OTP, complaints, appointments, blood requests, inbox, payments
- Admin portal: locations, members, services, SMS, maintenance, governance, data quality
- Ward and chairman portals: household workflows, service operations, local management
- Institution portal: school website, admin, teacher, student, guardian update flows
- Institution operations: sessions, routines, attendance, student lifecycle, fees, accounts, payroll, reports
- Market and business modules: directory, price alerts, demands, complaints
- SMS platform: wallet, campaign, delivery monitoring, failover webhook
- Public service modules: fuel, land guard, vehicle guard, blood, e-clinic, donation, lost and found

## Current Verification

Last local verification performed on 2026-07-06:

- `npm test`: passed
- `npm run quality:audit`: passed
- `npm run lint`: passed with warnings only
- `npm run build`: passed
- `npm run security:audit`: 57/57 passed
- `npm run audit`: 53/53 passed, with database-backed discovery skipped when external Supabase access is unavailable

## Launch Checklist

Before a pilot or production update:

1. Run the latest database migrations in Supabase.
2. Verify all production environment variables in Vercel.
3. Run `npm run build`, `npm run security:audit`, and `npm run audit`.
4. Test the citizen flow on mobile.
5. Test role boundaries for super admin, chairman, ward member, volunteer, institution admin, teacher, and student.
6. Use demo data only through the registry-backed demo data manager.
7. Run the final checklist in `docs/launch_readiness_checklist.md`.
