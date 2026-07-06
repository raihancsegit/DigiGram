# DigiGram Launch Readiness Checklist

Pilot launch, client demo, or Vercel production update-er age ei checklist follow korun.

## 1. Database setup

- Supabase SQL Editor-e latest migrations order moto run korun.
- `database/66_migration_registry.sql` run kore migration tracker ready rakhun.
- `database/73_demo_data_registry.sql` run korle registry-backed demo data add/remove kaj korbe.
- `database/63_role_rls_security_audit.sql` final security audit migration hishabe run korun.

## 2. Demo data test

Super Admin portal:

1. `/admin/maintenance` open korun.
2. `সব Demo Data যোগ করুন` click korun.
3. Check korun:
   - household + residents
   - citizen complaint / appointment / blood / support
   - school class / student / lesson
   - SMS wallet / messages
   - market / lost-found / business directory
4. Cleanup dorkar hole `সব Demo Data Remove করুন` click korun.

## 3. Citizen flow

1. `/citizen` open korun.
2. Demo phone use korun: `01700009999`.
3. OTP request korun.
4. Complaint, office appointment, life support, and blood request submit korun.
5. Inbox tab-e timeline/status check korun.
6. Tax due thakle `/pay` flow check korun.

## 4. SMS business flow

1. `/admin/sms` open korun.
2. Package create korun.
3. Gateway configure/test korun.
4. Wallet low-balance list check korun.
5. Recharge request approve korun.
6. Delivery report and failed queue monitor korun.

Profit metrics:

- SMS package revenue
- Credits sold
- Credits used
- Low-balance wallets
- Pending recharge revenue
- Failed delivery rate

## 5. Role permission check

Must verify:

- Super admin: all module access.
- Chairman: only own union data.
- Ward member: only own ward household/application data.
- Volunteer: only assigned village household entry/edit.
- Institution admin: only own institution portal.
- Teacher: only assigned subject/topic.
- Student/guardian: only own class/student update.

Critical checks:

- Onno union-er household/application dekha jay ki na.
- Onno village-er household edit kora jay ki na.
- Deleted user logged-in thakle profile guard logout korche ki na.
- Public form direct table mutation bondho ache ki na.

## 6. Institution pilot test

1. `/admin/institutions` theke ekta school/college/madrasa create korun.
2. Website URL open korun.
3. Portal-e class, teacher, student, subject add korun.
4. Teacher portal theke lesson/topic add korun.
5. Student portal theke assigned topic and quiz check korun.
6. Guardian update flow verify korun.
7. Website CMS theke template/theme publish korun.

## 7. Mobile field test

Mobile viewport-e check korun:

- Home location selector.
- Village/ward page hero.
- Household entry modal.
- GPS button.
- Member form.
- Citizen page forms.
- Admin/ward/chairman table overflow.
- Bottom safe spacing with keyboard.

## 8. Production env checklist

Vercel/Supabase:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- SMS provider secrets
- Webhook secret
- Subdomain/custom domain routing
- Storage bucket policies

Automated release checks:

```bash
npm run quality:audit
npm test
npm run lint
npm run build
npm run security:audit
npm run audit
```

Production database access is required for the database-backed route checks in `npm run audit`. Verify every authenticated role manually with dedicated test accounts before launch.

## 9. Pilot launch recommendation

Prothome ekta union pilot korun:

- 30-50 household
- 1 school
- 1 market
- 1 SMS wallet package
- complaint + appointment desk
- public trust board

Pilot feedback onujayi UX and permission gap fix kore tarpor onno union-e scale korun.
