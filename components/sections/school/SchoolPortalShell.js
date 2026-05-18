'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BookOpenCheck, CalendarCheck, ClipboardList, GraduationCap, Loader2, Trophy, Users } from 'lucide-react';
import { institutionService } from '@/lib/services/institutionService';
import { institutionPortalService } from '@/lib/services/institutionPortalService';
import { getInstitutionDesignProfile } from '@/lib/constants/institutionDesignProfiles';

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

export default function SchoolPortalShell({ schoolId, role }) {
    const [institution, setInstitution] = useState(null);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const copy = ROLE_COPY[role];

    useEffect(() => {
        async function load() {
            try {
                const [membership, currentRole] = await Promise.all([
                    institutionPortalService.getMembership(schoolId, role),
                    institutionPortalService.getCurrentRole()
                ]);
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

    return (
        <div className="space-y-6">
            <div className={`rounded-[32px] bg-gradient-to-br ${design.surface} p-6`}>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${design.badge}`}>{design.eyebrow}</span>
                <h1 className="mt-3 text-3xl font-black text-slate-900">{copy.title}</h1>
                <p className="mt-2 max-w-2xl font-bold text-slate-500">{copy.intro}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { icon: Users, label: 'প্রতিষ্ঠান', value: institution?.name },
                    { icon: CalendarCheck, label: 'Attendance', value: 'চালু' },
                    { icon: BookOpenCheck, label: 'Lesson', value: 'চালু' },
                    { icon: Trophy, label: 'Result', value: 'চালু' }
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
                        ) : notices.map((notice) => (
                            <div key={notice.id} className="rounded-2xl bg-slate-50 p-4">
                                <p className="font-black text-slate-800">{notice.title}</p>
                            </div>
                        ))}
                    </div>
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
        </div>
    );
}
