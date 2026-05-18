import { supabase } from '@/lib/utils/supabase';

export const schoolService = {
    async getClasses(institutionId) {
        const { data, error } = await supabase
            .from('school_classes')
            .select('*')
            .eq('institution_id', institutionId)
            .order('academic_year', { ascending: false })
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

    async createClass(payload) {
        const { data, error } = await supabase
            .from('school_classes')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
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

    async markLessonProgress(payload) {
        const { data, error } = await supabase
            .from('school_lesson_progress')
            .upsert(payload, { onConflict: 'lesson_id,student_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
