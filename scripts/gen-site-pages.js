const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const slugs = [
    'blood-bank',
    'e-union',
    'emergency',
    'lost-found',
    'news',
    'donation',
    'school',
    'learn',
    'islamic',
    'quiz',
    'market',
    'more',
    'roles',
    'upcoming-ai',
    'roadmap',
    'area-select',
    'voice',
    'search',
    'profile',
    'admin',
];

for (const s of slugs) {
    const dir = path.join(root, 'app', '(site)', s);
    fs.mkdirSync(dir, { recursive: true });
    const c = `import ModuleDocPage, { moduleMetadata } from '@/components/modules/ModuleDocPage';

export const metadata = moduleMetadata('${s}');

export default function Page() {
  return <ModuleDocPage slug="${s}" />;
}
`;
    fs.writeFileSync(path.join(dir, 'page.js'), c, 'utf8');
}

console.log('Generated', slugs.length, 'pages');
