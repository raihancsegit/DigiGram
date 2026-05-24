'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BookOpenCheck, CalendarCheck, ClipboardList, ExternalLink, GraduationCap, Home, Loader2, Pencil, Plus, Trash2, Trophy, Users, X } from 'lucide-react';
import { institutionService } from '@/lib/services/institutionService';
import { institutionPortalService } from '@/lib/services/institutionPortalService';
import { schoolService } from '@/lib/services/schoolService';
import { aiService } from '@/lib/services/aiService';
import { smsService } from '@/lib/services/smsService';
import { getInstitutionDesignProfile } from '@/lib/constants/institutionDesignProfiles';
import { getInstitutionProfile } from '@/lib/constants/institutionProfiles';
import { buildExamResultSummaries } from '@/lib/constants/grading';
import StudentReportCard from '@/components/sections/school/StudentReportCard';

const ROLE_COPY = {
    admin: {
        title: 'প্রতিষ্ঠান অ্যাডমিন',
        intro: 'ক্লাস, শিক্ষক, নোটিশ, website content এবং রিপোর্ট নিয়ন্ত্রণ করুন।'
    },
    teacher: {
        title: 'শিক্ষক পোর্টাল',
        intro: 'উপস্থিতি, lesson progress, homework এবং result update করুন।'
    },
    student: {
        title: 'শিক্ষার্থী পোর্টাল',
        intro: 'নোটিশ, ক্লাস আপডেট, lesson status এবং ফলাফল দেখুন।'
    }
};

const PAGE_SIZE = 6;

function clampPage(page, totalItems, pageSize = PAGE_SIZE) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return Math.min(Math.max(page, 1), totalPages);
}

function paginateRows(rows, page, pageSize = PAGE_SIZE) {
    const safePage = clampPage(page, rows.length, pageSize);
    return rows.slice((safePage - 1) * pageSize, safePage * pageSize);
}

function matchesSearch(row, search, fields) {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return fields.some((field) => String(row?.[field] || '').toLowerCase().includes(needle));
}

function escapeHtml(value = '') {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function richTextToHtml(value = '') {
    return escapeHtml(value)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br />');
}

function Pagination({ page, totalItems, onPageChange, pageSize = PAGE_SIZE }) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems <= pageSize) return null;
    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-black text-slate-500">Page {page} / {totalPages}</p>
            <div className="flex gap-2">
                <button type="button" onClick={() => onPageChange(clampPage(page - 1, totalItems, pageSize))} disabled={page <= 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
                    Prev
                </button>
                <button type="button" onClick={() => onPageChange(clampPage(page + 1, totalItems, pageSize))} disabled={page >= totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
                    Next
                </button>
            </div>
        </div>
    );
}

function RichTextInput({ value, onChange, placeholder, disabled, minHeight = 'min-h-28' }) {
    function wrapSelection(before, after = before) {
        const textarea = document.activeElement;
        if (!textarea || textarea.tagName !== 'TEXTAREA') return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.slice(start, end) || 'text';
        const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
        onChange(nextValue);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
        });
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap gap-2 border-b border-slate-100 p-2">
                <button type="button" onClick={() => wrapSelection('**')} disabled={disabled} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 disabled:opacity-40">Bold</button>
                <button type="button" onClick={() => wrapSelection('*')} disabled={disabled} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black italic text-slate-700 disabled:opacity-40">Italic</button>
                <button type="button" onClick={() => onChange(`${value}${value ? '\n' : ''}- `)} disabled={disabled} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 disabled:opacity-40">List</button>
            </div>
            <textarea
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={`${minHeight} w-full resize-y rounded-b-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none disabled:bg-slate-100`}
            />
        </div>
    );
}

export default function SchoolPortalShell({ schoolId, role }) {
    const [institution, setInstitution] = useState(null);
    const [membership, setMembership] = useState(null);
    const [currentRole, setCurrentRole] = useState(null);
    const [notices, setNotices] = useState([]);
    const [student, setStudent] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [studentClass, setStudentClass] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [publishedExams, setPublishedExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examEntries, setExamEntries] = useState([]);
    const [teacherSubjects, setTeacherSubjects] = useState([]);
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [selectedTeacherClassId, setSelectedTeacherClassId] = useState('');
    const [selectedTeacherSubject, setSelectedTeacherSubject] = useState(null);
    const [teacherStudents, setTeacherStudents] = useState([]);
    const [teacherLessons, setTeacherLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [lessonQuiz, setLessonQuiz] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [studentLessons, setStudentLessons] = useState([]);
    const [studentLessonProgress, setStudentLessonProgress] = useState([]);
    const [selectedStudentSubjectId, setSelectedStudentSubjectId] = useState('');
    const [lessonForm, setLessonForm] = useState({
        lesson_date: '',
        title: '',
        description: '',
        homework: '',
        resource_url: ''
    });
    const [quizForm, setQuizForm] = useState({ title: 'Topic check', passing_score: 60 });
    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'a',
        explanation: ''
    });
    const [studentQuizMap, setStudentQuizMap] = useState({});
    const [studentQuestionMap, setStudentQuestionMap] = useState({});
    const [studentAttemptMap, setStudentAttemptMap] = useState({});
    const [studentAnswers, setStudentAnswers] = useState({});
    const [studentHelpQuestions, setStudentHelpQuestions] = useState({});
    const [studentHelpMap, setStudentHelpMap] = useState({});
    const [studentHelpLoading, setStudentHelpLoading] = useState({});
    const [lessonScanLoading, setLessonScanLoading] = useState(false);
    const [aiQuizDrafts, setAiQuizDrafts] = useState([]);
    const [aiResourceHint, setAiResourceHint] = useState('');
    const [lessonScanStatus, setLessonScanStatus] = useState('');
    const [lessonSmsSending, setLessonSmsSending] = useState(false);
    const [lessonSmsStatus, setLessonSmsStatus] = useState('');
    const [lessonModalOpen, setLessonModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [teacherLessonPage, setTeacherLessonPage] = useState(1);
    const [teacherStudentPage, setTeacherStudentPage] = useState(1);
    const [studentLessonPage, setStudentLessonPage] = useState(1);
    const [portalNoticePage, setPortalNoticePage] = useState(1);
    const [portalSearch, setPortalSearch] = useState({
        teacherLessons: '',
        teacherStudents: '',
        studentLessons: '',
        notices: ''
    });
    const [loading, setLoading] = useState(true);
    const [portalTab, setPortalTab] = useState('dashboard');
    const copy = ROLE_COPY[role];

    useEffect(() => {
        async function load() {
            try {
                const [membership, currentRole] = await Promise.all([
                    institutionPortalService.getMembership(schoolId, role),
                    institutionPortalService.getCurrentRole()
                ]);
                setMembership(membership);
                setCurrentRole(currentRole);
                let effectiveMembership = membership;
                if (!membership && currentRole !== 'super_admin') {
                    setInstitution({ accessDenied: true });
                    return;
                }
                const [info, noticeData] = await Promise.all([
                    institutionService.getInstitutionById(schoolId),
                    institutionPortalService.getPublicNotices(schoolId)
                ]);
                setInstitution(info);
                setNotices(noticeData);

                if (!effectiveMembership && currentRole === 'super_admin' && role !== 'admin') {
                    const members = await institutionPortalService.getMembers(schoolId, role, true);
                    effectiveMembership = members.find((item) => item.is_active) || members[0] || null;
                    setMembership(effectiveMembership);
                }

                if (role === 'student') {
                    const currentStudent = effectiveMembership?.profile_id
                        ? await schoolService.getStudentByProfile(schoolId, effectiveMembership.profile_id)
                        : currentRole === 'super_admin'
                            ? await schoolService.getFirstStudent(schoolId)
                            : await schoolService.getCurrentStudent(schoolId);
                    setStudent(currentStudent);
                    if (currentStudent?.class_id) {
                        const [classRows, classStudentRows, subjectRows, examRows] = await Promise.all([
                            schoolService.getClasses(schoolId),
                            schoolService.getStudents(currentStudent.class_id),
                            schoolService.getSubjects(schoolId, currentStudent.class_id),
                            schoolService.getPublishedExams(schoolId, currentStudent.class_id)
                        ]);
                        setStudentClass(classRows.find((item) => item.id === currentStudent.class_id) || null);
                        setClassStudents(classStudentRows);
                        setSubjects(subjectRows);
                        setPublishedExams(examRows);
                        if (examRows[0]) {
                            setSelectedExam(examRows[0]);
                            setExamEntries(await schoolService.getExamEntries(examRows[0].id));
                        }
                        const [lessonRows, progressRows] = await Promise.all([
                            schoolService.getLessons(schoolId, {
                                classId: currentStudent.class_id,
                                status: 'published',
                                limit: 12
                            }),
                            schoolService.getStudentLessonProgress(currentStudent.id)
                        ]);
                        setStudentLessons(lessonRows);
                        setStudentLessonProgress(progressRows);
                        const quizRows = await Promise.all(lessonRows.map(async (lesson) => {
                            const quiz = await schoolService.getLessonQuiz(lesson.id);
                            return [lesson.id, quiz];
                        }));
                        const quizMap = Object.fromEntries(quizRows.filter(([, quiz]) => quiz));
                        setStudentQuizMap(quizMap);
                        const questionEntries = await Promise.all(
                            Object.values(quizMap).map(async (quiz) => [quiz.id, await schoolService.getLessonQuizQuestions(quiz.id)])
                        );
                        setStudentQuestionMap(Object.fromEntries(questionEntries));
                        const attempts = await Promise.all(
                            Object.values(quizMap).map(async (quiz) => [quiz.id, await schoolService.getStudentQuizAttempt(quiz.id, currentStudent.id)])
                        );
                        setStudentAttemptMap(Object.fromEntries(attempts.filter(([, attempt]) => attempt)));
                    }
                }

                if (role === 'teacher' && (effectiveMembership?.profile_id || currentRole === 'super_admin')) {
                    const [classRows, assignedSubjects] = await Promise.all([
                        schoolService.getClasses(schoolId),
                        schoolService.getSubjects(schoolId)
                    ]);
                    const ownSubjects = effectiveMembership?.profile_id
                        ? assignedSubjects.filter((subject) => subject.teacher_id === effectiveMembership.profile_id)
                        : assignedSubjects;
                    setTeacherClasses(classRows);
                    setTeacherSubjects(ownSubjects);
                    if (ownSubjects[0]) {
                        const subject = ownSubjects[0];
                        setSelectedTeacherClassId(subject.class_id || '');
                        setSelectedTeacherSubject(subject);
                        const lessonOptions = {
                            classId: subject.class_id,
                            subjectId: subject.id
                        };
                        if (effectiveMembership?.profile_id) lessonOptions.teacherId = effectiveMembership.profile_id;
                        const [studentRows, lessonRows] = await Promise.all([
                            schoolService.getStudents(subject.class_id),
                            schoolService.getLessons(schoolId, lessonOptions)
                        ]);
                        setTeacherStudents(studentRows);
                        setTeacherLessons(lessonRows);
                        if (lessonRows[0]) {
                            setSelectedLesson(lessonRows[0]);
                            setLessonProgress(await schoolService.getLessonProgress(lessonRows[0].id));
                            const quiz = await schoolService.getLessonQuiz(lessonRows[0].id);
                            setLessonQuiz(quiz);
                            setQuizQuestions(quiz ? await schoolService.getLessonQuizQuestions(quiz.id) : []);
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [role, schoolId]);

    if (loading) return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-teal-600" /></div>;

    if (institution?.accessDenied) {
        return (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center">
                <h1 className="text-2xl font-black text-rose-700">এই portal-এ আপনার access নেই</h1>
                <p className="mt-2 font-bold text-rose-500">আপনাকে যে প্রতিষ্ঠানে assign করা হয়েছে, শুধু সেই portal-এই প্রবেশ করা যাবে।</p>
            </div>
        );
    }

    const design = getInstitutionDesignProfile(institution?.category);
    const profile = getInstitutionProfile(institution?.category);
    const portalCopy = profile.portal;
    const studentSummary = student && selectedExam
        ? buildExamResultSummaries(classStudents, subjects, examEntries).find((item) => item.student.id === student.id)
        : null;
    const selectedTeacherClass = teacherClasses.find((item) => item.id === selectedTeacherSubject?.class_id);
    const teacherClassOptions = teacherClasses.filter((classInfo) =>
        teacherSubjects.some((subject) => subject.class_id === classInfo.id)
    );
    const filteredTeacherSubjects = selectedTeacherClassId
        ? teacherSubjects.filter((subject) => subject.class_id === selectedTeacherClassId)
        : teacherSubjects;
    const completedCount = lessonProgress.filter((item) => item.status === 'completed').length;
    const portalTabs = role === 'teacher'
        ? [
            { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Home },
            { id: 'lessons', label: 'Topic ও lesson', icon: BookOpenCheck },
            { id: 'progress', label: 'Student progress', icon: ClipboardList },
            { id: 'quiz', label: 'Quiz ও AI', icon: Trophy }
        ]
        : role === 'student'
            ? [
                { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Home },
                { id: 'lessons', label: 'আজকের পড়া', icon: BookOpenCheck },
                { id: 'result', label: 'ফলাফল', icon: Trophy },
                { id: 'notices', label: 'নোটিশ', icon: Bell }
            ]
            : [
                { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Home }
            ];
    const isTeacherPortal = role === 'teacher';
    const isStudentPortal = role === 'student';
    const teacherCompletionRate = teacherStudents.length ? Math.round((completedCount / teacherStudents.length) * 100) : 0;
    const studentCompletedLessons = studentLessonProgress.filter((item) => item.status === 'completed').length;
    const visibleStudentLessons = selectedStudentSubjectId
        ? studentLessons.filter((lesson) => lesson.subject_id === selectedStudentSubjectId)
        : studentLessons;
    const filteredStudentLessons = visibleStudentLessons.filter((lesson) => matchesSearch(lesson, portalSearch.studentLessons, ['title', 'description', 'homework', 'lesson_date']));
    const filteredTeacherLessons = teacherLessons.filter((lesson) => matchesSearch(lesson, portalSearch.teacherLessons, ['title', 'description', 'homework', 'lesson_date']));
    const filteredTeacherStudents = teacherStudents.filter((student) => matchesSearch(student, portalSearch.teacherStudents, ['student_name', 'roll_no', 'guardian_name', 'guardian_phone']));
    const filteredPortalNotices = notices.filter((notice) => matchesSearch(notice, portalSearch.notices, ['title', 'body', 'audience']));
    const pagedStudentLessons = paginateRows(filteredStudentLessons, studentLessonPage);
    const pagedTeacherLessons = paginateRows(filteredTeacherLessons, teacherLessonPage);
    const pagedTeacherStudents = paginateRows(filteredTeacherStudents, teacherStudentPage);
    const pagedNotices = paginateRows(filteredPortalNotices, portalNoticePage);
    const setPortalSearchValue = (key, value) => {
        setPortalSearch((current) => ({ ...current, [key]: value }));
        if (key === 'teacherLessons') setTeacherLessonPage(1);
        if (key === 'teacherStudents') setTeacherStudentPage(1);
        if (key === 'studentLessons') setStudentLessonPage(1);
        if (key === 'notices') setPortalNoticePage(1);
    };
    const studentPendingLessons = studentLessons.filter((lesson) => {
        const progress = studentLessonProgress.find((item) => item.lesson_id === lesson.id);
        return progress?.status !== 'completed';
    }).length;
    const portalTheme = isTeacherPortal
        ? {
            page: 'bg-[#eef2ff]',
            grid: 'lg:grid-cols-[300px_1fr]',
            sidebar: 'bg-[#172554] text-white',
            sidebarBorder: 'border-white/10',
            avatar: 'bg-[#f59e0b] text-[#172554]',
            badge: 'bg-white/10 text-cyan-200',
            activeNav: 'bg-white text-[#172554] shadow-xl shadow-blue-950/20',
            inactiveNav: 'text-blue-100/75 hover:bg-white/10 hover:text-white',
            header: 'border-b border-blue-100 bg-white/90',
            eyebrow: 'text-blue-700',
            primary: 'bg-[#1d4ed8] text-white',
            card: 'border-blue-100 bg-white'
        }
        : isStudentPortal
            ? {
                page: 'bg-[#fff7ed]',
                grid: 'lg:grid-cols-[260px_1fr]',
                sidebar: 'border-r border-orange-100 bg-white text-slate-900',
                sidebarBorder: 'border-orange-100',
                avatar: 'bg-[#fb923c] text-white',
                badge: 'bg-orange-50 text-orange-700',
                activeNav: 'bg-orange-600 text-white shadow-lg shadow-orange-200',
                inactiveNav: 'text-slate-600 hover:bg-orange-50 hover:text-orange-700',
                header: 'border-b border-orange-100 bg-[#fffaf3]/95',
                eyebrow: 'text-orange-700',
                primary: 'bg-orange-600 text-white',
                card: 'border-orange-100 bg-white'
            }
            : {
                page: 'bg-[#f4f2ee]',
                grid: 'lg:grid-cols-[280px_1fr]',
                sidebar: 'bg-[#0f4a27] text-white',
                sidebarBorder: 'border-white/10',
                avatar: 'bg-[#c8922a] text-white',
                badge: 'bg-white/10 text-[#f0b840]',
                activeNav: 'bg-white text-[#0f4a27] shadow-xl',
                inactiveNav: 'text-white/75 hover:bg-white/10 hover:text-white',
                header: 'border-b border-slate-200 bg-white/95',
                eyebrow: 'text-emerald-700',
                primary: 'bg-emerald-700 text-white',
                card: 'border-slate-200 bg-white'
            };

    async function selectTeacherSubject(subject) {
        setSelectedTeacherClassId(subject.class_id || '');
        setSelectedTeacherSubject(subject);
        const lessonOptions = {
            classId: subject.class_id,
            subjectId: subject.id
        };
        if (membership?.profile_id) lessonOptions.teacherId = membership.profile_id;
        const [studentRows, lessonRows] = await Promise.all([
            schoolService.getStudents(subject.class_id),
            schoolService.getLessons(schoolId, lessonOptions)
        ]);
        setTeacherStudents(studentRows);
        setTeacherLessons(lessonRows);
        setTeacherLessonPage(1);
        setTeacherStudentPage(1);
        setSelectedLesson(lessonRows[0] || null);
        setLessonProgress(lessonRows[0] ? await schoolService.getLessonProgress(lessonRows[0].id) : []);
        if (lessonRows[0]) {
            const quiz = await schoolService.getLessonQuiz(lessonRows[0].id);
            setLessonQuiz(quiz);
            setQuizQuestions(quiz ? await schoolService.getLessonQuizQuestions(quiz.id) : []);
        } else {
            setLessonQuiz(null);
            setQuizQuestions([]);
        }
    }

    async function selectTeacherClass(classId) {
        setSelectedTeacherClassId(classId);
        const nextSubject = teacherSubjects.find((subject) => subject.class_id === classId);
        if (nextSubject) {
            await selectTeacherSubject(nextSubject);
            return;
        }
        setSelectedTeacherSubject(null);
        setTeacherStudents([]);
        setTeacherLessons([]);
        setTeacherLessonPage(1);
        setTeacherStudentPage(1);
        setSelectedLesson(null);
        setLessonProgress([]);
        setLessonQuiz(null);
        setQuizQuestions([]);
    }

    async function createTeacherLesson(event) {
        event.preventDefault();
        if (!selectedTeacherSubject) return;
        const payload = {
            institution_id: schoolId,
            class_id: selectedTeacherSubject.class_id,
            subject_id: selectedTeacherSubject.id,
            status: 'published',
            ...lessonForm,
            lesson_date: lessonForm.lesson_date || new Date().toISOString().split('T')[0]
        };
        if (editingLesson) {
            const updated = await schoolService.updateLesson(editingLesson.id, payload);
            setTeacherLessons((current) => current.map((item) => item.id === updated.id ? updated : item));
            setSelectedLesson(updated);
        } else {
            const created = await schoolService.createLesson({
                ...payload,
                teacher_id: membership?.profile_id || selectedTeacherSubject.teacher_id || null
            });
            setTeacherLessons((current) => [created, ...current]);
            setSelectedLesson(created);
            setLessonProgress([]);
            setTeacherLessonPage(1);
        }
        setLessonForm({
            lesson_date: '',
            title: '',
            description: '',
            homework: '',
            resource_url: ''
        });
        setEditingLesson(null);
        setLessonModalOpen(false);
        setAiQuizDrafts((current) => current);
        setLessonScanStatus('');
    }

    function openLessonModal(lesson = null) {
        if (lesson && !canManageLesson(lesson)) return;
        setEditingLesson(lesson);
        setLessonForm(lesson ? {
            lesson_date: lesson.lesson_date || '',
            title: lesson.title || '',
            description: lesson.description || '',
            homework: lesson.homework || '',
            resource_url: lesson.resource_url || ''
        } : {
            lesson_date: '',
            title: '',
            description: '',
            homework: '',
            resource_url: ''
        });
        setLessonScanStatus('');
        setLessonModalOpen(true);
    }

    function closeLessonModal() {
        setLessonModalOpen(false);
        setEditingLesson(null);
        setLessonScanStatus('');
    }

    function canManageLesson(lesson) {
        if (currentRole === 'super_admin') return true;
        return Boolean(lesson?.teacher_id && membership?.profile_id && lesson.teacher_id === membership.profile_id);
    }

    async function deleteTeacherLesson(lesson) {
        if (!canManageLesson(lesson)) return;
        const confirmed = window.confirm('এই topic delete করবেন? Student progress এবং quiz data-ও মুছে যেতে পারে।');
        if (!confirmed) return;
        await schoolService.deleteLesson(lesson.id);
        setTeacherLessons((current) => current.filter((item) => item.id !== lesson.id));
        if (selectedLesson?.id === lesson.id) {
            const nextLesson = teacherLessons.find((item) => item.id !== lesson.id) || null;
            setSelectedLesson(nextLesson);
            setLessonProgress(nextLesson ? await schoolService.getLessonProgress(nextLesson.id) : []);
        }
    }

    async function selectLesson(lesson) {
        setSelectedLesson(lesson);
        setLessonProgress(await schoolService.getLessonProgress(lesson.id));
        const quiz = await schoolService.getLessonQuiz(lesson.id);
        setLessonQuiz(quiz);
        setQuizQuestions(quiz ? await schoolService.getLessonQuizQuestions(quiz.id) : []);
    }

    async function markTeacherLessonProgress(studentId, status) {
        if (!selectedLesson) return;
        const updated = await schoolService.markLessonProgress({
            lesson_id: selectedLesson.id,
            student_id: studentId,
            status
        });
        setLessonProgress((current) => {
            const exists = current.some((item) => item.student_id === studentId);
            return exists
                ? current.map((item) => item.student_id === studentId ? updated : item)
                : [...current, updated];
        });
    }

    async function markAllTeacherLessonProgress(status) {
        if (!selectedLesson || teacherStudents.length === 0) return;
        const updatedRows = await Promise.all(
            teacherStudents.map((item) => schoolService.markLessonProgress({
                lesson_id: selectedLesson.id,
                student_id: item.id,
                status
            }))
        );
        setLessonProgress(updatedRows);
    }

    async function sendLessonFollowupSms() {
        if (!selectedLesson) return;
        const pendingStudents = teacherStudents.filter((item) => {
            const progress = lessonProgress.find((row) => row.student_id === item.id);
            return progress?.status !== 'completed' && item.guardian_phone;
        });
        if (pendingStudents.length === 0) {
            setLessonSmsStatus('SMS পাঠানোর মতো pending guardian phone পাওয়া যায়নি।');
            return;
        }
        setLessonSmsSending(true);
        setLessonSmsStatus('');
        const subjectName = selectedTeacherSubject?.name || 'subject';
        const className = selectedTeacherClass?.name || 'class';
        const messageBase = `${institution?.name || 'School'}: আপনার সন্তানের ${className} ${subjectName} topic "${selectedLesson.title}" এখনো complete হয়নি। অনুগ্রহ করে আজকের homework দেখে practice করান।`;
        const results = await Promise.allSettled(
            pendingStudents.map((item) => smsService.queueMessage({
                ownerType: 'institution',
                ownerId: schoolId,
                recipientPhone: item.guardian_phone,
                message: messageBase,
                category: 'school_lesson_followup',
                sourceType: 'school_lesson',
                sourceId: selectedLesson.id
            }))
        );
        const sent = results.filter((item) => item.status === 'fulfilled').length;
        const failed = results.length - sent;
        const firstError = results.find((item) => item.status === 'rejected')?.reason?.message;
        setLessonSmsSending(false);
        setLessonSmsStatus(`${sent} টি SMS queue হয়েছে${failed ? `, ${failed} টি failed${firstError ? ` (${firstError})` : ''}` : ''}।`);
    }

    async function createQuiz(event) {
        event.preventDefault();
        if (!selectedLesson) return;
        const created = await schoolService.createLessonQuiz({
            lesson_id: selectedLesson.id,
            title: quizForm.title,
            passing_score: Number(quizForm.passing_score)
        });
        setLessonQuiz(created);
    }

    async function createQuizQuestion(event) {
        event.preventDefault();
        if (!lessonQuiz) return;
        const created = await schoolService.createLessonQuizQuestion({
            quiz_id: lessonQuiz.id,
            ...questionForm,
            sort_order: quizQuestions.length + 1
        });
        setQuizQuestions((current) => [...current, created]);
        setQuestionForm({
            question_text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_option: 'a',
            explanation: ''
        });
    }

    async function submitStudentQuiz(quiz) {
        const questions = studentQuestionMap[quiz.id] || [];
        const answers = studentAnswers[quiz.id] || {};
        const correctAnswers = questions.filter((question) => answers[question.id] === question.correct_option).length;
        const score = questions.length ? Math.round((correctAnswers / questions.length) * 100) : 0;
        const attempt = await schoolService.submitLessonQuizAttempt({
            quiz_id: quiz.id,
            student_id: student.id,
            answers,
            total_questions: questions.length,
            correct_answers: correctAnswers,
            score,
            passed: score >= quiz.passing_score
        });
        setStudentAttemptMap((current) => ({ ...current, [quiz.id]: attempt }));
    }

    async function markStudentLessonProgress(lessonId, status) {
        if (!student) return;
        const updated = await schoolService.markLessonProgress({
            lesson_id: lessonId,
            student_id: student.id,
            status
        });
        setStudentLessonProgress((current) => {
            const exists = current.some((item) => item.lesson_id === lessonId);
            return exists
                ? current.map((item) => item.lesson_id === lessonId ? updated : item)
                : [...current, updated];
        });
    }

    async function requestStudentHelp(lesson, mode = 'explain') {
        setStudentHelpLoading((current) => ({ ...current, [lesson.id]: true }));
        try {
            const result = await aiService.getLessonHelp({
                lesson,
                subjectName: subjects.find((item) => item.id === lesson.subject_id)?.name || '',
                question: studentHelpQuestions[lesson.id] || '',
                mode
            });
            setStudentHelpMap((current) => ({ ...current, [lesson.id]: result }));
        } finally {
            setStudentHelpLoading((current) => ({ ...current, [lesson.id]: false }));
        }
    }

    async function scanLessonImage(files) {
        if (!files?.length) return;
        setLessonScanLoading(true);
        setLessonScanStatus('');
        try {
            const draft = await aiService.scanLessonImage(files, selectedTeacherSubject?.name || '');
            setLessonForm((current) => ({
                ...current,
                title: draft.title || current.title,
                description: draft.description || current.description,
                homework: draft.homework || current.homework
            }));
            setAiQuizDrafts(draft.quiz_questions || []);
            setAiResourceHint(draft.resource_hint || '');
            setLessonScanStatus(draft.fallback
                ? 'AI key না থাকায় basic draft বসানো হয়েছে। Edit করে publish করুন।'
                : 'AI scan complete হয়েছে। Draft check করে publish করুন।'
            );
        } catch (error) {
            setLessonScanStatus(error.message || 'AI scan করতে সমস্যা হয়েছে। Manual form ব্যবহার করুন।');
        } finally {
            setLessonScanLoading(false);
        }
    }

    async function addAiQuizDrafts() {
        if (!selectedLesson || !aiQuizDrafts.length) return;
        let quiz = lessonQuiz;
        if (!quiz) {
            quiz = await schoolService.createLessonQuiz({
                lesson_id: selectedLesson.id,
                title: 'AI topic check',
                passing_score: 60
            });
            setLessonQuiz(quiz);
        }
        const createdQuestions = [];
        for (let index = 0; index < aiQuizDrafts.length; index += 1) {
            createdQuestions.push(await schoolService.createLessonQuizQuestion({
                quiz_id: quiz.id,
                ...aiQuizDrafts[index],
                sort_order: quizQuestions.length + index + 1
            }));
        }
        setQuizQuestions((current) => [...current, ...createdQuestions]);
        setAiQuizDrafts([]);
    }

    return (
        <div className={`min-h-screen ${portalTheme.page}`}>
            <div className={`grid min-h-screen ${portalTheme.grid}`}>
                <aside className={`${portalTheme.sidebar} lg:sticky lg:top-0 lg:h-screen`}>
                    <div className={`border-b ${portalTheme.sidebarBorder} p-6`}>
                        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${portalTheme.avatar} text-2xl font-black`}>
                            {(institution?.name || 'S').slice(0, 1)}
                        </div>
                        <h2 className="mt-4 text-xl font-black">{institution?.name || 'School portal'}</h2>
                        <p className={`mt-1 text-sm font-bold ${isStudentPortal ? 'text-slate-500' : 'text-white/60'}`}>{role === 'teacher' ? 'শিক্ষক কাজের জায়গা' : role === 'student' ? 'শিক্ষার্থী শেখার পোর্টাল' : 'প্রতিষ্ঠান পোর্টাল'}</p>
                        <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${portalTheme.badge}`}>
                            {isTeacherPortal ? 'ক্লাস workflow' : isStudentPortal ? 'Learning desk' : 'DigiGram powered'}
                        </p>
                    </div>
                    <nav className="space-y-2 p-4">
                        {portalTabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setPortalTab(id)}
                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${portalTab === id ? portalTheme.activeNav : portalTheme.inactiveNav}`}
                            >
                                <Icon size={18} />
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-auto p-4">
                        <Link
                            href={`/${institution?.subdomain || ''}`}
                            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${isStudentPortal ? 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-700' : 'bg-white/10 text-white hover:bg-white/15'}`}
                        >
                            Website দেখুন <ExternalLink size={16} />
                        </Link>
                    </div>
                </aside>

                <main className="min-w-0">
                    <header className={`sticky top-0 z-20 px-5 py-4 backdrop-blur ${portalTheme.header}`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className={`text-xs font-black uppercase tracking-[0.25em] ${portalTheme.eyebrow}`}>{isTeacherPortal ? 'শিক্ষক কার্যক্রম' : isStudentPortal ? 'শিক্ষার্থী শেখা' : design.eyebrow}</p>
                                <h1 className="mt-1 text-2xl font-black text-slate-950">{copy.title}</h1>
                                <p className="mt-1 text-sm font-bold text-slate-500">{copy.intro}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Link href={`/${institution?.subdomain || ''}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                                    পাবলিক সাইট
                                </Link>
                                {role !== 'student' && (
                                    <Link href={`/school/${schoolId}/admin`} className={`rounded-2xl px-4 py-3 text-sm font-black ${portalTheme.primary}`}>
                                        অ্যাডমিন প্যানেল
                                    </Link>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="space-y-6 p-5 lg:p-7">
            {portalTab === 'dashboard' && (
                <>
            {isTeacherPortal && (
                <section className="rounded-[30px] bg-[#172554] p-6 text-white shadow-xl shadow-blue-950/10">
                    <div className="flex flex-wrap items-center justify-between gap-5">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">আজকের ক্লাস কন্ট্রোল</p>
                            <h2 className="mt-2 text-3xl font-black">টপিক, progress, quiz - এক জায়গায়</h2>
                            <p className="mt-2 max-w-2xl text-sm font-bold text-blue-100/75">বিষয় নির্বাচন করে lesson publish, student completion mark, quiz add এবং AI draft করতে পারবেন।</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">{teacherSubjects.length}</p><p className="text-xs font-bold text-blue-100/70">বিষয়</p></div>
                            <div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">{teacherLessons.length}</p><p className="text-xs font-bold text-blue-100/70">টপিক</p></div>
                            <div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">{teacherCompletionRate}%</p><p className="text-xs font-bold text-blue-100/70">সম্পন্ন</p></div>
                        </div>
                    </div>
                </section>
            )}
            {isStudentPortal && (
                <section className="rounded-[30px] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-100/60">
                    <div className="flex flex-wrap items-center justify-between gap-5">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-600">আমার পড়ার ডেস্ক</p>
                            <h2 className="mt-2 text-3xl font-black text-slate-950">{student?.student_name || 'শিক্ষার্থী preview'}</h2>
                            <p className="mt-2 max-w-2xl text-sm font-bold text-slate-500">{studentClass?.name || 'ক্লাস'}-এর lesson, quiz, result এবং AI help এখানে দেখাবে।</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-2xl bg-orange-50 p-4"><p className="text-2xl font-black text-orange-700">{studentLessons.length}</p><p className="text-xs font-bold text-orange-700/70">Lesson</p></div>
                            <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-2xl font-black text-emerald-700">{studentCompletedLessons}</p><p className="text-xs font-bold text-emerald-700/70">সম্পন্ন</p></div>
                            <div className="rounded-2xl bg-amber-50 p-4"><p className="text-2xl font-black text-amber-700">{studentPendingLessons}</p><p className="text-xs font-bold text-amber-700/70">বাকি</p></div>
                        </div>
                    </div>
                </section>
            )}
            {isStudentPortal && (
                <section className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">আজকের কাজ</h2>
                            <p className="mt-1 text-sm font-bold text-slate-500">শিক্ষক দেওয়া topic থেকে যেগুলো এখনো complete হয়নি।</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPortalTab('lessons')}
                            className="rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white"
                        >
                            সব topic দেখুন
                        </button>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {studentLessons.filter((lesson) => {
                            const progress = studentLessonProgress.find((item) => item.lesson_id === lesson.id);
                            return progress?.status !== 'completed';
                        }).slice(0, 4).map((lesson) => (
                            <article key={lesson.id} className="rounded-2xl bg-orange-50 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                                    {subjects.find((item) => item.id === lesson.subject_id)?.name || 'বিষয়'}
                                </p>
                                <h3 className="mt-2 font-black text-slate-900">{lesson.title}</h3>
                                {lesson.homework && <p className="mt-2 text-sm font-bold text-slate-600">কাজ: {lesson.homework}</p>}
                            </article>
                        ))}
                        {studentLessons.length === 0 && (
                            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">এখনো শিক্ষক কোনো topic publish করেননি।</p>
                        )}
                        {studentLessons.length > 0 && studentPendingLessons === 0 && (
                            <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">সব topic complete করা হয়েছে।</p>
                        )}
                    </div>
                </section>
            )}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { icon: Users, label: 'প্রতিষ্ঠান', value: institution?.name },
                    { icon: CalendarCheck, label: 'Attendance', value: 'চালু' },
                    { icon: BookOpenCheck, label: portalCopy.subjectLabel, value: 'চালু' },
                    { icon: Trophy, label: portalCopy.resultLabel, value: 'চালু' }
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${design.iconWrap}`}>
                            <Icon size={18} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-slate-400">{label}</p>
                        <p className="font-black text-slate-800">{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6">
                    <h2 className="text-xl font-black text-slate-900">দ্রুত কাজ</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {role === 'admin' && <Link href={`/school/${schoolId}/admin`} className="rounded-2xl bg-slate-900 px-4 py-4 font-black text-white">Admin dashboard</Link>}
                        {role === 'teacher' && (
                            <>
                                <span className={`rounded-2xl px-4 py-4 font-black ${design.badge}`}>আজকের lesson update</span>
                                <span className="rounded-2xl bg-slate-100 px-4 py-4 font-black text-slate-700">Attendance mark</span>
                            </>
                        )}
                        {role === 'student' && (
                            <>
                                <span className={`rounded-2xl px-4 py-4 font-black ${design.badge}`}>আমার ফলাফল</span>
                                <span className="rounded-2xl bg-slate-100 px-4 py-4 font-black text-slate-700">Homework status</span>
                            </>
                        )}
                        <a href={`http://${institution?.subdomain}.localhost:3000`} className="rounded-2xl bg-slate-100 px-4 py-4 font-black text-slate-700">Website</a>
                    </div>
                </section>
                <section className="rounded-[28px] border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2">
                        <Bell className={design.badge.split(' ')[1]} />
                        <h2 className="text-xl font-black text-slate-900">নোটিশ</h2>
                    </div>
                    <div className="mt-4 space-y-3">
                        {notices.length === 0 ? (
                            <p className="text-sm font-bold text-slate-400">কোনো নোটিশ নেই।</p>
                        ) : pagedNotices.map((notice) => (
                            <div key={notice.id} className="rounded-2xl bg-slate-50 p-4">
                                <p className="font-black text-slate-800">{notice.title}</p>
                            </div>
                        ))}
                    </div>
                    <Pagination page={portalNoticePage} totalItems={filteredPortalNotices.length} onPageChange={setPortalNoticePage} />
                </section>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {role === 'teacher' && [
                    { icon: ClipboardList, title: 'Lesson plan', text: 'আজ কোন topic পড়ানো হলো, কে complete করেছে।' },
                    { icon: CalendarCheck, title: 'Attendance', text: 'অনুপস্থিত শিক্ষার্থীর guardian-কে SMS।' },
                    { icon: Trophy, title: 'Result entry', text: 'পরীক্ষার নম্বর ও grade update।' }
                ].map(({ icon: Icon, title, text }) => (
                    <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${design.iconWrap}`}>
                            <Icon size={18} />
                        </div>
                        <h3 className="font-black text-slate-800">{title}</h3>
                        <p className="mt-2 text-sm font-bold text-slate-500">{text}</p>
                    </article>
                ))}
                {role === 'student' && [
                    { icon: GraduationCap, title: 'আমার অগ্রগতি', text: 'lesson completion ও attendance trend।' },
                    { icon: Trophy, title: 'ফলাফল', text: 'সর্বশেষ পরীক্ষার result summary।' },
                    { icon: ClipboardList, title: 'কাজ', text: 'অসম্পন্ন homework ও teacher note।' }
                ].map(({ icon: Icon, title, text }) => (
                    <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${design.iconWrap}`}>
                            <Icon size={18} />
                        </div>
                        <h3 className="font-black text-slate-800">{title}</h3>
                        <p className="mt-2 text-sm font-bold text-slate-500">{text}</p>
                    </article>
                ))}
            </div>
                </>
            )}

            {role === 'teacher' && portalTab !== 'dashboard' && (
                <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-5">
                        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
                            <h2 className="text-xl font-black text-slate-900">Class & subject</h2>
                            <p className="mt-1 text-sm font-bold text-slate-500">আগে class select করুন, তারপর ওই class-এর subject নিয়ে topic publish করুন।</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Class</span>
                                    <select
                                        value={selectedTeacherClassId}
                                        onChange={(event) => selectTeacherClass(event.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-800 outline-none focus:border-blue-400"
                                    >
                                        <option value="">Class select</option>
                                        {teacherClassOptions.map((classInfo) => (
                                            <option key={classInfo.id} value={classInfo.id}>{classInfo.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Subject</span>
                                    <select
                                        value={selectedTeacherSubject?.id || ''}
                                        onChange={(event) => {
                                            const subject = teacherSubjects.find((item) => item.id === event.target.value);
                                            if (subject) selectTeacherSubject(subject);
                                        }}
                                        disabled={!selectedTeacherClassId}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-800 outline-none focus:border-blue-400 disabled:text-slate-400"
                                    >
                                        <option value="">Subject select</option>
                                        {filteredTeacherSubjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                {teacherSubjects.length === 0 ? (
                                    <p className="text-sm font-bold text-slate-500">এখনো কোনো বিষয় assign করা হয়নি।</p>
                                ) : filteredTeacherSubjects.map((subject) => (
                                    <button
                                        key={subject.id}
                                        type="button"
                                        onClick={() => selectTeacherSubject(subject)}
                                        className={`rounded-2xl px-4 py-3 text-left font-black ${selectedTeacherSubject?.id === subject.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                                    >
                                        <span className="block">{subject.name}</span>
                                        <span className="mt-1 block text-xs opacity-70">
                                            {teacherClasses.find((item) => item.id === subject.class_id)?.name || '-'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {portalTab === 'lessons' && (
                        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Topic entry</h2>
                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                        {selectedTeacherSubject ? `${selectedTeacherClass?.name || ''} - ${selectedTeacherSubject.name}` : 'Class & subject select করলে topic add করা যাবে।'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openLessonModal()}
                                    disabled={!selectedTeacherSubject}
                                    className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 disabled:bg-slate-300 disabled:shadow-none"
                                >
                                    + নতুন topic
                                </button>
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <span className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">Manual title + rich description</span>
                                <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">Image দিলে AI draft</span>
                            </div>
                        </section>
                        )}

                        {lessonModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
                        <form onSubmit={createTeacherLesson} className="my-6 w-full max-w-3xl rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl shadow-slate-950/20">
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Plus size={18} className="text-emerald-700" />
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">{editingLesson ? 'Topic edit' : 'নতুন topic'}</h2>
                                        <p className="mt-1 text-sm font-bold text-slate-500">{selectedTeacherSubject?.name || 'Subject select করুন'}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={closeLessonModal} className="rounded-full bg-slate-100 p-2 text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="mb-4 flex items-center gap-2">
                                <Plus size={18} className="text-emerald-700" />
                                <h2 className="text-xl font-black text-slate-900">নতুন topic</h2>
                            </div>
                            <div className="mb-4 rounded-3xl bg-blue-50 p-4">
                                <p className="text-sm font-black text-blue-900">কীভাবে add করবেন</p>
                                <div className="mt-3 grid gap-2 text-xs font-bold text-blue-800">
                                    <p>1. Class এবং Subject select করুন।</p>
                                    <p>2. Manual হলে title, summary, homework লিখুন।</p>
                                    <p>3. AI হলে বই/বোর্ডের পরিষ্কার ছবি upload করুন, draft আসলে edit করুন।</p>
                                    <p>4. Publish করলে student portal ও guardian update-এ topic দেখা যাবে।</p>
                                </div>
                            </div>
                            <div className="mb-4 grid gap-2 sm:grid-cols-2">
                                <span className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">Manual topic entry</span>
                                <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">AI scan draft supported</span>
                            </div>
                            <p className="mb-4 text-sm font-bold text-slate-500">
                                {selectedTeacherSubject ? `${selectedTeacherClass?.name || ''} - ${selectedTeacherSubject.name}` : 'প্রথমে বিষয় নির্বাচন করুন'}
                            </p>
                            <div className="space-y-3">
                                <label className="block rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
                                    <span className="block">ছবি দিয়ে AI draft বানান</span>
                                    <span className="mt-1 block text-xs font-bold text-emerald-700">বইয়ের পৃষ্ঠা বা board-এর ছবি দিলে title, summary, homework আর quiz draft তৈরি হবে।</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => scanLessonImage(event.target.files)}
                                        className="mt-3 block w-full text-sm"
                                    />
                                    {lessonScanLoading && <span className="mt-2 block text-xs font-black">AI scan চলছে...</span>}
                                </label>
                                {lessonScanStatus && (
                                    <p className={`rounded-2xl p-3 text-sm font-bold ${lessonScanStatus.includes('সমস্যা') ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-800'}`}>
                                        {lessonScanStatus}
                                    </p>
                                )}
                                <input type="date" disabled={!selectedTeacherSubject} value={lessonForm.lesson_date} onChange={(e) => setLessonForm({ ...lessonForm, lesson_date: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700 disabled:bg-slate-100" />
                                <input required disabled={!selectedTeacherSubject} value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="আজকের topic" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                                <RichTextInput value={lessonForm.description} onChange={(value) => setLessonForm({ ...lessonForm, description: value })} placeholder="সংক্ষিপ্ত ব্যাখ্যা / মূল পয়েন্ট - Bold/Italic/List ব্যবহার করতে পারবেন" />
                                <RichTextInput value={lessonForm.homework} onChange={(value) => setLessonForm({ ...lessonForm, homework: value })} placeholder="হোমওয়ার্ক / practice" minHeight="min-h-24" />
                                <input value={lessonForm.resource_url} onChange={(e) => setLessonForm({ ...lessonForm, resource_url: e.target.value })} placeholder="ভিডিও বা resource link (optional)" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                                {aiResourceHint && (
                                    <p className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
                                        AI resource hint: {aiResourceHint}
                                    </p>
                                )}
                                <button disabled={!selectedTeacherSubject} className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white disabled:bg-slate-300">{editingLesson ? 'Topic update করুন' : 'Topic publish করুন'}</button>
                            </div>
                        </form>
                        </div>
                        )}
                    </div>

                    <div className="space-y-5">
                        {(portalTab === 'lessons' || portalTab === 'progress' || portalTab === 'quiz') && (
                        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Topic তালিকা</h2>
                                    <p className="mt-1 text-sm font-bold text-slate-500">যে topic নির্বাচন করবেন, তার progress নিচে দেখাবে।</p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{filteredTeacherLessons.length}/{teacherLessons.length} টি</span>
                            </div>
                            <input value={portalSearch.teacherLessons} onChange={(e) => setPortalSearchValue('teacherLessons', e.target.value)} placeholder="Topic/date/homework দিয়ে খুঁজুন" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                            <div className="mt-4 space-y-3">
                                {teacherLessons.length === 0 ? (
                                    <p className="text-sm font-bold text-slate-500">এখনো কোনো topic নেই।</p>
                                ) : pagedTeacherLessons.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className={`w-full rounded-2xl p-4 text-left ${selectedLesson?.id === lesson.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}
                                    >
                                        <button type="button" onClick={() => selectLesson(lesson)} className="w-full text-left">
                                            <p className="font-black">{lesson.title}</p>
                                            <p className="mt-1 text-sm font-bold opacity-70">{lesson.lesson_date}</p>
                                        </button>
                                        {canManageLesson(lesson) && (
                                            <div className="mt-3 flex gap-2">
                                                <button type="button" onClick={() => openLessonModal(lesson)} className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${selectedLesson?.id === lesson.id ? 'bg-white/10 text-white' : 'bg-white text-slate-700'}`}>
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button type="button" onClick={() => deleteTeacherLesson(lesson)} className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${selectedLesson?.id === lesson.id ? 'bg-rose-500/20 text-rose-100' : 'bg-rose-50 text-rose-700'}`}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Pagination page={teacherLessonPage} totalItems={filteredTeacherLessons.length} onPageChange={setTeacherLessonPage} />
                        </section>
                        )}

                        {portalTab === 'lessons' && selectedLesson && (
                        <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">এই topic-এর student mark</h2>
                                    <p className="mt-1 text-sm font-bold text-slate-500">{selectedLesson.title}</p>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                    {completedCount}/{teacherStudents.length} complete
                                </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button type="button" onClick={() => markAllTeacherLessonProgress('completed')} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">সবাই complete</button>
                                <button type="button" onClick={() => markAllTeacherLessonProgress('not_completed')} className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">সবাই not complete</button>
                                <button type="button" onClick={sendLessonFollowupSms} disabled={lessonSmsSending} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                                    {lessonSmsSending ? 'SMS queue হচ্ছে...' : 'বাকি guardian SMS'}
                                </button>
                            </div>
                            {lessonSmsStatus && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{lessonSmsStatus}</p>}
                            <input value={portalSearch.teacherStudents} onChange={(e) => setPortalSearchValue('teacherStudents', e.target.value)} placeholder="Student name/roll দিয়ে খুঁজুন" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {teacherStudents.length === 0 ? (
                                    <p className="text-sm font-bold text-slate-500">এই class-এ student নেই।</p>
                                ) : pagedTeacherStudents.map((item) => {
                                    const progress = lessonProgress.find((row) => row.student_id === item.id);
                                    return (
                                        <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                                            <p className="font-black text-slate-900">{item.student_name}</p>
                                            <p className="text-xs font-bold text-slate-500">Roll {item.roll_no || '-'}</p>
                                            <div className="mt-3 flex gap-2">
                                                <button type="button" onClick={() => markTeacherLessonProgress(item.id, 'completed')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-black ${progress?.status === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}>Complete</button>
                                                <button type="button" onClick={() => markTeacherLessonProgress(item.id, 'not_completed')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-black ${progress?.status === 'not_completed' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'}`}>Not</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <Pagination page={teacherStudentPage} totalItems={filteredTeacherStudents.length} onPageChange={setTeacherStudentPage} />
                        </section>
                        )}

                        {portalTab === 'progress' && (
                        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Completion tracking</h2>
                                    <p className="mt-1 text-sm font-bold text-slate-500">{selectedLesson?.title || 'Topic নির্বাচন করুন'}</p>
                                </div>
                                {selectedLesson && (
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                        {completedCount}/{teacherStudents.length} complete
                                    </span>
                                )}
                            </div>
                            {selectedLesson && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => markAllTeacherLessonProgress('completed')} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">সবাই complete</button>
                                    <button type="button" onClick={() => markAllTeacherLessonProgress('not_completed')} className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">সবাই not complete</button>
                                    <button type="button" onClick={sendLessonFollowupSms} disabled={lessonSmsSending} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                                        {lessonSmsSending ? 'SMS queue হচ্ছে...' : 'বাকি guardian SMS'}
                                    </button>
                                </div>
                            )}
                            {lessonSmsStatus && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{lessonSmsStatus}</p>}
                            <input value={portalSearch.teacherStudents} onChange={(e) => setPortalSearchValue('teacherStudents', e.target.value)} placeholder="Student name/roll দিয়ে খুঁজুন" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                            <div className="mt-4 space-y-3">
                                {!selectedLesson ? (
                                    <p className="text-sm font-bold text-slate-500">প্রথমে topic নির্বাচন করুন।</p>
                                ) : pagedTeacherStudents.map((item) => {
                                    const progress = lessonProgress.find((row) => row.student_id === item.id);
                                    return (
                                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                                            <div>
                                                <p className="font-black text-slate-900">{item.student_name}</p>
                                                <p className="text-xs font-bold text-slate-500">রোল {item.roll_no || '-'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => markTeacherLessonProgress(item.id, 'completed')} className={`rounded-xl px-3 py-2 text-sm font-black ${progress?.status === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}>Complete</button>
                                                <button type="button" onClick={() => markTeacherLessonProgress(item.id, 'not_completed')} className={`rounded-xl px-3 py-2 text-sm font-black ${progress?.status === 'not_completed' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'}`}>Not complete</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <Pagination page={teacherStudentPage} totalItems={filteredTeacherStudents.length} onPageChange={setTeacherStudentPage} />
                        </section>
                        )}

                        {portalTab === 'quiz' && (
                        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900">Topic quiz</h2>
                            {!selectedLesson ? (
                                <p className="mt-3 text-sm font-bold text-slate-500">প্রথমে topic নির্বাচন করুন।</p>
                            ) : !lessonQuiz ? (
                                <div className="mt-4 space-y-3">
                                    <form onSubmit={createQuiz} className="space-y-3">
                                        <input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Quiz title" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                                        <input type="number" value={quizForm.passing_score} onChange={(e) => setQuizForm({ ...quizForm, passing_score: e.target.value })} placeholder="Passing score" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
                                        <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">Quiz তৈরি করুন</button>
                                    </form>
                                    {aiQuizDrafts.length > 0 && (
                                        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-4">
                                            <p className="font-black text-indigo-900">AI quiz draft প্রস্তুত</p>
                                            <p className="mt-1 text-sm font-bold text-indigo-700">{aiQuizDrafts.length} টি প্রশ্ন তৈরি হয়েছে।</p>
                                            <button type="button" onClick={addAiQuizDrafts} className="mt-3 rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-black text-white">
                                                Quiz বানিয়ে AI প্রশ্ন যোগ করুন
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="font-black text-slate-900">{lessonQuiz.title}</p>
                                        <p className="mt-1 text-sm font-bold text-slate-500">Pass: {lessonQuiz.passing_score}% · {quizQuestions.length} প্রশ্ন</p>
                                    </div>
                                    <form onSubmit={createQuizQuestion} className="space-y-3">
                                        <textarea required value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} placeholder="প্রশ্ন" className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <input required value={questionForm.option_a} onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })} placeholder="Option A" className="rounded-2xl border border-slate-200 px-4 py-3" />
                                            <input required value={questionForm.option_b} onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })} placeholder="Option B" className="rounded-2xl border border-slate-200 px-4 py-3" />
                                            <input value={questionForm.option_c} onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })} placeholder="Option C" className="rounded-2xl border border-slate-200 px-4 py-3" />
                                            <input value={questionForm.option_d} onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })} placeholder="Option D" className="rounded-2xl border border-slate-200 px-4 py-3" />
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <select value={questionForm.correct_option} onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3">
                                                <option value="a">Correct: A</option>
                                                <option value="b">Correct: B</option>
                                                <option value="c">Correct: C</option>
                                                <option value="d">Correct: D</option>
                                            </select>
                                            <input value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} placeholder="Explanation (optional)" className="rounded-2xl border border-slate-200 px-4 py-3" />
                                        </div>
                                        <button className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white">প্রশ্ন যোগ করুন</button>
                                    </form>
                                    {aiQuizDrafts.length > 0 && (
                                        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-4">
                                            <p className="font-black text-indigo-900">AI quiz draft প্রস্তুত</p>
                                            <p className="mt-1 text-sm font-bold text-indigo-700">{aiQuizDrafts.length} টি প্রশ্ন তৈরি হয়েছে। দেখে নিয়ে quiz-এ যোগ করতে পারেন।</p>
                                            <button type="button" onClick={addAiQuizDrafts} className="mt-3 rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-black text-white">
                                                AI প্রশ্নগুলো যোগ করুন
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                        )}
                    </div>
                </div>
            )}

            {role === 'student' && portalTab !== 'dashboard' && (
                <div className="space-y-5">
                    {portalTab === 'lessons' && (
                    <section className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">আমার class topic desk</h2>
                                <p className="mt-1 text-sm font-bold text-slate-500">
                                    {studentClass?.name || 'Class'}-এর teacher assigned topic এখানে পড়া, quiz দেওয়া, AI help নেওয়া এবং পড়েছি mark করা যাবে।
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{filteredStudentLessons.length}/{studentLessons.length} topic</span>
                        </div>
                        <input value={portalSearch.studentLessons} onChange={(e) => setPortalSearchValue('studentLessons', e.target.value)} placeholder="Topic/homework/date দিয়ে খুঁজুন" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedStudentSubjectId('');
                                    setStudentLessonPage(1);
                                }}
                                className={`rounded-full px-4 py-2 text-sm font-black ${!selectedStudentSubjectId ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'}`}
                            >
                                সব subject
                            </button>
                            {subjects.map((subject) => (
                                <button
                                    key={subject.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedStudentSubjectId(subject.id);
                                        setStudentLessonPage(1);
                                    }}
                                    className={`rounded-full px-4 py-2 text-sm font-black ${selectedStudentSubjectId === subject.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                                >
                                    {subject.name}
                                </button>
                            ))}
                        </div>
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            {!student ? (
                                <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">এই login-এর সাথে student profile link করা নেই। Admin থেকে student profile link করুন।</p>
                            ) : visibleStudentLessons.length === 0 ? (
                                <p className="text-sm font-bold text-slate-500">এই class/subject-এ এখনো কোনো topic publish হয়নি।</p>
                            ) : pagedStudentLessons.map((lesson) => {
                                const progress = studentLessonProgress.find((item) => item.lesson_id === lesson.id);
                                const subjectName = subjects.find((item) => item.id === lesson.subject_id)?.name || 'Subject';
                                return (
                                    <article key={lesson.id} className="rounded-2xl bg-slate-50 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{subjectName}</p>
                                                <p className="mt-1 text-xs font-black text-slate-400">{lesson.lesson_date}</p>
                                                <h3 className="mt-1 text-lg font-black text-slate-900">{lesson.title}</h3>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-black ${
                                                progress?.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : progress?.status === 'not_completed'
                                                        ? 'bg-rose-50 text-rose-700'
                                                        : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {progress?.status === 'completed'
                                                    ? 'Complete'
                                                    : progress?.status === 'not_completed'
                                                        ? 'Not complete'
                                                        : 'Pending'}
                                            </span>
                                        </div>
                                        {lesson.description && <div className="mt-3 text-sm font-bold leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: richTextToHtml(lesson.description) }} />}
                                        {lesson.homework && (
                                            <div className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold leading-7 text-slate-700">
                                                <span className="font-black">কাজ: </span>
                                                <span dangerouslySetInnerHTML={{ __html: richTextToHtml(lesson.homework) }} />
                                            </div>
                                        )}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => markStudentLessonProgress(lesson.id, 'completed')}
                                                className={`rounded-2xl px-4 py-2 text-sm font-black ${progress?.status === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}
                                            >
                                                পড়েছি
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => markStudentLessonProgress(lesson.id, 'not_completed')}
                                                className={`rounded-2xl px-4 py-2 text-sm font-black ${progress?.status === 'not_completed' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'}`}
                                            >
                                                বুঝিনি / বাকি
                                            </button>
                                        </div>
                                        {lesson.resource_url && (
                                            <a href={lesson.resource_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                                                Resource দেখুন
                                            </a>
                                        )}
                                        {studentQuizMap[lesson.id] && (
                                            <div className="mt-4 rounded-2xl bg-white p-4">
                                                <p className="font-black text-slate-900">{studentQuizMap[lesson.id].title}</p>
                                                {studentAttemptMap[studentQuizMap[lesson.id].id] ? (
                                                    <div className="mt-2">
                                                        <p className={`text-sm font-black ${studentAttemptMap[studentQuizMap[lesson.id].id].passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            Score {studentAttemptMap[studentQuizMap[lesson.id].id].score}% · {studentAttemptMap[studentQuizMap[lesson.id].id].passed ? 'Passed' : 'Needs revision'}
                                                        </p>
                                                        {!studentAttemptMap[studentQuizMap[lesson.id].id].passed && (
                                                            <button
                                                                type="button"
                                                                onClick={() => requestStudentHelp(lesson, 'revision')}
                                                                className="mt-3 rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700"
                                                            >
                                                                Revision help নিন
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 space-y-4">
                                                        {(studentQuestionMap[studentQuizMap[lesson.id].id] || []).map((question) => (
                                                            <div key={question.id}>
                                                                <p className="font-bold text-slate-800">{question.question_text}</p>
                                                                <div className="mt-2 grid gap-2">
                                                                    {[
                                                                        ['a', question.option_a],
                                                                        ['b', question.option_b],
                                                                        ['c', question.option_c],
                                                                        ['d', question.option_d]
                                                                    ].filter(([, label]) => label).map(([value, label]) => (
                                                                        <label key={value} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                                                                            <input
                                                                                type="radio"
                                                                                name={`${studentQuizMap[lesson.id].id}-${question.id}`}
                                                                                checked={studentAnswers[studentQuizMap[lesson.id].id]?.[question.id] === value}
                                                                                onChange={() => setStudentAnswers((current) => ({
                                                                                    ...current,
                                                                                    [studentQuizMap[lesson.id].id]: {
                                                                                        ...(current[studentQuizMap[lesson.id].id] || {}),
                                                                                        [question.id]: value
                                                                                    }
                                                                                }))}
                                                                            />
                                                                            {label}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => submitStudentQuiz(studentQuizMap[lesson.id])}
                                                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white"
                                                        >
                                                            Quiz জমা দিন
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                            <p className="font-black text-slate-900">AI help</p>
                                            <p className="mt-1 text-sm font-bold text-slate-500">না বুঝলে নিজের প্রশ্ন লিখে সহজ ব্যাখ্যা নিন।</p>
                                            <div className="mt-3 space-y-3">
                                                <textarea
                                                    value={studentHelpQuestions[lesson.id] || ''}
                                                    onChange={(event) => setStudentHelpQuestions((current) => ({
                                                        ...current,
                                                        [lesson.id]: event.target.value
                                                    }))}
                                                    placeholder="যেমন: এই অংকটা ধাপে ধাপে বুঝিয়ে দিন"
                                                    className="min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => requestStudentHelp(lesson)}
                                                    className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white"
                                                >
                                                    {studentHelpLoading[lesson.id] ? 'AI ভাবছে...' : 'AI help নিন'}
                                                </button>
                                            </div>
                                            {studentHelpMap[lesson.id] && (
                                                <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                                                    <h4 className="font-black text-slate-900">{studentHelpMap[lesson.id].title}</h4>
                                                    <p className="text-sm font-bold text-slate-700">{studentHelpMap[lesson.id].answer}</p>
                                                    {studentHelpMap[lesson.id].steps?.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-black text-slate-500">ধাপ</p>
                                                            <ol className="mt-2 space-y-1 text-sm font-bold text-slate-700">
                                                                {studentHelpMap[lesson.id].steps.map((step, index) => (
                                                                    <li key={step}>{index + 1}. {step}</li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}
                                                    {studentHelpMap[lesson.id].practice?.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-black text-slate-500">Practice</p>
                                                            <ul className="mt-2 space-y-1 text-sm font-bold text-slate-700">
                                                                {studentHelpMap[lesson.id].practice.map((item) => (
                                                                    <li key={item}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {studentHelpMap[lesson.id].encouragement && (
                                                        <p className="text-sm font-black text-emerald-700">{studentHelpMap[lesson.id].encouragement}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <Pagination page={studentLessonPage} totalItems={filteredStudentLessons.length} onPageChange={setStudentLessonPage} />
                    </section>
                    )}

                    {portalTab === 'notices' && (
                    <section className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">নোটিশ বোর্ড</h2>
                                <p className="mt-1 text-sm font-bold text-slate-500">School theke published notice ekhane dekhabe.</p>
                            </div>
                            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">{filteredPortalNotices.length}/{notices.length} notice</span>
                        </div>
                        <input value={portalSearch.notices} onChange={(e) => setPortalSearchValue('notices', e.target.value)} placeholder="Notice title/body দিয়ে খুঁজুন" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {notices.length === 0 ? (
                                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">এখনো কোনো notice নেই।</p>
                            ) : pagedNotices.map((notice) => (
                                <article key={notice.id} className="rounded-2xl bg-orange-50 p-4">
                                    <p className="font-black text-slate-900">{notice.title}</p>
                                    {notice.body && <p className="mt-2 text-sm font-bold text-slate-600">{notice.body}</p>}
                                </article>
                            ))}
                        </div>
                        <Pagination page={portalNoticePage} totalItems={filteredPortalNotices.length} onPageChange={setPortalNoticePage} />
                    </section>
                    )}

                    {portalTab === 'result' && (
                    <section className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">আমার ফলাফল</h2>
                                <p className="mt-1 text-sm font-bold text-slate-500">
                                    {student ? `${student.student_name} - ${studentClass?.name || ''}` : 'এই লগইনের সাথে এখনো কোনো শিক্ষার্থী যুক্ত করা হয়নি।'}
                                </p>
                            </div>
                            {publishedExams.length > 0 && (
                                <select
                                    value={selectedExam?.id || ''}
                                    onChange={async (event) => {
                                        const exam = publishedExams.find((item) => item.id === event.target.value);
                                        setSelectedExam(exam || null);
                                        setExamEntries(exam ? await schoolService.getExamEntries(exam.id) : []);
                                    }}
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700"
                                >
                                    {publishedExams.map((exam) => (
                                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {!student && (
                            <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
                                Admin portal থেকে এই user-কে student record-এর সাথে link করলে এখানে ফলাফল দেখা যাবে।
                            </p>
                        )}
                        {student && publishedExams.length === 0 && (
                            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                এখনো কোনো published result নেই।
                            </p>
                        )}
                        {studentSummary && (
                            <div className="mt-5 grid gap-4 md:grid-cols-4">
                                {[
                                    ['মোট', `${studentSummary.obtainedTotal}/${studentSummary.totalMarks}`],
                                    ['শতাংশ', studentSummary.percentage === null ? '-' : `${studentSummary.percentage.toFixed(2)}%`],
                                    ['গ্রেড', studentSummary.overallGrade || '-'],
                                    ['র‍্যাংক', studentSummary.rank || '-']
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs font-bold text-slate-500">{label}</p>
                                        <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                    )}

                    {portalTab === 'result' && studentSummary?.complete && (
                        <StudentReportCard
                            institution={institution}
                            student={student}
                            exam={selectedExam}
                            classInfo={studentClass}
                            summary={studentSummary}
                        />
                    )}
                </div>
            )}
                    </div>
                </main>
            </div>
        </div>
    );
}
