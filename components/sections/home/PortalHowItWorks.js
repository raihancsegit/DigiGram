'use client';

import { motion } from 'framer-motion';
import {
    ArrowRight,
    Building2,
    GraduationCap,
    Home,
    LayoutDashboard,
    MapPinned,
    MousePointer2,
    Network,
    ShieldCheck,
    UsersRound,
    Zap
} from 'lucide-react';

const branchNodes = [
    {
        title: 'Union portal',
        desc: 'Chairman office, notice, payment, market, school and emergency service.',
        icon: Building2,
        tone: 'bg-teal-50 text-teal-700 ring-teal-100'
    },
    {
        title: 'Ward branch',
        desc: 'Member dashboard, household verification, field team and local requests.',
        icon: ShieldCheck,
        tone: 'bg-sky-50 text-sky-700 ring-sky-100'
    },
    {
        title: 'Village branch',
        desc: 'Household list, blood donors, village stats and volunteer updates.',
        icon: MapPinned,
        tone: 'bg-amber-50 text-amber-700 ring-amber-100'
    }
];

const leafNodes = [
    { title: 'Home profile', icon: Home, detail: 'Family tree + documents' },
    { title: 'School admission', icon: GraduationCap, detail: 'Home member theke student' },
    { title: 'Citizen service', icon: UsersRound, detail: 'Apply, track, update' }
];

export default function PortalHowItWorks() {
    return (
        <section className="bg-white px-3 py-10 sm:px-6 md:py-16">
            <div className="mx-auto max-w-7xl">
                <div className="mb-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-teal-700 ring-1 ring-teal-100"
                    >
                        <Network size={14} />
                        DigiGram tree
                    </motion.div>
                    <h2 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl md:text-5xl">
                        Area select korlei puro system tree akare khule jay
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-6 text-slate-500 sm:text-base">
                        District theke union, ward, village, home, school and citizen service ek flow-te connected thake.
                    </p>
                </div>

                <div className="relative mx-auto max-w-6xl">
                    <div className="absolute left-1/2 top-20 hidden h-[calc(100%-8rem)] w-px -translate-x-1/2 bg-slate-200 lg:block" />
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative z-10 mx-auto flex max-w-md flex-col items-center rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-center text-white shadow-xl"
                    >
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white">
                            <MousePointer2 size={26} />
                        </span>
                        <h3 className="mt-4 text-xl font-black">Select your area</h3>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
                            Search ba map theke area choose korle relevant portal, member, school and service automatically show kore.
                        </p>
                    </motion.div>

                    <div className="relative z-10 mt-8 grid gap-4 lg:grid-cols-3">
                        {branchNodes.map((node, index) => (
                            <motion.div
                                key={node.title}
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08 }}
                                className="relative rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="absolute -top-8 left-1/2 hidden h-8 w-px -translate-x-1/2 bg-slate-200 lg:block" />
                                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${node.tone}`}>
                                    <node.icon size={23} />
                                </div>
                                <h3 className="text-lg font-black text-slate-950">{node.title}</h3>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{node.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="relative z-10 mt-4 grid gap-3 lg:grid-cols-3">
                        {leafNodes.map((leaf, index) => (
                            <motion.div
                                key={leaf.title}
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + index * 0.08 }}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                                    <leaf.icon size={18} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-black text-slate-950">{leaf.title}</span>
                                    <span className="block truncate text-xs font-bold text-slate-500">{leaf.detail}</span>
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative z-10 mt-6 overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-xl sm:p-6"
                    >
                        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div className="flex items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950">
                                    <LayoutDashboard size={24} />
                                </span>
                                <div>
                                    <h4 className="text-xl font-black">One selected area, many connected workflows</h4>
                                    <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
                                        Home profile theke school admission, school theke guardian update, citizen center theke tracking, sob branch ek data tree-te thake.
                                    </p>
                                </div>
                            </div>
                            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-teal-400 hover:text-white">
                                <Zap size={17} />
                                Start
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
