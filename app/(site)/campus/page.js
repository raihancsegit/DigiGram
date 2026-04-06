import Link from 'next/link';
import StaticDocPage from '@/components/templates/StaticDocPage';
import { paths } from '@/lib/constants/paths';

export const metadata = {
    title: 'Digi-Campus | DigiGram',
    description: 'শিক্ষা ও মেধা বিকাশ মডিউল।',
};

const links = [
    { href: paths.service('school'), label: 'স্মার্ট স্কুল (SaaS)' },
    { href: paths.service('learning'), label: 'লার্নিং হাব' },
    { href: paths.service('islamic'), label: 'ইসলামিক কর্নার' },
    { href: paths.service('quiz'), label: 'মেগা কুইজ ও লিডারবোর্ড' },
    { href: paths.campusProgress, label: 'লার্নার প্রোগ্রেস (ডেমো UI)' },
];

export default function CampusHubPage() {
    return (
        <StaticDocPage title="Digi-Campus" kicker="শিক্ষা ও মেধা বিকাশ">
            <p>
                স্কুল অটোমেশন, লার্নিং হাব, ইসলামিক কর্নার ও কুইজ—একই ইকোসিস্টেমে। পরে <strong>পয়েন্ট, আনলক ও নোটিফিকেশন</strong> এক
                ফ্লোতে বাঁধা হবে।
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {links.map((l) => (
                    <Link
                        key={l.href}
                        href={l.href}
                        className="dg-card-surface rounded-2xl p-4 font-extrabold text-[color:var(--dg-teal)] hover:underline"
                    >
                        {l.label} →
                    </Link>
                ))}
            </div>
        </StaticDocPage>
    );
}
