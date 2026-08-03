'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { schoolService } from '@/lib/services/schoolService';

function csvCell(value) {
    const text = String(value ?? '').replaceAll('"', '""');
    return `"${text}"`;
}

function downloadCsv(filename, headers, rows) {
    const body = [
        headers.map(csvCell).join(','),
        ...rows.map((row) => row.map(csvCell).join(','))
    ].join('\r\n');
    const blob = new Blob([`\uFEFF${body}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

export default function SchoolReportsPanel({ institutionId, classes, profile }) {
    const [loadingReport, setLoadingReport] = useState('');
    const [error, setError] = useState('');
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${today.slice(0, 7)}-01`;

    async function exportStudents() {
        setLoadingReport('students');
        setError('');
        try {
            const groups = await Promise.all(classes.map(async (classInfo) => ({
                classInfo,
                students: await schoolService.getStudents(classInfo.id)
            })));
            const rows = groups.flatMap(({ classInfo, students }) => students.map((student) => [
                student.admission_no,
                student.student_name,
                student.roll_no,
                classInfo.name,
                classInfo.section,
                classInfo.group_name,
                student.guardian_name,
                student.guardian_phone,
                student.enrollment_status,
                student.birth_registration_no
            ]));
            downloadCsv('school-students.csv', ['Admission No', 'Name', 'Roll', 'Class', 'Section', 'Group', 'Guardian', 'Phone', 'Status', 'Birth Registration'], rows);
        } catch (reportError) {
            setError(reportError.message || 'Student report তৈরি করা যায়নি।');
        } finally {
            setLoadingReport('');
        }
    }

    async function exportAttendance() {
        setLoadingReport('attendance');
        setError('');
        try {
            const rows = await schoolService.getInstitutionAttendance(institutionId, monthStart, today);
            downloadCsv('school-attendance-current-month.csv', ['Date', 'Class ID', 'Student ID', 'Status', 'Note'], rows.map((item) => [
                item.attendance_date, item.class_id, item.student_id, item.status, item.note
            ]));
        } catch (reportError) {
            setError(reportError.message || 'Attendance report তৈরি করা যায়নি।');
        } finally {
            setLoadingReport('');
        }
    }

    async function exportFinance() {
        setLoadingReport('finance');
        setError('');
        try {
            const [invoices, entries, payroll] = await Promise.all([
                schoolService.getFeeInvoices(institutionId),
                schoolService.getFinanceEntries(institutionId),
                schoolService.getPayrollRuns(institutionId)
            ]);
            downloadCsv('school-fee-invoices.csv', ['Invoice', 'Student ID', 'Billing Month', 'Due Date', 'Payable', 'Paid', 'Status'], invoices.map((item) => [
                item.invoice_no, item.student_id, item.billing_month, item.due_date, item.payable_amount, item.paid_amount, item.status
            ]));
            downloadCsv('school-income-expense.csv', ['Date', 'Type', 'Category', 'Amount', 'Method', 'Description'], entries.map((item) => [
                item.entry_date, item.entry_type, item.category, item.amount, item.payment_method, item.description
            ]));
            downloadCsv('school-payroll.csv', ['Month', 'Total', 'Status', 'Approved At'], payroll.map((item) => [
                item.payroll_month, item.total_amount, item.status, item.approved_at
            ]));
        } catch (reportError) {
            setError(reportError.message || 'Finance report তৈরি করা যায়নি।');
        } finally {
            setLoadingReport('');
        }
    }

    const reports = [
        { id: 'students', title: `${profile.portal.studentLabel} master list`, text: 'Class, roll, guardian, status ও পরিচয় তথ্য', action: exportStudents },
        { id: 'attendance', title: 'চলতি মাসের attendance', text: `${monthStart} থেকে ${today} পর্যন্ত attendance register`, action: exportAttendance },
        { id: 'finance', title: 'Finance ও payroll', text: 'Invoice, income-expense ও payroll—তিনটি CSV file', action: exportFinance }
    ];

    return (
        <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Reports & export</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">প্রতিষ্ঠানের তথ্য CSV-তে নিন</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">Bangla text ঠিক রাখার জন্য UTF-8 BOM সহ export হয়; Excel ও Google Sheets-এ খোলা যাবে।</p>
            </div>
            {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</p>}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map((report) => (
                    <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <Download className="text-emerald-700" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">{report.title}</h3>
                        <p className="mt-2 min-h-12 text-sm font-bold leading-6 text-slate-500">{report.text}</p>
                        <button type="button" onClick={report.action} disabled={Boolean(loadingReport)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:bg-slate-400">
                            {loadingReport === report.id ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                            CSV export
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
}
