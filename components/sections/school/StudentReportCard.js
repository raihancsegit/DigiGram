'use client';

import { Printer } from 'lucide-react';

export default function StudentReportCard({ institution, student, exam, classInfo, summary }) {
    if (!student || !exam || !summary) return null;

    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 print:rounded-none print:border-slate-300 print:p-0">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-xl font-black text-slate-900">রিপোর্ট কার্ড</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">{exam.name}</p>
                </div>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white"
                >
                    <Printer size={16} />
                    প্রিন্ট করুন
                </button>
            </div>

            <article className="mx-auto max-w-4xl bg-white p-5 text-slate-900 print:max-w-none print:p-5">
                <header className="border-b-2 border-slate-900 pb-4 text-center">
                    <h1 className="text-2xl font-black">{institution?.name}</h1>
                    <p className="mt-1 text-sm font-bold text-slate-500">{institution?.village || ''}</p>
                    <h2 className="mt-4 text-lg font-black">{exam.name} - রিপোর্ট কার্ড</h2>
                </header>

                <div className="mt-5 grid gap-3 text-sm font-bold sm:grid-cols-2">
                    <p>শিক্ষার্থীর নাম: <span className="font-black">{student.student_name}</span></p>
                    <p>রোল: <span className="font-black">{student.roll_no || '-'}</span></p>
                    <p>শ্রেণি: <span className="font-black">{classInfo?.name || '-'}</span></p>
                    <p>অভিভাবক: <span className="font-black">{student.guardian_name || '-'}</span></p>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 print:rounded-none">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-left text-xs font-black text-slate-600">
                                <th className="px-4 py-3">বিষয়</th>
                                <th className="px-4 py-3">পূর্ণমান</th>
                                <th className="px-4 py-3">প্রাপ্ত নম্বর</th>
                                <th className="px-4 py-3">গ্রেড</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.subjectResults.map((item) => (
                                <tr key={item.subject.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3 font-bold">{item.subject.name}</td>
                                    <td className="px-4 py-3">{item.totalMarks}</td>
                                    <td className="px-4 py-3">{item.hasMarks ? item.obtainedMarks : '-'}</td>
                                    <td className="px-4 py-3">{item.grade || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                    <ResultStat label="মোট" value={`${summary.obtainedTotal}/${summary.totalMarks}`} />
                    <ResultStat label="শতাংশ" value={summary.percentage === null ? '-' : `${summary.percentage.toFixed(2)}%`} />
                    <ResultStat label="গ্রেড" value={summary.overallGrade || '-'} />
                    <ResultStat label="র‍্যাংক" value={summary.rank || '-'} />
                </div>

                <div className="mt-8 flex justify-between pt-8 text-sm font-bold text-slate-600">
                    <span>শ্রেণি শিক্ষক</span>
                    <span>প্রধান শিক্ষক</span>
                </div>
            </article>
        </section>
    );
}

function ResultStat({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4 text-center print:border print:border-slate-200 print:bg-white">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
        </div>
    );
}
