# DigiGram School Operations Pilot Runbook

এই runbook kindergarten, primary school, high school, college এবং madrasa pilot-এর জন্য।

## 1. Database

Supabase SQL Editor-এ run করুন:

1. `database/79_school_operations_foundation.sql`
2. `database/80_school_academic_organization.sql`
3. `database/81_school_student_lifecycle.sql`
4. `database/82_school_finance_and_payroll.sql`
5. `database/66_migration_registry.sql`
6. `database/63_role_rls_security_audit.sql`

তারপর local machine-এ:

```bash
npm run database:audit
npm test
npm run security:audit
```

## 2. Minimum pilot data

Admin panel থেকে demo import শেষ হলে response-এর `verification.passed` অবশ্যই `true` হতে হবে।
`verification.counts`-এ class, teacher, student, lesson, notice এবং website page-এর সংখ্যা দেখা যাবে।
Verification ব্যর্থ হলে pilot শুরু করবেন না; API এখন partial seed-কে success হিসেবে দেখাবে না।

`/admin/launch` readiness board-এর Pilot UAT sign-off অংশে teacher login, student login,
guardian verification, attendance, fee receipt, result card এবং mobile website হাতে-কলমে
পরীক্ষা করে mark করুন। প্রতিটি completed item verifier ও verification time-সহ সংরক্ষিত হবে।
প্রয়োজনে প্রতিটি item-এর evidence/note লিখে Save করুন এবং `Export sign-off CSV` দিয়ে
প্রতিষ্ঠানভিত্তিক audit report সংরক্ষণ করুন।
Readiness 100% এবং UAT 7/7 হলে super admin `Final pilot approval` দেবেন।
Approval record-এ approver ও approval time থাকবে; কোনো UAT item uncheck করলে approval বাতিল হবে।

- একটি institution admin account
- দুইজন teacher/staff
- দুইটি class/section
- দশজন student
- একটি academic session
- অন্তত পাঁচটি routine period
- monthly fee এবং exam fee
- একটি salary setup

## 3. End-to-end verification

### Academic

- Session তৈরি ও current করুন।
- Class/section/group/shift তৈরি করুন।
- Subject ও teacher assign করুন।
- Weekly routine তৈরি করুন।

### Student

- Household member থেকে একজন student ভর্তি করুন।
- Manual entry দিয়ে একজন ভর্তি করুন।
- জন্মনিবন্ধন/document metadata যোগ করুন।
- একজনকে next class-এ promote করুন।
- Demo student-এ transfer/TC flow পরীক্ষা করুন।

### Attendance and result

- Student ও teacher attendance নিন।
- Absent guardian SMS queue হয়েছে কি না দেখুন।
- Exam marks পূরণ করে publish করুন।
- Bangla report card print preview দেখুন।

### Finance

- Fee invoice তৈরি করুন।
- Partial payment এবং পরে final payment নিন।
- Overpayment reject হচ্ছে কি না দেখুন।
- Receipt number ও income ledger যাচাই করুন।
- Salary setup করে payroll generate এবং paid করুন।

### Website and guardian

- Institution type-এর recommended CMS preset apply করুন।
- Draft save, preview এবং publish করুন।
- Guardian view-তে roll + phone verify করুন।
- শুধুমাত্র নিজের attendance, result, routine ও dues দেখা যাচ্ছে নিশ্চিত করুন।

### Export

- Student master list CSV
- Current-month attendance CSV
- Fee invoice CSV
- Income/expense CSV
- Payroll CSV

## 4. Role boundary

- Institution admin অন্য institution-এর student/finance দেখতে পারবে না।
- Teacher finance/payroll manage করতে পারবে না।
- Student/guardian অন্য student-এর roll/phone দিয়ে data দেখতে পারবে না।
- Public website-এ personal document, phone, salary বা invoice প্রকাশ হবে না।

## 5. Pilot sign-off

Pilot ready বলার আগে:

- `npm run build`
- `npm run quality:audit`
- `npm run security:audit`
- `npm run mobile:citizen:audit`
- `npm run role:audit`
- `npm run audit`

Production Supabase access দিয়ে database-backed route discovery এবং প্রতিটি role-এর real account test বাধ্যতামূলক।
