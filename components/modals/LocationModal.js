"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, MapPin, Loader2, ArrowRight, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { toggleModal, setStepData, goBack } from "@/lib/store/features/locationSlice";
import { getDistricts, getChildLocationsByType, getLocationBySlug } from "@/lib/services/hierarchyService";
import { paths } from "@/lib/constants/paths";
import ModalPortal from "@/components/common/ModalPortal";
import { repairMojibakeText } from "@/lib/utils/textEncoding";

const bn = repairMojibakeText;

const STEP_META = {
    1: { title: "জেলা", hint: "প্রথমে আপনার জেলা বেছে নিন" },
    2: { title: "উপজেলা", hint: "এবার উপজেলা বেছে নিন" },
    3: { title: "ইউনিয়ন", hint: "আপনার ইউনিয়ন নির্বাচন করুন" },
    4: { title: "ওয়ার্ড", hint: "ওয়ার্ড বেছে নিন অথবা পুরো ইউনিয়নে প্রবেশ করুন" }
};

function toBnNumber(value) {
    return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function displayLocationLabel(value) {
    const label = bn(value || "");
    const lowerLabel = label.toLowerCase();

    if (lowerLabel === "demo district") return "ডেমো জেলা";
    if (lowerLabel === "demo upazila") return "ডেমো উপজেলা";
    if (lowerLabel === "demo union") return "ডেমো ইউনিয়ন";

    const wardMatch = label.match(/^demo ward\s+(\d+)$/i);
    if (wardMatch) return `ডেমো ওয়ার্ড ${toBnNumber(wardMatch[1])}`;

    return label;
}

export default function LocationModal() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { isOpen, step, selected } = useSelector((state) => state.location);

    const [districts, setDistricts] = useState([]);
    const [upazilas, setUpazilas] = useState([]);
    const [unions, setUnions] = useState([]);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const selectedTrail = useMemo(() => ([
        selected.district,
        selected.upazila,
        selected.union,
        selected.ward
    ].filter(Boolean).map(displayLocationLabel)), [selected.district, selected.upazila, selected.union, selected.ward]);

    const runListLoad = useCallback(async (loader, setter, label) => {
        setLoading(true);
        setLoadError("");
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
    }, []);

    const loadDistricts = useCallback(() => (
        runListLoad(getDistricts, setDistricts, "জেলা")
    ), [runListLoad]);

    const loadUpazilas = useCallback((districtId) => (
        runListLoad(() => getChildLocationsByType(districtId, "upazila"), setUpazilas, "উপজেলা")
    ), [runListLoad]);

    const loadUnions = useCallback((upazilaId) => (
        runListLoad(() => getChildLocationsByType(upazilaId, "union"), setUnions, "ইউনিয়ন")
    ), [runListLoad]);

    const loadWards = useCallback((unionId) => (
        runListLoad(() => getChildLocationsByType(unionId, "ward"), setWards, "ওয়ার্ড")
    ), [runListLoad]);

    const loadWardsForSelectedUnion = useCallback(async () => {
        if (selected.unionId) {
            await loadWards(selected.unionId);
            return;
        }
        if (!selected.unionSlug) return;

        await runListLoad(async () => {
            const selectedUnion = await getLocationBySlug(selected.unionSlug);
            return selectedUnion?.id ? getChildLocationsByType(selectedUnion.id, "ward") : [];
        }, setWards, "ওয়ার্ড");
    }, [loadWards, runListLoad, selected.unionId, selected.unionSlug]);

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
    }, [
        isOpen,
        step,
        selected.districtId,
        selected.upazilaId,
        selected.unionId,
        selected.unionSlug,
        loadDistricts,
        loadUpazilas,
        loadUnions,
        loadWardsForSelectedUnion
    ]);

    const currentList = useMemo(() => {
        if (step === 1) return districts;
        if (step === 2) return upazilas;
        if (step === 3) return unions;
        if (step === 4) return wards;
        return [];
    }, [districts, step, unions, upazilas, wards]);
    const singleOption = currentList.length <= 1;

    const retryCurrentStep = () => {
        if (step === 1) loadDistricts();
        else if (step === 2 && selected.districtId) loadUpazilas(selected.districtId);
        else if (step === 3 && selected.upazilaId) loadUnions(selected.upazilaId);
        else if (step === 4) loadWardsForSelectedUnion();
    };

    const closeModal = () => dispatch(toggleModal());

    const openUnionPortal = () => {
        if (!selected.unionSlug) return;
        closeModal();
        router.push(paths.unionPortal(selected.unionSlug));
    };

    const handleSelect = (item) => {
        const label = displayLocationLabel(item.name_bn || item.name);

        if (step === 1) {
            setUpazilas([]);
            setUnions([]);
            setWards([]);
            dispatch(setStepData({ level: "district", value: label, districtId: item.id }));
        } else if (step === 2) {
            setUnions([]);
            setWards([]);
            dispatch(setStepData({ level: "upazila", value: label, upazilaId: item.id }));
        } else if (step === 3) {
            setWards([]);
            dispatch(setStepData({ level: "union", value: label, unionId: item.id, unionSlug: item.slug }));
        } else if (step === 4) {
            dispatch(setStepData({ level: "ward", value: label, wardId: item.id }));
            closeModal();
            router.push(paths.wardPortal(selected.unionSlug, item.slug || item.id));
        }
    };

    if (!isOpen) return null;

    const rawMeta = STEP_META[step] || STEP_META[1];
    const meta = {
        title: bn(rawMeta.title),
        hint: bn(rawMeta.hint)
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-slate-900/65 p-0 backdrop-blur-md sm:items-center sm:p-4">
                <motion.div
                    initial={{ y: "100%", opacity: 0.96 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative flex h-[86dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[86vh] sm:rounded-3xl lg:max-w-3xl"
                >
                    <div className="flex shrink-0 justify-center pb-2 pt-4 sm:hidden">
                        <div className="h-1.5 w-12 rounded-full bg-slate-200" />
                    </div>

                    <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => dispatch(goBack())}
                                        className="rounded-xl p-2 text-teal-700 transition hover:bg-slate-100"
                                        aria-label="পেছনে যান"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                )}
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                                    <MapPin size={22} />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="truncate text-xl font-black text-slate-950 sm:text-2xl">এলাকা নির্বাচন</h2>
                                    <p className="truncate text-sm font-bold text-slate-500">{meta.hint}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
                                aria-label="বন্ধ করুন"
                            >
                                <X size={23} />
                            </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {(selectedTrail.length ? selectedTrail : ["এখনও কোনো এলাকা বাছাই করা হয়নি"]).map((label, index) => (
                                <span
                                    key={`${label}-${index}`}
                                    className={`rounded-full border px-3.5 py-1.5 text-xs font-black ${
                                        selectedTrail.length
                                            ? "border-teal-100 bg-teal-50 text-teal-700"
                                            : "border-slate-100 bg-slate-100 text-slate-500"
                                    }`}
                                >
                                    {displayLocationLabel(label)}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div>
                                <p className="mb-1 text-xs font-black uppercase tracking-wider text-teal-700">ধাপ {toBnNumber(step)} / ৪</p>
                                <p className="text-sm font-bold text-slate-600">{meta.title} বেছে নিন</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4].map((item) => (
                                    <span
                                        key={item}
                                        className={`h-2 rounded-full transition-all ${item === step ? "w-7 bg-teal-600" : item < step ? "w-2 bg-teal-300" : "w-2 bg-slate-200"}`}
                                    />
                                ))}
                                {loading && <Loader2 className="ml-2 animate-spin text-teal-700" size={18} />}
                            </div>
                        </div>

                        {step === 4 && selected.union && (
                            <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-black text-teal-800">
                                {displayLocationLabel(selected.union)} নির্বাচিত হয়েছে। ওয়ার্ড বেছে নিন অথবা পুরো ইউনিয়ন পোর্টালে যান।
                            </div>
                        )}

                        {loadError && (
                            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 sm:flex-row sm:items-center sm:justify-between">
                                <span>{bn(loadError)}</span>
                                <button
                                    type="button"
                                    onClick={retryCurrentStep}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-700"
                                >
                                    <RefreshCcw size={14} /> আবার চেষ্টা
                                </button>
                            </div>
                        )}

                        <ul className={`grid grid-cols-1 gap-3 ${singleOption ? "" : "sm:grid-cols-2"}`}>
                            {step === 4 && selected.unionSlug && (
                                <li className="sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={openUnionPortal}
                                        className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/70 p-4 transition hover:border-teal-300 hover:bg-teal-50"
                                    >
                                        <ArrowRight size={20} className="text-slate-900 transition-transform group-hover:translate-x-1" />
                                        <span className="font-black text-slate-900">পুরো ইউনিয়ন পোর্টালে প্রবেশ করুন</span>
                                    </button>
                                </li>
                            )}

                            {currentList.length === 0 && !loading ? (
                                <li className="rounded-2xl border border-slate-200 bg-white py-10 text-center sm:col-span-2">
                                    <p className="text-sm font-bold text-slate-400">কোনো তথ্য পাওয়া যায়নি</p>
                                </li>
                            ) : (
                                currentList.map((item) => (
                                    <li key={item.id || item.slug} className={singleOption ? "sm:col-span-2" : undefined}>
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleSelect(item)}
                                            className="group flex min-h-[92px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50/80 hover:shadow-md disabled:opacity-50"
                                        >
                                            <div className="min-w-0">
                                                <span className="block truncate text-lg font-black text-slate-800">{displayLocationLabel(item.name_bn || item.name)}</span>
                                                {item.name_en && (
                                                    <span className="mt-1 block truncate text-xs font-bold text-slate-400">{item.name_en}</span>
                                                )}
                                            </div>
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-teal-600 group-hover:text-white">
                                                <ChevronRight size={19} />
                                            </span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>

                        {step === 4 && !loading && currentList.length === 0 && selected.unionSlug && (
                            <button
                                type="button"
                                onClick={openUnionPortal}
                                className="mt-4 w-full rounded-2xl border border-teal-200 bg-teal-50 py-3.5 font-black text-teal-700 transition hover:bg-teal-100"
                            >
                                ওয়ার্ড তালিকা নেই - ইউনিয়ন পোর্টালে যান
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </ModalPortal>
    );
}
