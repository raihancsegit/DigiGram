import { supabase } from '@/lib/utils/supabase';
import { buildAcademicClassPlan } from '@/lib/constants/academicStructure';

export const schoolService = {
    async getClasses(institutionId) {
        const { data, error } = await supabase
            .from('school_classes')
            .select('*')
            .eq('institution_id', institutionId)
            .order('academic_year', { ascending: false })
            .order('grade_level', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getStudents(classId) {
        const { data, error } = await supabase
            .from('school_students')
            .select('*')
            .eq('class_id', classId)
            .eq('active', true)
            .order('roll_no', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getCurrentStudent(institutionId) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) return null;

        return this.getStudentByProfile(institutionId, authData.user.id);
    },

    async getStudentByProfile(institutionId, profileId) {
        const { data, error } = await supabase
            .from('school_students')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('profile_id', profileId)
            .eq('active', true)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async getFirstStudent(institutionId) {
        const { data, error } = await supabase
            .from('school_students')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('active', true)
            .order('created_at', { ascending: true })
            .limit(1);
        if (error) throw error;
        return data?.[0] || null;
    },

    async createClass(payload) {
        const { data, error } = await supabase
            .from('school_classes')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async createDefaultClasses(institutionId, academicYear, academicSettings) {
        const plan = buildAcademicClassPlan(academicSettings);
        if (!plan.length) return [];

        const existing = await this.getClasses(institutionId);
        const existingGrades = new Set(
            existing
                .filter((item) => item.academic_year === academicYear)
                .map((item) => item.grade_level)
                .filter((value) => value !== null && value !== undefined)
        );
        const missingRows = plan
            .filter((item) => !existingGrades.has(item.grade_level))
            .map((item) => ({
                institution_id: institutionId,
                academic_year: academicYear,
                grade_level: item.grade_level,
                name: item.name
            }));

        if (!missingRows.length) return [];

        const { data, error } = await supabase
            .from('school_classes')
            .insert(missingRows)
            .select();
        if (error) throw error;
        return data || [];
    },

    async createStudent(payload) {
        const { data, error } = await supabase
            .from('school_students')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateStudent(studentId, updates) {
        const { data, error } = await supabase
            .from('school_students')
            .update(updates)
            .eq('id', studentId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getSubjects(institutionId, classId = null) {
        let query = supabase
            .from('school_subjects')
            .select('*')
            .eq('institution_id', institutionId)
            .order('name', { ascending: true });

        if (classId) query = query.eq('class_id', classId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async createSubject(payload) {
        const { data, error } = await supabase
            .from('school_subjects')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteSubject(subjectId) {
        const { error } = await supabase
            .from('school_subjects')
            .delete()
            .eq('id', subjectId);
        if (error) throw error;
    },

    async updateSubject(subjectId, updates) {
        const { data, error } = await supabase
            .from('school_subjects')
            .update(updates)
            .eq('id', subjectId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getExams(institutionId, classId = null) {
        let query = supabase
            .from('school_exams')
            .select('*')
            .eq('institution_id', institutionId)
            .order('exam_date', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (classId) query = query.eq('class_id', classId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getPublishedExams(institutionId, classId = null) {
        let query = supabase
            .from('school_exams')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('status', 'published')
            .order('published_at', { ascending: false, nullsFirst: false })
            .order('exam_date', { ascending: false, nullsFirst: false });

        if (classId) query = query.eq('class_id', classId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async createExam(payload) {
        const { data, error } = await supabase
            .from('school_exams')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getExamEntries(examId) {
        const { data, error } = await supabase
            .from('school_exam_entries')
            .select('*')
            .eq('exam_id', examId);
        if (error) throw error;
        return data || [];
    },

    async upsertExamEntries(entries) {
        if (!entries.length) return [];
        const { data, error } = await supabase
            .from('school_exam_entries')
            .upsert(entries, { onConflict: 'exam_id,student_id,subject_id' })
            .select();
        if (error) throw error;
        return data || [];
    },

    async publishExam(examId) {
        const { data, error } = await supabase
            .from('school_exams')
            .update({
                status: 'published',
                published_at: new Date().toISOString()
            })
            .eq('id', examId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async markAttendance(payload) {
        const { data, error } = await supabase
            .from('school_attendance')
            .upsert(payload, { onConflict: 'student_id,attendance_date' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async createLesson(payload) {
        const { data, error } = await supabase
            .from('school_lessons')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateLesson(lessonId, payload) {
        const { data, error } = await supabase
            .from('school_lessons')
            .update(payload)
            .eq('id', lessonId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteLesson(lessonId) {
        const { error } = await supabase
            .from('school_lessons')
            .update({
                deleted_at: new Date().toISOString(),
                status: 'archived'
            })
            .eq('id', lessonId);
        if (error) {
            const missingSoftDeleteColumn = error.code === '42703'
                || String(error.message || '').includes('deleted_at')
                || String(error.message || '').includes('archived');
            if (!missingSoftDeleteColumn) throw error;

            const { error: deleteError } = await supabase
                .from('school_lessons')
                .delete()
                .eq('id', lessonId);
            if (deleteError) throw deleteError;
        }
        return true;
    },

    async getLessons(institutionId, options = {}) {
        let query = supabase
            .from('school_lessons')
            .select('*')
            .eq('institution_id', institutionId)
            .order('lesson_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (options.classId) query = query.eq('class_id', options.classId);
        if (options.subjectId) query = query.eq('subject_id', options.subjectId);
        if (options.teacherId) query = query.eq('teacher_id', options.teacherId);
        if (options.status) query = query.eq('status', options.status);
        if (options.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).filter((lesson) => !lesson.deleted_at && lesson.status !== 'archived');
    },

    async getLessonProgress(lessonId) {
        const { data, error } = await supabase
            .from('school_lesson_progress')
            .select('*')
            .eq('lesson_id', lessonId);
        if (error) throw error;
        return data || [];
    },

    async getStudentLessonProgress(studentId) {
        const { data, error } = await supabase
            .from('school_lesson_progress')
            .select('*')
            .eq('student_id', studentId);
        if (error) throw error;
        return data || [];
    },

    async markLessonProgress(payload) {
        const { data, error } = await supabase
            .from('school_lesson_progress')
            .upsert({
                ...payload,
                reviewed_at: new Date().toISOString()
            }, { onConflict: 'lesson_id,student_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getLessonQuiz(lessonId) {
        const { data, error } = await supabase
            .from('school_lesson_quizzes')
            .select('*')
            .eq('lesson_id', lessonId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async createLessonQuiz(payload) {
        const { data, error } = await supabase
            .from('school_lesson_quizzes')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getLessonQuizQuestions(quizId) {
        const { data, error } = await supabase
            .from('school_lesson_quiz_questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createLessonQuizQuestion(payload) {
        const { data, error } = await supabase
            .from('school_lesson_quiz_questions')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getStudentQuizAttempt(quizId, studentId) {
        const { data, error } = await supabase
            .from('school_lesson_quiz_attempts')
            .select('*')
            .eq('quiz_id', quizId)
            .eq('student_id', studentId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async submitLessonQuizAttempt(payload) {
        const { data, error } = await supabase
            .from('school_lesson_quiz_attempts')
            .upsert(payload, { onConflict: 'quiz_id,student_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
