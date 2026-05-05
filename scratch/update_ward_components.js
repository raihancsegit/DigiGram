import fs from 'fs';

// --- WardManagementSection ---
let managementPath = 'components/sections/ward/WardManagementSection.js';
let mContent = fs.readFileSync(managementPath, 'utf-8');

mContent = mContent.replace(
    "import { updateWardInfo } from '@/lib/store/features/wardDataSlice';", 
    "import { wardService } from '@/lib/services/wardService';"
);

mContent = mContent.replace(
    "export default function WardManagementSection({ user }) {", 
    "export default function WardManagementSection({ user, wardInfo }) {"
);

mContent = mContent.replace(
    /const dispatch = useDispatch\(\);\s*const wardKey = `\$\{user\.unionId\}-\$\{user\.wardId\}`;\s*const dynamicData = useSelector\(\(state\) => state\.wardData\.dynamicWardData\[wardKey\]\);/,
    "const dynamicData = wardInfo?.stats || {};"
);

mContent = mContent.replace(
    /dispatch\(updateWardInfo\(\{\s*key: wardKey,\s*data: \{([\s\S]*?)\}\s*\}\)\);/,
    `await wardService.updateWardStats(wardInfo.parent_id || user.access_scope_id, {
                $1
            });`
);
mContent = mContent.replace(/updateWardStats\(wardInfo\.parent_id \|\| user\.access_scope_id/, 'updateWardStats(user.access_scope_id');

fs.writeFileSync(managementPath, mContent, 'utf-8');
console.log('Updated WardManagementSection.js');

// --- WardNewsForm ---
let newsFormPath = 'components/sections/ward/WardNewsForm.js';
let nContent = fs.readFileSync(newsFormPath, 'utf-8');

nContent = nContent.replace(
    "import { addNews } from '@/lib/store/features/newsSlice';", 
    "import { wardService } from '@/lib/services/wardService';"
);

nContent = nContent.replace(
    "export default function WardNewsForm({ user }) {", 
    "export default function WardNewsForm({ user, onSuccess, wardId }) {"
);

nContent = nContent.replace(
    /dispatch\(addNews\(\{([\s\S]*?)\}\)\);/,
    `await wardService.createNews({
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
            image_url: formData.image,
            category: formData.category,
            location_id: wardId,
            author_id: user.id
        });
        if(onSuccess) onSuccess();`
);

fs.writeFileSync(newsFormPath, nContent, 'utf-8');
console.log('Updated WardNewsForm.js');
