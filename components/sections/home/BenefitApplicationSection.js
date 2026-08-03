import Link from 'next/link';
import { ArrowRight, Baby, BadgeDollarSign, HeartHandshake, PersonStanding, ShieldCheck, Users } from 'lucide-react';

const BENEFITS = [
    { id: 'maternity', title: 'মাতৃত্বকালীন ভাতা', text: 'গর্ভবতী মা ও নবজাতকের সহায়তার আবেদন প্রস্তুত করুন।', icon: Baby, tone: 'bg-rose-50 text-rose-700 ring-rose-100' },
    { id: 'elderly', title: 'বয়স্ক ভাতা', text: 'বয়স্ক নাগরিকের তথ্য ও প্রয়োজনীয় কাগজপত্র গুছিয়ে নিন।', icon: PersonStanding, tone: 'bg-amber-50 text-amber-700 ring-amber-100' },
    { id: 'widow', title: 'বিধবা ও স্বামী নিগৃহীতা ভাতা', text: 'আবেদনের তথ্য, পরিচয় ও সহায়ক নথির তালিকা তৈরি করুন।', icon: HeartHandshake, tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
    { id: 'disability', title: 'প্রতিবন্ধী ভাতা', text: 'প্রতিবন্ধিতা ও পরিচয়সংক্রান্ত নথিসহ আবেদন প্রস্তুত করুন।', icon: Users, tone: 'bg-sky-50 text-sky-700 ring-sky-100' },
];

export default function BenefitApplicationSection() {
    return (
        <section id="benefit-applications" className="bg-white px-4 py-12 sm:px-6 md:py-20">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-200 sm:p-8 lg:p-12">
                <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-teal-300 ring-1 ring-white/10">
                            <ShieldCheck size={15} /> সহজ আবেদন প্রস্তুতি
                        </p>
                        <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">ভাতার আবেদন এখন ঘরে বসেই গুছিয়ে নিন</h2>
                        <p className="mt-4 max-w-xl font-medium leading-7 text-slate-300">
                            সেবা বাছাই করুন, যোগ্যতা যাচাই করুন, প্রয়োজনীয় তথ্য দিন এবং জমা দেওয়ার উপযোগী আবেদন সারাংশ তৈরি করুন।
                        </p>
                        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-400/10 p-4 text-sm font-bold leading-6 text-amber-100 ring-1 ring-amber-300/20">
                            <BadgeDollarSign className="mt-0.5 shrink-0" size={20} />
                            DigiGram আবেদন প্রস্তুত করতে সাহায্য করে। চূড়ান্ত অনুমোদন ও ভাতা প্রদান সংশ্লিষ্ট সরকারি কর্তৃপক্ষের সিদ্ধান্ত।
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {BENEFITS.map((benefit) => {
                            const Icon = benefit.icon;
                            return (
                                <Link key={benefit.id} href={`/benefits/apply?service=${benefit.id}`} className="group rounded-3xl bg-white p-5 text-slate-950 transition hover:-translate-y-1 hover:shadow-xl">
                                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${benefit.tone}`}><Icon size={23} /></span>
                                    <h3 className="mt-5 text-lg font-black">{benefit.title}</h3>
                                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{benefit.text}</p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-teal-700">আবেদন প্রস্তুত করুন <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
