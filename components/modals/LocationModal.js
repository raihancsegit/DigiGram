"use client";

import { useDispatch, useSelector, useStore } from "react-redux";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, MapPin, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toggleModal, setStepData, goBack } from "@/lib/store/features/locationSlice";
import { getDistricts, getChildLocationsByType } from "@/lib/services/hierarchyService";
import { useState, useEffect } from "react";
import { paths } from "@/lib/constants/paths";
import ModalPortal from "@/components/common/ModalPortal";

export default function LocationModal() {
    const dispatch = useDispatch();
    const router = useRouter();
    const store = useStore();
    const { isOpen, step, selected } = useSelector((s) => s.location);

    const [districts, setDistricts] = useState([]);
    const [upazilas, setUpazilas] = useState([]);
    const [unions, setUnions] = useState([]);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (step === 1) {
            loadDistricts();
        } else if (step === 2 && selected.districtId) {
            loadUpazilas(selected.districtId);
        } else if (step === 3 && selected.upazilaId) {
            loadUnions(selected.upazilaId);
        } else if (step === 4 && selected.unionSlug) {
            // We need union ID to fetch wards. The union object is in 'unions' state.
            const selectedUnion = unions.find(u => u.slug === selected.unionSlug);
            if (selectedUnion) loadWards(selectedUnion.id);
        }
    }, [isOpen, step, selected.districtId, selected.upazilaId, selected.unionSlug]);

    const loadDistricts = async () => {
        setLoading(true);
        const data = await getDistricts();
        setDistricts(data);
        setLoading(false);
    };

    const loadUpazilas = async (districtId) => {
        setLoading(true);
        const data = await getChildLocationsByType(districtId, 'upazila');
        setUpazilas(data);
        setLoading(false);
    };

    const loadUnions = async (upazilaId) => {
        setLoading(true);
        const data = await getChildLocationsByType(upazilaId, 'union');
        setUnions(data);
        setLoading(false);
    };

    const loadWards = async (unionId) => {
        setLoading(true);
        const data = await getChildLocationsByType(unionId, 'ward');
        setWards(data);
        setLoading(false);
    };

    const handleSelect = async (item) => {
        if (step === 1) {
            dispatch(setStepData({ level: "district", value: item.name_bn, districtId: item.id }));
        } else if (step === 2) {
            dispatch(setStepData({ level: "upazila", value: item.name_bn, upazilaId: item.id }));
        } else if (step === 3) {
            dispatch(setStepData({ level: "union", value: item.name_bn, unionSlug: item.slug }));
        } else if (step === 4) {
            dispatch(setStepData({ level: "ward", value: item.name_bn, wardId: item.id }));
            dispatch(toggleModal());
            router.push(paths.wardPortal(selected.unionSlug, item.id));
        }
    };

    if (!isOpen) return null;

    let list = [];
    let title = "";

    if (step === 1) {
        list = districts;
        title = "জেলা";
    } else if (step === 2) {
        list = upazilas;
        title = "উপজেলা";
    } else if (step === 3) {
        list = unions;
        title = "ইউনিয়ন";
    } else if (step === 4) {
        list = wards;
        title = "ওয়ার্ড";
    }

    const skipVillage = () => {
        dispatch(toggleModal());
        const slug = store.getState().location.selected.unionSlug;
        if (slug) router.push(paths.unionPortal(slug));
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden relative"
            >
                {/* Mobile Handle */}
                <div className="flex justify-center pt-4 pb-2 sm:hidden shrink-0">
                    <div className="w-12 h-1.5 rounded-full bg-slate-200" />
                </div>

                <div className="px-6 py-5 sm:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
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
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--dg-teal)] mb-1">
                                ধাপ {step} / ৪
                            </p>
                            <p className="text-sm font-bold text-slate-600">{title} বেছে নিন</p>
                        </div>
                        {loading && <Loader2 className="animate-spin text-[color:var(--dg-teal)]" size={20} />}
                    </div>

                    {step === 4 && (
                        <button
                            onClick={() => {
                                dispatch(toggleModal());
                                router.push(paths.unionPortal(selected.unionSlug));
                            }}
                            className="w-full mb-4 p-4 border-2 border-dashed border-teal-200 rounded-2xl bg-teal-50/50 flex items-center justify-center gap-3 group hover:bg-teal-500 hover:text-white transition-all"
                        >
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            <span className="font-extrabold text-sm uppercase tracking-wide">পুরো ইউনিয়নে প্রবেশ করুন</span>
                        </button>
                    )}

                    <ul className="space-y-2">
                        {list.length === 0 && !loading ? (
                            <div className="py-10 text-center">
                                <p className="text-slate-400 font-bold text-sm">কোন তথ্য পাওয়া যায়নি</p>
                            </div>
                        ) : (
                            list.map((item) => (
                                <li key={item.id || item.slug}>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-2xl hover:bg-teal-50/80 hover:border-teal-200 transition-colors text-left disabled:opacity-50"
                                    >
                                        <div className="min-w-0">
                                            <span className="font-extrabold text-slate-800 block truncate">{item.name_bn || item.name}</span>
                                            {step === 2 && item.type === 'upazila' && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">উপজেলা</span>
                                            )}
                                            {step === 3 && item.type === 'union' && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">ইউনিয়ন প্রোফাইল</span>
                                            )}
                                        </div>
                                        <ChevronRight size={18} className="text-slate-400 shrink-0" />
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </motion.div>
            </div>
        </ModalPortal>
    );
}
