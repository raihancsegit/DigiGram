import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function normalizePhone(value = '') {
    return String(value).replace(/[^\d]/g, '').replace(/^88/, '');
}

function buildExamSummary(exam, entries, subjects) {
    const total = entries.reduce((sum, item) => sum + Number(item.total_marks || 0), 0);
    const obtained = entries.reduce((sum, item) => sum + Number(item.obtained_marks || 0), 0);
    const percentage = total ? Math.round((obtained / total) * 100) : null;
    return {
        id: exam.id,
        name: exam.name,
        exam_date: exam.exam_date,
        total,
        obtained,
        percentage,
        subjects: entries.map((entry) => ({
            subject: subjects.find((item) => item.id === entry.subject_id)?.name || 'Subject',
            total_marks: Number(entry.total_marks || 0),
            obtained_marks: entry.obtained_marks === null ? null : Number(entry.obtained_marks || 0),
            grade: entry.grade || null
        }))
    };
}

export async function POST(request, { params }) {
    try {
        const { institutionId } = await params;
        const body = await request.json();
        const classId = body.classId;
        const rollNo = String(body.rollNo || '').trim();
        const phone = normalizePhone(body.guardianPhone);

        if (!institutionId || !classId || !rollNo || !phone) {
            return NextResponse.json({ error: 'Class, roll and guardian phone are required' }, { status: 400 });
        }

        const { data: students, error: studentError } = await supabaseAdmin
            .from('school_students')
            .select('id,institution_id,class_id,student_name,roll_no,guardian_name,guardian_phone,active')
            .eq('institution_id', institutionId)
            .eq('class_id', classId)
            .eq('roll_no', rollNo)
            .eq('active', true)
            .limit(5);
        if (studentError) throw studentError;

        const student = (students || []).find((item) => normalizePhone(item.guardian_phone) === phone);
        if (!student) {
            return NextResponse.json({ error: 'Student roll and guardian phone did not match' }, { status: 404 });
        }

        const [classResult, subjectsResult, lessonsResult, progressResult, attendanceResult, examsResult] = await Promise.all([
            supabaseAdmin.from('school_classes').select('id,name,academic_year,grade_level').eq('id', classId).maybeSingle(),
            supabaseAdmin.from('school_subjects').select('id,name').eq('institution_id', institutionId).eq('class_id', classId).order('name'),
            supabaseAdmin
                .from('school_lessons')
                .select('id,class_id,subject_id,title,description,homework,resource_url,lesson_date,status')
                .eq('institution_id', institutionId)
                .eq('class_id', classId)
                .eq('status', 'published')
                .order('lesson_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(20),
            supabaseAdmin.from('school_lesson_progress').select('lesson_id,status,reviewed_at,note').eq('student_id', student.id),
            supabaseAdmin
                .from('school_attendance')
                .select('attendance_date,status')
                .eq('student_id', student.id)
                .order('attendance_date', { ascending: false })
                .limit(30),
            supabaseAdmin
                .from('school_exams')
                .select('id,name,exam_date,published_at')
                .eq('institution_id', institutionId)
                .eq('class_id', classId)
                .eq('status', 'published')
                .order('published_at', { ascending: false, nullsFirst: false })
                .order('exam_date', { ascending: false, nullsFirst: false })
                .limit(3)
        ]);

        for (const result of [classResult, subjectsResult, lessonsResult, progressResult, attendanceResult, examsResult]) {
            if (result.error) throw result.error;
        }

        const progress = progressResult.data || [];
        const lessons = (lessonsResult.data || []).map((lesson) => ({
            ...lesson,
            subject_name: (subjectsResult.data || []).find((item) => item.id === lesson.subject_id)?.name || 'Subject',
            progress: progress.find((item) => item.lesson_id === lesson.id) || null
        }));

        const examSummaries = [];
        for (const exam of examsResult.data || []) {
            const { data: entries, error: entriesError } = await supabaseAdmin
                .from('school_exam_entries')
                .select('subject_id,total_marks,obtained_marks,grade')
                .eq('exam_id', exam.id)
                .eq('student_id', student.id);
            if (entriesError) throw entriesError;
            examSummaries.push(buildExamSummary(exam, entries || [], subjectsResult.data || []));
        }

        return NextResponse.json({
            data: {
                student: {
                    id: student.id,
                    student_name: student.student_name,
                    roll_no: student.roll_no,
                    guardian_name: student.guardian_name
                },
                classInfo: classResult.data,
                attendance: attendanceResult.data || [],
                lessons,
                results: examSummaries
            }
        });
    } catch (error) {
        console.error('Guardian student check failed:', error);
        return NextResponse.json({ error: error.message || 'Student check failed' }, { status: 500 });
    }
}
