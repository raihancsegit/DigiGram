const fs = require('fs');

const filePath = 'app/(site)/admin/union/page.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Icons
content = content.replace("BarChart3, Users2, ShieldCheck, X, UserCheck, Trash2", "BarChart3, Users2, ShieldCheck, X, UserCheck, Trash2, LayoutGrid");

// 2. Add State Variables
const stateVars = `
    const [isWardModalOpen, setIsWardModalOpen] = useState(false);
    const [selectedUnionWards, setSelectedUnionWards] = useState([]);
    const [activeRoleAssign, setActiveRoleAssign] = useState('chairman'); // 'chairman' or 'ward_member'
    const [activeWardForAssign, setActiveWardForAssign] = useState(null);
    const [newWard, setNewWard] = useState({ name_bn: '', name_en: '' });
`;
content = content.replace("const [errorMessage, setErrorMessage] = useState('');", "const [errorMessage, setErrorMessage] = useState('');" + stateVars);

// 3. Add handleOpenWardModal and handleCreateWard
const wardHandlers = `
    const handleOpenWardModal = async (union) => {
        setSelectedUnion(union);
        setIsWardModalOpen(true);
        setLoading(true);
        try {
            const wards = await adminService.getChildrenLocations(union.id, 'ward');
            setSelectedUnionWards(wards);
        } catch (err) {
            alert("ওয়ার্ড ফেচ করতে সমস্যা হয়েছে");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWard = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const wardSlug = \`\${selectedUnion.slug}-\${newWard.name_en.toLowerCase().replace(/\\s+/g, '-')}\`;
            await adminService.createLocation({
                name_bn: newWard.name_bn,
                name_en: newWard.name_en,
                slug: wardSlug,
                type: 'ward',
                parent_id: selectedUnion.id
            });
            const wards = await adminService.getChildrenLocations(selectedUnion.id, 'ward');
            setSelectedUnionWards(wards);
            setNewWard({ name_bn: '', name_en: '' });
        } catch (err) {
            alert("ওয়ার্ড তৈরি করতে সমস্যা হয়েছে: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };
`;
content = content.replace("const handleAssignChairman = async (userId) => {", wardHandlers + "\n    const handleAssignChairman = async (userId) => {");

// 4. Modify handleAssignChairman & handleQuickAddUser
content = content.replace("await adminService.assignRoleToUser(userId, 'chairman', selectedUnion.id);", `
            const role = activeRoleAssign;
            const scopeId = activeRoleAssign === 'ward_member' ? activeWardForAssign.id : selectedUnion.id;
            await adminService.assignRoleToUser(userId, role, scopeId);
`);
content = content.replace("const { data, error } = await adminService.quickCreateChairman(newUser);", `
            // Pass the active role to quickCreateChairman
            const roleToCreate = activeRoleAssign === 'ward_member' ? 'ward_member' : 'chairman';
            const { data, error } = await adminService.quickCreateChairman({...newUser, role: roleToCreate});
`);
content = content.replace("await adminService.assignRoleToUser(data.user.id, 'chairman', selectedUnion.id);", `
            const role = activeRoleAssign;
            const scopeId = activeRoleAssign === 'ward_member' ? activeWardForAssign.id : selectedUnion.id;
            await adminService.assignRoleToUser(data.user.id, role, scopeId);
`);

// 5. Add Ward button in table
const wardBtn = `
                                            <button 
                                                onClick={() => handleOpenWardModal(union)}
                                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:shadow-lg transition-all"
                                                title="ওয়ার্ডগুলি"
                                            >
                                                <LayoutGrid size={18} />
                                            </button>
`;
content = content.replace('<UserCheck size={18} />\n                                            </button>', '<UserCheck size={18} />\n                                            </button>' + wardBtn);

// 6. Add Ward Modal JSX at the end before final </div>
const wardModalJsx = `
            {/* Ward Modal */}
            <AnimatePresence>
                {isWardModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsWardModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl relative z-10 w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col h-[700px]"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">ওয়ার্ড সমূহ</h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{selectedUnion?.name_bn} এর অন্তর্ভুক্ত</p>
                                </div>
                                <button onClick={() => setIsWardModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-50">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                                <form onSubmit={handleCreateWard} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-sm font-black text-slate-800">নতুন ওয়ার্ড যোগ করুন</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            required placeholder="নাম (বাংলা, উদা: ১নং ওয়ার্ড)" 
                                            className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                            value={newWard.name_bn}
                                            onChange={(e) => setNewWard({...newWard, name_bn: e.target.value})}
                                        />
                                        <input 
                                            required placeholder="নাম (ইংরেজি, e.g. Ward 1)" 
                                            className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-teal-500"
                                            value={newWard.name_en}
                                            onChange={(e) => setNewWard({...newWard, name_en: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        disabled={submitting}
                                        type="submit" 
                                        className="w-full py-3 bg-teal-600 text-white rounded-xl font-black text-sm hover:bg-teal-700 transition-all shadow-md shadow-teal-200 disabled:opacity-50"
                                    >
                                        যোগ করুন
                                    </button>
                                </form>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-black text-slate-800">নিবন্ধিত ওয়ার্ডগুলি</h3>
                                    {selectedUnionWards.length === 0 ? (
                                        <p className="text-xs font-bold text-slate-400">কোনো ওয়ার্ড পাওয়া যায়নি।</p>
                                    ) : (
                                        selectedUnionWards.map(ward => (
                                            <div key={ward.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{ward.name_bn}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">Slug: {ward.slug}</p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setActiveRoleAssign('ward_member');
                                                        setActiveWardForAssign(ward);
                                                        setIsAssignModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    মেম্বার তৈরি/নিয়োগ
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
`;

content = content.replace("        </div>\n    );\n}", wardModalJsx + "\n        </div>\n    );\n}");

// Change "চেয়ারম্যান নিয়োগ" to dynamic label based on role
content = content.replace('{selectedUnion?.name_bn} ইউনিয়নের জন্য', `{activeRoleAssign === 'ward_member' ? activeWardForAssign?.name_bn : selectedUnion?.name_bn} এর জন্য`);
content = content.replace('নতুন চেয়ারম্যান তৈরি করুন', `{activeRoleAssign === 'ward_member' ? 'নতুন মেম্বার তৈরি করুন' : 'নতুন চেয়ারম্যান তৈরি করুন'}`);
content = content.replace('<h2 className="text-2xl font-black text-slate-800">চেয়ারম্যান নিয়োগ</h2>', '<h2 className="text-2xl font-black text-slate-800">{activeRoleAssign === \'ward_member\' ? \'মেম্বার নিয়োগ\' : \'চেয়ারম্যান নিয়োগ\'}</h2>');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Updated page.js');
