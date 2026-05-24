import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

export async function GET(_request, { params }) {
    try {
        const { institutionId } = await params;
        if (!institutionId) {
            return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
        }

        const [classesResult, subjectsResult, lessonsResult, examsResult, studentsResult] = await Promise.all([
            supabaseAdmin
                .from('school_classes')
                .select('id,name,academic_year,grade_level')
                .eq('institution_id', institutionId)
                .order('grade_level', { ascending: true, nullsFirst: false })
                .order('name', { ascending: true }),
            supabaseAdmin
                .from('school_subjects')
                .select('id,class_id,name')
                .eq('institution_id', institutionId)
                .order('name', { ascending: true }),
            supabaseAdmin
                .from('school_lessons')
                .select('id,class_id,subject_id,title,description,homework,resource_url,lesson_date,status')
                .eq('institution_id', institutionId)
                .eq('status', 'published')
                .order('lesson_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(120),
            supabaseAdmin
                .from('school_exams')
                .select('id,class_id,name,exam_date,status,published_at')
                .eq('institution_id', institutionId)
                .eq('status', 'published')
                .order('published_at', { ascending: false, nullsFirst: false })
                .order('exam_date', { ascending: false, nullsFirst: false })
                .limit(80),
            supabaseAdmin
                .from('school_students')
                .select('id,class_id')
                .eq('institution_id', institutionId)
                .eq('active', true)
        ]);

        if (classesResult.error) throw classesResult.error;
        if (subjectsResult.error) throw subjectsResult.error;
        if (lessonsResult.error) throw lessonsResult.error;
        if (examsResult.error) throw examsResult.error;
        if (studentsResult.error) throw studentsResult.error;

        const students = studentsResult.data || [];
        const studentIds = students.map((item) => item.id);
        let attendanceRows = [];
        if (studentIds.length) {
            const attendanceResult = await supabaseAdmin
                .from('school_attendance')
                .select('student_id,status')
                .in('student_id', studentIds)
                .eq('attendance_date', todayIsoDate());
            if (attendanceResult.error) throw attendanceResult.error;
            attendanceRows = attendanceResult.data || [];
        }

        const studentClassMap = new Map(students.map((item) => [item.id, item.class_id]));
        const lessonIds = (lessonsResult.data || []).map((item) => item.id);
        let progressRows = [];
        if (lessonIds.length) {
            const progressResult = await supabaseAdmin
                .from('school_lesson_progress')
                .select('lesson_id,status')
                .in('lesson_id', lessonIds);
            if (progressResult.error) throw progressResult.error;
            progressRows = progressResult.data || [];
        }
        const progressByLesson = progressRows.reduce((acc, row) => {
            if (!acc[row.lesson_id]) acc[row.lesson_id] = { completed: 0, not_completed: 0 };
            acc[row.lesson_id][row.status] = (acc[row.lesson_id][row.status] || 0) + 1;
            return acc;
        }, {});
        const attendanceByClass = new Map();
        attendanceRows.forEach((row) => {
            const classId = studentClassMap.get(row.student_id);
            if (!classId) return;
            const current = attendanceByClass.get(classId) || { present: 0, absent: 0, late: 0, marked: 0 };
            current[row.status] = (current[row.status] || 0) + 1;
            current.marked += 1;
            attendanceByClass.set(classId, current);
        });

        const studentsByClass = students.reduce((acc, student) => {
            acc[student.class_id] = (acc[student.class_id] || 0) + 1;
            return acc;
        }, {});

        const classes = (classesResult.data || []).map((classInfo) => ({
            ...classInfo,
            student_count: studentsByClass[classInfo.id] || 0,
            subjects: (subjectsResult.data || []).filter((subject) => subject.class_id === classInfo.id),
            latest_lessons: (lessonsResult.data || [])
                .filter((lesson) => lesson.class_id === classInfo.id)
                .slice(0, 6)
                .map((lesson) => ({
                    ...lesson,
                    progress_summary: progressByLesson[lesson.id] || { completed: 0, not_completed: 0 }
                })),
            latest_exams: (examsResult.data || []).filter((exam) => exam.class_id === classInfo.id).slice(0, 3),
            today_attendance: attendanceByClass.get(classInfo.id) || { present: 0, absent: 0, late: 0, marked: 0 }
        }));

        return NextResponse.json({ data: { classes } });
    } catch (error) {
        console.error('Guardian updates route failed:', error);
        return NextResponse.json({ error: error.message || 'Guardian updates failed' }, { status: 500 });
    }
}
