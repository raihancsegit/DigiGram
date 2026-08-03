'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarRange, CheckCircle2, CircleDollarSign, Loader2, Plus, Trash2 } from 'lucide-react';
import { schoolService } from '@/lib/services/schoolService';

const WEEKDAYS = [
    { value: 0, label: 'রবিবার' },
    { value: 1, label: 'সোমবার' },
    { value: 2, label: 'মঙ্গলবার' },
    { value: 3, label: 'বুধবার' },
    { value: 4, label: 'বৃহস্পতিবার' },
    { value: 5, label: 'শুক্রবার' },
    { value: 6, label: 'শনিবার' }
];

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500';

function money(value) {
    return new Intl.NumberFormat('bn-BD', {
        style: 'currency',
        currency: 'BDT',
        maximumFractionDigits: 0
    }).format(Number(value || 0));
}

export default function SchoolOperationsManager({ institutionId, mode, classes, subjects, teachers, students, profile }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [routine, setRoutine] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [financeEntries, setFinanceEntries] = useState([]);
    const [compensation, setCompensation] = useState([]);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [lastPayment, setLastPayment] = useState(null);
    const [routineForm, setRoutineForm] = useState({
        class_id: classes[0]?.id || '',
        subject_id: '',
        teacher_id: '',
        weekday: 0,
        period_no: 1,
        starts_at: '09:00',
        ends_at: '09:45',
        activity_type: 'class',
        room_label: ''
    });
    const currentYear = new Date().getFullYear();
    const [sessionForm, setSessionForm] = useState({
        name: `${currentYear} শিক্ষাবর্ষ`,
        starts_on: `${currentYear}-01-01`,
        ends_on: `${currentYear}-12-31`
    });
    const [feeForm, setFeeForm] = useState({
        name: 'মাসিক বেতন',
        amount: '',
        frequency: 'monthly',
        class_id: ''
    });
    const [invoiceForm, setInvoiceForm] = useState({
        student_id: '',
        subtotal: '',
        due_date: '',
        billing_month: new Date().toISOString().slice(0, 7) + '-01',
        note: ''
    });
    const [paymentForm, setPaymentForm] = useState({ invoice_id: '', amount: '', payment_method: 'cash' });
    const [ledgerForm, setLedgerForm] = useState({ entry_type: 'expense', category: '', amount: '', payment_method: 'cash', description: '' });
    const [salaryForm, setSalaryForm] = useState({ profile_id: '', base_salary: '', allowance_amount: '0' });
    const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7) + '-01');

    useEffect(() => {
        let cancelled = false;
        async function loadOperations() {
            setLoading(true);
            setError('');
            try {
                if (mode === 'routine') {
                    const [rows, sessionRows] = await Promise.all([
                        schoolService.getRoutinePeriods(institutionId),
                        schoolService.getAcademicSessions(institutionId)
                    ]);
                    if (!cancelled) {
                        setRoutine(rows);
                        setSessions(sessionRows);
                        const currentSession = sessionRows.find((item) => item.is_current);
                        if (currentSession) {
                            setRoutineForm((form) => ({ ...form, session_id: currentSession.id }));
                        }
                    }
                } else {
                    const [types, bills, ledgerRows, salaryRows, payrollRows] = await Promise.all([
                        schoolService.getFeeTypes(institutionId),
                        schoolService.getFeeInvoices(institutionId),
                        schoolService.getFinanceEntries(institutionId),
                        schoolService.getStaffCompensation(institutionId),
                        schoolService.getPayrollRuns(institutionId)
                    ]);
                    if (!cancelled) {
                        setFeeTypes(types);
                        setInvoices(bills);
                        setFinanceEntries(ledgerRows);
                        setCompensation(salaryRows);
                        setPayrollRuns(payrollRows);
                    }
                }
            } catch (loadError) {
                if (!cancelled) {
                    const missingTable = ['42P01', 'PGRST205'].includes(loadError?.code);
                    setError(missingTable
                        ? 'School Operations migration এখনো database-এ চালানো হয়নি। database/79_school_operations_foundation.sql চালান।'
                        : loadError.message || 'তথ্য লোড করা যায়নি।');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadOperations();
        return () => { cancelled = true; };
    }, [institutionId, mode]);

    const routineByDay = useMemo(() => WEEKDAYS.map((day) => ({
        ...day,
        rows: routine.filter((item) => Number(item.weekday) === day.value)
    })), [routine]);

    async function addRoutine(event) {
        event.preventDefault();
        setError('');
        try {
            const created = await schoolService.createRoutinePeriod({
                institution_id: institutionId,
                ...routineForm,
                weekday: Number(routineForm.weekday),
                period_no: Number(routineForm.period_no),
                subject_id: routineForm.subject_id || null,
                teacher_id: routineForm.teacher_id || null,
                session_id: routineForm.session_id || null,
                room_label: routineForm.room_label || null
            });
            setRoutine((current) => [...current, created].sort((a, b) => a.weekday - b.weekday || a.period_no - b.period_no));
            setRoutineForm((current) => ({ ...current, period_no: Number(current.period_no) + 1 }));
        } catch (submitError) {
            setError(submitError.message || 'রুটিন যোগ করা যায়নি।');
        }
    }

    async function addSession(event) {
        event.preventDefault();
        setError('');
        try {
            const created = await schoolService.createAcademicSession({
                institution_id: institutionId,
                ...sessionForm,
                status: 'active'
            });
            const activated = await schoolService.activateAcademicSession(created.id);
            setSessions((current) => [activated, ...current.map((item) => ({ ...item, is_current: false }))]);
            setRoutineForm((current) => ({ ...current, session_id: activated.id }));
        } catch (submitError) {
            setError(submitError.message || 'শিক্ষাবর্ষ তৈরি করা যায়নি।');
        }
    }

    async function activateSession(sessionId) {
        setError('');
        try {
            const activated = await schoolService.activateAcademicSession(sessionId);
            setSessions((current) => current.map((item) => ({
                ...item,
                is_current: item.id === activated.id
            })));
            setRoutineForm((current) => ({ ...current, session_id: activated.id }));
        } catch (submitError) {
            setError(submitError.message || 'শিক্ষাবর্ষ চালু করা যায়নি।');
        }
    }

    async function removeRoutine(id) {
        setError('');
        try {
            await schoolService.deleteRoutinePeriod(id);
            setRoutine((current) => current.filter((item) => item.id !== id));
        } catch (submitError) {
            setError(submitError.message || 'রুটিন মুছতে সমস্যা হয়েছে।');
        }
    }

    async function addFeeType(event) {
        event.preventDefault();
        setError('');
        try {
            const created = await schoolService.createFeeType({
                institution_id: institutionId,
                ...feeForm,
                amount: Number(feeForm.amount),
                class_id: feeForm.class_id || null
            });
            setFeeTypes((current) => [...current, created]);
            setFeeForm((current) => ({ ...current, name: '', amount: '' }));
        } catch (submitError) {
            setError(submitError.message || 'ফি যোগ করা যায়নি।');
        }
    }

    async function createInvoice(event) {
        event.preventDefault();
        setError('');
        try {
            const student = students.find((item) => item.id === invoiceForm.student_id);
            const created = await schoolService.createFeeInvoice({
                institution_id: institutionId,
                student_id: invoiceForm.student_id,
                class_id: student?.class_id || null,
                subtotal: Number(invoiceForm.subtotal),
                billing_month: invoiceForm.billing_month || null,
                due_date: invoiceForm.due_date || null,
                note: invoiceForm.note || null,
                status: 'due',
                line_items: [{ label: 'প্রতিষ্ঠান ফি', amount: Number(invoiceForm.subtotal) }]
            });
            setInvoices((current) => [created, ...current]);
            setInvoiceForm((current) => ({ ...current, student_id: '', subtotal: '', note: '' }));
        } catch (submitError) {
            setError(submitError.message || 'Invoice তৈরি করা যায়নি।');
        }
    }

    async function recordPayment(event) {
        event.preventDefault();
        setError('');
        try {
            const receipt = await schoolService.recordFeePayment(
                paymentForm.invoice_id,
                Number(paymentForm.amount),
                paymentForm.payment_method
            );
            setLastPayment(receipt);
            const [billRows, ledgerRows] = await Promise.all([
                schoolService.getFeeInvoices(institutionId),
                schoolService.getFinanceEntries(institutionId)
            ]);
            setInvoices(billRows);
            setFinanceEntries(ledgerRows);
            setPaymentForm({ invoice_id: '', amount: '', payment_method: 'cash' });
        } catch (submitError) {
            setError(submitError.message || 'Payment record করা যায়নি।');
        }
    }

    async function addLedgerEntry(event) {
        event.preventDefault();
        setError('');
        try {
            const created = await schoolService.createFinanceEntry({
                institution_id: institutionId,
                ...ledgerForm,
                amount: Number(ledgerForm.amount)
            });
            setFinanceEntries((current) => [created, ...current]);
            setLedgerForm((current) => ({ ...current, category: '', amount: '', description: '' }));
        } catch (submitError) {
            setError(submitError.message || 'হিসাব যোগ করা যায়নি।');
        }
    }

    async function saveSalary(event) {
        event.preventDefault();
        setError('');
        try {
            const saved = await schoolService.saveStaffCompensation({
                institution_id: institutionId,
                profile_id: salaryForm.profile_id,
                base_salary: Number(salaryForm.base_salary),
                allowance_amount: Number(salaryForm.allowance_amount || 0),
                effective_from: new Date().toISOString().split('T')[0],
                is_active: true
            });
            setCompensation((current) => [...current.filter((item) => item.profile_id !== saved.profile_id), saved]);
            setSalaryForm({ profile_id: '', base_salary: '', allowance_amount: '0' });
        } catch (submitError) {
            setError(submitError.message || 'Salary setup সংরক্ষণ করা যায়নি।');
        }
    }

    async function generatePayroll() {
        setError('');
        try {
            const created = await schoolService.generatePayroll(institutionId, payrollMonth);
            setPayrollRuns((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        } catch (submitError) {
            setError(submitError.message || 'Payroll তৈরি করা যায়নি।');
        }
    }

    async function payPayroll(payrollId) {
        setError('');
        try {
            const updated = await schoolService.markPayrollPaid(payrollId);
            setPayrollRuns((current) => current.map((item) => item.id === updated.id ? updated : item));
            setFinanceEntries(await schoolService.getFinanceEntries(institutionId));
        } catch (submitError) {
            setError(submitError.message || 'Payroll paid করা যায়নি।');
        }
    }

    if (loading) {
        return <div className="rounded-2xl bg-white p-12 text-center"><Loader2 className="mx-auto animate-spin text-emerald-700" /></div>;
    }

    if (mode === 'routine') {
        return (
            <div className="space-y-5">
                {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
                <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
                    <form onSubmit={addSession} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <CalendarRange className="text-emerald-700" />
                            <div><h2 className="font-black">শিক্ষাবর্ষ/Session</h2><p className="text-sm font-bold text-slate-500">Routine, fee ও result একই session-এর অধীনে রাখুন।</p></div>
                        </div>
                        <div className="space-y-3">
                            <input required value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} className={fieldClass} placeholder="শিক্ষাবর্ষের নাম" />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input required type="date" value={sessionForm.starts_on} onChange={(e) => setSessionForm({ ...sessionForm, starts_on: e.target.value })} className={fieldClass} />
                                <input required type="date" value={sessionForm.ends_on} onChange={(e) => setSessionForm({ ...sessionForm, ends_on: e.target.value })} className={fieldClass} />
                            </div>
                        </div>
                        <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-black text-white"><Plus size={18} /> শিক্ষাবর্ষ তৈরি করুন</button>
                    </form>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="font-black">শিক্ষাবর্ষ তালিকা</h2>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {sessions.length === 0 && <p className="text-sm font-bold text-slate-400">এখনো কোনো শিক্ষাবর্ষ নেই।</p>}
                            {sessions.map((session) => (
                                <button key={session.id} type="button" onClick={() => activateSession(session.id)} className={`rounded-xl border p-4 text-left ${session.is_current ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="font-black text-slate-900">{session.name}</span>
                                        {session.is_current && <CheckCircle2 size={18} className="text-emerald-700" />}
                                    </span>
                                    <span className="mt-1 block text-xs font-bold text-slate-500">{session.starts_on} — {session.ends_on}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
                <form onSubmit={addRoutine} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <CalendarClock className="text-emerald-700" />
                        <div><h2 className="text-xl font-black">ক্লাস রুটিন</h2><p className="text-sm font-bold text-slate-500">{profile.portal.classLabel}, বিষয় ও সময় মিলিয়ে period তৈরি করুন।</p></div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <select value={routineForm.session_id || ''} onChange={(e) => setRoutineForm({ ...routineForm, session_id: e.target.value })} className={fieldClass}>
                            <option value="">শিক্ষাবর্ষ নির্বাচন</option>
                            {sessions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.is_current ? ' (চলতি)' : ''}</option>)}
                        </select>
                        <select required value={routineForm.class_id} onChange={(e) => setRoutineForm({ ...routineForm, class_id: e.target.value })} className={fieldClass}>
                            <option value="">শ্রেণি নির্বাচন</option>
                            {classes.map((item) => <option key={item.id} value={item.id}>{item.name} {item.section || ''}</option>)}
                        </select>
                        <select value={routineForm.subject_id} onChange={(e) => setRoutineForm({ ...routineForm, subject_id: e.target.value })} className={fieldClass}>
                            <option value="">বিষয়/কার্যক্রম</option>
                            {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <select value={routineForm.teacher_id} onChange={(e) => setRoutineForm({ ...routineForm, teacher_id: e.target.value })} className={fieldClass}>
                            <option value="">{profile.staffLabel || 'শিক্ষক'} নির্বাচন</option>
                            {teachers.map((item) => <option key={item.profile_id || item.id} value={item.profile_id}>{item.display_name || item.title}</option>)}
                        </select>
                        <select value={routineForm.weekday} onChange={(e) => setRoutineForm({ ...routineForm, weekday: e.target.value })} className={fieldClass}>
                            {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                        </select>
                        <input type="number" min="1" max="20" value={routineForm.period_no} onChange={(e) => setRoutineForm({ ...routineForm, period_no: e.target.value })} className={fieldClass} placeholder="পিরিয়ড" />
                        <input type="time" value={routineForm.starts_at} onChange={(e) => setRoutineForm({ ...routineForm, starts_at: e.target.value })} className={fieldClass} />
                        <input type="time" value={routineForm.ends_at} onChange={(e) => setRoutineForm({ ...routineForm, ends_at: e.target.value })} className={fieldClass} />
                        <input value={routineForm.room_label} onChange={(e) => setRoutineForm({ ...routineForm, room_label: e.target.value })} className={fieldClass} placeholder="কক্ষ/রুম (ঐচ্ছিক)" />
                    </div>
                    <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white"><Plus size={18} /> রুটিনে যোগ করুন</button>
                </form>
                <section className="grid gap-4 xl:grid-cols-2">
                    {routineByDay.map((day) => (
                        <article key={day.value} className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="font-black text-slate-900">{day.label}</h3>
                            <div className="mt-3 space-y-2">
                                {day.rows.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-400">কোনো পিরিয়ড নেই</p>}
                                {day.rows.map((period) => {
                                    const classItem = classes.find((item) => item.id === period.class_id);
                                    const subject = subjects.find((item) => item.id === period.subject_id);
                                    return (
                                        <div key={period.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                                            <div>
                                                <p className="font-black text-slate-900">{period.period_no}. {classItem?.name || 'শ্রেণি'} · {subject?.name || period.activity_type}</p>
                                                <p className="text-xs font-bold text-slate-500">{period.starts_at?.slice(0, 5)}–{period.ends_at?.slice(0, 5)} {period.room_label ? `· ${period.room_label}` : ''}</p>
                                            </div>
                                            <button type="button" onClick={() => removeRoutine(period.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="রুটিন মুছুন"><Trash2 size={17} /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        );
    }

    const dueTotal = invoices.reduce((sum, item) => sum + Math.max(Number(item.payable_amount || 0) - Number(item.paid_amount || 0), 0), 0);
    const incomeTotal = financeEntries.filter((item) => item.entry_type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenseTotal = financeEntries.filter((item) => item.entry_type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return (
        <div className="space-y-5">
            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
            {lastPayment && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Payment receipt</p><h2 className="mt-1 text-xl font-black">{lastPayment.receipt_no}</h2><p className="text-sm font-bold text-slate-600">{money(lastPayment.amount)} · {lastPayment.payment_method}</p></div>
                        <button type="button" onClick={() => window.print()} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white">Receipt print</button>
                    </div>
                </section>
            )}
            <div className="grid gap-4 md:grid-cols-3">
                {[['ফি-এর ধরন', feeTypes.length], ['মোট বিল', invoices.length], ['মোট বকেয়া', money(dueTotal)]].map(([label, value]) => (
                    <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                    </article>
                ))}
            </div>
            <form onSubmit={addFeeType} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3"><CircleDollarSign className="text-emerald-700" /><div><h2 className="text-xl font-black">ফি কাঠামো</h2><p className="text-sm font-bold text-slate-500">মাসিক বেতন, ভর্তি, পরীক্ষা বা পরিবহন ফি নির্ধারণ করুন।</p></div></div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input required value={feeForm.name} onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })} className={fieldClass} placeholder="ফি-এর নাম" />
                    <input required type="number" min="0" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} className={fieldClass} placeholder="টাকার পরিমাণ" />
                    <select value={feeForm.frequency} onChange={(e) => setFeeForm({ ...feeForm, frequency: e.target.value })} className={fieldClass}>
                        <option value="one_time">একবার</option><option value="monthly">মাসিক</option><option value="quarterly">ত্রৈমাসিক</option><option value="half_yearly">ষাণ্মাসিক</option><option value="yearly">বার্ষিক</option>
                    </select>
                    <select value={feeForm.class_id} onChange={(e) => setFeeForm({ ...feeForm, class_id: e.target.value })} className={fieldClass}>
                        <option value="">সব {profile.portal.classLabel}</option>
                        {classes.map((item) => <option key={item.id} value={item.id}>{item.name} {item.section || ''}</option>)}
                    </select>
                </div>
                <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white"><Plus size={18} /> ফি যোগ করুন</button>
            </form>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-black">চলতি ফি তালিকা</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {feeTypes.length === 0 && <p className="text-sm font-bold text-slate-400">এখনো ফি কাঠামো যোগ করা হয়নি।</p>}
                    {feeTypes.map((fee) => (
                        <article key={fee.id} className="rounded-2xl bg-slate-50 p-4">
                            <p className="font-black text-slate-900">{fee.name}</p>
                            <p className="mt-1 text-xl font-black text-emerald-700">{money(fee.amount)}</p>
                            <p className="text-xs font-bold text-slate-500">{fee.frequency}</p>
                        </article>
                    ))}
                </div>
            </section>
            <section className="grid gap-5 xl:grid-cols-2">
                <form onSubmit={createInvoice} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-xl font-black">Student invoice তৈরি</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <select required value={invoiceForm.student_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, student_id: e.target.value })} className={fieldClass}>
                            <option value="">{profile.portal.studentLabel} নির্বাচন</option>
                            {students.map((item) => <option key={item.id} value={item.id}>{item.student_name} · রোল {item.roll_no || '-'}</option>)}
                        </select>
                        <input required type="number" min="1" value={invoiceForm.subtotal} onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })} className={fieldClass} placeholder="মোট টাকা" />
                        <input type="month" value={invoiceForm.billing_month?.slice(0, 7)} onChange={(e) => setInvoiceForm({ ...invoiceForm, billing_month: `${e.target.value}-01` })} className={fieldClass} />
                        <input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className={fieldClass} />
                        <input value={invoiceForm.note} onChange={(e) => setInvoiceForm({ ...invoiceForm, note: e.target.value })} className={`${fieldClass} sm:col-span-2`} placeholder="বিবরণ" />
                    </div>
                    <button className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-black text-white">Invoice তৈরি করুন</button>
                </form>
                <form onSubmit={recordPayment} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-xl font-black">Payment ও receipt</h2>
                    <div className="mt-4 space-y-3">
                        <select required value={paymentForm.invoice_id} onChange={(e) => setPaymentForm({ ...paymentForm, invoice_id: e.target.value })} className={fieldClass}>
                            <option value="">বকেয়া invoice নির্বাচন</option>
                            {invoices.filter((item) => ['due', 'partial'].includes(item.status)).map((item) => {
                                const student = students.find((row) => row.id === item.student_id);
                                return <option key={item.id} value={item.id}>{item.invoice_no} · {student?.student_name || 'Student'} · বাকি {money(Number(item.payable_amount) - Number(item.paid_amount))}</option>;
                            })}
                        </select>
                        <input required type="number" min="1" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className={fieldClass} placeholder="জমার পরিমাণ" />
                        <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} className={fieldClass}>
                            <option value="cash">Cash</option><option value="bank">Bank</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option>
                        </select>
                    </div>
                    <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white">Payment গ্রহণ করুন</button>
                </form>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-black">Invoice ও বকেয়া তালিকা</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead><tr className="bg-slate-50 text-xs font-black text-slate-500"><th className="p-3">Invoice</th><th className="p-3">Student</th><th className="p-3">Payable</th><th className="p-3">Paid</th><th className="p-3">Due</th><th className="p-3">Status</th></tr></thead>
                        <tbody>{invoices.map((invoice) => {
                            const student = students.find((item) => item.id === invoice.student_id);
                            return <tr key={invoice.id} className="border-t border-slate-100"><td className="p-3 font-black">{invoice.invoice_no}</td><td className="p-3">{student?.student_name || '-'}</td><td className="p-3">{money(invoice.payable_amount)}</td><td className="p-3">{money(invoice.paid_amount)}</td><td className="p-3 font-black text-rose-700">{money(Math.max(Number(invoice.payable_amount) - Number(invoice.paid_amount), 0))}</td><td className="p-3">{invoice.status}</td></tr>;
                        })}</tbody>
                    </table>
                </div>
            </section>
            <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                <form onSubmit={addLedgerEntry} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-xl font-black">Income / Expense</h2>
                    <div className="mt-4 space-y-3">
                        <select value={ledgerForm.entry_type} onChange={(e) => setLedgerForm({ ...ledgerForm, entry_type: e.target.value })} className={fieldClass}><option value="income">আয়</option><option value="expense">ব্যয়</option></select>
                        <input required value={ledgerForm.category} onChange={(e) => setLedgerForm({ ...ledgerForm, category: e.target.value })} className={fieldClass} placeholder="Category" />
                        <input required type="number" min="1" value={ledgerForm.amount} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} className={fieldClass} placeholder="টাকার পরিমাণ" />
                        <input value={ledgerForm.description} onChange={(e) => setLedgerForm({ ...ledgerForm, description: e.target.value })} className={fieldClass} placeholder="বিবরণ" />
                    </div>
                    <button className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-black text-white">হিসাবে যোগ করুন</button>
                </form>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[['মোট আয়', money(incomeTotal), 'text-emerald-700'], ['মোট ব্যয়', money(expenseTotal), 'text-rose-700'], ['Balance', money(incomeTotal - expenseTotal), 'text-slate-900']].map(([label, value, tone]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500">{label}</p><p className={`mt-1 text-xl font-black ${tone}`}>{value}</p></div>)}
                    </div>
                    <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                        {financeEntries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-black">{entry.category}</p><p className="text-xs font-bold text-slate-500">{entry.entry_date} · {entry.description || entry.payment_method}</p></div><p className={`font-black ${entry.entry_type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{entry.entry_type === 'income' ? '+' : '-'}{money(entry.amount)}</p></div>)}
                    </div>
                </div>
            </section>
            <section className="grid gap-5 xl:grid-cols-2">
                <form onSubmit={saveSalary} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-xl font-black">Staff salary setup</h2>
                    <div className="mt-4 space-y-3">
                        <select required value={salaryForm.profile_id} onChange={(e) => setSalaryForm({ ...salaryForm, profile_id: e.target.value })} className={fieldClass}><option value="">Staff নির্বাচন</option>{teachers.map((item) => <option key={item.profile_id || item.id} value={item.profile_id}>{item.display_name || item.title}</option>)}</select>
                        <input required type="number" min="0" value={salaryForm.base_salary} onChange={(e) => setSalaryForm({ ...salaryForm, base_salary: e.target.value })} className={fieldClass} placeholder="মূল বেতন" />
                        <input type="number" min="0" value={salaryForm.allowance_amount} onChange={(e) => setSalaryForm({ ...salaryForm, allowance_amount: e.target.value })} className={fieldClass} placeholder="ভাতা" />
                    </div>
                    <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white">Salary সংরক্ষণ</button>
                    <div className="mt-4 space-y-2">{compensation.map((item) => {
                        const teacher = teachers.find((row) => row.profile_id === item.profile_id);
                        return <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm font-bold">{teacher?.display_name || 'Staff'} · {money(Number(item.base_salary) + Number(item.allowance_amount))}</div>;
                    })}</div>
                </form>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-xl font-black">Monthly payroll</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <input type="month" value={payrollMonth.slice(0, 7)} onChange={(e) => setPayrollMonth(`${e.target.value}-01`)} className={`${fieldClass} max-w-64`} />
                        <button type="button" onClick={generatePayroll} className="rounded-xl bg-slate-900 px-4 py-3 font-black text-white">Payroll তৈরি</button>
                    </div>
                    <div className="mt-4 space-y-3">{payrollRuns.map((run) => <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-black">{run.payroll_month?.slice(0, 7)}</p><p className="text-sm font-bold text-slate-500">{money(run.total_amount)} · {run.status}</p></div>{run.status !== 'paid' && <button type="button" onClick={() => payPayroll(run.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white">Paid করুন</button>}</div>)}</div>
                </div>
            </section>
        </div>
    );
}
