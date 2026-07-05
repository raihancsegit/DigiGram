import Link from 'next/link';
import {
    Activity,
    ArrowRight,
    BellRing,
    CheckCircle2,
    ClipboardCheck,
    Database,
    FileText,
    GitBranch,
    Landmark,
    MessageSquareText,
    MonitorSmartphone,
    Rocket,
    School,
    ShieldCheck,
    Smartphone,
    WalletCards,
    Wrench
} from 'lucide-react';
import LaunchHealthPanel from './LaunchHealthPanel';

const envChecks = [
    { label: 'Supabase URL', ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), key: 'NEXT_PUBLIC_SUPABASE_URL' },
    { label: 'Supabase anon key', ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
    { label: 'Service role key', ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), key: 'SUPABASE_SERVICE_ROLE_KEY' },
    { label: 'SMS worker secret', ok: Boolean(process.env.SMS_WORKER_SECRET || process.env.CRON_SECRET), key: 'SMS_WORKER_SECRET / CRON_SECRET' },
    { label: 'SMS webhook secret', ok: Boolean(process.env.SMS_WEBHOOK_SECRET), key: 'SMS_WEBHOOK_SECRET' },
    { label: 'Gemini API key', ok: Boolean(process.env.GEMINI_API_KEY), key: 'GEMINI_API_KEY' }
];

const readinessCards = [
    {
        title: 'Citizen Service Flow',
        status: 'High impact',
        icon: Smartphone,
        href: '/citizen',
        text: 'OTP inbox, complaint, appointment, life support, blood request, payment link, and status timeline.',
        checks: ['Mobile-first test', 'OTP request', 'Submit complaint', 'Inbox status update']
    },
    {
        title: 'SMS Business Engine',
        status: 'Profit zone',
        icon: WalletCards,
        href: '/admin/sms',
        text: 'Wallet, recharge, packages, gateway, failed queue, delivery report, and low-balance follow-up.',
        checks: ['Gateway configured', 'Test send', 'Wallet balance', 'Failed retry monitor']
    },
    {
        title: 'Role Permission Audit',
        status: 'Security',
        icon: ShieldCheck,
        href: '/admin/maintenance',
        text: 'Check RLS, household edit scope, officer access, public form safety, and demo cleanup registry.',
        checks: ['Chairman scope', 'Ward scope', 'Volunteer scope', 'Public API lock']
    },
    {
        title: 'Institution Pilot',
        status: 'Growth',
        icon: School,
        href: '/admin/institutions',
        text: 'School website, CMS publish, teacher lesson, student portal, guardian update, and admission flow.',
        checks: ['Seed demo data', 'Publish website', 'Teacher login', 'Student/guardian check']
    }
];

const testFlows = [
    {
        title: 'Household to Service Approval',
        owner: 'Ward member / Chairman',
        href: '/admin/maintenance',
        steps: ['Add demo data', 'Submit citizen complaint', 'Open officer portal', 'Approve or update status', 'Check SMS queue']
    },
    {
        title: 'SMS Sale and Recharge',
        owner: 'Super admin',
        href: '/admin/sms',
        steps: ['Create package', 'Find low-balance wallet', 'Approve recharge', 'Run queue worker', 'Review delivery report']
    },
    {
        title: 'School Website and Portal',
        owner: 'Institution admin',
        href: '/admin/institutions',
        steps: ['Create institution', 'Seed class/student data', 'Publish CMS theme', 'Add teacher lesson', 'Open student portal']
    },
    {
        title: 'Governance Decision Room',
        owner: 'Chairman / Super admin',
        href: '/admin/governance',
        steps: ['Review duplicate citizens', 'Check data quality', 'Inspect officer devices', 'Audit access scope', 'Record decision']
    }
];

const launchBlocks = [
    {
        title: 'Database Setup',
        icon: Database,
        items: ['Run latest migrations in order', 'Run database/66_migration_registry.sql', 'Run database/73_demo_data_registry.sql', 'Run database/63_role_rls_security_audit.sql last']
    },
    {
        title: 'Production Verification',
        icon: MonitorSmartphone,
        items: ['Run npm run build', 'Run npm run security:audit', 'Run npm run audit while app is running', 'Test mobile citizen flow on a real phone']
    },
    {
        title: 'Public Trust Signals',
        icon: Landmark,
        items: ['Union public profile opens', 'Complaint tracking works', 'Payment receipt can be verified', 'Market price and lost-found data are visible']
    },
    {
        title: 'Citizen Follow-up',
        icon: BellRing,
        items: ['Submission SMS queued', 'Processing SMS queued', 'Ready/collection SMS queued', 'Low-balance wallet follow-up visible']
    }
];

const envReadyCount = envChecks.filter((item) => item.ok).length;
const envScore = Math.round((envReadyCount / envChecks.length) * 100);
const pilotTasks = 12;
const completedStaticTasks = 9;
const launchScore = Math.round(((completedStaticTasks + envReadyCount) / (pilotTasks + envChecks.length)) * 100);

export default function LaunchReadinessPage() {
    return (
        <div className="space-y-6 pb-16">
            <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-teal-200">
                            <Rocket size={15} /> Launch Command Center
                        </div>
                        <h1 className="text-3xl font-black leading-tight sm:text-4xl">
                            Pilot launch-er age sob critical flow ek jaygay verify korun
                        </h1>
                        <p className="mt-3 text-sm font-bold leading-7 text-slate-300">
                            Citizen service, SMS business, role permission, institution portal, database migration, and production env readiness ek screen theke track korun.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Launch Score</p>
                            <p className="mt-2 text-4xl font-black text-teal-200">{launchScore}%</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">Static checklist + env signal</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Env Ready</p>
                            <p className="mt-2 text-4xl font-black text-amber-200">{envScore}%</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">{envReadyCount}/{envChecks.length} required signals found</p>
                        </div>
                    </div>
                </div>
            </section>

            <LaunchHealthPanel />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {readinessCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link key={card.title} href={card.href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-200/70">
                            <div className="flex items-start justify-between gap-4">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                                    <Icon size={23} />
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    {card.status}
                                </span>
                            </div>
                            <h2 className="mt-4 text-xl font-black text-slate-900">{card.title}</h2>
                            <p className="mt-2 min-h-[72px] text-sm font-bold leading-6 text-slate-500">{card.text}</p>
                            <div className="mt-4 space-y-2">
                                {card.checks.map((check) => (
                                    <div key={check} className="flex items-center gap-2 text-xs font-black text-slate-600">
                                        <CheckCircle2 size={15} className="text-teal-600" /> {check}
                                    </div>
                                ))}
                            </div>
                        </Link>
                    );
                })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <ClipboardCheck className="text-teal-700" />
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Client demo test flows</h2>
                            <p className="text-sm font-bold text-slate-500">Ei flow-gulo show korlei client bujhbe system real office workflow handle korte pare.</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {testFlows.map((flow, index) => (
                            <Link key={flow.title} href={flow.href} className="block rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:border-teal-200 hover:bg-teal-50">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-teal-700">Flow {index + 1}</p>
                                        <h3 className="text-lg font-black text-slate-900">{flow.title}</h3>
                                        <p className="text-xs font-black text-slate-400">{flow.owner}</p>
                                    </div>
                                    <ArrowRight className="hidden text-slate-400 sm:block" />
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {flow.steps.map((step) => (
                                        <span key={step} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                                            {step}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <Activity className="text-teal-700" />
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Environment readiness</h2>
                            <p className="text-sm font-bold text-slate-500">Missing secrets thakle feature demo fail korte pare.</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {envChecks.map((item) => (
                            <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-900">{item.label}</p>
                                    <p className="truncate text-xs font-bold text-slate-400">{item.key}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${item.ok ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {item.ok ? 'Found' : 'Missing'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
                {launchBlocks.map((block) => {
                    const Icon = block.icon;
                    return (
                        <div key={block.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                    <Icon size={21} />
                                </span>
                                <h3 className="text-xl font-black text-slate-900">{block.title}</h3>
                            </div>
                            <div className="space-y-2">
                                {block.items.map((item) => (
                                    <div key={item} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
                                        <FileText size={15} className="mt-0.5 shrink-0 text-teal-700" /> {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>

            <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <Wrench className="text-amber-700" />
                        <h2 className="text-2xl font-black text-slate-950">Run before demo</h2>
                    </div>
                    <div className="space-y-2 font-mono text-xs font-bold text-slate-700">
                        <div className="rounded-2xl bg-white px-4 py-3">npm run build</div>
                        <div className="rounded-2xl bg-white px-4 py-3">npm run security:audit</div>
                        <div className="rounded-2xl bg-white px-4 py-3">npm run dev</div>
                        <div className="rounded-2xl bg-white px-4 py-3">npm run audit</div>
                    </div>
                </div>
                <div className="rounded-3xl border border-teal-100 bg-teal-50 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-950">Next best launch move</h2>
                            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
                                Prothome ekta pilot union-e 30-50 household, 1 school, 1 market, 1 SMS package, complaint desk, and public trust board live korun. Feedback niye tarpor next union-e scale korun.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Link href="/admin/migrations" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50">
                                <GitBranch size={17} /> Migrations
                            </Link>
                            <Link href="/admin/sms" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
                                <MessageSquareText size={17} /> SMS
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
