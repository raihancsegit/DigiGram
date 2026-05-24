const BANGLA_GRADES = {
    0: 'প্রাক-প্রাথমিক',
    1: '১ম শ্রেণি',
    2: '২য় শ্রেণি',
    3: '৩য় শ্রেণি',
    4: '৪র্থ শ্রেণি',
    5: '৫ম শ্রেণি',
    6: '৬ষ্ঠ শ্রেণি',
    7: '৭ম শ্রেণি',
    8: '৮ম শ্রেণি',
    9: '৯ম শ্রেণি',
    10: '১০ম শ্রেণি',
    11: 'একাদশ শ্রেণি',
    12: 'দ্বাদশ শ্রেণি'
};

export function getGradeLabel(gradeLevel, model = 'general') {
    if (model === 'madrasa' && gradeLevel === 0) {
        return 'ইবতেদায়ি';
    }

    return BANGLA_GRADES[gradeLevel] || `${gradeLevel} শ্রেণি`;
}

export function buildAcademicClassPlan(settings = {}) {
    const startGrade = Number(settings.start_grade);
    const endGrade = Number(settings.end_grade);
    const model = settings.model || 'general';

    if (!Number.isInteger(startGrade) || !Number.isInteger(endGrade) || endGrade < startGrade) {
        return [];
    }

    return Array.from({ length: endGrade - startGrade + 1 }, (_, index) => {
        const gradeLevel = startGrade + index;
        return {
            grade_level: gradeLevel,
            name: getGradeLabel(gradeLevel, model)
        };
    });
}
