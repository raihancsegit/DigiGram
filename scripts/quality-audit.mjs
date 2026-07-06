import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoots = ['app', 'components', 'lib'];
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);
const ignoredEncodingFiles = new Set(['lib/utils/textEncoding.js']);
const failures = [];

function walk(directory) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(fullPath) : [fullPath];
    });
}

const sourceFiles = sourceRoots
    .flatMap((directory) => walk(path.join(root, directory)))
    .filter((file) => sourceExtensions.has(path.extname(file)));

for (const file of sourceFiles) {
    const relativePath = path.relative(root, file).replaceAll('\\', '/');
    if (ignoredEncodingFiles.has(relativePath)) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (/à[¦§]|Ã|Â|â€/.test(source)) failures.push(`${relativePath}: possible mojibake text`);
}

for (const requiredFile of ['app/sitemap.js', 'app/robots.js']) {
    if (!fs.existsSync(path.join(root, requiredFile))) failures.push(`${requiredFile}: missing`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const script of ['build', 'lint', 'test', 'audit', 'quality:audit', 'security:audit']) {
    if (!packageJson.scripts?.[script]) failures.push(`package.json: missing ${script} script`);
}

if (failures.length) {
    console.error(failures.map((failure) => `FAIL  ${failure}`).join('\n'));
    process.exitCode = 1;
} else {
    console.log(`PASS  ${sourceFiles.length} source files checked for encoding regressions`);
    console.log('PASS  SEO metadata routes are present');
    console.log('PASS  Required verification scripts are configured');
}
