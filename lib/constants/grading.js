export function calculateGrade(obtainedMarks, totalMarks) {
    const total = Number(totalMarks);
    const obtained = Number(obtainedMarks);
    if (!total || Number.isNaN(obtained)) return '';

    const percentage = (obtained / total) * 100;
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
}

export function buildExamResultSummaries(students = [], subjects = [], examEntries = []) {
    const summaries = students.map((student) => {
        const subjectResults = subjects.map((subject) => {
            const entry = examEntries.find((item) => item.student_id === student.id && item.subject_id === subject.id);
            const obtainedMarks = entry?.obtained_marks;
            const totalMarks = Number(entry?.total_marks || 100);
            const hasMarks = obtainedMarks !== null && obtainedMarks !== undefined && obtainedMarks !== '';

            return {
                subject,
                entry,
                hasMarks,
                obtainedMarks: hasMarks ? Number(obtainedMarks) : null,
                totalMarks,
                grade: hasMarks ? calculateGrade(obtainedMarks, totalMarks) : ''
            };
        });

        const complete = subjectResults.length > 0 && subjectResults.every((item) => item.hasMarks);
        const obtainedTotal = subjectResults.reduce((sum, item) => sum + (item.obtainedMarks || 0), 0);
        const totalMarks = subjectResults.reduce((sum, item) => sum + item.totalMarks, 0);
        const percentage = complete && totalMarks ? (obtainedTotal / totalMarks) * 100 : null;
        const failedSubjects = subjectResults.filter((item) => item.grade === 'F').length;

        return {
            student,
            subjectResults,
            complete,
            obtainedTotal,
            totalMarks,
            percentage,
            overallGrade: complete ? calculateGrade(obtainedTotal, totalMarks) : '',
            failedSubjects,
            passed: complete ? failedSubjects === 0 : null,
            rank: null
        };
    });

    const ranked = summaries
        .filter((item) => item.complete)
        .sort((a, b) => {
            if (b.obtainedTotal !== a.obtainedTotal) return b.obtainedTotal - a.obtainedTotal;
            return a.student.student_name.localeCompare(b.student.student_name);
        });

    ranked.forEach((item, index) => {
        item.rank = index + 1;
    });

    return summaries;
}
