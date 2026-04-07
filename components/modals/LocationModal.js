"use client";

import { useDispatch, useSelector, useStore } from "react-redux";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { toggleModal, setStepData, goBack } from "@/lib/store/features/locationSlice";
import { RAJSHAHI_GEO, getUpazilaById } from "@/lib/constants/locations";
import { paths } from "@/lib/constants/paths";

export default function LocationModal() {
    const dispatch = useDispatch();
    const router = useRouter();
    const store = useStore();
    const { isOpen, step, selected } = useSelector((s) => s.location);

    if (!isOpen) return null;

    const district = RAJSHAHI_GEO.district;
    let list = [];
    let title = "";

    if (step === 1) {
        list = [district];
        title = "জেলা";
    } else if (step === 2) {
        list = RAJSHAHI_GEO.upazilas;
        title = "উপজেলা";
    } else if (step === 3) {
        const up = getUpazilaById(selected.upazilaId);
        list = up?.unions ?? [];
        title = "ইউনিয়ন";
    }

    const handleSelect = (raw) => {
        if (step === 1) {
            dispatch(setStepData({ level: "district", value: district.name, districtId: district.id }));
        } else if (step === 2) {
            const up = raw;
            dispatch(setStepData({ level: "upazila", value: up.name, upazilaId: up.id }));
        } else if (step === 3) {
            const un = raw;
            dispatch(setStepData({ level: "union", value: un.name, unionSlug: un.slug }));
            dispatch(toggleModal());
            router.push(paths.unionPortal(un.slug));
        }
    };

    const skipVillage = () => {
        dispatch(toggleModal());
        const slug = store.getState().location.selected.unionSlug;
        if (slug) router.push(paths.unionPortal(slug));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-t-[30px] sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => dispatch(goBack())}
                                className="p-1 rounded-lg hover:bg-slate-100 text-[color:var(--dg-teal)]"
                                aria-label="পিছনে"
                            >
                                <ChevronLeft size={22} />
                            </button>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="text-[color:var(--dg-teal)] shrink-0" size={20} />
                            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">এলাকা নির্বাচন</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => dispatch(toggleModal())}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                        aria-label="বন্ধ"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--dg-teal)] mb-1">
                        ধাপ {step} / ৩
                    </p>
                    <p className="text-sm font-bold text-slate-600 mb-4">{title} বেছে নিন</p>

                    <ul className="space-y-2">
                        {step === 1 &&
                            list.map((d) => (
                                <li key={d.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(d)}
                                        className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-2xl hover:bg-teal-50/80 hover:border-teal-200 transition-colors text-left"
                                    >
                                        <span className="font-extrabold text-slate-800">{d.name}</span>
                                        <ChevronRight size={18} className="text-slate-400" />
                                    </button>
                                </li>
                            ))}

                        {step === 2 &&
                            list.map((up) => (
                                <li key={up.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(up)}
                                        className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-2xl hover:bg-teal-50/80 hover:border-teal-200 transition-colors text-left"
                                    >
                                        <span className="font-extrabold text-slate-800">{up.name}</span>
                                        <span className="text-xs font-bold text-slate-400">{up.unions.length} ইউনিয়ন</span>
                                    </button>
                                </li>
                            ))}

                        {step === 3 &&
                            list.map((un) => (
                                <li key={un.slug}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(un)}
                                        className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-2xl hover:bg-teal-50/80 hover:border-teal-200 transition-colors text-left"
                                    >
                                        <div>
                                            <span className="font-extrabold text-slate-800 block">{un.name}</span>
                                            <span className="text-xs font-semibold text-slate-500">
                                                {un.wards?.length || 0} ওয়াড · {un.wards?.reduce((acc, w) => acc + (w.villages?.length || 0), 0) || 0} গ্রাম
                                            </span>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-400 shrink-0" />
                                    </button>
                                </li>
                            ))}
                    </ul>

                </div>
            </div>
        </div>
    );
}
