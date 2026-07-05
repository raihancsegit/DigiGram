'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Bell,
    BookOpenCheck,
    CalendarCheck,
    ClipboardList,
    ExternalLink,
    GraduationCap,
    House,
    Loader2,
    Megaphone,
    Plus,
    Search,
    Settings2,
    ShieldCheck,
    UserPlus,
    Users
} from 'lucide-react';
import { schoolService } from '@/lib/services/schoolService';
import { smsService } from '@/lib/services/smsService';
import { institutionPortalService } from '@/lib/services/institutionPortalService';
import { institutionService } from '@/lib/services/institutionService';
import { adminService } from '@/lib/services/adminService';
import InstitutionWebsiteManager from '@/components/sections/institution/InstitutionWebsiteManager';
import { buildAcademicClassPlan } from '@/lib/constants/academicStructure';
import { getInstitutionProfile } from '@/lib/constants/institutionProfiles';
import { buildExamResultSummaries, calculateGrade } from '@/lib/constants/grading';

const PAGE_SIZE = 8;

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

function slugEmail(value = 'demo') {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 40) || 'demo';
}

function Pagination({ page, totalItems, onPageChange, pageSize = PAGE_SIZE }) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems <= pageSize) return null;
    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-black text-slate-500">Page {page} / {totalPages}</p>
            <div className="flex gap-2">
                <button type="button" onClick={() => onPageChange(clampPage(page - 1, totalItems, pageSize))} disabled={page <= 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">Prev</button>
                <button type="button" onClick={() => onPageChange(clampPage(page + 1, totalItems, pageSize))} disabled={page >= totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">Next</button>
            </div>
        </div>
    );
}

export default function SchoolAdminClient({ schoolId }) {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examEntries, setExamEntries] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classForm, setClassForm] = useState({ name: '', academic_year: new Date().getFullYear(), section: '' });
    const [studentForm, setStudentForm] = useState({
        student_name: '',
        roll_no: '',
        guardian_name: '',
        guardian_phone: '',
        household_id: '',
        resident_id: '',
        source_label: ''
    });
    const [householdSearch, setHouseholdSearch] = useState('');
    const [householdResults, setHouseholdResults] = useState([]);
    const [householdSearching, setHouseholdSearching] = useState(false);
    const [householdSearchError, setHouseholdSearchError] = useState('');
    const [subjectForm, setSubjectForm] = useState({ name: '', teacher_id: '' });
    const [teacherForm, setTeacherForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: 'password123',
        title: ''
    });
    const [examForm, setExamForm] = useState({
        name: '',
        exam_date: new Date().toISOString().split('T')[0]
    });
    const [lessonTitle, setLessonTitle] = useState('');
    const [activeLesson, setActiveLesson] = useState(null);
    const [pageData, setPageData] = useState(null);
    const [notices, setNotices] = useState([]);
    const [noticeForm, setNoticeForm] = useState({ title: '', body: '', audience: 'public', is_pinned: false });
    const [editingNoticeId, setEditingNoticeId] = useState('');
    const [admissionApplications, setAdmissionApplications] = useState([]);
    const [institution, setInstitution] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [creatingDefaultClasses, setCreatingDefaultClasses] = useState(false);
    const [seedingDemo, setSeedingDemo] = useState(false);
    const [seedResult, setSeedResult] = useState(null);
    const [seedError, setSeedError] = useState('');
    const [listPages, setListPages] = useState({
        classes: 1,
        students: 1,
        teachers: 1,
        subjects: 1,
        exams: 1,
        attendance: 1,
        resultRank: 1,
        resultIncomplete: 1,
        notices: 1,
        admissions: 1
    });
    const [listSearch, setListSearch] = useState({
        classes: '',
        students: '',
        teachers: '',
        subjects: '',
        exams: '',
        attendance: '',
        notices: '',
        admissions: ''
    });
    const resultSummaries = useMemo(
        () => buildExamResultSummaries(students, subjects, examEntries),
        [students, subjects, examEntries]
    );
    const completeResultSummaries = resultSummaries.filter((item) => item.complete);
    const passedResultSummaries = completeResultSummaries.filter((item) => item.passed);
    const failedResultSummaries = completeResultSummaries.filter((item) => item.passed === false);
    const incompleteResultSummaries = resultSummaries.filter((item) => !item.complete);
    const rankedResultSummaries = [...completeResultSummaries].sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

    useEffect(() => {
        async function load() {
            try {
                const [membership, currentRole, institutionData] = await Promise.all([
                    institutionPortalService.getMembership(schoolId, 'admin'),
                    institutionPortalService.getCurrentRole(),
                    institutionService.getInstitutionById(schoolId)
                ]);
                if (!membership && currentRole !== 'super_admin') {
                    setInstitution({ accessDenied: true });
                    return;
                }
                const [classRows, teacherRows, noticeRows, admissionRows] = await Promise.all([
                    schoolService.getClasses(schoolId),
                    institutionPortalService.getMembers(schoolId, 'teacher', true),
                    institutionPortalService.getNotices(schoolId),
                    institutionPortalService.getAdmissionApplications(schoolId)
                ]);
                setClasses(classRows);
                setTeachers(teacherRows);
                setNotices(noticeRows);
                setAdmissionApplications(admissionRows);
                setInstitution(institutionData);
                setPageData(await institutionPortalService.getPage(schoolId));
                if (classRows[0]) {
                    setSelectedClass(classRows[0]);
                    const [studentRows, subjectRows] = await Promise.all([
                        schoolService.getStudents(classRows[0].id),
                        schoolService.getSubjects(schoolId, classRows[0].id)
                    ]);
                    setStudents(studentRows);
                    setSubjects(subjectRows);
                    const examRows = await schoolService.getExams(schoolId, classRows[0].id);
                    setExams(examRows);
                    if (examRows[0]) {
                        setSelectedExam(examRows[0]);
                        setExamEntries(await schoolService.getExamEntries(examRows[0].id));
                    }
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [schoolId]);

    useEffect(() => {
        const requestedTab = new URLSearchParams(window.location.search).get('tab');
        if (requestedTab) setActiveTab(requestedTab);
    }, []);

    async function createClass(event) {
        event.preventDefault();
        const created = await schoolService.createClass({
            institution_id: schoolId,
            ...classForm,
            academic_year: Number(classForm.academic_year)
        });
        setClasses((current) => [created, ...current]);
        setSelectedClass(created);
        setStudents([]);
        setClassForm({ name: '', academic_year: new Date().getFullYear(), section: '' });
    }

    async function createDefaultClasses() {
        setCreatingDefaultClasses(true);
        try {
            const academicYear = new Date().getFullYear();
            await schoolService.createDefaultClasses(
                schoolId,
                academicYear,
                institution?.operational_settings || {}
            );
            const nextClasses = await schoolService.getClasses(schoolId);
            setClasses(nextClasses);
            if (!selectedClass && nextClasses[0]) {
                setSelectedClass(nextClasses[0]);
                setStudents(await schoolService.getStudents(nextClasses[0].id));
            }
        } finally {
            setCreatingDefaultClasses(false);
        }
    }

    async function createStudent(event) {
        event.preventDefault();
        const created = await schoolService.createStudent({
            institution_id: schoolId,
            class_id: selectedClass.id,
            class_name: selectedClass.name,
            student_name: studentForm.student_name,
            roll_no: studentForm.roll_no,
            guardian_name: studentForm.guardian_name,
            guardian_phone: studentForm.guardian_phone,
            household_id: studentForm.household_id || null,
            resident_id: studentForm.resident_id || null,
            enrollment_source: studentForm.resident_id ? 'household_profile' : 'school_admin',
            enrollment_status: 'studying'
        });
        setStudents((current) => [...current, created]);
        setStudentForm({
            student_name: '',
            roll_no: '',
            guardian_name: '',
            guardian_phone: '',
            household_id: '',
            resident_id: '',
            source_label: ''
        });
    }

    async function searchHouseholdMembers(event) {
        event.preventDefault();
        const query = householdSearch.trim();
        if (query.length < 2) return;
        setHouseholdSearching(true);
        setHouseholdSearchError('');
        try {
            const rows = await schoolService.searchHouseholdMembers(schoolId, query);
            setHouseholdResults(rows);
        } catch (error) {
            setHouseholdSearchError(error.message || 'Home member search failed');
            setHouseholdResults([]);
        } finally {
            setHouseholdSearching(false);
        }
    }

    function selectHouseholdMember(household, resident) {
        setStudentForm((current) => ({
            ...current,
            student_name: resident.name || resident.legal_name || '',
            guardian_name: household.owner_name || current.guardian_name,
            guardian_phone: household.guardian_phone || resident.phone || current.guardian_phone,
            household_id: household.id,
            resident_id: resident.id,
            source_label: [
                household.house_no && `House ${household.house_no}`,
                household.owner_name,
                resident.age !== null && resident.age !== undefined ? `${resident.age}y` : ''
            ].filter(Boolean).join(' · ')
        }));
    }

    function clearHouseholdSelection() {
        setStudentForm((current) => ({
            ...current,
            household_id: '',
            resident_id: '',
            source_label: ''
        }));
    }

    async function createSubject(event) {
        event.preventDefault();
        const created = await schoolService.createSubject({
            institution_id: schoolId,
            class_id: selectedClass.id,
            name: subjectForm.name,
            teacher_id: subjectForm.teacher_id || null
        });
        setSubjects((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        setSubjectForm({ name: '', teacher_id: '' });
    }

    async function deleteSubject(subjectId) {
        await schoolService.deleteSubject(subjectId);
        setSubjects((current) => current.filter((item) => item.id !== subjectId));
    }

    async function updateSubjectTeacher(subjectId, teacherId) {
        const updated = await schoolService.updateSubject(subjectId, {
            teacher_id: teacherId || null
        });
        setSubjects((current) => current.map((item) => item.id === subjectId ? updated : item));
    }

    async function createTeacher(event) {
        event.preventDefault();
        const created = await adminService.quickCreateChairman({
            email: teacherForm.email,
            password: teacherForm.password,
            first_name: teacherForm.first_name,
            last_name: teacherForm.last_name,
            phone: teacherForm.phone,
            role: 'teacher',
            access_scope_id: institution?.village_location_id || institution?.location_id || null
        });
        const displayName = `${teacherForm.first_name} ${teacherForm.last_name}`.trim();
        const membership = await institutionPortalService.addMembership({
            institution_id: schoolId,
            profile_id: created.data.id,
            member_role: 'teacher',
            title: teacherForm.title || portalCopy.subjectLabel,
            display_name: displayName,
            is_active: true
        });
        setTeachers((current) => [...current, membership].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || '')));
        setTeacherForm({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            password: 'password123',
            title: ''
        });
    }

    async function createExam(event) {
        event.preventDefault();
        const created = await schoolService.createExam({
            institution_id: schoolId,
            class_id: selectedClass.id,
            ...examForm
        });
        setExams((current) => [created, ...current]);
        setSelectedExam(created);
        setExamEntries([]);
        setExamForm({
            name: '',
            exam_date: new Date().toISOString().split('T')[0]
        });
    }

    function updateExamEntry(studentId, subjectId, value) {
        const obtainedMarks = value === '' ? '' : Number(value);
        const current = examEntries.find((item) => item.student_id === studentId && item.subject_id === subjectId);
        const totalMarks = current?.total_marks || 100;
        const nextEntry = {
            exam_id: selectedExam.id,
            institution_id: schoolId,
            class_id: selectedClass.id,
            student_id: studentId,
            subject_id: subjectId,
            total_marks: totalMarks,
            obtained_marks: obtainedMarks === '' ? null : obtainedMarks,
            grade: obtainedMarks === '' ? null : calculateGrade(obtainedMarks, totalMarks)
        };
        setExamEntries((currentEntries) => {
            const exists = currentEntries.some((item) => item.student_id === studentId && item.subject_id === subjectId);
            return exists
                ? currentEntries.map((item) => item.student_id === studentId && item.subject_id === subjectId ? { ...item, ...nextEntry } : item)
                : [...currentEntries, nextEntry];
        });
    }

    async function saveExamEntries() {
        await schoolService.upsertExamEntries(examEntries);
        const nextEntries = await schoolService.getExamEntries(selectedExam.id);
        setExamEntries(nextEntries);
        return nextEntries;
    }

    async function publishExam() {
        const savedEntries = await saveExamEntries();
        const updated = await schoolService.publishExam(selectedExam.id);
        setSelectedExam(updated);
        setExams((current) => current.map((item) => item.id === updated.id ? updated : item));

        const publishedSummaries = buildExamResultSummaries(students, subjects, savedEntries);
        const smsJobs = publishedSummaries
            .filter((item) => item.complete && item.student.guardian_phone)
            .map((item) => smsService.queueMessage({
                ownerType: 'institution',
                ownerId: schoolId,
                recipientPhone: item.student.guardian_phone,
                message: `DigiGram School: ${item.student.student_name} এর ${selectedExam.name} ফলাফল প্রকাশিত হয়েছে। মোট ${item.obtainedTotal}/${item.totalMarks}, গ্রেড ${item.overallGrade}.`,
                category: 'school_result_published',
                sourceType: 'school_exam',
                sourceId: selectedExam.id
            }));

        await Promise.allSettled(smsJobs);
    }

    async function toggleTeacher(member) {
        const updated = await institutionPortalService.updateMembership(member.id, {
            is_active: !member.is_active
        });
        setTeachers((current) => current.map((item) => item.id === member.id ? updated : item));
    }

    async function seedDemoSchool() {
        setSeedingDemo(true);
        setSeedError('');
        try {
            const result = await adminService.seedSchoolDemo(schoolId);
            setSeedResult(result);
            const [classRows, teacherRows, noticeRows, nextPageData] = await Promise.all([
                schoolService.getClasses(schoolId),
                institutionPortalService.getMembers(schoolId, 'teacher', true),
                institutionPortalService.getNotices(schoolId),
                institutionPortalService.getPage(schoolId)
            ]);
            setClasses(classRows);
            setTeachers(teacherRows);
            setNotices(noticeRows);
            setPageData(nextPageData);
            if (classRows[0]) {
                setSelectedClass(classRows[0]);
                const [studentRows, subjectRows, examRows] = await Promise.all([
                    schoolService.getStudents(classRows[0].id),
                    schoolService.getSubjects(schoolId, classRows[0].id),
                    schoolService.getExams(schoolId, classRows[0].id)
                ]);
                setStudents(studentRows);
                setSubjects(subjectRows);
                setExams(examRows);
                setSelectedExam(examRows[0] || null);
                setExamEntries(examRows[0] ? await schoolService.getExamEntries(examRows[0].id) : []);
            }
            setListPages({
                classes: 1,
                students: 1,
                teachers: 1,
                subjects: 1,
                exams: 1,
                attendance: 1,
                resultRank: 1,
                resultIncomplete: 1,
                notices: 1,
                admissions: 1
            });
        } catch (error) {
            setSeedError(error.message || 'Demo data তৈরি করতে সমস্যা হয়েছে');
        } finally {
            setSeedingDemo(false);
        }
    }

    async function markAttendance(student, status) {
        await schoolService.markAttendance({
            institution_id: schoolId,
            class_id: selectedClass.id,
            student_id: student.id,
            attendance_date: new Date().toISOString().split('T')[0],
            status
        });
        if (status === 'absent' && student.guardian_phone) {
            await smsService.queueMessage({
                ownerType: 'institution',
                ownerId: schoolId,
                recipientPhone: student.guardian_phone,
                message: `DigiGram School: ${student.student_name} আজ অনুপস্থিত ছিল।`,
                category: 'school_absence',
                sourceType: 'school_student',
                sourceId: student.id
            });
        }
    }

    async function createLesson(event) {
        event.preventDefault();
        const created = await schoolService.createLesson({
            institution_id: schoolId,
            class_id: selectedClass.id,
            title: lessonTitle,
            lesson_date: new Date().toISOString().split('T')[0]
        });
        setActiveLesson(created);
        setLessonTitle('');
    }

    async function publishNotice(event) {
        event.preventDefault();
        const saved = editingNoticeId
            ? await institutionPortalService.updateNotice(editingNoticeId, noticeForm)
            : await institutionPortalService.createNotice({
                institution_id: schoolId,
                ...noticeForm
            });
        setNotices((current) => editingNoticeId
            ? current.map((item) => item.id === editingNoticeId ? saved : item)
            : [saved, ...current]);
        setListPage('notices', 1);
        setEditingNoticeId('');
        setNoticeForm({ title: '', body: '', audience: 'public', is_pinned: false });
    }

    function startNoticeEdit(notice) {
        setEditingNoticeId(notice.id);
        setNoticeForm({
            title: notice.title || '',
            body: notice.body || '',
            audience: notice.audience || 'public',
            is_pinned: Boolean(notice.is_pinned)
        });
    }

    async function removeNotice(noticeId) {
        await institutionPortalService.deleteNotice(noticeId);
        setNotices((current) => current.filter((item) => item.id !== noticeId));
        if (editingNoticeId === noticeId) {
            setEditingNoticeId('');
            setNoticeForm({ title: '', body: '', audience: 'public', is_pinned: false });
        }
    }

    async function updateAdmissionStatus(application, status) {
        const updated = await institutionPortalService.updateAdmissionApplication(application.id, { status });
        setAdmissionApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
    }

    if (loading) return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-emerald-700" /></div>;
    if (institution?.accessDenied) {
        return (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center">
                <h1 className="text-2xl font-black text-rose-700">এই প্রতিষ্ঠানের admin access আপনার নেই</h1>
            </div>
        );
    }

    const profile = getInstitutionProfile(institution?.category);
    const portalCopy = profile.portal;
    const tabs = [
        { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: House },
        { id: 'attendance', label: 'উপস্থিতি', icon: ClipboardList },
        { id: 'students', label: portalCopy.studentLabel, icon: GraduationCap },
        { id: 'teachers', label: 'শিক্ষক', icon: Users },
        { id: 'classes', label: portalCopy.classLabel, icon: BookOpenCheck },
        { id: 'subjects', label: portalCopy.subjectLabel, icon: BookOpenCheck },
        { id: 'results', label: portalCopy.resultLabel, icon: GraduationCap },
        { id: 'admissions', label: 'ভর্তি আবেদন', icon: CalendarCheck },
        { id: 'notices', label: 'নোটিশ', icon: Bell },
        { id: 'website', label: 'ওয়েবসাইট CMS', icon: Settings2 }
    ];
    const adminSetupSteps = [
        { title: '১. ক্লাস খুলুন', text: 'প্রথমে শ্রেণি/সেকশন তৈরি করুন, না হলে ভর্তি ও ফলাফল ঠিকভাবে বসবে না।', tab: 'classes' },
        { title: '২. শিক্ষক যোগ করুন', text: 'শিক্ষকের login তৈরি করুন, পরে subject-এর সাথে শিক্ষক assign করুন।', tab: 'teachers' },
        { title: '৩. বিষয় assign করুন', text: 'প্রতি ক্লাসে subject যোগ করে শিক্ষক বসালে teacher portal সহজ হবে।', tab: 'subjects' },
        { title: '৪. ভর্তি নিন', text: 'Home search থেকে member select করুন, না থাকলে manual student add করুন।', tab: 'students' }
    ];
    const adminDailySteps = [
        { title: 'উপস্থিতি', text: 'প্রতিদিন present/absent/late/leave mark করুন।', tab: 'attendance' },
        { title: 'নোটিশ', text: 'পরীক্ষা, ছুটি বা জরুরি ঘোষণার জন্য notice publish করুন।', tab: 'notices' },
        { title: 'ফলাফল', text: 'Exam তৈরি করে subject-wise marks দিয়ে publish করুন।', tab: 'results' },
        { title: 'Website', text: 'Admission, gallery, principal message ও public info update করুন।', tab: 'website' }
    ];

    const filteredClasses = classes.filter((item) => matchesSearch(item, listSearch.classes, ['name', 'section', 'academic_year']));
    const filteredStudents = students.filter((item) => matchesSearch(item, listSearch.students, ['student_name', 'roll_no', 'guardian_name', 'guardian_phone']));
    const filteredTeachers = teachers.filter((item) => matchesSearch(item, listSearch.teachers, ['display_name', 'title', 'member_role']));
    const filteredSubjects = subjects.filter((item) => matchesSearch(item, listSearch.subjects, ['name']));
    const filteredExams = exams.filter((item) => matchesSearch(item, listSearch.exams, ['name', 'status', 'exam_date']));
    const filteredAttendanceStudents = students.filter((item) => matchesSearch(item, listSearch.attendance, ['student_name', 'roll_no', 'guardian_name', 'guardian_phone']));
    const filteredNotices = notices.filter((item) => matchesSearch(item, listSearch.notices, ['title', 'body', 'audience']));
    const filteredAdmissions = admissionApplications.filter((item) => matchesSearch(item, listSearch.admissions, ['student_name', 'desired_class', 'guardian_name', 'guardian_phone', 'status']));
    const totalStudents = students.length;
    const totalClasses = classes.length;
    const pagedClasses = paginateRows(filteredClasses, listPages.classes);
    const pagedStudents = paginateRows(filteredStudents, listPages.students);
    const pagedTeachers = paginateRows(filteredTeachers, listPages.teachers);
    const pagedSubjects = paginateRows(filteredSubjects, listPages.subjects);
    const pagedExams = paginateRows(filteredExams, listPages.exams);
    const pagedAttendanceStudents = paginateRows(filteredAttendanceStudents, listPages.attendance);
    const pagedRankedResults = paginateRows(rankedResultSummaries, listPages.resultRank);
    const pagedIncompleteResults = paginateRows(incompleteResultSummaries, listPages.resultIncomplete);
    const pagedNotices = paginateRows(filteredNotices, listPages.notices);
    const pagedAdmissions = paginateRows(filteredAdmissions, listPages.admissions);
    const setListPage = (key, page) => setListPages((current) => ({ ...current, [key]: page }));
    const setSearch = (key, value) => {
        setListSearch((current) => ({ ...current, [key]: value }));
        setListPage(key, 1);
    };
    const academicPlan = buildAcademicClassPlan(institution?.operational_settings || {});
    const websiteHref = institution?.custom_domain
        ? `https://${institution.custom_domain}`
        : institution?.subdomain
            ? `http://${institution.subdomain}.localhost:3000`
            : null;
    const teacherPortalHref = `/school/${schoolId}/teacher`;
    const studentPortalHref = `/school/${schoolId}/student`;
    const demoSeedTag = slugEmail(`${institution?.subdomain || institution?.name || schoolId}-${schoolId.slice(0, 6)}`);
    const fallbackDemoTeachers = [
        { name: 'মোঃ রফিকুল ইসলাম', title: 'গণিত শিক্ষক', email: `teacher.math.${demoSeedTag}@example.com` },
        { name: 'সুমাইয়া নূর', title: 'ইংরেজি শিক্ষক', email: `teacher.english.${demoSeedTag}@example.com` },
        { name: 'নাসরিন সুলতানা', title: 'বিজ্ঞান শিক্ষক', email: `teacher.science.${demoSeedTag}@example.com` },
        { name: 'ফারহানা বেগম', title: 'বাংলা শিক্ষক', email: `teacher.bangla.${demoSeedTag}@example.com` }
    ];
    const fallbackDemoStudents = [
        { name: 'আরিয়ান হোসেন', roll: '01', email: `student.01.${demoSeedTag}@example.com` },
        { name: 'তাসনিম আক্তার', roll: '02', email: `student.02.${demoSeedTag}@example.com` },
        { name: 'রাফিয়া সুলতানা', roll: '03', email: `student.03.${demoSeedTag}@example.com` }
    ];
    const demoTeacherLogins = seedResult?.login?.teachers?.length ? seedResult.login.teachers : fallbackDemoTeachers;
    const demoStudentLogins = seedResult?.login?.students?.length ? seedResult.login.students : fallbackDemoStudents;
    const demoGuardianChecks = seedResult?.guardianChecks || [];
    const demoPassword = seedResult?.login?.password || seedResult?.password || 'password123';

    return (
        <div className="overflow-hidden bg-[#f4f2ee]">
            <div
                className="min-h-[calc(100vh-8rem)]"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '240px minmax(0, 1fr)'
                }}
            >
                <aside className="text-white" style={{ backgroundColor: '#0f4a27' }}>
                    <div className="border-b border-white/10 p-5">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#c8922a] text-xl font-black">
                            {institution?.name?.slice(0, 1)}
                        </div>
                        <h2 className="font-black">{institution?.name}</h2>
                        <p className="mt-1 text-xs font-bold text-white/55">{institution?.village || 'School portal'}</p>
                    </div>
                    <div className="p-3">
                        <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/35">প্রধান মেনু</p>
                        <div className="space-y-1">
                            {tabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveTab(id)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activeTab === id ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/6 hover:text-white'}`}
                                >
                                    <Icon size={18} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="min-w-0">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6d3cb] bg-white px-5 py-4">
                        <div>
                            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1b6e3c]">
                                <ShieldCheck size={14} />
                                DigiGram powered portal
                            </div>
                            <h1 className="text-xl font-black text-slate-900">{institution?.name}</h1>
                            <p className="text-sm font-bold text-slate-400">{tabs.find((tab) => tab.id === activeTab)?.label}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={teacherPortalHref} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">
                                শিক্ষক পোর্টাল
                            </a>
                            <a href={studentPortalHref} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">
                                শিক্ষার্থী পোর্টাল
                            </a>
                            {websiteHref && (
                                <a
                                    href={websiteHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-[#1b6e3c] hover:text-[#1b6e3c]"
                                >
                                    ওয়েবসাইট
                                    <ExternalLink size={16} />
                                </a>
                            )}
                            <button type="button" onClick={() => setActiveTab('notices')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">নোটিশ</button>
                            <button type="button" onClick={() => setActiveTab('students')} className="rounded-xl bg-[#1b6e3c] px-4 py-2 text-sm font-black text-white">+ নতুন ভর্তি</button>
                        </div>
                    </header>

                    <div className="space-y-5 p-5">
                        {activeTab === 'dashboard' && (
                            <section className="grid gap-4 lg:grid-cols-3">
                                <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                            <Users size={20} />
                                        </span>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">ধাপ ১</p>
                                            <h3 className="text-lg font-black text-slate-900">শিক্ষক পোর্টাল</h3>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                                        শিক্ষক লগইন করে ক্লাস ও বিষয় নির্বাচন করবেন, তারপর টপিক প্রকাশ করবেন। হাতে লিখে টপিক যোগ করা যাবে, আবার বই/বোর্ডের ছবি দিয়ে AI draft নেওয়া যাবে।
                                    </p>
                                    <a href={teacherPortalHref} className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">
                                        শিক্ষক পোর্টাল খুলুন
                                    </a>
                                </article>

                                <article className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                            <GraduationCap size={20} />
                                        </span>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">ধাপ ২</p>
                                            <h3 className="text-lg font-black text-slate-900">শিক্ষার্থী পোর্টাল</h3>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                                        শিক্ষার্থী লগইন করলে শিক্ষকের দেওয়া টপিক, হোমওয়ার্ক, কুইজ ও AI help দেখতে পাবে। পড়া শেষ হলে নিজে complete mark করতে পারবে।
                                    </p>
                                    <a href={studentPortalHref} className="mt-4 inline-flex rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950">
                                        শিক্ষার্থী পোর্টাল খুলুন
                                    </a>
                                </article>

                                <article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                                            <BookOpenCheck size={20} />
                                        </span>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">টপিক গাইড</p>
                                            <h3 className="text-lg font-black">হাতে লেখা + AI</h3>
                                        </div>
                                    </div>
                                    <ol className="mt-3 space-y-2 text-sm font-bold leading-6 text-white/75">
                                        <li>১. শিক্ষক পোর্টাল থেকে Topic ও lesson মেনুতে যান।</li>
                                        <li>২. ক্লাস এবং বিষয় নির্বাচন করুন।</li>
                                        <li>৩. Title/Homework লিখুন অথবা ছবি upload করে AI scan দিন।</li>
                                        <li>৪. Draft দেখে publish করলে শিক্ষার্থী ও guardian view-তে দেখা যাবে।</li>
                                    </ol>
                                </article>
                            </section>
                        )}

                        {activeTab === 'dashboard' && (
                            <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-black">ডেমো ডাটা ও লগইন</h2>
                                        <p className="mt-1 text-sm font-bold text-slate-500">এক ক্লিকে শিক্ষক, শিক্ষার্থী, বিষয়, টপিক, কুইজ, উপস্থিতি, নোটিশ ও ফলাফল বসিয়ে পুরো flow পরীক্ষা করুন।</p>
                                    </div>
                                    <button type="button" onClick={seedDemoSchool} disabled={seedingDemo} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300">
                                        {seedingDemo ? 'তৈরি হচ্ছে...' : 'ডেমো ডাটা যোগ করুন'}
                                    </button>
                                </div>
                                {seedError && (
                                    <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700">
                                        Demo seed error: {seedError}
                                    </div>
                                )}
                                {seedResult && (
                                    <div className="mt-4 grid gap-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 lg:grid-cols-2">
                                        {seedResult.summary && (
                                            <div className="grid gap-3 lg:col-span-2 md:grid-cols-4">
                                                {[
                                                    ['ক্লাস', seedResult.summary.classes],
                                                    ['শিক্ষক', seedResult.summary.teachers],
                                                    ['শিক্ষার্থী', seedResult.summary.students],
                                                    ['টপিক', seedResult.summary.lessons]
                                                ].map(([label, value]) => (
                                                    <div key={label} className="rounded-2xl bg-white px-4 py-3">
                                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">{label}</p>
                                                        <p className="mt-1 text-2xl font-black">{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="rounded-2xl bg-white p-4">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">শিক্ষক লগইন</p>
                                            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-2">
                                                {demoTeacherLogins.map((teacher) => (
                                                    <p key={teacher.email} className="break-all">{teacher.name}: {teacher.email}</p>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-white p-4">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">শিক্ষার্থী লগইন</p>
                                            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-2">
                                                {demoStudentLogins.map((student) => (
                                                    <p key={student.email} className="break-all">
                                                        {student.className ? `${student.className} · ` : ''}রোল {student.roll}: {student.email}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                        {demoGuardianChecks.length > 0 && (
                                            <div className="rounded-2xl bg-white p-4 lg:col-span-2">
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Guardian view test</p>
                                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                                    {demoGuardianChecks.slice(0, 4).map((item) => (
                                                        <div key={`${item.className}-${item.roll}-${item.guardianPhone}`} className="rounded-xl bg-[#f4f2ee] px-4 py-3">
                                                            <p className="font-black text-slate-900">{item.name}</p>
                                                            <p className="text-xs font-bold text-slate-600">
                                                                Class: {item.className || '-'} · Roll: {item.roll || '-'} · Phone: {item.guardianPhone || '-'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-3 text-xs font-bold text-slate-500">
                                                    Website-এর Guardian Updates page-এ class select করে এই roll ও phone দিলে student update দেখাবে।
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 lg:col-span-2">
                                            <p>পাসওয়ার্ড: <span className="font-black">{demoPassword}</span></p>
                                            <div className="flex flex-wrap gap-2">
                                                <a href={teacherPortalHref} className="rounded-xl bg-emerald-700 px-4 py-2 text-white">শিক্ষক পোর্টাল</a>
                                                <a href={studentPortalHref} className="rounded-xl bg-amber-500 px-4 py-2 text-slate-950">শিক্ষার্থী পোর্টাল</a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!seedResult && (
                                    <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 lg:grid-cols-2">
                                        <div className="rounded-2xl bg-white p-4">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">ডেমো শিক্ষক অ্যাকাউন্ট</p>
                                            <div className="mt-2 space-y-1">
                                                {demoTeacherLogins.slice(0, 2).map((teacher) => (
                                                    <p key={teacher.email} className="break-all">{teacher.name}: {teacher.email}</p>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-white p-4">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">ডেমো শিক্ষার্থী অ্যাকাউন্ট</p>
                                            <div className="mt-2 space-y-1">
                                                {demoStudentLogins.slice(0, 2).map((student) => (
                                                    <p key={student.email} className="break-all">রোল {student.roll}: {student.email}</p>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 lg:col-span-2">
                                            <p>পাসওয়ার্ড: <span className="font-black">{demoPassword}</span></p>
                                            <p className="text-slate-500">ডেমো ডাটা যোগ করলে এই অ্যাকাউন্টগুলো active হবে।</p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                        {activeTab === 'dashboard' && (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        [`মোট ${portalCopy.studentLabel}`, totalStudents, Users],
                                        [`মোট ${portalCopy.classLabel}`, totalClasses, BookOpenCheck],
                                        ['আজকের উপস্থিতি', totalStudents ? `${totalStudents}/${totalStudents}` : '০', CalendarCheck],
                                        [portalCopy.resultLabel, 'চালু', Megaphone]
                                    ].map(([label, value, Icon]) => (
                                        <article key={label} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                            <Icon className="mb-4 text-[#1b6e3c]" />
                                            <p className="text-sm font-bold text-slate-500">{label}</p>
                                            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                                        </article>
                                    ))}
                                </div>
                                <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">সহজ কাজের পথ</p>
                                            <h2 className="mt-1 text-xl font-black text-slate-900">প্রথমবার setup করলে এই ৪ ধাপ অনুসরণ করুন</h2>
                                            <p className="mt-1 text-sm font-bold text-slate-500">প্রতিটি কার্ডে চাপ দিলে সরাসরি সেই কাজের পেজ খুলবে।</p>
                                        </div>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Admin guide</span>
                                    </div>
                                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        {adminSetupSteps.map((step) => (
                                            <button key={step.title} type="button" onClick={() => setActiveTab(step.tab)} className="rounded-2xl border border-slate-200 bg-[#f8faf8] p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50">
                                                <p className="font-black text-slate-900">{step.title}</p>
                                                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{step.text}</p>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">প্রতিদিনের কাজ</p>
                                            <h2 className="mt-1 text-xl font-black text-slate-900">স্কুল চালানোর মূল কাজগুলো</h2>
                                        </div>
                                        <button type="button" onClick={() => setActiveTab('attendance')} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white">আজকের উপস্থিতি নিন</button>
                                    </div>
                                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        {adminDailySteps.map((step) => (
                                            <button key={step.title} type="button" onClick={() => setActiveTab(step.tab)} className="rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-slate-50">
                                                <p className="font-black text-slate-900">{step.title}</p>
                                                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{step.text}</p>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 font-black">দ্রুত কাজ</h2>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        {[
                                            ['উপস্থিতি নিন', 'attendance'],
                                            [`${portalCopy.studentLabel} যোগ করুন`, 'students'],
                                            ['শিক্ষক যোগ করুন', 'teachers'],
                                            [portalCopy.subjectLabel, 'subjects'],
                                            [portalCopy.resultLabel, 'results'],
                                            ['ওয়েবসাইট সাজান', 'website']
                                        ].map(([label, tab]) => (
                                            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className="rounded-2xl border border-slate-200 bg-[#f4f2ee] px-4 py-5 text-left font-black hover:border-[#27a35a] hover:bg-[#e8f5ee]">
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                                    <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                        <h2 className="mb-4 font-black">সাম্প্রতিক কার্যক্রম</h2>
                                        <div className="space-y-3">
                                            <div className="rounded-xl bg-[#f4f2ee] px-4 py-3 text-sm font-bold text-slate-600">নতুন class তৈরি করে শিক্ষার্থী যোগ করুন</div>
                                            <div className="rounded-xl bg-[#f4f2ee] px-4 py-3 text-sm font-bold text-slate-600">অনুপস্থিত হলে guardian SMS পাঠানো হবে</div>
                                            <div className="rounded-xl bg-[#f4f2ee] px-4 py-3 text-sm font-bold text-slate-600">Website CMS থেকে public site সাজানো যাবে</div>
                                        </div>
                                    </section>
                                    <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                        <h2 className="mb-4 font-black">আজকের সারাংশ</h2>
                                        <div className="space-y-4 text-sm font-bold text-slate-600">
                                            <p className="flex justify-between"><span>{portalCopy.classLabel}</span><span>{totalClasses}</span></p>
                                            <p className="flex justify-between"><span>{portalCopy.studentLabel}</span><span>{totalStudents}</span></p>
                                            <p className="flex justify-between"><span>Selected class</span><span>{selectedClass?.name || '-'}</span></p>
                                        </div>
                                    </section>
                                </div>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 font-black">এই প্রতিষ্ঠানের প্রধান ফোকাস</h2>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {portalCopy.focus.map((item) => (
                                            <div key={item} className="rounded-2xl bg-[#f4f2ee] px-4 py-4 font-black text-slate-700">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}

                        {activeTab === 'classes' && (
                            <>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <h2 className="font-black">স্বয়ংক্রিয় শ্রেণি কাঠামো</h2>
                                            <p className="mt-1 text-sm font-bold text-slate-500">
                                                {academicPlan.length
                                                    ? `${academicPlan[0].name} থেকে ${academicPlan[academicPlan.length - 1].name} পর্যন্ত ${academicPlan.length}টি শ্রেণি প্রস্তুত করা যাবে।`
                                                    : 'প্রতিষ্ঠানের শিক্ষা পরিসর সেট করা নেই। আগে institution edit থেকে শুরু ও শেষ শ্রেণি ঠিক করুন।'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={createDefaultClasses}
                                            disabled={!academicPlan.length || creatingDefaultClasses}
                                            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300"
                                        >
                                            {creatingDefaultClasses ? 'তৈরি হচ্ছে...' : 'শ্রেণি কাঠামো তৈরি করুন'}
                                        </button>
                                    </div>
                                </section>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 text-xl font-black">শ্রেণি তালিকা</h2>
                                    <input value={listSearch.classes} onChange={(e) => setSearch('classes', e.target.value)} placeholder="Class name/section/year দিয়ে খুঁজুন" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                    <div className="flex flex-wrap gap-3">
                                        {classes.length === 0 ? <p className="text-sm font-bold text-slate-400">এখনো কোনো class নেই।</p> : pagedClasses.map((item) => (
                                            <button key={item.id} type="button" onClick={async () => {
                                                setSelectedClass(item);
                                                const [studentRows, subjectRows] = await Promise.all([
                                                    schoolService.getStudents(item.id),
                                                    schoolService.getSubjects(schoolId, item.id)
                                                ]);
                                                setStudents(studentRows);
                                                setSubjects(subjectRows);
                                                const examRows = await schoolService.getExams(schoolId, item.id);
                                                setExams(examRows);
                                                if (examRows[0]) {
                                                    setSelectedExam(examRows[0]);
                                                    setExamEntries(await schoolService.getExamEntries(examRows[0].id));
                                                } else {
                                                    setSelectedExam(null);
                                                    setExamEntries([]);
                                                }
                                            }} className={`rounded-xl px-4 py-3 text-sm font-black ${selectedClass?.id === item.id ? 'bg-[#1b6e3c] text-white' : 'bg-[#f4f2ee] text-slate-600'}`}>
                                                {item.name} {item.section ? `- ${item.section}` : ''}
                                            </button>
                                        ))}
                                    </div>
                                    <Pagination page={listPages.classes} totalItems={filteredClasses.length} onPageChange={(page) => setListPage('classes', page)} />
                                </section>
                                <form onSubmit={createClass} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <div className="mb-4 flex items-center gap-3"><Plus className="text-[#1b6e3c]" /><h2 className="text-xl font-black">নতুন ক্লাস</h2></div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <input required value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Class name" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        <input required type="number" value={classForm.academic_year} onChange={(e) => setClassForm({ ...classForm, academic_year: e.target.value })} placeholder="Year" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        <input value={classForm.section} onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} placeholder="Section" className="rounded-xl border border-slate-200 px-4 py-3" />
                                    </div>
                                    <button className="mt-4 rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white">ক্লাস যোগ করুন</button>
                                </form>
                            </>
                        )}

                        {activeTab === 'students' && (
                            <div className="space-y-5">
                                <section className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">ভর্তি নিয়ম</p>
                                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                                        {[
                                            ['Home থেকে নিন', 'আগে search দিন। Member পেলে select করলেই student info বসে যাবে।'],
                                            ['না পেলে manual', 'Home entry না থাকলে নাম, roll, guardian phone লিখে ভর্তি করুন।'],
                                            ['Guardian check', 'Student login না থাকলেও guardian roll + phone দিয়ে update দেখতে পারবে।']
                                        ].map(([title, text]) => (
                                            <div key={title} className="rounded-2xl bg-white p-4">
                                                <p className="font-black text-slate-900">{title}</p>
                                                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                <form onSubmit={createStudent} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <div className="mb-4 flex items-center gap-3"><Plus className="text-[#1b6e3c]" /><h2 className="text-xl font-black">ভর্তি / নতুন {portalCopy.studentLabel}</h2></div>
                                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                        <div className="flex flex-wrap items-end gap-3">
                                            <label className="min-w-0 flex-1">
                                                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-emerald-700">Home member search</span>
                                                <input
                                                    value={householdSearch}
                                                    onChange={(e) => setHouseholdSearch(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            searchHouseholdMembers(e);
                                                        }
                                                    }}
                                                    placeholder="House no, guardian name, phone, NID, birth reg"
                                                    className="h-12 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm font-bold outline-none focus:border-emerald-400"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={searchHouseholdMembers}
                                                disabled={householdSearching || householdSearch.trim().length < 2}
                                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white disabled:bg-slate-300"
                                            >
                                                {householdSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                                Search
                                            </button>
                                        </div>
                                        {householdSearchError && <p className="mt-3 text-xs font-black text-rose-600">{householdSearchError}</p>}
                                        {studentForm.resident_id && (
                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-emerald-800">
                                                <span>Selected from home: {studentForm.source_label}</span>
                                                <button type="button" onClick={clearHouseholdSelection} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">Clear link</button>
                                            </div>
                                        )}
                                        {householdResults.length > 0 && (
                                            <div className="mt-4 grid gap-3">
                                                {householdResults.map((household) => (
                                                    <div key={household.id} className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <div>
                                                                <p className="font-black text-slate-900">{household.owner_name || 'Household'}</p>
                                                                <p className="text-xs font-bold text-slate-500">
                                                                    {[household.house_no && `House ${household.house_no}`, household.village_name, household.ward_name, household.guardian_phone].filter(Boolean).join(' · ')}
                                                                </p>
                                                            </div>
                                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">{household.residents.length} members</span>
                                                        </div>
                                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                            {household.residents.map((resident) => (
                                                                <button
                                                                    key={resident.id}
                                                                    type="button"
                                                                    onClick={() => selectHouseholdMember(household, resident)}
                                                                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                                                                >
                                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
                                                                        <UserPlus size={16} />
                                                                    </span>
                                                                    <span className="min-w-0">
                                                                        <span className="block truncate text-sm font-black text-slate-900">{resident.name || 'Unnamed member'}</span>
                                                                        <span className="block truncate text-[11px] font-bold text-slate-500">
                                                                            {[resident.age !== null ? `${resident.age}y` : '', resident.student_status, resident.birth_reg_no || resident.nid].filter(Boolean).join(' · ')}
                                                                        </span>
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <input required disabled={!selectedClass} value={studentForm.student_name} onChange={(e) => setStudentForm({ ...studentForm, student_name: e.target.value })} placeholder="Student name" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        <input value={studentForm.roll_no} onChange={(e) => setStudentForm({ ...studentForm, roll_no: e.target.value })} placeholder="Roll" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        <input value={studentForm.guardian_name} onChange={(e) => setStudentForm({ ...studentForm, guardian_name: e.target.value })} placeholder="Guardian name" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        <input value={studentForm.guardian_phone} onChange={(e) => setStudentForm({ ...studentForm, guardian_phone: e.target.value })} placeholder="Guardian phone" className="rounded-xl border border-slate-200 px-4 py-3" />
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
                                        Student add korle আলাদা login account তৈরি হবে না। Guardian update/result দেখার জন্য roll + guardian phone ব্যবহার হবে, আর family tree/home profile থেকে household link রাখা যাবে।
                                    </div>
                                    <button disabled={!selectedClass} className="mt-4 rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white disabled:bg-slate-300">{portalCopy.studentLabel} যোগ করুন</button>
                                </form>

                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-black">{portalCopy.studentLabel} তালিকা</h2>
                                            <p className="mt-1 text-sm font-bold text-slate-500">Student account ছাড়া guardian phone/roll দিয়ে result, attendance ও homework দেখা যাবে। Household link থাকলে family profile-এ school status থাকবে।</p>
                                        </div>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{students.length} জন</span>
                                    </div>
                                    <div className="mt-5 space-y-3">
                                        <input value={listSearch.students} onChange={(e) => setSearch('students', e.target.value)} placeholder="Student name, roll, guardian phone দিয়ে খুঁজুন" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                        {students.length === 0 ? (
                                            <p className="rounded-2xl bg-[#f4f2ee] p-4 text-sm font-bold text-slate-500">এখনো কোনো {portalCopy.studentLabel} যোগ করা হয়নি।</p>
                                        ) : pagedStudents.map((student) => (
                                            <div key={student.id} className="rounded-2xl bg-[#f4f2ee] p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-black text-slate-900">{student.student_name}</p>
                                                        <p className="mt-1 text-sm font-bold text-slate-500">রোল {student.roll_no || '-'} · {student.guardian_phone || 'Guardian phone নেই'}</p>
                                                    </div>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${student.household_id || student.resident_id ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                                                        {student.household_id || student.resident_id ? 'Home linked' : 'Guardian check'}
                                                    </span>
                                                </div>
                                                <div className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-500">
                                                    Guardian: {student.guardian_name || '-'} · Source: {student.enrollment_source || 'school record'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination page={listPages.students} totalItems={filteredStudents.length} onPageChange={(page) => setListPage('students', page)} />
                                </section>
                            </div>
                        )}

                        {activeTab === 'subjects' && (
                            <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                                <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 xl:col-span-2">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Subject setup</p>
                                    <h2 className="mt-1 text-xl font-black text-slate-900">প্রতি class-এর subject আলাদা করে দিন</h2>
                                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">Subject-এর সাথে teacher assign করলে teacher portal-এ শুধু তার class/subject দেখাবে। এতে ভুল topic বা ভুল class-এ homework যাওয়ার ঝুঁকি কমে।</p>
                                </section>
                                <form onSubmit={createSubject} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="text-xl font-black">নতুন {portalCopy.subjectLabel}</h2>
                                    <p className="mt-2 text-sm font-bold text-slate-500">
                                        নির্বাচিত {portalCopy.classLabel}: {selectedClass?.name || '-'}
                                    </p>
                                    <div className="mt-5 space-y-3">
                                        <input
                                            required
                                            disabled={!selectedClass}
                                            value={subjectForm.name}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                            placeholder={portalCopy.subjectLabel}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3"
                                        />
                                        <select
                                            value={subjectForm.teacher_id}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3"
                                        >
                                            <option value="">Teacher assign না করে রাখুন</option>
                                            {teachers.map((teacher) => (
                                                <option key={teacher.id} value={teacher.profile_id}>
                                                    {teacher.display_name || teacher.title || teacher.profile_id}
                                                </option>
                                            ))}
                                        </select>
                                        <button disabled={!selectedClass} className="w-full rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white disabled:bg-slate-300">
                                            {portalCopy.subjectLabel} যোগ করুন
                                        </button>
                                    </div>
                                </form>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-black">{portalCopy.subjectLabel} তালিকা</h2>
                                            <p className="mt-1 text-sm font-bold text-slate-500">{selectedClass?.name || 'কোনো শ্রেণি নির্বাচন করা হয়নি'}</p>
                                        </div>
                                        {profile.features.includes('subject_results') && (
                                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">বিষয়ভিত্তিক ফলাফল</span>
                                        )}
                                    </div>
                                    <div className="mt-5 space-y-3">
                                        <input value={listSearch.subjects} onChange={(e) => setSearch('subjects', e.target.value)} placeholder="Subject name দিয়ে খুঁজুন" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                        {subjects.length === 0 ? (
                                            <p className="rounded-2xl bg-[#f4f2ee] p-4 text-sm font-bold text-slate-500">এখনো কোনো {portalCopy.subjectLabel} যোগ করা হয়নি।</p>
                                        ) : pagedSubjects.map((subject) => {
                                            const teacher = teachers.find((item) => item.profile_id === subject.teacher_id);
                                            return (
                                                <div key={subject.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f4f2ee] p-4">
                                                    <div>
                                                        <p className="font-black text-slate-900">{subject.name}</p>
                                                        <p className="mt-1 text-sm font-bold text-slate-500">
                                                            {teacher ? (teacher.display_name || teacher.title || 'Teacher assigned') : 'Teacher assign করা হয়নি'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <select
                                                            value={subject.teacher_id || ''}
                                                            onChange={(event) => updateSubjectTeacher(subject.id, event.target.value)}
                                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700"
                                                        >
                                                            <option value="">Teacher নেই</option>
                                                            {teachers.map((item) => (
                                                                <option key={item.id} value={item.profile_id}>
                                                                    {item.display_name || item.title || item.profile_id}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button type="button" onClick={() => deleteSubject(subject.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">
                                                            মুছুন
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Pagination page={listPages.subjects} totalItems={filteredSubjects.length} onPageChange={(page) => setListPage('subjects', page)} />
                                </section>
                            </div>
                        )}

                        {activeTab === 'teachers' && (
                            <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                                <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 xl:col-span-2">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Teacher access</p>
                                    <h2 className="mt-1 text-xl font-black text-slate-900">শিক্ষকের জন্য সহজ login তৈরি করুন</h2>
                                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">শিক্ষক তৈরি করার পর Subjects menu থেকে তার subject assign করুন। তারপর শিক্ষক portal-এ topic, homework, quiz এবং review করতে পারবে।</p>
                                </section>
                                <form onSubmit={createTeacher} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="text-xl font-black">নতুন শিক্ষক</h2>
                                    <p className="mt-2 text-sm font-bold text-slate-500">এই প্রতিষ্ঠানের জন্য আলাদা teacher login তৈরি হবে।</p>
                                    <div className="mt-5 grid gap-3">
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <input required value={teacherForm.first_name} onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })} placeholder="নামের প্রথম অংশ" className="rounded-xl border border-slate-200 px-4 py-3" />
                                            <input value={teacherForm.last_name} onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })} placeholder="নামের শেষ অংশ" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        </div>
                                        <input required type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="teacher@example.com" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <input value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} placeholder="মোবাইল নম্বর" className="rounded-xl border border-slate-200 px-4 py-3" />
                                            <input required value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="অস্থায়ী পাসওয়ার্ড" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        </div>
                                        <input value={teacherForm.title} onChange={(e) => setTeacherForm({ ...teacherForm, title: e.target.value })} placeholder="যেমন: গণিত শিক্ষক / আরবি শিক্ষক" className="rounded-xl border border-slate-200 px-4 py-3" />
                                        <button className="rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white">শিক্ষক তৈরি করুন</button>
                                    </div>
                                </form>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-black">শিক্ষক তালিকা</h2>
                                            <p className="mt-1 text-sm font-bold text-slate-500">এই institution-এর নিজস্ব শিক্ষক</p>
                                        </div>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{teachers.length} জন</span>
                                    </div>
                                    <div className="mt-5 space-y-3">
                                        <input value={listSearch.teachers} onChange={(e) => setSearch('teachers', e.target.value)} placeholder="Teacher name/title দিয়ে খুঁজুন" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                        {teachers.length === 0 ? (
                                            <p className="rounded-2xl bg-[#f4f2ee] p-4 text-sm font-bold text-slate-500">এখনো কোনো শিক্ষক যোগ করা হয়নি।</p>
                                        ) : pagedTeachers.map((teacher) => (
                                            <div key={teacher.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f4f2ee] p-4">
                                                <div>
                                                    <p className="font-black text-slate-900">{teacher.display_name || 'নাম যোগ করা হয়নি'}</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-500">{teacher.title || 'শিক্ষক'}</p>
                                                </div>
                                                <button type="button" onClick={() => toggleTeacher(teacher)} className={`rounded-xl px-3 py-2 text-sm font-black ${teacher.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {teacher.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination page={listPages.teachers} totalItems={filteredTeachers.length} onPageChange={(page) => setListPage('teachers', page)} />
                                </section>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="space-y-5">
                                <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                                    <form onSubmit={createExam} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                        <h2 className="text-xl font-black">নতুন পরীক্ষা</h2>
                                        <p className="mt-2 text-sm font-bold text-slate-500">{selectedClass?.name || 'শ্রেণি নির্বাচন করা হয়নি'}</p>
                                        <div className="mt-5 space-y-3">
                                            <input required disabled={!selectedClass} value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="যেমন: প্রথম সাময়িক পরীক্ষা" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
                                            <input required disabled={!selectedClass} type="date" value={examForm.exam_date} onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3" />
                                            <button disabled={!selectedClass} className="w-full rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white disabled:bg-slate-300">পরীক্ষা তৈরি করুন</button>
                                        </div>
                                    </form>
                                    <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                        <h2 className="text-xl font-black">পরীক্ষার তালিকা</h2>
                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <input value={listSearch.exams} onChange={(e) => setSearch('exams', e.target.value)} placeholder="Exam name/status/date দিয়ে খুঁজুন" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                            {exams.length === 0 ? (
                                                <p className="rounded-2xl bg-[#f4f2ee] p-4 text-sm font-bold text-slate-500">এখনো কোনো পরীক্ষা তৈরি হয়নি।</p>
                                            ) : pagedExams.map((exam) => (
                                                <button key={exam.id} type="button" onClick={async () => {
                                                    setSelectedExam(exam);
                                                    setExamEntries(await schoolService.getExamEntries(exam.id));
                                                }} className={`rounded-2xl px-4 py-3 text-left font-black ${selectedExam?.id === exam.id ? 'bg-slate-900 text-white' : 'bg-[#f4f2ee] text-slate-700'}`}>
                                                    <span className="block">{exam.name}</span>
                                                    <span className="mt-1 block text-xs opacity-70">{exam.status === 'published' ? 'প্রকাশিত' : 'ড্রাফট'}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <Pagination page={listPages.exams} totalItems={filteredExams.length} onPageChange={(page) => setListPage('exams', page)} />
                                    </section>
                                </div>

                                <section className="overflow-hidden rounded-2xl border border-[#d6d3cb] bg-white">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                                        <div>
                                            <h2 className="text-xl font-black">{portalCopy.resultLabel}</h2>
                                            <p className="mt-1 text-sm font-bold text-slate-500">{selectedExam?.name || 'পরীক্ষা নির্বাচন করুন'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" disabled={!selectedExam} onClick={saveExamEntries} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:text-slate-300">সেভ</button>
                                            <button type="button" disabled={!selectedExam || selectedExam.status === 'published'} onClick={publishExam} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300">প্রকাশ করুন</button>
                                        </div>
                                    </div>
                                    {!selectedExam ? (
                                        <p className="p-5 text-sm font-bold text-slate-500">প্রথমে একটি পরীক্ষা তৈরি বা নির্বাচন করুন।</p>
                                    ) : subjects.length === 0 ? (
                                        <p className="p-5 text-sm font-bold text-slate-500">নম্বর এন্ট্রির আগে এই {portalCopy.classLabel}-এর {portalCopy.subjectLabel} যোগ করুন।</p>
                                    ) : students.length === 0 ? (
                                        <p className="p-5 text-sm font-bold text-slate-500">নম্বর এন্ট্রির আগে {portalCopy.studentLabel} যোগ করুন।</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-[#f4f2ee] text-left text-xs font-black text-slate-500">
                                                        <th className="px-4 py-3">নাম</th>
                                                        {subjects.map((subject) => <th key={subject.id} className="px-4 py-3">{subject.name}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pagedStudents.map((student) => (
                                                        <tr key={student.id} className="border-t border-slate-100">
                                                            <td className="px-4 py-3 font-black text-slate-900">{student.student_name}</td>
                                                            {subjects.map((subject) => {
                                                                const entry = examEntries.find((item) => item.student_id === student.id && item.subject_id === subject.id);
                                                                return (
                                                                    <td key={subject.id} className="px-4 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                value={entry?.obtained_marks ?? ''}
                                                                                onChange={(e) => updateExamEntry(student.id, subject.id, e.target.value)}
                                                                                className="w-20 rounded-xl border border-slate-200 px-3 py-2"
                                                                            />
                                                                            <span className="text-xs font-black text-slate-500">{entry?.grade || '-'}</span>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {selectedExam && subjects.length > 0 && students.length > 0 && (
                                        <div className="px-5 pb-5">
                                            <Pagination page={listPages.students} totalItems={filteredStudents.length} onPageChange={(page) => setListPage('students', page)} />
                                        </div>
                                    )}
                                </section>

                                {selectedExam && subjects.length > 0 && students.length > 0 && (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            {[
                                                ['সম্পূর্ণ ফলাফল', completeResultSummaries.length, 'text-emerald-700 bg-emerald-50'],
                                                ['পাস', passedResultSummaries.length, 'text-sky-700 bg-sky-50'],
                                                ['ফেল', failedResultSummaries.length, 'text-rose-700 bg-rose-50'],
                                                ['অসম্পূর্ণ', incompleteResultSummaries.length, 'text-amber-700 bg-amber-50']
                                            ].map(([label, value, tone]) => (
                                                <article key={label} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                                    <p className="text-sm font-bold text-slate-500">{label}</p>
                                                    <p className={`mt-3 inline-flex min-w-16 justify-center rounded-full px-4 py-2 text-2xl font-black ${tone}`}>{value}</p>
                                                </article>
                                            ))}
                                        </div>

                                        <section className="overflow-hidden rounded-2xl border border-[#d6d3cb] bg-white">
                                            <div className="border-b border-slate-200 p-5">
                                                <h2 className="text-xl font-black">মেধাতালিকা ও ফলাফল সারাংশ</h2>
                                                <p className="mt-1 text-sm font-bold text-slate-500">সব বিষয়ের নম্বর পূর্ণ হলে তবেই র‍্যাংক ধরা হবে।</p>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-[#f4f2ee] text-left text-xs font-black text-slate-500">
                                                            <th className="px-4 py-3">র‍্যাংক</th>
                                                            <th className="px-4 py-3">নাম</th>
                                                            <th className="px-4 py-3">রোল</th>
                                                            <th className="px-4 py-3">মোট</th>
                                                            <th className="px-4 py-3">শতাংশ</th>
                                                            <th className="px-4 py-3">গ্রেড</th>
                                                            <th className="px-4 py-3">অবস্থা</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pagedRankedResults.map((item) => (
                                                            <tr key={item.student.id} className="border-t border-slate-100">
                                                                <td className="px-4 py-3 font-black text-slate-900">{item.rank}</td>
                                                                <td className="px-4 py-3 font-black text-slate-900">{item.student.student_name}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-500">{item.student.roll_no || '-'}</td>
                                                                <td className="px-4 py-3 font-black text-slate-900">{item.obtainedTotal}/{item.totalMarks}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-600">{item.percentage?.toFixed(2)}%</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${item.overallGrade === 'F' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                                        {item.overallGrade}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${item.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                        {item.passed ? 'পাস' : 'ফেল'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {rankedResultSummaries.length === 0 && (
                                                            <tr>
                                                                <td colSpan={7} className="px-4 py-6 text-sm font-bold text-slate-500">এখনও কোনো সম্পূর্ণ ফলাফল নেই।</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="px-5 pb-5">
                                                <Pagination page={listPages.resultRank} totalItems={rankedResultSummaries.length} onPageChange={(page) => setListPage('resultRank', page)} />
                                            </div>
                                            {incompleteResultSummaries.length > 0 && (
                                                <div className="border-t border-slate-200 bg-amber-50 p-5">
                                                    <p className="font-black text-amber-800">অসম্পূর্ণ ফলাফল</p>
                                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                        {pagedIncompleteResults.map((item) => (
                                                            <div key={item.student.id} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-amber-800">
                                                                {item.student.student_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Pagination page={listPages.resultIncomplete} totalItems={incompleteResultSummaries.length} onPageChange={(page) => setListPage('resultIncomplete', page)} />
                                                </div>
                                            )}
                                        </section>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                                <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 xl:col-span-2">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Attendance guide</p>
                                    <h2 className="mt-1 text-xl font-black text-slate-900">প্রতিদিন একবার attendance mark করুন</h2>
                                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">Absent দিলে guardian SMS যাবে। Late, leave, excused ব্যবহার করলে রিপোর্ট বেশি পরিষ্কার হবে।</p>
                                </section>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 text-xl font-black">আজকের উপস্থিতি</h2>
                                    <input value={listSearch.attendance} onChange={(e) => setSearch('attendance', e.target.value)} placeholder="Student name/roll দিয়ে খুঁজুন" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                    <div className="space-y-3">
                                    {students.length === 0 ? <p className="text-sm font-bold text-slate-400">শিক্ষার্থী যোগ করলে এখানে attendance দেখা যাবে।</p> : pagedAttendanceStudents.map((student) => (
                                            <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4f2ee] p-4">
                                                <div>
                                                    <p className="font-black">{student.student_name}</p>
                                                    <p className="text-xs font-bold text-slate-400">রোল {student.roll_no || '-'}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => markAttendance(student, 'present')} className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-700">উপস্থিত</button>
                                                    <button type="button" onClick={() => markAttendance(student, 'absent')} className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-black text-rose-700">অনুপস্থিত</button>
                                                    <button type="button" onClick={() => markAttendance(student, 'late')} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-black text-amber-700">দেরি</button>
                                                    <button type="button" onClick={() => markAttendance(student, 'leave')} className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-black text-blue-700">ছুটি</button>
                                                    <button type="button" onClick={() => markAttendance(student, 'excused')} className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-black text-slate-700">কারণসহ</button>
                                                </div>
                                            </div>
                                    ))}
                                </div>
                                <Pagination page={listPages.attendance} totalItems={filteredAttendanceStudents.length} onPageChange={(page) => setListPage('attendance', page)} />
                            </section>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 text-xl font-black">Lesson tracking</h2>
                                    <form onSubmit={createLesson} className="flex gap-3">
                                        <input required disabled={!selectedClass} value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="আজকের topic" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3" />
                                        <button disabled={!selectedClass} className="rounded-xl bg-slate-900 px-4 py-3 font-black text-white">যোগ</button>
                                    </form>
                                    {activeLesson && <p className="mt-4 rounded-xl bg-[#f4f2ee] p-3 text-sm font-bold text-slate-600">{activeLesson.title}</p>}
                                </section>
                            </div>
                        )}

                        {activeTab === 'notices' && (
                            <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                            <form onSubmit={publishNotice} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 className="text-xl font-black">{editingNoticeId ? 'নোটিশ আপডেট' : 'নোটিশ প্রকাশ'}</h2>
                                    {editingNoticeId && (
                                        <button type="button" onClick={() => {
                                            setEditingNoticeId('');
                                            setNoticeForm({ title: '', body: '', audience: 'public', is_pinned: false });
                                        }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">
                                            Cancel edit
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <input required value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} placeholder="Notice title" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
                                    <textarea value={noticeForm.body} onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })} placeholder="Notice details" className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3" />
                                    <select value={noticeForm.audience} onChange={(e) => setNoticeForm({ ...noticeForm, audience: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3">
                                        <option value="public">Public</option>
                                        <option value="teachers">Teachers</option>
                                        <option value="students">Students</option>
                                        <option value="guardians">Guardians</option>
                                    </select>
                                    <label className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
                                        <input type="checkbox" checked={noticeForm.is_pinned} onChange={(e) => setNoticeForm({ ...noticeForm, is_pinned: e.target.checked })} className="mt-1" />
                                        <span>
                                            Pin this notice
                                            <span className="mt-1 block text-xs font-bold text-amber-700">Pinned public notices appear first and feed the website ticker.</span>
                                        </span>
                                    </label>
                                    <button className="rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white">{editingNoticeId ? 'আপডেট করুন' : 'নোটিশ দিন'}</button>
                                </div>
                            </form>
                            <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-black">Notice list</h2>
                                        <p className="mt-1 text-sm font-bold text-slate-500">Published notice গুলো pagination সহ দেখা যাবে।</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{notices.length} টি</span>
                                </div>
                                <div className="mt-5 space-y-3">
                                    <input value={listSearch.notices} onChange={(e) => setSearch('notices', e.target.value)} placeholder="Notice title/body/audience দিয়ে খুঁজুন" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                    {notices.length === 0 ? (
                                        <p className="rounded-2xl bg-[#f4f2ee] p-4 text-sm font-bold text-slate-500">এখনো কোনো notice নেই।</p>
                                    ) : pagedNotices.map((notice) => (
                                        <article key={notice.id} className="rounded-2xl bg-[#f4f2ee] p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-black text-slate-900">{notice.title}</p>
                                                    <div className="mt-1 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.16em]">
                                                        <span className="text-slate-400">{notice.audience}</span>
                                                        {notice.is_pinned && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Pinned</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => startNoticeEdit(notice)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-700">Edit</button>
                                                    <button type="button" onClick={() => removeNotice(notice.id)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Delete</button>
                                                </div>
                                            </div>
                                            {notice.body && <p className="mt-2 text-sm font-bold leading-7 text-slate-500">{notice.body}</p>}
                                        </article>
                                    ))}
                                </div>
                                <Pagination page={listPages.notices} totalItems={filteredNotices.length} onPageChange={(page) => setListPage('notices', page)} />
                            </section>
                            </div>
                        )}

                        {activeTab === 'admissions' && (
                            <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                <div className="flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-black">Website ভর্তি আবেদন</h2>
                                        <p className="mt-1 text-sm font-bold text-slate-500">Public website থেকে জমা হওয়া application review করে status দিন।</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{admissionApplications.length} টি</span>
                                </div>
                                <input value={listSearch.admissions} onChange={(e) => setSearch('admissions', e.target.value)} placeholder="নাম, class, guardian phone বা status দিয়ে খুঁজুন" className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
                                <div className="mt-4 grid gap-3">
                                    {admissionApplications.length === 0 ? (
                                        <p className="rounded-2xl bg-[#f4f2ee] p-4 text-sm font-bold text-slate-500">এখনও public admission application আসেনি। Website-এর ভর্তি page থেকে test application দিন।</p>
                                    ) : pagedAdmissions.map((application) => (
                                        <article key={application.id} className="grid gap-4 rounded-2xl bg-[#f4f2ee] p-4 xl:grid-cols-[1fr_auto]">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-black text-slate-900">{application.student_name}</h3>
                                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{application.desired_class}</span>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${application.status === 'approved' || application.status === 'admitted' ? 'bg-emerald-100 text-emerald-700' : application.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {application.status}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm font-bold text-slate-600">Guardian: {application.guardian_name} | {application.guardian_phone}</p>
                                                {application.address && <p className="mt-1 text-sm font-bold text-slate-500">{application.address}</p>}
                                                {application.notes && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-500">{application.notes}</p>}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {['reviewing', 'approved', 'rejected', 'admitted'].map((status) => (
                                                    <button key={status} type="button" onClick={() => updateAdmissionStatus(application, status)} className={`rounded-xl px-3 py-2 text-xs font-black ${application.status === status ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                                <Pagination page={listPages.admissions} totalItems={filteredAdmissions.length} onPageChange={(page) => setListPage('admissions', page)} />
                            </section>
                        )}

                        {activeTab === 'website' && (
                            <InstitutionWebsiteManager institution={institution} initialPage={pageData} onInstitutionUpdate={setInstitution} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
