import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { buildSchoolWebsiteDemoPage } from '@/lib/constants/schoolWebsiteDefaults';
import { canManageInstitution, requireRequestProfile } from '@/lib/utils/server-auth';

const PASSWORD = 'password123';

const today = () => new Date().toISOString().split('T')[0];

const DEMO_TEXT = {
    teachers: [
        { key: 'math', name: 'মোঃ রফিকুল ইসলাম', title: 'গণিত শিক্ষক', phone: '01711010001' },
        { key: 'english', name: 'সুমাইয়া নূর', title: 'ইংরেজি শিক্ষক', phone: '01711010002' },
        { key: 'science', name: 'নাসরিন সুলতানা', title: 'বিজ্ঞান শিক্ষক', phone: '01711010003' },
        { key: 'bangla', name: 'ফারহানা বেগম', title: 'বাংলা শিক্ষক', phone: '01711010004' }
    ],
    classes: {
        six: { name: '৬ষ্ঠ শ্রেণি', section: 'ক' },
        seven: { name: '৭ম শ্রেণি', section: 'ক' },
        eight: { name: '৮ম শ্রেণি', section: 'ক' },
        nine: { name: '৯ম শ্রেণি বিজ্ঞান', section: 'বিজ্ঞান' }
    },
    subjects: {
        bangla: 'বাংলা',
        math: 'গণিত',
        english: 'ইংরেজি',
        science: 'বিজ্ঞান',
        higherMath: 'উচ্চতর গণিত'
    },
    students: [
        { name: 'আরিয়ান হোসেন', roll: '01', phone: '01711020001' },
        { name: 'তাসনিম আক্তার', roll: '02', phone: '01711020002' },
        { name: 'রাফিয়া সুলতানা', roll: '03', phone: '01711020003' },
        { name: 'নাহিদ হাসান', roll: '04', phone: '01711020004' },
        { name: 'সামিরা ইসলাম', roll: '05', phone: '01711020005' },
        { name: 'ইমরান খান', roll: '06', phone: '01711020006' },
        { name: 'মিতু বেগম', roll: '07', phone: '01711020007' },
        { name: 'জুবায়ের আহমেদ', roll: '08', phone: '01711020008' }
    ]
};

function slugEmail(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 40);
}

async function createAuthProfile(admin, institution, { email, firstName, phone, role }) {
    try {
        const { data: existingProfiles } = await admin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .limit(1);
        if (existingProfiles?.[0]?.id) return existingProfiles[0].id;
    } catch {
        // Demo seed should still create school data even if profile lookup is blocked.
    }

    async function findExistingAuthUserId() {
        try {
            let page = 1;
            const perPage = 1000;
            while (page <= 10) {
                const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
                if (error) return null;
                const found = (data?.users || []).find((user) => user.email?.toLowerCase() === email.toLowerCase());
                if (found?.id) return found.id;
                if (!data?.users?.length || data.users.length < perPage) return null;
                page += 1;
            }
        } catch {
            return null;
        }
        return null;
    }

    let authData = null;
    let authError = null;
    try {
        const result = await admin.auth.admin.createUser({
            email,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { first_name: firstName }
        });
        authData = result.data;
        authError = result.error;
    } catch {
        const existingUserId = await findExistingAuthUserId();
        if (!existingUserId) return null;
        authData = { user: { id: existingUserId } };
    }
    if (authError || !authData?.user?.id) {
        const existingUserId = await findExistingAuthUserId();
        if (!existingUserId) return null;
        authData = { user: { id: existingUserId } };
    }

    const userId = authData.user.id;

    const { error: profileError } = await admin
        .from('profiles')
        .upsert({
            id: userId,
            email,
            phone,
            first_name: firstName,
            last_name: '',
            role,
            access_scope_id: institution.village_location_id || institution.location_id || null
        });
    if (profileError) return null;

    return userId;
}

async function ensureClass(admin, institutionId, academicYear, { name, gradeLevel, section, teacherId }) {
    const { data: existingRows, error: existingError } = await admin
        .from('school_classes')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('academic_year', academicYear)
        .eq('grade_level', gradeLevel)
        .limit(1);
    if (existingError) throw existingError;
    const existing = existingRows?.[0];

    const payload = {
        institution_id: institutionId,
        name,
        academic_year: academicYear,
        grade_level: gradeLevel,
        section,
        class_teacher_id: teacherId || null
    };

    if (existing) {
        const { data, error } = await admin
            .from('school_classes')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    const { data, error } = await admin
        .from('school_classes')
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function ensureSubject(admin, institutionId, { classId, name, teacherId }) {
    const { data: existingRows, error: existingError } = await admin
        .from('school_subjects')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('class_id', classId)
        .eq('name', name)
        .limit(1);
    if (existingError) throw existingError;
    const existing = existingRows?.[0];

    const payload = {
        institution_id: institutionId,
        class_id: classId,
        name,
        teacher_id: teacherId || null
    };

    if (existing) {
        const { data, error } = await admin
            .from('school_subjects')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    const { data, error } = await admin
        .from('school_subjects')
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function ensureStudent(admin, institutionId, { classId, profileId, name, rollNo, guardianName, guardianPhone }) {
    let existingQuery = admin
        .from('school_students')
        .select('*')
        .eq('institution_id', institutionId);

    existingQuery = profileId
        ? existingQuery.eq('profile_id', profileId)
        : existingQuery.eq('class_id', classId).eq('roll_no', rollNo).eq('student_name', name);

    const { data: existingRows, error: existingError } = await existingQuery.limit(1);
    if (existingError) throw existingError;
    const existing = existingRows?.[0];

    const payload = {
        institution_id: institutionId,
        class_id: classId,
        profile_id: profileId || null,
        student_name: name,
        roll_no: rollNo,
        guardian_name: guardianName,
        guardian_phone: guardianPhone,
        active: true
    };

    if (existing) {
        const { data, error } = await admin
            .from('school_students')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    const { data, error } = await admin
        .from('school_students')
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function ensureLesson(admin, institutionId, { classId, subjectId, teacherId, title, description, homework, resourceUrl, lessonDate }) {
    const { data: existingRows, error: existingError } = await admin
        .from('school_lessons')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .eq('title', title)
        .limit(1);
    if (existingError) throw existingError;
    const existing = existingRows?.[0];

    const payload = {
        institution_id: institutionId,
        class_id: classId,
        subject_id: subjectId,
        teacher_id: teacherId || null,
        title,
        description,
        homework,
        resource_url: resourceUrl,
        lesson_date: lessonDate,
        status: 'published'
    };

    if (existing) {
        const { data, error } = await admin
            .from('school_lessons')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    const { data, error } = await admin
        .from('school_lessons')
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function ensureQuiz(admin, lessonId, { title, questions }) {
    const { data: quiz, error: quizError } = await admin
        .from('school_lesson_quizzes')
        .upsert({ lesson_id: lessonId, title, passing_score: 60 }, { onConflict: 'lesson_id' })
        .select()
        .single();
    if (quizError) throw quizError;

    await admin.from('school_lesson_quiz_questions').delete().eq('quiz_id', quiz.id);

    const { error: questionError } = await admin
        .from('school_lesson_quiz_questions')
        .insert(questions.map((question, index) => ({
            quiz_id: quiz.id,
            sort_order: index + 1,
            ...question
        })));
    if (questionError) throw questionError;

    return quiz;
}

async function ensureExam(admin, institutionId, { classId, name, entries }) {
    const { data: existingRows, error: existingError } = await admin
        .from('school_exams')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('class_id', classId)
        .eq('name', name)
        .limit(1);
    if (existingError) throw existingError;
    const existing = existingRows?.[0];

    const payload = {
        institution_id: institutionId,
        class_id: classId,
        name,
        exam_date: today(),
        status: 'published',
        published_at: new Date().toISOString()
    };

    const { data: exam, error: examError } = existing
        ? await admin.from('school_exams').update(payload).eq('id', existing.id).select().single()
        : await admin.from('school_exams').insert([payload]).select().single();
    if (examError) throw examError;

    const { error: entryError } = await admin
        .from('school_exam_entries')
        .upsert(entries.map((entry) => ({ ...entry, exam_id: exam.id })), { onConflict: 'exam_id,student_id,subject_id' });
    if (entryError) throw entryError;

    return exam;
}

function gradeFor(mark) {
    if (mark >= 80) return 'A+';
    if (mark >= 70) return 'A';
    if (mark >= 60) return 'A-';
    if (mark >= 50) return 'B';
    if (mark >= 40) return 'C';
    return 'F';
}

function formatSeedError(error) {
    const parts = [
        error?.message,
        error?.code ? `code: ${error.code}` : '',
        error?.details ? `details: ${error.details}` : '',
        error?.hint ? `hint: ${error.hint}` : ''
    ].filter(Boolean);

    const message = parts.join(' | ') || 'School demo seed failed';
    const missingRelation = error?.code === '42P01' || /relation .* does not exist/i.test(message);
    const missingColumn = error?.code === '42703' || /column .* does not exist/i.test(message);

    return {
        error: message,
        code: error?.code || null,
        details: error?.details || null,
        hint: error?.hint || (
            missingRelation || missingColumn
                ? 'Supabase SQL schema is not fully updated. Run the latest school/institution SQL files, especially 42_school_portal_runtime_repairs.sql through 47_school_website_professional_demo_defaults.sql, then click demo import again.'
                : null
        )
    };
}

export async function POST(request) {
    try {
        const auth = await requireRequestProfile(request, ['super_admin', 'institution_admin', 'school_admin']);
        if (auth.response) return auth.response;

        const { institutionId } = await request.json();
        if (!institutionId) return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
        if (!(await canManageInstitution(auth.profile, institutionId))) {
            return NextResponse.json({ error: 'This institution is outside your assigned scope' }, { status: 403 });
        }
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({
                error: 'Supabase service role env missing. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before demo seed.'
            }, { status: 500 });
        }

        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: institution, error: institutionError } = await admin
            .from('institutions')
            .select('*')
            .eq('id', institutionId)
            .single();
        if (institutionError) throw institutionError;

        const academicYear = new Date().getFullYear();
        const seedTag = slugEmail(`${institution.subdomain || institution.name || institutionId}-${institutionId.slice(0, 6)}`);

        const teacherSeeds = [
            { key: 'math', name: 'মোঃ রফিকুল ইসলাম', title: 'গণিত শিক্ষক', phone: '01711010001' },
            { key: 'english', name: 'সুমাইয়া নূর', title: 'ইংরেজি শিক্ষক', phone: '01711010002' },
            { key: 'science', name: 'নাসরিন সুলতানা', title: 'বিজ্ঞান শিক্ষক', phone: '01711010003' },
            { key: 'bangla', name: 'ফারহানা বেগম', title: 'বাংলা শিক্ষক', phone: '01711010004' }
        ];

        const usableTeacherSeeds = DEMO_TEXT.teachers;
        const teachers = {};
        for (const item of usableTeacherSeeds) {
            const email = `teacher.${item.key}.${seedTag}@example.com`;
            const profileId = await createAuthProfile(admin, institution, {
                email,
                firstName: item.name,
                phone: item.phone,
                role: 'teacher'
            });
            teachers[item.key] = { ...item, email, profileId };
        }

        const teacherMemberships = Object.values(teachers)
            .filter((teacher) => teacher.profileId)
            .map((teacher) => ({
                institution_id: institutionId,
                profile_id: teacher.profileId,
                member_role: 'teacher',
                title: teacher.title,
                display_name: teacher.name,
                is_active: true
            }));
        if (teacherMemberships.length) {
            const { error: teacherMembershipError } = await admin
                .from('institution_memberships')
                .upsert(teacherMemberships, { onConflict: 'institution_id,profile_id,member_role' });
            if (teacherMembershipError) throw teacherMembershipError;
        }

        const classSix = await ensureClass(admin, institutionId, academicYear, {
            name: '৬ষ্ঠ শ্রেণি',
            gradeLevel: 6,
            section: 'ক',
            teacherId: teachers.math.profileId
        });
        const classSeven = await ensureClass(admin, institutionId, academicYear, {
            name: '৭ম শ্রেণি',
            gradeLevel: 7,
            section: 'ক',
            teacherId: teachers.english.profileId
        });
        const classEight = await ensureClass(admin, institutionId, academicYear, {
            name: '৮ম শ্রেণি',
            gradeLevel: 8,
            section: 'ক',
            teacherId: teachers.science.profileId
        });
        const classNine = await ensureClass(admin, institutionId, academicYear, {
            name: '৯ম শ্রেণি বিজ্ঞান',
            gradeLevel: 9,
            section: 'বিজ্ঞান',
            teacherId: teachers.bangla.profileId
        });

        const subjectSeeds = [
            { key: 'six_math', classId: classSix.id, name: 'গণিত', teacher: teachers.math },
            { key: 'six_english', classId: classSix.id, name: 'ইংরেজি', teacher: teachers.english },
            { key: 'six_bangla', classId: classSix.id, name: 'বাংলা', teacher: teachers.bangla },
            { key: 'seven_math', classId: classSeven.id, name: 'গণিত', teacher: teachers.math },
            { key: 'seven_science', classId: classSeven.id, name: 'বিজ্ঞান', teacher: teachers.science },
            { key: 'eight_science', classId: classEight.id, name: 'বিজ্ঞান', teacher: teachers.science },
            { key: 'nine_math', classId: classNine.id, name: 'উচ্চতর গণিত', teacher: teachers.math },
            { key: 'nine_english', classId: classNine.id, name: 'ইংরেজি', teacher: teachers.english }
        ];

        const usableSubjectSeeds = [
            { key: 'six_math', classId: classSix.id, name: DEMO_TEXT.subjects.math, teacher: teachers.math },
            { key: 'six_english', classId: classSix.id, name: DEMO_TEXT.subjects.english, teacher: teachers.english },
            { key: 'six_bangla', classId: classSix.id, name: DEMO_TEXT.subjects.bangla, teacher: teachers.bangla },
            { key: 'seven_math', classId: classSeven.id, name: DEMO_TEXT.subjects.math, teacher: teachers.math },
            { key: 'seven_science', classId: classSeven.id, name: DEMO_TEXT.subjects.science, teacher: teachers.science },
            { key: 'eight_science', classId: classEight.id, name: DEMO_TEXT.subjects.science, teacher: teachers.science },
            { key: 'nine_math', classId: classNine.id, name: DEMO_TEXT.subjects.higherMath, teacher: teachers.math },
            { key: 'nine_english', classId: classNine.id, name: DEMO_TEXT.subjects.english, teacher: teachers.english }
        ];

        const subjects = {};
        for (const item of usableSubjectSeeds) {
            subjects[item.key] = await ensureSubject(admin, institutionId, {
                classId: item.classId,
                name: item.name,
                teacherId: item.teacher.profileId
            });
        }

        const studentSeeds = [
            { name: 'আরিয়ান হোসেন', roll: '01', classId: classSix.id, phone: '01711020001' },
            { name: 'তাসনিম আক্তার', roll: '02', classId: classSix.id, phone: '01711020002' },
            { name: 'রাফিয়া সুলতানা', roll: '03', classId: classSix.id, phone: '01711020003' },
            { name: 'নাহিদ হাসান', roll: '04', classId: classSix.id, phone: '01711020004' },
            { name: 'সামিরা ইসলাম', roll: '05', classId: classSeven.id, phone: '01711020005' },
            { name: 'ইমরান খান', roll: '06', classId: classSeven.id, phone: '01711020006' },
            { name: 'মিতু বেগম', roll: '07', classId: classEight.id, phone: '01711020007' },
            { name: 'জুবায়ের আহমেদ', roll: '08', classId: classNine.id, phone: '01711020008' }
        ];

        const usableStudentSeeds = [
            { ...DEMO_TEXT.students[0], classId: classSix.id },
            { ...DEMO_TEXT.students[1], classId: classSix.id },
            { ...DEMO_TEXT.students[2], classId: classSix.id },
            { ...DEMO_TEXT.students[3], classId: classSix.id },
            { ...DEMO_TEXT.students[4], classId: classSeven.id },
            { ...DEMO_TEXT.students[5], classId: classSeven.id },
            { ...DEMO_TEXT.students[6], classId: classEight.id },
            { ...DEMO_TEXT.students[7], classId: classNine.id }
        ];

        const students = [];
        for (const item of usableStudentSeeds) {
            const email = `student.${item.roll}.${seedTag}@example.com`;
            const profileId = await createAuthProfile(admin, institution, {
                email,
                firstName: item.name,
                phone: item.phone,
                role: 'student'
            });
            const student = await ensureStudent(admin, institutionId, {
                classId: item.classId,
                profileId,
                name: item.name,
                rollNo: item.roll,
                guardianName: 'অভিভাবক',
                guardianPhone: item.phone
            });
            students.push({ ...item, email, profileId, student });
        }

        const studentMembershipRows = students
            .filter((item) => item.profileId)
            .map((item) => ({
                institution_id: institutionId,
                profile_id: item.profileId,
                member_role: 'student',
                title: 'শিক্ষার্থী',
                display_name: item.name,
                is_active: true
            }));
        if (studentMembershipRows.length) {
            const { error: studentMembershipError } = await admin
                .from('institution_memberships')
                .upsert(studentMembershipRows, { onConflict: 'institution_id,profile_id,member_role' });
            if (studentMembershipError) throw studentMembershipError;
        }

        const sixStudents = students.filter((item) => item.classId === classSix.id);
        const sevenStudents = students.filter((item) => item.classId === classSeven.id);

        const lessonSeeds = [
            {
                subject: subjects.six_math,
                classId: classSix.id,
                teacher: teachers.math,
                title: 'ভগ্নাংশ যোগ',
                description: 'সমান হর হলে লবগুলো যোগ করে ভগ্নাংশের মান বের করা হয়।',
                homework: '১/৫ + ২/৫ এবং ৩/৭ + ২/৭ সমাধান করো।',
                resourceUrl: 'https://www.youtube.com/results?search_query=fraction+addition+bangla',
                students: sixStudents,
                questions: [
                    { question_text: '১/৫ + ২/৫ কত?', option_a: '৩/৫', option_b: '৩/১০', option_c: '২/৫', option_d: '১/৫', correct_option: 'a', explanation: 'হর একই, তাই লব যোগ হবে।' },
                    { question_text: 'সমান হর হলে কোনটি যোগ করা হয়?', option_a: 'হর', option_b: 'লব', option_c: 'উভয়', option_d: 'কোনোটিই নয়', correct_option: 'b', explanation: 'সমান হরে শুধু লব যোগ করা হয়।' }
                ]
            },
            {
                subject: subjects.six_english,
                classId: classSix.id,
                teacher: teachers.english,
                title: 'Simple Present Tense',
                description: 'Daily routine, habit এবং general truth বোঝাতে simple present tense ব্যবহার হয়।',
                homework: 'নিজের daily routine নিয়ে ৫টি বাক্য লেখো।',
                resourceUrl: 'https://www.youtube.com/results?search_query=simple+present+tense+bangla',
                students: sixStudents,
                questions: [
                    { question_text: 'He ___ to school every day.', option_a: 'go', option_b: 'goes', option_c: 'went', option_d: 'going', correct_option: 'b', explanation: 'He/She/It-এর সাথে verb+s/es হয়।' },
                    { question_text: 'Simple present কোন কাজে বেশি ব্যবহৃত হয়?', option_a: 'habit', option_b: 'past event', option_c: 'future plan only', option_d: 'none', correct_option: 'a', explanation: 'Habit বা নিয়মিত কাজ বোঝাতে।' }
                ]
            },
            {
                subject: subjects.seven_science,
                classId: classSeven.id,
                teacher: teachers.science,
                title: 'উদ্ভিদের খাদ্য তৈরি',
                description: 'সূর্যালোক, পানি ও কার্বন ডাই অক্সাইড ব্যবহার করে উদ্ভিদ খাদ্য তৈরি করে।',
                homework: 'Photosynthesis-এর একটি flow chart আঁকো।',
                resourceUrl: 'https://www.youtube.com/results?search_query=photosynthesis+bangla',
                students: sevenStudents,
                questions: [
                    { question_text: 'উদ্ভিদ খাদ্য তৈরি করতে কোন শক্তি ব্যবহার করে?', option_a: 'শব্দ', option_b: 'সূর্যালোক', option_c: 'বিদ্যুৎ', option_d: 'তাপমাত্রা', correct_option: 'b', explanation: 'সূর্যালোক photosynthesis-এর প্রধান শক্তি।' },
                    { question_text: 'পাতার কোন অংশে chlorophyll থাকে?', option_a: 'সবুজ অংশে', option_b: 'শিকড়ে', option_c: 'ফুলে', option_d: 'ফলে', correct_option: 'a', explanation: 'পাতার সবুজ অংশে chlorophyll থাকে।' }
                ]
            },
            {
                subject: subjects.six_bangla,
                classId: classSix.id,
                teacher: teachers.bangla,
                title: 'ভাবসম্প্রসারণ লেখা',
                description: 'মূল ভাবটি নিজের ভাষায় উদাহরণসহ বিস্তারিতভাবে লেখা হলো ভাবসম্প্রসারণ।',
                homework: 'পরিশ্রম সৌভাগ্যের প্রসূতি - এই বিষয়ের ভাবসম্প্রসারণ লেখো।',
                resourceUrl: '',
                students: sixStudents,
                questions: [
                    { question_text: 'ভাবসম্প্রসারণে কী করা হয়?', option_a: 'মূল ভাব বিস্তার', option_b: 'শুধু মুখস্থ', option_c: 'সংক্ষিপ্ত উত্তর', option_d: 'ছবি আঁকা', correct_option: 'a', explanation: 'মূল ভাবটি ব্যাখ্যা করা হয়।' },
                    { question_text: 'ভাবসম্প্রসারণে উদাহরণ দিলে লেখা কেমন হয়?', option_a: 'দুর্বল', option_b: 'স্পষ্ট', option_c: 'ভুল', option_d: 'অসম্পূর্ণ', correct_option: 'b', explanation: 'উদাহরণ লেখাকে স্পষ্ট করে।' }
                ]
            }
        ];

        const usableLessonSeeds = [
            {
                subject: subjects.six_math,
                classId: classSix.id,
                teacher: teachers.math,
                title: 'ভগ্নাংশ যোগ',
                description: 'সমান হর হলে লবগুলো যোগ করে ভগ্নাংশের মান বের করা হয়। অসমান হর হলে আগে হর সমান করতে হবে।',
                homework: '১/৫ + ২/৫ এবং ৩/৭ + ২/৭ সমাধান করো।',
                resourceUrl: 'https://www.youtube.com/results?search_query=fraction+addition+bangla',
                students: sixStudents,
                questions: [
                    { question_text: '১/৫ + ২/৫ কত?', option_a: '৩/৫', option_b: '৩/১০', option_c: '২/৫', option_d: '১/৫', correct_option: 'a', explanation: 'হর একই, তাই লব যোগ হবে।' },
                    { question_text: 'সমান হর হলে কোন অংশ যোগ করা হয়?', option_a: 'হর', option_b: 'লব', option_c: 'উভয়', option_d: 'কোনোটিই নয়', correct_option: 'b', explanation: 'সমান হরে শুধু লব যোগ করা হয়।' }
                ]
            },
            {
                subject: subjects.six_english,
                classId: classSix.id,
                teacher: teachers.english,
                title: 'Simple Present Tense',
                description: 'Daily routine, habit এবং general truth বোঝাতে simple present tense ব্যবহার হয়।',
                homework: 'নিজের daily routine নিয়ে ৫টি বাক্য লেখো।',
                resourceUrl: 'https://www.youtube.com/results?search_query=simple+present+tense+bangla',
                students: sixStudents,
                questions: [
                    { question_text: 'He ___ to school every day.', option_a: 'go', option_b: 'goes', option_c: 'went', option_d: 'going', correct_option: 'b', explanation: 'He/She/It এর সাথে verb+s/es হয়।' },
                    { question_text: 'Simple present কোন কাজে বেশি ব্যবহৃত হয়?', option_a: 'habit', option_b: 'past event', option_c: 'future plan only', option_d: 'none', correct_option: 'a', explanation: 'Habit বা নিয়মিত কাজ বোঝাতে।' }
                ]
            },
            {
                subject: subjects.seven_science,
                classId: classSeven.id,
                teacher: teachers.science,
                title: 'উদ্ভিদের খাদ্য তৈরি',
                description: 'সূর্যালোক, পানি ও কার্বন ডাই অক্সাইড ব্যবহার করে উদ্ভিদ খাদ্য তৈরি করে।',
                homework: 'Photosynthesis-এর একটি flow chart আঁকো।',
                resourceUrl: 'https://www.youtube.com/results?search_query=photosynthesis+bangla',
                students: sevenStudents,
                questions: [
                    { question_text: 'উদ্ভিদ খাদ্য তৈরি করতে কোন শক্তি ব্যবহার করে?', option_a: 'শব্দ', option_b: 'সূর্যালোক', option_c: 'বিদ্যুৎ', option_d: 'তাপমাত্রা', correct_option: 'b', explanation: 'সূর্যালোক photosynthesis-এর প্রধান শক্তি।' },
                    { question_text: 'পাতার কোন অংশে chlorophyll থাকে?', option_a: 'সবুজ অংশে', option_b: 'শিকড়ে', option_c: 'ফুলে', option_d: 'ফলে', correct_option: 'a', explanation: 'পাতার সবুজ অংশে chlorophyll থাকে।' }
                ]
            },
            {
                subject: subjects.six_bangla,
                classId: classSix.id,
                teacher: teachers.bangla,
                title: 'ভাবসম্প্রসারণ লেখা',
                description: 'মূল ভাবটি নিজের ভাষায় উদাহরণসহ বিস্তারিতভাবে লেখা হলো ভাবসম্প্রসারণ।',
                homework: 'পরিশ্রম সৌভাগ্যের প্রসূতি - এই বিষয়ের ভাবসম্প্রসারণ লেখো।',
                resourceUrl: '',
                students: sixStudents,
                questions: [
                    { question_text: 'ভাবসম্প্রসারণে কী করা হয়?', option_a: 'মূল ভাব বিস্তার', option_b: 'শুধু মুখস্থ', option_c: 'সংক্ষিপ্ত উত্তর', option_d: 'ছবি আঁকা', correct_option: 'a', explanation: 'মূল ভাবটি ব্যাখ্যা করা হয়।' },
                    { question_text: 'ভাবসম্প্রসারণে উদাহরণ দিলে লেখা কেমন হয়?', option_a: 'দুর্বল', option_b: 'স্পষ্ট', option_c: 'ভুল', option_d: 'অসম্পূর্ণ', correct_option: 'b', explanation: 'উদাহরণ লেখাকে স্পষ্ট করে।' }
                ]
            }
        ];

        const createdLessons = [];
        for (const lessonSeed of usableLessonSeeds) {
            const lesson = await ensureLesson(admin, institutionId, {
                classId: lessonSeed.classId,
                subjectId: lessonSeed.subject.id,
                teacherId: lessonSeed.teacher.profileId,
                title: lessonSeed.title,
                description: lessonSeed.description,
                homework: lessonSeed.homework,
                resourceUrl: lessonSeed.resourceUrl,
                lessonDate: today()
            });
            createdLessons.push(lesson);

            const progressRows = lessonSeed.students.map((item, index) => ({
                lesson_id: lesson.id,
                student_id: item.student.id,
                status: index === lessonSeed.students.length - 1 ? 'not_completed' : 'completed',
                note: index === lessonSeed.students.length - 1 ? 'আরেকবার revise করতে হবে' : 'ভালোভাবে সম্পন্ন করেছে',
                reviewed_at: new Date().toISOString()
            }));
            const { error: progressError } = await admin
                .from('school_lesson_progress')
                .upsert(progressRows, { onConflict: 'lesson_id,student_id' });
            if (progressError) throw progressError;

            await ensureQuiz(admin, lesson.id, {
                title: `${lessonSeed.title} যাচাই`,
                questions: lessonSeed.questions
            });
        }

        const attendanceRows = students.slice(0, 6).map((item, index) => ({
            institution_id: institutionId,
            class_id: item.classId,
            student_id: item.student.id,
            attendance_date: today(),
            status: index === 5 ? 'absent' : index === 3 ? 'late' : 'present',
            marked_by: item.classId === classSix.id ? teachers.math.profileId : teachers.science.profileId
        }));
        const { error: attendanceError } = await admin
            .from('school_attendance')
            .upsert(attendanceRows, { onConflict: 'student_id,attendance_date' });
        if (attendanceError) throw attendanceError;

        await ensureExam(admin, institutionId, {
            classId: classSix.id,
            name: 'ডেমো প্রথম সাময়িক পরীক্ষা',
            entries: sixStudents.flatMap((item, index) => {
                const mathMark = 92 - (index * 7);
                const englishMark = 88 - (index * 6);
                const banglaMark = 84 - (index * 5);
                return [
                    { institution_id: institutionId, class_id: classSix.id, student_id: item.student.id, subject_id: subjects.six_math.id, total_marks: 100, obtained_marks: mathMark, grade: gradeFor(mathMark) },
                    { institution_id: institutionId, class_id: classSix.id, student_id: item.student.id, subject_id: subjects.six_english.id, total_marks: 100, obtained_marks: englishMark, grade: gradeFor(englishMark) },
                    { institution_id: institutionId, class_id: classSix.id, student_id: item.student.id, subject_id: subjects.six_bangla.id, total_marks: 100, obtained_marks: banglaMark, grade: gradeFor(banglaMark) }
                ];
            })
        });

        await ensureExam(admin, institutionId, {
            classId: classSeven.id,
            name: 'ডেমো প্রথম সাময়িক পরীক্ষা',
            entries: sevenStudents.flatMap((item, index) => {
                const mathMark = 81 - (index * 9);
                const scienceMark = 86 - (index * 8);
                return [
                    { institution_id: institutionId, class_id: classSeven.id, student_id: item.student.id, subject_id: subjects.seven_math.id, total_marks: 100, obtained_marks: mathMark, grade: gradeFor(mathMark) },
                    { institution_id: institutionId, class_id: classSeven.id, student_id: item.student.id, subject_id: subjects.seven_science.id, total_marks: 100, obtained_marks: scienceMark, grade: gradeFor(scienceMark) }
                ];
            })
        });

        const { data: allSeedClasses, error: allClassError } = await admin
            .from('school_classes')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('academic_year', academicYear)
            .order('grade_level', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });
        if (allClassError) throw allClassError;
        const classNameById = Object.fromEntries((allSeedClasses || []).map((item) => [item.id, item.name]));

        const universalStudents = [];
        const universalLessons = [];
        for (const classInfo of allSeedClasses || []) {
            const gradeKey = String(classInfo.grade_level ?? classInfo.name).replace(/[^0-9a-zA-Z]+/g, '') || classInfo.id.slice(0, 4);
            const classSubjects = [
                await ensureSubject(admin, institutionId, {
                    classId: classInfo.id,
                    name: 'বাংলা',
                    teacherId: teachers.bangla.profileId
                }),
                await ensureSubject(admin, institutionId, {
                    classId: classInfo.id,
                    name: 'গণিত',
                    teacherId: teachers.math.profileId
                }),
                await ensureSubject(admin, institutionId, {
                    classId: classInfo.id,
                    name: 'ইংরেজি',
                    teacherId: teachers.english.profileId
                })
            ];

            const classStudents = [];
            for (let index = 1; index <= 3; index += 1) {
                const roll = String(index).padStart(2, '0');
                const name = `${classInfo.name} শিক্ষার্থী ${index}`;
                const email = `student.g${gradeKey}.${roll}.${seedTag}@example.com`;
                const profileId = await createAuthProfile(admin, institution, {
                    email,
                    firstName: name,
                    phone: `01712${String(classInfo.grade_level || 0).padStart(2, '0')}${String(index).padStart(4, '0')}`,
                    role: 'student'
                });
                const student = await ensureStudent(admin, institutionId, {
                    classId: classInfo.id,
                    profileId,
                    name,
                    rollNo: roll,
                    guardianName: 'ডেমো অভিভাবক',
                    guardianPhone: `01712${String(classInfo.grade_level || 0).padStart(2, '0')}${String(index).padStart(4, '0')}`
                });
                classStudents.push({ name, roll, email, profileId, student, classId: classInfo.id });
                universalStudents.push({ name, roll, email, profileId, student, classId: classInfo.id });
            }

            const universalMembershipRows = classStudents
                .filter((item) => item.profileId)
                .map((item) => ({
                    institution_id: institutionId,
                    profile_id: item.profileId,
                    member_role: 'student',
                    title: 'শিক্ষার্থী',
                    display_name: item.name,
                    is_active: true
                }));
            if (universalMembershipRows.length) {
                const { error: universalMembershipError } = await admin
                    .from('institution_memberships')
                    .upsert(universalMembershipRows, { onConflict: 'institution_id,profile_id,member_role' });
                if (universalMembershipError) throw universalMembershipError;
            }

            const lesson = await ensureLesson(admin, institutionId, {
                classId: classInfo.id,
                subjectId: classSubjects[1].id,
                teacherId: teachers.math.profileId,
                title: `${classInfo.name} গণিত ডেমো টপিক`,
                description: `${classInfo.name} এর জন্য আজকের ডেমো topic, teacher portal থেকে progress mark করা যাবে।`,
                homework: 'বই থেকে ৫টি অনুশীলনী সমাধান করো এবং না বুঝলে AI help নাও।',
                resourceUrl: 'https://www.youtube.com/results?search_query=math+class+bangla',
                lessonDate: today()
            });
            universalLessons.push(lesson);

            const { error: universalProgressError } = await admin
                .from('school_lesson_progress')
                .upsert(classStudents.map((item, index) => ({
                    lesson_id: lesson.id,
                    student_id: item.student.id,
                    status: index === 2 ? 'not_completed' : 'completed',
                    note: index === 2 ? 'Homework pending' : 'Completed in class',
                    reviewed_at: new Date().toISOString()
                })), { onConflict: 'lesson_id,student_id' });
            if (universalProgressError) throw universalProgressError;

            await ensureQuiz(admin, lesson.id, {
                title: `${classInfo.name} topic check`,
                questions: [
                    {
                        question_text: 'আজকের topic complete করলে কী mark হবে?',
                        option_a: 'completed',
                        option_b: 'absent',
                        option_c: 'failed',
                        option_d: 'none',
                        correct_option: 'a',
                        explanation: 'পড়া শেষ হলে teacher completed mark করবেন।'
                    },
                    {
                        question_text: 'না বুঝলে portal-এ কোন help নেওয়া যাবে?',
                        option_a: 'AI help',
                        option_b: 'delete',
                        option_c: 'logout',
                        option_d: 'none',
                        correct_option: 'a',
                        explanation: 'Student portal থেকে AI help নেওয়া যাবে।'
                    }
                ]
            });

            const { error: universalAttendanceError } = await admin
                .from('school_attendance')
                .upsert(classStudents.map((item, index) => ({
                    institution_id: institutionId,
                    class_id: classInfo.id,
                    student_id: item.student.id,
                    attendance_date: today(),
                    status: index === 2 ? 'absent' : index === 1 ? 'late' : 'present',
                    marked_by: teachers.math.profileId
                })), { onConflict: 'student_id,attendance_date' });
            if (universalAttendanceError) throw universalAttendanceError;

            await ensureExam(admin, institutionId, {
                classId: classInfo.id,
                name: 'ডেমো বার্ষিক পরীক্ষা',
                entries: classStudents.flatMap((item, studentIndex) => classSubjects.map((subject, subjectIndex) => {
                    const mark = 88 - (studentIndex * 7) - (subjectIndex * 3);
                    return {
                        institution_id: institutionId,
                        class_id: classInfo.id,
                        student_id: item.student.id,
                        subject_id: subject.id,
                        total_marks: 100,
                        obtained_marks: mark,
                        grade: gradeFor(mark)
                    };
                }))
            });
        }

        await admin.from('institution_notices').delete().eq('institution_id', institutionId).in('title', [
            'ডেমো: ভর্তি কার্যক্রম চলছে',
            'ডেমো: অভিভাবক সভা',
            'ডেমো: ক্লাস টেস্ট',
            'ডেমো: ফলাফল প্রকাশ',
            'ডেমো: বিজ্ঞান ও সাংস্কৃতিক সপ্তাহ'
        ]);
        const { error: noticeError } = await admin.from('institution_notices').insert([
            { institution_id: institutionId, title: 'ডেমো: ভর্তি কার্যক্রম চলছে', body: 'নতুন শিক্ষাবর্ষের ভর্তি আবেদন website ও office থেকে নেওয়া হচ্ছে।', audience: 'public', is_pinned: true },
            { institution_id: institutionId, title: 'ডেমো: ফলাফল প্রকাশ', body: 'প্রকাশিত ফলাফল student portal এবং guardian update view-তে দেখা যাবে।', audience: 'public' },
            { institution_id: institutionId, title: 'ডেমো: বিজ্ঞান ও সাংস্কৃতিক সপ্তাহ', body: 'Project, debate ও সাংস্কৃতিক অংশগ্রহণের registration চলছে।', audience: 'public' },
            { institution_id: institutionId, title: 'ডেমো: অভিভাবক সভা', body: 'আগামী শুক্রবার সকাল ১০টায় অভিভাবক সভা অনুষ্ঠিত হবে।', audience: 'guardians' },
            { institution_id: institutionId, title: 'ডেমো: ক্লাস টেস্ট', body: '৬ষ্ঠ শ্রেণির গণিত ক্লাস টেস্ট আগামী রবিবার।', audience: 'students' }
        ]);
        if (noticeError) throw noticeError;

        const demoWebsitePage = buildSchoolWebsiteDemoPage(institution, seedTag);
        await admin.from('institution_pages').upsert({
            institution_id: institutionId,
            ...demoWebsitePage,
            draft_content: demoWebsitePage,
            published_content: demoWebsitePage,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'institution_id' });

        const seedResponse = {
            summary: {
                classes: (allSeedClasses || []).length,
                teachers: usableTeacherSeeds.length,
                students: usableStudentSeeds.length + universalStudents.length,
                subjects: usableSubjectSeeds.length + ((allSeedClasses || []).length * 3),
                lessons: createdLessons.length + universalLessons.length,
                exams: 2 + (allSeedClasses || []).length,
                notices: 5
            },
            login: {
                password: PASSWORD,
                teachers: Object.values(teachers).map((teacher) => ({
                    name: teacher.name,
                    title: teacher.title,
                    email: teacher.email
                })),
                students: [...students, ...universalStudents].map((item) => ({
                    name: item.name,
                    roll: item.roll,
                    className: classNameById[item.classId] || '',
                    guardianPhone: item.student?.guardian_phone || item.phone || '',
                    email: item.email
                }))
            },
            guardianChecks: [...students, ...universalStudents].slice(0, 8).map((item) => ({
                name: item.name,
                className: classNameById[item.classId] || '',
                roll: item.roll,
                guardianPhone: item.student?.guardian_phone || item.phone || ''
            })),
            nextSteps: [
                'Teacher Portal: seeded teacher email দিয়ে login করুন, Topic ও lesson menu থেকে class/subject select করে topic publish করুন।',
                'Student Portal: seeded student email দিয়ে login করুন, আজকের পড়া menu থেকে topic, homework, quiz এবং AI help check করুন।',
                'Website Guardian Updates: public website-এর অভিভাবক আপডেট page-এ class select করে roll ও guardian phone দিয়ে verify করুন।'
            ]
        };

        return NextResponse.json({ success: true, data: seedResponse });
    } catch (error) {
        const payload = formatSeedError(error);
        console.error('School demo seed failed:', payload);
        return NextResponse.json(payload, { status: 500 });
    }
}
