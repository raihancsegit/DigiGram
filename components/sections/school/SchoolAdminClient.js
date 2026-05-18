'use client';

import { useEffect, useState } from 'react';
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
    Settings2,
    ShieldCheck,
    Users
} from 'lucide-react';
import { schoolService } from '@/lib/services/schoolService';
import { smsService } from '@/lib/services/smsService';
import { institutionPortalService } from '@/lib/services/institutionPortalService';
import { institutionService } from '@/lib/services/institutionService';
import InstitutionWebsiteManager from '@/components/sections/institution/InstitutionWebsiteManager';

export default function SchoolAdminClient({ schoolId }) {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classForm, setClassForm] = useState({ name: '', academic_year: new Date().getFullYear(), section: '' });
    const [studentForm, setStudentForm] = useState({ student_name: '', roll_no: '', guardian_name: '', guardian_phone: '' });
    const [lessonTitle, setLessonTitle] = useState('');
    const [activeLesson, setActiveLesson] = useState(null);
    const [pageData, setPageData] = useState(null);
    const [noticeForm, setNoticeForm] = useState({ title: '', body: '', audience: 'public' });
    const [institution, setInstitution] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');

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
                const classRows = await schoolService.getClasses(schoolId);
                setClasses(classRows);
                setInstitution(institutionData);
                setPageData(await institutionPortalService.getPage(schoolId));
                if (classRows[0]) {
                    setSelectedClass(classRows[0]);
                    setStudents(await schoolService.getStudents(classRows[0].id));
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [schoolId]);

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

    async function createStudent(event) {
        event.preventDefault();
        const created = await schoolService.createStudent({
            institution_id: schoolId,
            class_id: selectedClass.id,
            ...studentForm
        });
        setStudents((current) => [...current, created]);
        setStudentForm({ student_name: '', roll_no: '', guardian_name: '', guardian_phone: '' });
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
        await institutionPortalService.createNotice({
            institution_id: schoolId,
            ...noticeForm
        });
        setNoticeForm({ title: '', body: '', audience: 'public' });
    }

    if (loading) return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-emerald-700" /></div>;
    if (institution?.accessDenied) {
        return (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center">
                <h1 className="text-2xl font-black text-rose-700">এই প্রতিষ্ঠানের admin access আপনার নেই</h1>
            </div>
        );
    }

    const tabs = [
        { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: House },
        { id: 'attendance', label: 'উপস্থিতি', icon: ClipboardList },
        { id: 'students', label: 'শিক্ষার্থী', icon: GraduationCap },
        { id: 'classes', label: 'শ্রেণি', icon: BookOpenCheck },
        { id: 'notices', label: 'নোটিশ', icon: Bell },
        { id: 'website', label: 'ওয়েবসাইট CMS', icon: Settings2 }
    ];

    const totalStudents = students.length;
    const totalClasses = classes.length;
    const websiteHref = institution?.custom_domain
        ? `https://${institution.custom_domain}`
        : institution?.subdomain
            ? `http://${institution.subdomain}.localhost:3000`
            : null;

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
                            {websiteHref && (
                                <a
                                    href={websiteHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-[#1b6e3c] hover:text-[#1b6e3c]"
                                >
                                    Website
                                    <ExternalLink size={16} />
                                </a>
                            )}
                            <button type="button" onClick={() => setActiveTab('notices')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">নোটিশ</button>
                            <button type="button" onClick={() => setActiveTab('students')} className="rounded-xl bg-[#1b6e3c] px-4 py-2 text-sm font-black text-white">+ নতুন ভর্তি</button>
                        </div>
                    </header>

                    <div className="space-y-5 p-5">
                        {activeTab === 'dashboard' && (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        ['মোট শিক্ষার্থী', totalStudents, Users],
                                        ['মোট শ্রেণি', totalClasses, BookOpenCheck],
                                        ['আজকের উপস্থিতি', totalStudents ? `${totalStudents}/${totalStudents}` : '০', CalendarCheck],
                                        ['নোটিশ', 'Public', Megaphone]
                                    ].map(([label, value, Icon]) => (
                                        <article key={label} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                            <Icon className="mb-4 text-[#1b6e3c]" />
                                            <p className="text-sm font-bold text-slate-500">{label}</p>
                                            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                                        </article>
                                    ))}
                                </div>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 font-black">দ্রুত কাজ</h2>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        {[
                                            ['উপস্থিতি নিন', 'attendance'],
                                            ['শিক্ষার্থী যোগ করুন', 'students'],
                                            ['নোটিশ দিন', 'notices'],
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
                                            <p className="flex justify-between"><span>শ্রেণি</span><span>{totalClasses}</span></p>
                                            <p className="flex justify-between"><span>শিক্ষার্থী</span><span>{totalStudents}</span></p>
                                            <p className="flex justify-between"><span>Selected class</span><span>{selectedClass?.name || '-'}</span></p>
                                        </div>
                                    </section>
                                </div>
                            </>
                        )}

                        {activeTab === 'classes' && (
                            <>
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 text-xl font-black">শ্রেণি তালিকা</h2>
                                    <div className="flex flex-wrap gap-3">
                                        {classes.length === 0 ? <p className="text-sm font-bold text-slate-400">এখনো কোনো class নেই।</p> : classes.map((item) => (
                                            <button key={item.id} type="button" onClick={async () => {
                                                setSelectedClass(item);
                                                setStudents(await schoolService.getStudents(item.id));
                                            }} className={`rounded-xl px-4 py-3 text-sm font-black ${selectedClass?.id === item.id ? 'bg-[#1b6e3c] text-white' : 'bg-[#f4f2ee] text-slate-600'}`}>
                                                {item.name} {item.section ? `- ${item.section}` : ''}
                                            </button>
                                        ))}
                                    </div>
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
                            <form onSubmit={createStudent} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                <div className="mb-4 flex items-center gap-3"><Plus className="text-[#1b6e3c]" /><h2 className="text-xl font-black">নতুন শিক্ষার্থী</h2></div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <input required disabled={!selectedClass} value={studentForm.student_name} onChange={(e) => setStudentForm({ ...studentForm, student_name: e.target.value })} placeholder="Student name" className="rounded-xl border border-slate-200 px-4 py-3" />
                                    <input value={studentForm.roll_no} onChange={(e) => setStudentForm({ ...studentForm, roll_no: e.target.value })} placeholder="Roll" className="rounded-xl border border-slate-200 px-4 py-3" />
                                    <input value={studentForm.guardian_name} onChange={(e) => setStudentForm({ ...studentForm, guardian_name: e.target.value })} placeholder="Guardian name" className="rounded-xl border border-slate-200 px-4 py-3" />
                                    <input value={studentForm.guardian_phone} onChange={(e) => setStudentForm({ ...studentForm, guardian_phone: e.target.value })} placeholder="Guardian phone" className="rounded-xl border border-slate-200 px-4 py-3" />
                                </div>
                                <button disabled={!selectedClass} className="mt-4 rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white disabled:bg-slate-300">শিক্ষার্থী যোগ করুন</button>
                            </form>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                                <section className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                    <h2 className="mb-4 text-xl font-black">আজকের উপস্থিতি</h2>
                                    <div className="space-y-3">
                                        {students.length === 0 ? <p className="text-sm font-bold text-slate-400">শিক্ষার্থী যোগ করলে এখানে attendance দেখা যাবে।</p> : students.map((student) => (
                                            <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4f2ee] p-4">
                                                <div>
                                                    <p className="font-black">{student.student_name}</p>
                                                    <p className="text-xs font-bold text-slate-400">রোল {student.roll_no || '-'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => markAttendance(student, 'present')} className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-700">উপস্থিত</button>
                                                    <button type="button" onClick={() => markAttendance(student, 'absent')} className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-black text-rose-700">অনুপস্থিত</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                            <form onSubmit={publishNotice} className="rounded-2xl border border-[#d6d3cb] bg-white p-5">
                                <h2 className="mb-4 text-xl font-black">নোটিশ প্রকাশ</h2>
                                <div className="space-y-3">
                                    <input required value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} placeholder="Notice title" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
                                    <textarea value={noticeForm.body} onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })} placeholder="Notice details" className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3" />
                                    <select value={noticeForm.audience} onChange={(e) => setNoticeForm({ ...noticeForm, audience: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3">
                                        <option value="public">Public</option>
                                        <option value="teachers">Teachers</option>
                                        <option value="students">Students</option>
                                        <option value="guardians">Guardians</option>
                                    </select>
                                    <button className="rounded-xl bg-[#1b6e3c] px-4 py-3 font-black text-white">নোটিশ দিন</button>
                                </div>
                            </form>
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
