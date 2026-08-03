'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FileCheck2, Loader2, Save, X } from 'lucide-react';
import { schoolService } from '@/lib/services/schoolService';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500';

const TRANSITIONS = [
    { value: 'promoted', label: 'পরবর্তী শ্রেণিতে উত্তীর্ণ' },
    { value: 'repeated', label: 'একই/অন্য শ্রেণি পুনরায়' },
    { value: 'transferred', label: 'Transfer/TC প্রদান' },
    { value: 'completed', label: 'শিক্ষা সম্পন্ন' },
    { value: 'dropped', label: 'পড়াশোনা বন্ধ' },
    { value: 'restored', label: 'পুনরায় সক্রিয়' }
];

export default function StudentLifecycleManager({ student, institutionId, classes, profile, onClose, onUpdated }) {
    const [form, setForm] = useState({
        admission_no: student.admission_no || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        birth_registration_no: student.birth_registration_no || '',
        blood_group: student.blood_group || '',
        address: student.address || '',
        academic_group: student.academic_group || '',
        admission_date: student.admission_date || '',
        care_profile: student.care_profile || {}
    });
    const [transitionForm, setTransitionForm] = useState({
        type: 'promoted',
        class_id: '',
        date: new Date().toISOString().split('T')[0],
        reason: ''
    });
    const [documentForm, setDocumentForm] = useState({
        document_type: 'birth_registration',
        title: 'জন্মনিবন্ধন',
        document_number: '',
        file_url: ''
    });
    const [history, setHistory] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const isKindergarten = profile.type === 'school' && profile.label === 'কিন্ডারগার্টেন';

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            schoolService.getStudentTransitions(student.id),
            schoolService.getStudentDocuments(student.id)
        ]).then(([transitionRows, documentRows]) => {
            if (!cancelled) {
                setHistory(transitionRows);
                setDocuments(documentRows);
            }
        }).catch((loadError) => {
            if (!cancelled) {
                setError(['42P01', 'PGRST205'].includes(loadError?.code)
                    ? 'Student lifecycle migration এখনো database-এ চালানো হয়নি।'
                    : loadError.message || 'Student history লোড করা যায়নি।');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [student.id]);

    async function saveProfile(event) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const updated = await schoolService.updateStudent(student.id, {
                ...form,
                admission_no: form.admission_no || null,
                date_of_birth: form.date_of_birth || null,
                gender: form.gender || null,
                birth_registration_no: form.birth_registration_no || null,
                blood_group: form.blood_group || null,
                academic_group: form.academic_group || null,
                admission_date: form.admission_date || null,
                updated_at: new Date().toISOString()
            });
            onUpdated(updated);
            setMessage('Student profile সংরক্ষণ হয়েছে।');
        } catch (submitError) {
            setError(submitError.message || 'Profile সংরক্ষণ করা যায়নি।');
        } finally {
            setSaving(false);
        }
    }

    async function submitTransition(event) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const needsClass = ['promoted', 'repeated'].includes(transitionForm.type);
            const updated = await schoolService.transitionStudent(
                student.id,
                transitionForm.type,
                needsClass ? transitionForm.class_id : null,
                transitionForm.reason || null,
                transitionForm.date
            );
            onUpdated(updated);
            setHistory(await schoolService.getStudentTransitions(student.id));
            setMessage('Student status ও history আপডেট হয়েছে।');
        } catch (submitError) {
            setError(submitError.message || 'পরিবর্তন সম্পন্ন করা যায়নি।');
        } finally {
            setSaving(false);
        }
    }

    async function addDocument(event) {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const created = await schoolService.createStudentDocument({
                institution_id: institutionId,
                student_id: student.id,
                ...documentForm,
                file_url: documentForm.file_url || null,
                document_number: documentForm.document_number || null
            });
            setDocuments((current) => [created, ...current]);
            setDocumentForm((current) => ({ ...current, document_number: '', file_url: '' }));
            setMessage('Document record যোগ হয়েছে।');
        } catch (submitError) {
            setError(submitError.message || 'Document যোগ করা যায়নি।');
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Student lifecycle</p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">{student.student_name}</h3>
                    <p className="text-sm font-bold text-slate-500">রোল {student.roll_no || '-'} · {student.enrollment_status || 'studying'}</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-xl bg-white p-2 text-slate-500" aria-label="বন্ধ করুন"><X size={18} /></button>
            </div>
            {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
            {message && <p className="mt-4 rounded-xl bg-white p-3 text-sm font-bold text-emerald-700">{message}</p>}
            {loading ? <Loader2 className="mx-auto my-10 animate-spin text-emerald-700" /> : (
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <form onSubmit={saveProfile} className="rounded-2xl bg-white p-4">
                        <h4 className="font-black text-slate-900">পূর্ণ পরিচিতি</h4>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <input value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} className={inputClass} placeholder="Admission no" />
                            <input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} className={inputClass} />
                            <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={inputClass} />
                            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass}><option value="">লিঙ্গ</option><option value="male">ছাত্র</option><option value="female">ছাত্রী</option><option value="other">অন্যান্য</option></select>
                            <input value={form.birth_registration_no} onChange={(e) => setForm({ ...form, birth_registration_no: e.target.value })} className={inputClass} placeholder="জন্মনিবন্ধন নম্বর" />
                            <input value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className={inputClass} placeholder="রক্তের গ্রুপ" />
                            <input value={form.academic_group} onChange={(e) => setForm({ ...form, academic_group: e.target.value })} className={inputClass} placeholder="বিভাগ/Track" />
                            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="ঠিকানা" />
                            {isKindergarten && <>
                                <input value={form.care_profile?.pickup_person || ''} onChange={(e) => setForm({ ...form, care_profile: { ...form.care_profile, pickup_person: e.target.value } })} className={inputClass} placeholder="অনুমোদিত pickup person" />
                                <input value={form.care_profile?.allergies || ''} onChange={(e) => setForm({ ...form, care_profile: { ...form.care_profile, allergies: e.target.value } })} className={inputClass} placeholder="Allergy/স্বাস্থ্য নোট" />
                            </>}
                        </div>
                        <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white"><Save size={17} /> Profile সংরক্ষণ</button>
                    </form>
                    <form onSubmit={submitTransition} className="rounded-2xl bg-white p-4">
                        <h4 className="font-black text-slate-900">Promotion / Transfer / TC</h4>
                        <div className="mt-4 space-y-3">
                            <select value={transitionForm.type} onChange={(e) => setTransitionForm({ ...transitionForm, type: e.target.value })} className={inputClass}>{TRANSITIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                            {['promoted', 'repeated'].includes(transitionForm.type) && <select required value={transitionForm.class_id} onChange={(e) => setTransitionForm({ ...transitionForm, class_id: e.target.value })} className={inputClass}><option value="">নতুন শ্রেণি নির্বাচন</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} {item.section || ''}</option>)}</select>}
                            <input type="date" value={transitionForm.date} onChange={(e) => setTransitionForm({ ...transitionForm, date: e.target.value })} className={inputClass} />
                            <textarea value={transitionForm.reason} onChange={(e) => setTransitionForm({ ...transitionForm, reason: e.target.value })} className={`${inputClass} min-h-24`} placeholder="কারণ/মন্তব্য" />
                        </div>
                        <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-black text-white"><ArrowRight size={17} /> পরিবর্তন নিশ্চিত করুন</button>
                    </form>
                    <form onSubmit={addDocument} className="rounded-2xl bg-white p-4">
                        <h4 className="font-black text-slate-900">Document record</h4>
                        <div className="mt-4 space-y-3">
                            <select value={documentForm.document_type} onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })} className={inputClass}><option value="birth_registration">জন্মনিবন্ধন</option><option value="photo">ছবি</option><option value="previous_certificate">পূর্বের সনদ</option><option value="guardian_id">অভিভাবকের পরিচয়পত্র</option><option value="medical">Medical</option><option value="other">অন্যান্য</option></select>
                            <input required value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} className={inputClass} placeholder="Document title" />
                            <input value={documentForm.document_number} onChange={(e) => setDocumentForm({ ...documentForm, document_number: e.target.value })} className={inputClass} placeholder="Document number" />
                            <input value={documentForm.file_url} onChange={(e) => setDocumentForm({ ...documentForm, file_url: e.target.value })} className={inputClass} placeholder="Private storage URL/path (ঐচ্ছিক)" />
                        </div>
                        <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-black text-white"><FileCheck2 size={17} /> Document যোগ করুন</button>
                        <div className="mt-4 space-y-2">{documents.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600">{item.title} · {item.verification_status}</div>)}</div>
                    </form>
                    <div className="rounded-2xl bg-white p-4">
                        <h4 className="font-black text-slate-900">পরিবর্তনের ইতিহাস</h4>
                        <div className="mt-4 space-y-2">
                            {history.length === 0 && <p className="text-sm font-bold text-slate-400">কোনো transition history নেই।</p>}
                            {history.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3"><p className="font-black text-slate-800">{item.transition_type}</p><p className="text-xs font-bold text-slate-500">{item.effective_date}{item.certificate_no ? ` · ${item.certificate_no}` : ''}</p></div>)}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
