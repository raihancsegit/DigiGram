"use client";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, MapPin, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toggleModal, setStepData, goBack } from "@/lib/store/features/locationSlice";
import { getDistricts, getChildLocationsByType, getLocationBySlug } from "@/lib/services/hierarchyService";
import { useState, useEffect } from "react";
import { paths } from "@/lib/constants/paths";
import ModalPortal from "@/components/common/ModalPortal";

export default function LocationModal() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { isOpen, step, selected } = useSelector((s) => s.location);

    const [districts, setDistricts] = useState([]);
    const [upazilas, setUpazilas] = useState([]);
    const [unions, setUnions] = useState([]);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const selectedTrail = [
        selected.district,
        selected.upazila,
        selected.union,
        selected.ward
    ].filter(Boolean);

    const runListLoad = async (loader, setter, label) => {
        setLoading(true);
        setLoadError('');
        try {
            const data = await loader();
            setter(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(`Failed to load ${label}:`, error);
            setter([]);
            setLoadError(`${label} লোড করা যায়নি। আবার চেষ্টা করুন।`);
        } finally {
            setLoading(false);
        }
    };

    const loadDistricts = async () => {
        await runListLoad(getDistricts, setDistricts, 'districts');
    };

    const loadUpazilas = async (districtId) => {
        await runListLoad(() => getChildLocationsByType(districtId, 'upazila'), setUpazilas, 'upazilas');
    };

    const loadUnions = async (upazilaId) => {
        await runListLoad(() => getChildLocationsByType(upazilaId, 'union'), setUnions, 'unions');
    };

    const loadWards = async (unionId) => {
        await runListLoad(() => getChildLocationsByType(unionId, 'ward'), setWards, 'wards');
    };

    const loadWardsForSelectedUnion = async () => {
        if (selected.unionId) {
            await loadWards(selected.unionId);
            return;
        }
        if (!selected.unionSlug) return;
        await runListLoad(async () => {
            const selectedUnion = await getLocationBySlug(selected.unionSlug);
            return selectedUnion?.id ? await getChildLocationsByType(selectedUnion.id, 'ward') : [];
        }, setWards, 'wards');
    };

    useEffect(() => {
        if (!isOpen) return;
        if (step === 1) {
            setUpazilas([]);
            setUnions([]);
            setWards([]);
            loadDistricts();
        } else if (step === 2 && selected.districtId) {
            setUnions([]);
            setWards([]);
            loadUpazilas(selected.districtId);
        } else if (step === 3 && selected.upazilaId) {
            setWards([]);
            loadUnions(selected.upazilaId);
        } else if (step === 4 && (selected.unionId || selected.unionSlug)) {
            setWards([]);
            loadWardsForSelectedUnion();
        }
    }, [isOpen, step, selected.districtId, selected.upazilaId, selected.unionId, selected.unionSlug]);

    const handleSelect = async (item) => {
        if (step === 1) {
            setUpazilas([]);
            setUnions([]);
            setWards([]);
            dispatch(setStepData({ level: "district", value: item.name_bn, districtId: item.id }));
        } else if (step === 2) {
            setUnions([]);
            setWards([]);
            dispatch(setStepData({ level: "upazila", value: item.name_bn, upazilaId: item.id }));
        } else if (step === 3) {
            setWards([]);
            dispatch(setStepData({ level: "union", value: item.name_bn, unionId: item.id, unionSlug: item.slug }));
        } else if (step === 4) {
            dispatch(setStepData({ level: "ward", value: item.name_bn, wardId: item.id }));
            dispatch(toggleModal());
            router.push(paths.wardPortal(selected.unionSlug, item.slug || item.id));
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

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden relative"
                >
                    {/* Mobile Handle */}
                    <div className="flex justify-center pt-4 pb-2 sm:hidden shrink-0">
                        <div className="w-12 h-1.5 rounded-full bg-slate-200" />
                    </div>

                    <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-100 shrink-0">
                        <div className="flex justify-between items-center gap-4">
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

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {(selectedTrail.length ? selectedTrail : ['এলাকা নির্বাচন বাকি']).map((label, index) => (
                                <span
                                    key={`${label}-${index}`}
                                    className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                                        selectedTrail.length
                                            ? 'bg-teal-50 text-teal-700 border border-teal-100'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--dg-teal)] mb-1">
                                    ধাপ {step} / 4
                                </p>
                                <p className="text-sm font-bold text-slate-600">{title} বেছে নিন</p>
                            </div>
                            {loading && <Loader2 className="animate-spin text-[color:var(--dg-teal)]" size={20} />}
                        </div>

                        {step === 4 && selected.union && (
                            <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-extrabold text-teal-800">
                                {selected.union} সিলেক্ট হয়েছে। ইউনিয়ন পোর্টালে ঢুকুন অথবা ওয়ার্ড বেছে নিন।
                            </div>
                        )}

                        {loadError && (
                            <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700">
                                {loadError}
                            </div>
                        )}

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {step === 4 && selected.unionSlug && (
                                <li className="sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch(toggleModal());
                                            router.push(paths.unionPortal(selected.unionSlug));
                                        }}
                                        className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[color:var(--dg-teal)]/30 bg-teal-50/50 rounded-2xl hover:bg-teal-50 hover:border-[color:var(--dg-teal)]/50 transition-all group"
                                    >
                                        <ArrowRight size={20} className="text-slate-900 group-hover:translate-x-1 transition-transform" />
                                        <span className="font-extrabold text-slate-900">পুরো ইউনিয়নে প্রবেশ করুন</span>
                                    </button>
                                </li>
                            )}
                            {list.length === 0 && !loading ? (
                                <div className="sm:col-span-2 py-10 text-center rounded-3xl bg-white border border-slate-200">
                                    <p className="text-slate-400 font-bold text-sm">কোন তথ্য পাওয়া যায়নি</p>
                                </div>
                            ) : (
                                list.map((item) => (
                                    <li key={item.id || item.slug}>
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleSelect(item)}
                                            className="w-full min-h-[86px] flex justify-between items-center p-4 border border-slate-200 bg-white rounded-2xl hover:bg-teal-50/80 hover:border-teal-200 hover:shadow-sm transition-all text-left disabled:opacity-50"
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

                        {step === 4 && !loading && list.length === 0 && selected.unionSlug && (
                            <button
                                type="button"
                                onClick={() => {
                                    dispatch(toggleModal());
                                    router.push(paths.unionPortal(selected.unionSlug));
                                }}
                                className="mt-4 w-full py-3.5 rounded-2xl border border-teal-200 bg-teal-50 text-teal-700 font-extrabold hover:bg-teal-100 transition-colors"
                            >
                                ওয়ার্ড তালিকা নেই — ইউনিয়ন পোর্টালে যান
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </ModalPortal>
    );
}
