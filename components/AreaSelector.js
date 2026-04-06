import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
import { RAJSHAHI_GEO } from '@/lib/constants/locations';
import { setStepData, applyLocationSnapshot } from '@/lib/store/features/locationSlice';

export default function AreaSelector({ isOpen, onClose }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ division: '', district: '', upazila: null, union: null, ward: null });

    if (!isOpen) return null;

    const handleSelect = (level, value) => {
        if (level === 'upazila') {
            setSelection(prev => ({ ...prev, upazila: value, union: null, ward: null }));
            dispatch(setStepData({ level: 'upazila', value: value.name, upazilaId: value.id }));
            setStep(4);
        } else if (level === 'union') {
            setSelection(prev => ({ ...prev, union: value, ward: null }));
            dispatch(setStepData({ level: 'union', value: value.name, unionSlug: value.slug }));
            setStep(5);
        } else if (level === 'ward') {
            setSelection(prev => ({ ...prev, ward: value }));
            dispatch(
                applyLocationSnapshot({
                    district: selection.district,
                    upazila: selection.upazila.name,
                    upazilaId: selection.upazila.id,
                    union: selection.union.name,
                    unionSlug: selection.union.slug,
                    ward: value.name,
                    wardId: value.id,
                })
            );
            onClose();
            router.push(`/u/${selection.union.slug}`);
        } else {
            setSelection(prev => ({ ...prev, [level]: value }));
            dispatch(setStepData({ level, value: typeof value === 'string' ? value : value.name }));
            setStep(prev => prev + 1);
        }
    };

    const stepsInfo = ["বিভাগ", "জেলা", "উপজেলা", "ইউনিয়ন", "ওয়াড"];

    const getItems = () => {
        if (step === 1) return ["রাজশাহী"];
        if (step === 2) return ["রাজশাহী"];
        if (step === 3) return RAJSHAHI_GEO.upazilas;
        if (step === 4 && selection.upazila) return selection.upazila.unions;
        if (step === 5 && selection.union) return selection.union.wards;
        return [];
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-black text-gray-800">এલાকা নির্বাচন করুন</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--dg-teal)] bg-teal-50 px-3 py-1 rounded-full w-fit">
                        <span className="bg-[color:var(--dg-teal)] text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">
                            {step}
                        </span>
                        {stepsInfo[step - 1]} সিলেক্ট করুন
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {getItems().map((item) => {
                            const label = typeof item === 'string' ? item : item.name;
                            const levelKey = step === 1 ? 'division' : step === 2 ? 'district' : step === 3 ? 'upazila' : step === 4 ? 'union' : 'ward';
                            
                            return (
                                <button
                                    key={label}
                                    onClick={() => handleSelect(levelKey, item)}
                                    className="flex justify-between items-center p-4 text-left border-2 border-transparent bg-gray-50 rounded-2xl hover:border-[color:var(--dg-teal)] hover:bg-teal-50/50 transition-all group"
                                >
                                    <span className="font-bold text-gray-700">{label}</span>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[color:var(--dg-teal)] transition-colors" />
                                </button>
                            );
                        })}
                    </div>

                    {step > 1 && (
                        <button 
                            onClick={() => setStep(step - 1)}
                            className="text-xs font-bold text-slate-400 hover:text-teal-600 underline"
                        >
                            পিছনে যান
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}