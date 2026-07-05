'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { 
    Lock, Shield, Eye, EyeOff, Trash2, FileText, 
    CheckCircle, Loader2, X, Plus, Info, Home, User, Zap, Droplets, Unlock, Users, MapPin, Maximize2, Minimize2,
    Banknote, ClipboardList, Navigation, Calendar, AlertCircle, CheckCheck, Clock, Receipt, Sparkles, ArrowRight, UserCircle, UserCheck, ShieldCheck, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { householdService } from '@/lib/services/householdService';
import { taxService } from '@/lib/services/taxService';
import { notificationService } from '@/lib/services/notificationService';
import { supabase } from '@/lib/utils/supabase';
import { toBnDigits, parseBnInt } from '@/lib/utils/format';
import ModalPortal from '@/components/common/ModalPortal';
import { menuStyles } from '@/components/common/menuStyles';
import ApplicationPreview from './ApplicationPreview';
import toast from 'react-hot-toast';

const inputStyles = "w-full min-w-0 px-4 py-3.5 sm:px-5 sm:py-4 rounded-[20px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-700 text-sm";
const labelStyles = "text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1.5 block";

const SERVICE_TYPES = {
    birth_registration: 'জন্ম নিবন্ধন',
    death_certificate: 'মৃত্যু সনদ',
    warish_certificate: 'ওয়ারিশ সনদ',
    nid_application: 'NID আবেদন (নতুন)',
    nid_correction: 'NID সংশোধন',
    solvency_cert: 'সচ্ছলতার সনদ',
    trade_license: 'ট্রেড লাইসেন্স',
    social_safety: 'সামাজিক নিরাপত্তা (ভাতা)',
    other: 'অন্যান্য আবেদন'
};

const STATUS_CONFIG = {
    pending:    { label: 'অপেক্ষমাণ',   color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
    processing: { label: 'প্রক্রিয়াধীন', color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Loader2 },
    ready:      { label: 'প্রস্তুত',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    completed:  { label: 'সম্পন্ন',     color: 'bg-slate-50 text-slate-500 border-slate-200',   icon: CheckCheck },
};

const SERVICE_CHECKLISTS = {
    birth_registration: ['আবেদনকারীর নাম', 'জন্ম তারিখ', 'পিতার নাম', 'মাতার নাম', 'ঠিকানা'],
    death_certificate: ['মৃত ব্যক্তির নাম', 'মৃত্যুর তারিখ', 'মৃত্যুর স্থান', 'পিতার নাম', 'ঠিকানা'],
    warish_certificate: ['যার ওয়ারিশ সনদ', 'মৃত্যুর তারিখ', 'ওয়ারিশদের নাম', 'সম্পর্ক', 'ঠিকানা'],
    nid_application: ['নাম', 'জন্ম নিবন্ধন', 'জন্ম তারিখ', 'ঠিকানা'],
    nid_correction: ['বর্তমান NID', 'সংশোধিত তথ্য', 'সমর্থনকারী দলিল']
};

const TABS = {
    profile: { label: 'পরিবার', icon: Home },
    ai: { label: 'AI স্মার্ট', icon: Sparkles, premium: true },
    services: { label: 'সেবা আবেদন', icon: ClipboardList },
    documents: { label: 'লকার', icon: ShieldCheck },
    tax: { label: 'ট্যাক্স', icon: Banknote }
};

TABS.timeline = { label: 'Timeline', icon: History };

export default function HouseholdLockerManager({ household, onUpdate, onClose }) {
    const { user } = useSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'super_admin';
    const isWardMember = user?.role === 'ward_member';
    const canManage = isSuperAdmin || isWardMember;

    // PIN state
    const [pin, setPin] = useState('');
    const [enteredPin, setEnteredPin] = useState('');
    const [isLockerUnlocked, setIsLockerUnlocked] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isLockerExpanded, setIsLockerExpanded] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState('profile');

    // Data state
    const [documents, setDocuments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [selectedResident, setSelectedResident] = useState(null);
    const [taxes, setTaxes] = useState([]);
    const [serviceRequests, setServiceRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [savingService, setSavingService] = useState(false);
    const [savingTax, setSavingTax] = useState(false);
    const [unionId, setUnionId] = useState(household?.union_id || null);

    // Form states
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', type: 'nid', file: null });
    const [showTaxForm, setShowTaxForm] = useState(false);
    const [taxForm, setTaxForm] = useState({
        year: new Date().getFullYear(),
        fiscal_year_label: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        ward_no: '',
        holding_no: household?.house_no || '',
        taxpayer_name: household?.owner_name || '',
        guardian_name: '',
        address: household?.village_name || '',
        previous_due: '',
        current_tax: '',
        quarter_1: '',
        quarter_2: '',
        quarter_3: '',
        quarter_4: '',
        amount_due: '',
        due_date: '',
        notes: ''
    });
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount_paid: '',
        receipt_no: '',
        paid_date: new Date().toISOString().split('T')[0],
        collected_by: '',
        payment_method: 'cash'
    });
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [serviceForm, setServiceForm] = useState({ 
        request_type: 'birth_registration', 
        applicant_name: '', 
        applicant_nid: '',
        applicant_birth_reg: '',
        applicant_dob: '',
        applicant_gender: 'Male',
        father_name: '',
        father_nid: '',
        mother_name: '',
        mother_nid: '',
        blood_group: '',
        death_date: '',
        place_of_death: '',
        contact_phone: household?.phone || '', 
        applicant_address: '',
        details: '' 
    });

    useEffect(() => {
        if (!household?.locker_pin_hash && !household?.locker_pin && isSuperAdmin) setIsLockerUnlocked(true);
        loadData();
    }, [household.id]);

    const loadData = async (pinOverride = null) => {
        try {
            setLoading(true);
            const activePin = pinOverride || enteredPin;
            const [docs, taxData, { data: resData }, { data: srData }] = await Promise.all([
                (isLockerUnlocked || pinOverride) && activePin
                    ? householdService.getHouseholdDocuments(household.id, activePin)
                    : Promise.resolve([]),
                taxService.getTaxByHousehold(household.id),
                supabase.from('residents').select('*').eq('household_id', household.id).order('created_at', { ascending: true }),
                supabase.from('service_requests').select('*').eq('household_id', household.id).order('created_at', { ascending: false })
            ]);
            setDocuments(docs || []);
            setTaxes(taxData || []);
            setResidents(resData || []);
            setServiceRequests(srData || []);

            if (!unionId && household.ward_id) {
                const { data: wData } = await supabase.from('locations').select('parent_id').eq('id', household.ward_id).single();
                if (wData?.parent_id) setUnionId(wData.parent_id);
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async (e) => {
        e.preventDefault();
        const isValid = await householdService.verifyLockerPin(household.id, enteredPin);
        if (isValid) {
            setIsLockerUnlocked(true);
            setPinError(false);
            await loadData(enteredPin);
        } else {
            setPinError(true);
            toast.error("ভুল পিন! আবার চেষ্টা করুন।");
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return;
        setUploading(true);
        try {
            await householdService.uploadDocument(household.id, uploadForm.file, uploadForm.type, uploadForm.title, enteredPin);
            await loadData();
            setShowUploadForm(false);
            setUploadForm({ title: '', type: 'nid', file: null });
            toast.success("ডকুমেন্ট সফলভাবে আপলোড হয়েছে।");
        } catch (err) {
            toast.error("আপলোড ব্যর্থ হয়েছে।");
        } finally {
            setUploading(false);
        }
    };

    const handleApplicantChange = (name) => {
        const applicant = residents.find(r => r.name === name);
        if (!applicant) {
            setServiceForm(prev => ({ ...prev, applicant_name: name }));
            return;
        }

        const head = residents.find(r => r.relation_with_head === 'Head');
        const spouse = residents.find(r => ['Wife', 'Husband', 'Spouse'].includes(r.relation_with_head));
        const fatherResident = residents.find(r => r.relation_with_head === 'Father');
        const motherResident = residents.find(r => r.relation_with_head === 'Mother');
        
        let fName = '', fNid = '', mName = '', mNid = '';
        if (applicant.relation_with_head === 'Son' || applicant.relation_with_head === 'Daughter') {
            fName = head?.gender === 'Male' ? head.name : (spouse?.gender === 'Male' ? spouse.name : '');
            fNid = head?.gender === 'Male' ? head.nid : (spouse?.gender === 'Male' ? spouse.nid : '');
            mName = head?.gender === 'Female' ? head.name : (spouse?.gender === 'Female' ? spouse.name : '');
            mNid = head?.gender === 'Female' ? head.nid : (spouse?.gender === 'Female' ? spouse.nid : '');
        } else {
            fName = applicant.father_name || fatherResident?.name || '';
            fNid = fatherResident?.nid || '';
            mName = applicant.mother_name || motherResident?.name || '';
            mNid = motherResident?.nid || '';
        }

        setServiceForm(prev => ({
            ...prev,
            applicant_name: name,
            applicant_nid: applicant.nid || '',
            applicant_birth_reg: applicant.birth_reg_no || '',
            applicant_dob: applicant.dob ? new Date(applicant.dob).toISOString().split('T')[0] : '',
            applicant_gender: applicant.gender || 'Male',
            father_name: fName || '',
            father_nid: fNid || '',
            mother_name: mName || '',
            mother_nid: mNid || '',
            blood_group: applicant.blood_group || '',
            death_date: applicant.death_date ? new Date(applicant.death_date).toISOString().split('T')[0] : '',
            applicant_address: applicant.address || `${household.house_no ? `হোল্ডিং: ${household.house_no}, ` : ''}${household.village_name || ''}`,
            contact_phone: applicant.phone || household?.phone || '',
            details: prev.details || ''
        }));
    };

    const startApplicationForResident = (resident, requestType) => {
        setActiveTab('services');
        setShowServiceForm(true);
        setIsPreviewMode(false);
        setServiceForm(prev => ({ ...prev, request_type: requestType }));
        handleApplicantChange(resident.name);
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        if (!serviceForm.applicant_name) {
            toast.error("অনুগ্রহ করে আবেদনকারী নির্বাচন করুন।");
            return;
        }
        const applicant = residents.find(r => r.name === serviceForm.applicant_name);
        const duplicateRequest = serviceRequests.find((request) => (
            ['pending', 'processing', 'ready'].includes(request.status) &&
            request.request_type === serviceForm.request_type &&
            (
                request.resident_id === applicant?.id ||
                request.meta_data?.applicant_id === applicant?.id ||
                request.applicant_name === serviceForm.applicant_name
            )
        ));

        if (duplicateRequest) {
            toast.error("এই ব্যক্তির জন্য একই সেবার আবেদন ইতিমধ্যে চলমান আছে।");
            return;
        }
        setIsPreviewMode(true);
    };

    const confirmAndSubmitApplication = async () => {
        setSavingService(true);
        try {
            const applicant = residents.find(r => r.name === serviceForm.applicant_name);
            const head = residents.find(r => r.relation_with_head === 'Head');
            const spouse = residents.find(r => ['Wife', 'Husband', 'Spouse'].includes(r.relation_with_head));
            
            const father = head?.gender === 'Male' ? head : (spouse?.gender === 'Male' ? spouse : null);
            const mother = head?.gender === 'Female' ? head : (spouse?.gender === 'Female' ? spouse : null);

            // Magic Update: Sync back to profiles
            const updatePromises = [];
            
            // 1. Update Applicant
            if (applicant) {
                const appUpdates = {};
                if (serviceForm.applicant_nid && serviceForm.applicant_nid !== applicant.nid) appUpdates.nid = serviceForm.applicant_nid;
                if (serviceForm.applicant_birth_reg && serviceForm.applicant_birth_reg !== applicant.birth_reg_no) appUpdates.birth_reg_no = serviceForm.applicant_birth_reg;
                if (serviceForm.applicant_dob && serviceForm.applicant_dob !== applicant.dob) appUpdates.dob = serviceForm.applicant_dob;
                if (serviceForm.blood_group && serviceForm.blood_group !== applicant.blood_group) appUpdates.blood_group = serviceForm.blood_group;
                
                if (Object.keys(appUpdates).length > 0) {
                    updatePromises.push(householdService.updateResident(applicant.id, { ...appUpdates, household_id: household.id }));
                }
            }

            // 2. Update Father
            if (father) {
                const fUpdates = {};
                if (serviceForm.father_nid && serviceForm.father_nid !== father.nid) fUpdates.nid = serviceForm.father_nid;
                if (Object.keys(fUpdates).length > 0) {
                    updatePromises.push(householdService.updateResident(father.id, { ...fUpdates, household_id: household.id }));
                }
            }

            // 3. Update Mother
            if (mother) {
                const mUpdates = {};
                if (serviceForm.mother_nid && serviceForm.mother_nid !== mother.nid) mUpdates.nid = serviceForm.mother_nid;
                if (Object.keys(mUpdates).length > 0) {
                    updatePromises.push(householdService.updateResident(mother.id, { ...mUpdates, household_id: household.id }));
                }
            }

            if (updatePromises.length > 0) await Promise.all(updatePromises);

            const applicationData = { 
                ...serviceForm, 
                household_id: household.id, 
                resident_id: applicant?.id || null,
                status: 'pending',
                meta_data: {
                    address: `${household.house_no ? 'হোল্ডিং: ' + household.house_no + ', ' : ''}${household.village_name || ''}`,
                    applicant_id: applicant?.id,
                    applied_at: new Date().toISOString()
                }
            };

            await supabase.from('service_requests').insert([applicationData]);
            
            const wardName = household.ward_name || 'ওয়ার্ড';
            const vName = household.village_name || 'গ্রাম';
            const hInfo = household.house_no ? `${household.house_no} নং বাড়ি` : `${household.owner_name} এর বাড়ি`;
            const notificationMsg = `${wardName} এর ${vName} গ্রামের ${hInfo} থেকে "${serviceForm.applicant_name}" একটি নতুন আবেদন করেছেন।`;

            // Notify authorities
            await notificationService.createNotification({
                title: `নতুন আবেদন: ${SERVICE_TYPES[serviceForm.request_type]}`,
                message: notificationMsg,
                role: 'ward_member',
                scope_id: household.ward_id,
                type: 'request'
            });

            if (unionId) {
                await notificationService.createNotification({
                    title: `নতুন আবেদন: ${SERVICE_TYPES[serviceForm.request_type]}`,
                    message: notificationMsg,
                    role: 'chairman',
                    scope_id: unionId,
                    type: 'request'
                });
            }

            await loadData();
            setIsPreviewMode(false);
            setShowServiceForm(false);
            setServiceForm({ 
                request_type: 'birth_registration', 
                applicant_name: '', 
                applicant_nid: '',
                applicant_birth_reg: '',
                applicant_dob: '',
                applicant_gender: 'Male',
                father_name: '',
                father_nid: '',
                mother_name: '',
                mother_nid: '',
                blood_group: '',
                death_date: '',
                place_of_death: '',
                contact_phone: household?.phone || '', 
                applicant_address: '',
                details: '' 
            });
            toast.success("আবেদন জমা হয়েছে এবং প্রোফাইল আপডেট করা হয়েছে।");
        } catch (err) {
            toast.error("আবেদন ব্যর্থ হয়েছে।");
        } finally {
            setSavingService(false);
        }
    };

    const handleAddTax = async (e) => {
        e.preventDefault();
        setSavingTax(true);
        try {
            await taxService.addTaxRecord({ ...taxForm, household_id: household.id });
            setShowTaxForm(false);
            setTaxForm(prev => ({
                ...prev,
                previous_due: '',
                current_tax: '',
                quarter_1: '',
                quarter_2: '',
                quarter_3: '',
                quarter_4: '',
                amount_due: '',
                notes: ''
            }));
            await loadData();
            toast.success("ট্যাক্স রেকর্ড সফলভাবে যোগ হয়েছে।");
        } catch (err) {
            toast.error("ট্যাক্স রেকর্ড যোগ করতে সমস্যা হয়েছে।");
        } finally {
            setSavingTax(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setSavingTax(true);
        try {
            await taxService.recordPayment(showPaymentModal.id, paymentForm);
            await loadData();
            setShowPaymentModal(null);
            setPaymentForm({
                amount_paid: '',
                receipt_no: '',
                paid_date: new Date().toISOString().split('T')[0],
                collected_by: '',
                payment_method: 'cash'
            });
            toast.success("পেমেন্ট সফলভাবে রেকর্ড হয়েছে।");
        } catch (err) {
            toast.error("পেমেন্ট রেকর্ড করতে সমস্যা হয়েছে।");
        } finally {
            setSavingTax(false);
        }
    };

    // --- AI Logic ---
    const getAIInsights = () => {
        const insights = [];
        const today = new Date();

        if (residents.length === 0) {
            insights.push({
                type: 'system',
                priority: 'high',
                title: 'কোনো সদস্য খুঁজে পাওয়া যায়নি',
                message: 'আপনার খানার সদস্যদের প্রোফাইল এখনো তৈরি করা হয়নি। অনুগ্রহ করে "পরিবার" ট্যাব থেকে সদস্য যোগ করুন।',
                key: 'add_member'
            });
            return insights;
        }

        residents.forEach(r => {
            const birthDate = r.dob ? new Date(r.dob) : null;
            let age = -1;
            if (birthDate) {
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            }

            const hasValidNid = r.nid?.length === 10 || r.nid?.length === 13 || r.nid?.length === 17;
            const hasValidBrn = r.birth_reg_no?.length === 17;

            if (age !== -1 && ((r.gender === 'Male' && age >= 65) || (r.gender === 'Female' && age >= 62))) {
                insights.push({
                    type: 'benefit',
                    priority: 'high',
                    title: 'বয়স্ক ভাতা প্রাপ্তির সুযোগ',
                    message: `${r.name} এর বয়স ${toBnDigits(age.toString())} বছর। তিনি সরকারি বয়স্ক ভাতার জন্য আবেদন করতে পারেন।`,
                    key: 'social_safety',
                    resident: r
                });
            }

            if (age !== -1 && age > 5 && age < 25 && (r.occupation?.toLowerCase().includes('ছাত্র') || r.occupation?.toLowerCase().includes('student'))) {
                insights.push({
                    type: 'stipend',
                    priority: 'medium',
                    title: 'শিক্ষা উপবৃত্তি ও সহায়তা',
                    message: `${r.name} একজন শিক্ষার্থী। তার জন্য নতুন উপবৃত্তি বা শিক্ষা সহায়তার আবেদন সম্ভব।`,
                    key: 'other',
                    resident: r
                });
            }

            if (age !== -1 && age >= 18 && !hasValidNid) {
                insights.push({
                    type: 'document',
                    priority: 'high',
                    title: 'NID তথ্য হালনাগাদ প্রয়োজন',
                    message: `${r.name} এর বয়স ১৮+ কিন্তু সঠিক এনআইডি নম্বর সিস্টেমে নেই। ভোটার হওয়ার আবেদন করুন।`,
                    key: 'nid_application',
                    resident: r
                });
            }

            if (!hasValidBrn) {
                insights.push({
                    type: 'document',
                    priority: 'medium',
                    title: 'ডিজিটাল জন্ম নিবন্ধন অনুপস্থিত',
                    message: `${r.name} এর ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বরটি প্রোফাইলে যুক্ত নেই।`,
                    key: 'birth_registration',
                    resident: r
                });
            }
        });

        if (taxes.length > 0) {
            const unpaid = taxes.filter(t => t.status !== 'paid');
            if (unpaid.length > 0) {
                insights.push({
                    type: 'tax',
                    priority: 'high',
                    title: 'বকেয়া ট্যাক্স সতর্কতা',
                    message: `আপনার খানার ${toBnDigits(unpaid.length.toString())}টি বছরের ট্যাক্স বকেয়া আছে। দ্রুত পরিশোধ করুন।`,
                    key: 'tax_alert'
                });
            }
        }

        if (insights.length === 0) {
            insights.push({
                type: 'health',
                priority: 'low',
                title: 'স্মার্ট ফ্যামিলি হেলথ টিপ',
                message: 'আপনার পরিবারের সকল ডাটা চমৎকারভাবে সাজানো আছে। নিয়মিত ট্যাক্স পরিশোধ করে স্মার্ট ইউনিয়ন গড়তে সহায়তা করুন।',
                key: 'health_tip'
            });
        }

        return insights;
    };

    const handleAIAction = (e, insight) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (insight.key === 'add_member') {
            setActiveTab('profile');
            return;
        }
        if (insight.key === 'tax_alert' || insight.key === 'health_tip') {
            setActiveTab('tax');
            return;
        }

        // 1. Prepare form data first
        const newFormData = {
            applicant_name: insight.resident.name,
            request_type: insight.key,
            contact_phone: insight.resident.phone || household.phone || '',
            details: `AI সুপারিশক্রমে "${insight.title}" এর জন্য স্বয়ংক্রিয়ভাবে তৈরি আবেদন।`
        };
        
        setServiceForm(newFormData);
        
        // 2. Navigate and show form
        setActiveTab('services');
        setIsPreviewMode(false);
        setShowServiceForm(true);
        
        // 3. Robust scrolling with a slight delay for render
        requestAnimationFrame(() => {
            setTimeout(() => {
                const formElement = document.getElementById('service-form-top');
                if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        });

        toast.success(`${insight.resident.name} এর জন্য ${insight.title} ফরম প্রস্তুত!`, {
            icon: '⚡',
            duration: 3000
        });
    };

    const AIAssistantView = () => {
        const insights = getAIInsights();
        return (
            <div className="space-y-6">
                <div className="p-8 rounded-[40px] bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Sparkles size={160} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                                <Sparkles className="text-teal-400" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">ডিজিটাল গ্রাম AI</h3>
                                <p className="text-teal-300 font-bold text-sm tracking-widest uppercase">স্মার্ট ফ্যামিলি অ্যানালাইসিস</p>
                            </div>
                        </div>
                        <p className="text-slate-300 font-medium leading-relaxed max-w-xl">
                            আপনার পরিবারের ডাটা বিশ্লেষণ করে আমি কিছু প্রয়োজনীয় সেবার সুপারিশ তৈরি করেছি।
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.map((insight, idx) => (
                        <div key={idx} className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${insight.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
                                    {insight.type === 'benefit' ? <Users size={20} /> : (insight.type === 'tax' ? <Banknote size={20} /> : <ShieldCheck size={20} />)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-800 text-sm mb-1">{insight.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{insight.message}</p>
                                    <button 
                                        type="button"
                                        onClick={(e) => handleAIAction(e, insight)} 
                                        className="w-full py-3 rounded-xl bg-slate-50 group-hover:bg-teal-600 group-hover:text-white text-slate-700 font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        সুপারিশ গ্রহণ করুন
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const ResidentCard = ({ resident, title, icon: Icon, colorClass }) => {
        const today = new Date();
        const birthDate = resident.dob ? new Date(resident.dob) : null;
        let age = birthDate ? today.getFullYear() - birthDate.getFullYear() : null;
        if (birthDate && (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()))) age--;

        const activeRequest = serviceRequests.find(sr => (sr.applicant_name === resident.name) && ['pending', 'processing', 'ready'].includes(sr.status));
        const deathRequest = serviceRequests.find(sr => (
            sr.applicant_name === resident.name &&
            sr.request_type === 'death_certificate' &&
            ['ready', 'completed'].includes(sr.status)
        ));
        const isDeceased = resident.is_dead || Boolean(deathRequest);
        const hasNid = Boolean(resident.nid);
        const hasBirthReg = Boolean(resident.birth_reg_no);
        const hasSchoolStatus = resident.student_status && resident.student_status !== 'not_student';
        const schoolStatusLabel = {
            studying: 'পড়ছে',
            applied: 'ভর্তি আবেদন',
            completed: 'পড়া শেষ',
            dropped: 'পড়া বন্ধ'
        }[resident.student_status] || 'শিক্ষার্থী';
        const missingFields = [
            !resident.nid && 'NID',
            !resident.birth_reg_no && 'জন্ম সনদ',
            !resident.dob && 'জন্ম তারিখ',
            !resident.blood_group && 'রক্তের গ্রুপ'
        ].filter(Boolean);
        const readiness = Math.round(((4 - missingFields.length) / 4) * 100);

        return (
            <div 
                role="button"
                tabIndex={0}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedResident(resident); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedResident(resident);
                    }
                }}
                className={`relative z-10 w-full min-w-0 overflow-hidden rounded-2xl border p-4 text-left ${isDeceased ? 'border-slate-200 bg-slate-100 grayscale opacity-80' : `${colorClass} bg-white`} group shadow-sm outline-none transition-all hover:border-teal-500 hover:shadow-md focus:ring-2 focus:ring-teal-500`}
            >
                {isDeceased && (
                    <span className="absolute right-3 top-3 rounded-full bg-slate-700 px-2.5 py-1 text-[8px] font-black text-white">
                        মৃত
                    </span>
                )}
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all group-hover:scale-110 group-hover:text-teal-600"><Icon size={20} /></div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{title}</p>
                        <h4 className="break-words text-xs font-black text-slate-800">{resident.name}</h4>
                        <p className="text-[9px] font-bold text-slate-500 mt-1">{toBnDigits(age?.toString() || '0')} বছর • {resident.gender === 'Male' ? 'পুরুষ' : 'নারী'}</p>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[8px] font-black ${hasNid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        NID {hasNid ? 'আছে' : 'নেই'}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[8px] font-black ${hasBirthReg ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                        জন্ম সনদ {hasBirthReg ? 'আছে' : 'নেই'}
                    </span>
                    {hasSchoolStatus && (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[8px] font-black text-indigo-700">
                            {schoolStatusLabel}
                        </span>
                    )}
                </div>
                {hasSchoolStatus && (
                    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[9px] font-bold leading-4 text-indigo-800">
                        {resident.current_school_name || 'School name নেই'}
                        {resident.current_class_name ? ` · ${resident.current_class_name}` : ''}
                        {resident.current_roll_no ? ` · Roll ${resident.current_roll_no}` : ''}
                    </div>
                )}
                <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[9px] font-black text-slate-400">
                        <span>তথ্য প্রস্তুতি</span>
                        <span>{toBnDigits(String(readiness))}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${readiness}%` }} />
                    </div>
                </div>
                {missingFields.length > 0 && (
                    <p className="mt-2 text-[9px] font-bold text-amber-600">
                        বাকি: {missingFields.join(', ')}
                    </p>
                )}
                {activeRequest && (
                    <div className={`mt-3 px-3 py-1.5 rounded-lg border ${STATUS_CONFIG[activeRequest.status]?.color} text-[8px] font-black uppercase tracking-widest flex items-center gap-2`}>
                        <Clock size={10} /> {SERVICE_TYPES[activeRequest.request_type] || 'আবেদন'} {STATUS_CONFIG[activeRequest.status]?.label}
                    </div>
                )}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startApplicationForResident(resident, 'birth_registration');
                        }}
                        className="rounded-lg bg-slate-900 px-2.5 py-2 text-center text-[8px] font-black text-white sm:py-1.5"
                    >
                        জন্ম নিবন্ধন
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startApplicationForResident(resident, 'death_certificate');
                        }}
                        className="rounded-lg bg-slate-100 px-2.5 py-2 text-center text-[8px] font-black text-slate-700 sm:py-1.5"
                    >
                        মৃত্যু সনদ
                    </button>
                </div>
            </div>
        );
    };

    const parents = residents.filter(r => ['Father', 'Mother'].includes(r.relation_with_head));
    const head = residents.filter(r => r.relation_with_head === 'Head');
    const spouses = residents.filter(r => ['Wife', 'Husband', 'Spouse'].includes(r.relation_with_head));
    const children = residents.filter(r => ['Son', 'Daughter', 'Child'].includes(r.relation_with_head));
    const otherMembers = residents.filter(r => !['Father', 'Mother', 'Head', 'Wife', 'Husband', 'Spouse', 'Son', 'Daughter', 'Child'].includes(r.relation_with_head));

    const relationLabel = (relation) => ({
        Father: 'বাবা',
        Mother: 'মা',
        Head: 'খানা প্রধান',
        Wife: 'স্ত্রী',
        Husband: 'স্বামী',
        Spouse: 'স্বামী/স্ত্রী',
        Son: 'ছেলে',
        Daughter: 'মেয়ে',
        Child: 'সন্তান'
    }[relation] || relation);

    const relationWarnings = residents.flatMap((resident) => {
        const warnings = [];
        const residentAge = resident.dob ? new Date().getFullYear() - new Date(resident.dob).getFullYear() : null;
        const headResident = head[0];
        const headAge = headResident?.dob ? new Date().getFullYear() - new Date(headResident.dob).getFullYear() : null;

        if (['Son', 'Daughter', 'Child'].includes(resident.relation_with_head) && !headResident) {
            warnings.push(`${resident.name}: খানা প্রধান পাওয়া যায়নি।`);
        }
        if (['Son', 'Daughter', 'Child'].includes(resident.relation_with_head) && headAge !== null && residentAge !== null && headAge - residentAge < 12) {
            warnings.push(`${resident.name}: খানা প্রধানের সঙ্গে বয়সের পার্থক্য অস্বাভাবিক।`);
        }
        return warnings;
    });

    const timelineEvents = [
        household?.created_at && {
            id: `house-${household.id}`,
            type: 'household',
            title: 'Household profile created',
            description: `${household.owner_name || 'Family'} profile opened in DigiGram.`,
            date: household.created_at,
            icon: Home,
            tone: 'bg-teal-50 text-teal-700 border-teal-100'
        },
        ...residents.map((resident) => ({
            id: `resident-${resident.id}`,
            type: 'resident',
            title: `${resident.name || 'Resident'} added`,
            description: `${relationLabel(resident.relation_with_head)} · ${resident.nid ? 'NID available' : 'NID missing'} · ${resident.birth_reg_no ? 'Birth reg available' : 'Birth reg missing'}`,
            date: resident.created_at || household.created_at,
            icon: User,
            tone: 'bg-slate-50 text-slate-700 border-slate-100'
        })),
        ...serviceRequests.map((request) => ({
            id: `request-${request.id}`,
            type: 'request',
            title: SERVICE_TYPES[request.request_type] || request.request_type || 'Service request',
            description: `${request.applicant_name || 'Applicant'} · ${STATUS_CONFIG[request.status]?.label || request.status || 'pending'}${request.collection_date ? ` · Collection ${new Date(request.collection_date).toLocaleDateString('bn-BD')}` : ''}`,
            date: request.updated_at || request.created_at,
            icon: ClipboardList,
            tone: request.status === 'ready' || request.status === 'completed'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : request.status === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
        })),
        ...documents.map((document) => ({
            id: `document-${document.id}`,
            type: 'document',
            title: document.title || document.document_type || 'Document uploaded',
            description: `${document.document_type || 'Document'} saved in digital locker.`,
            date: document.created_at || household.created_at,
            icon: ShieldCheck,
            tone: 'bg-indigo-50 text-indigo-700 border-indigo-100'
        })),
        ...taxes.map((tax) => ({
            id: `tax-${tax.id}`,
            type: 'tax',
            title: `Tax ${tax.fiscal_year_label || tax.year || ''}`,
            description: `${tax.status || 'due'} · Paid ${toBnDigits(tax.amount_paid || 0)} / Due ${toBnDigits(tax.amount_due || 0)}`,
            date: tax.updated_at || tax.created_at || tax.issued_at,
            icon: Banknote,
            tone: tax.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'
        }))
    ]
        .filter(Boolean)
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    const timelineSummary = timelineEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
    }, {});

    const selectedApplicant = residents.find(r => r.name === serviceForm.applicant_name);
    const selectedApplicantMissingFields = selectedApplicant ? [
        !selectedApplicant.nid && 'NID',
        !selectedApplicant.birth_reg_no && 'জন্ম সনদ',
        !selectedApplicant.dob && 'জন্ম তারিখ',
        !selectedApplicant.blood_group && 'রক্তের গ্রুপ'
    ].filter(Boolean) : [];

    return (
        <div className="flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden bg-white">
            {/* Header Tabs */}
            <div className="no-scrollbar -mx-2 flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-100 px-2 py-3 sm:mx-0 sm:p-4">
                {Object.entries(TABS).map(([key, tab]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        aria-current={activeTab === key ? 'page' : undefined}
                        className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all sm:gap-2 sm:px-6 sm:py-3 sm:text-[10px] ${menuStyles.tab(activeTab === key, 'dark')}`}
                    >
                        <tab.icon size={14} className={activeTab === key ? 'text-teal-400 sm:size-4' : 'sm:size-4'} />
                        {tab.label}
                        {tab.premium && <span className="ml-1 px-1.5 py-0.5 bg-teal-500 text-white rounded text-[7px]">PRO</span>}
                    </button>
                ))}
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 space-y-6 sm:space-y-12">
                            <div className="flex min-w-0 flex-col items-start justify-between gap-5 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6 md:flex-row md:gap-8 md:rounded-[32px] md:p-8">
                                <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-2xl shadow-teal-200 sm:h-20 sm:w-20 sm:rounded-3xl"><Home size={32} className="sm:h-10 sm:w-10" /></div>
                                    <div className="min-w-0">
                                        <h3 className="break-words text-xl font-black tracking-tight text-slate-800 sm:text-2xl">{household.owner_name} এর খানা</h3>
                                        <p className="mt-1 break-words text-xs font-bold uppercase tracking-widest text-slate-400 sm:text-sm">হোল্ডিং: {toBnDigits(household.house_no || '0')} • {household.village_name}</p>
                                    </div>
                                </div>
                                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto md:gap-4">
                                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5"><p className={labelStyles}>খানা প্রধান</p><p className="break-words text-sm font-black text-slate-800">{household.owner_name}</p></div>
                                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5"><p className={labelStyles}>মোট সদস্য</p><p className="text-sm font-black text-slate-800">{toBnDigits(residents.length.toString())} জন</p></div>
                                </div>
                            </div>

                            {relationWarnings.length > 0 && (
                                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                                    <p className="text-sm font-black text-amber-800">সম্পর্ক যাচাই প্রয়োজন</p>
                                    <div className="mt-3 space-y-2">
                                        {relationWarnings.map((warning) => (
                                            <p key={warning} className="text-xs font-bold text-amber-700">{warning}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8 py-2 sm:space-y-10 sm:py-4">
                                {parents.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">পূর্ব প্রজন্ম</p>
                                        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                                            {parents.map((r) => (
                                                <div key={r.id}>
                                                    {ResidentCard({ resident: r, title: relationLabel(r.relation_with_head), icon: Users, colorClass: "border-slate-200 bg-white" })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="relative space-y-4">
                                    {parents.length > 0 && <div className="mx-auto hidden h-8 w-px bg-slate-200 md:block" />}
                                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">মূল পরিবার</p>
                                    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                                        {head.map((r) => (
                                            <div key={r.id}>
                                                {ResidentCard({ resident: r, title: relationLabel(r.relation_with_head), icon: UserCheck, colorClass: "border-teal-300 bg-white" })}
                                            </div>
                                        ))}
                                        {spouses.map((r) => (
                                            <div key={r.id}>
                                                {ResidentCard({ resident: r, title: relationLabel(r.relation_with_head), icon: UserCircle, colorClass: "border-rose-200 bg-white" })}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {children.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="mx-auto hidden h-8 w-px bg-slate-200 md:block" />
                                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">সন্তান</p>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {children.map((r) => (
                                                <div key={r.id}>
                                                    {ResidentCard({ resident: r, title: relationLabel(r.relation_with_head), icon: User, colorClass: "border-slate-200 bg-white" })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {otherMembers.length > 0 && (
                                    <div className="space-y-4 border-t border-dashed border-slate-200 pt-6">
                                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">অন্যান্য সদস্য</p>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {otherMembers.map((r) => (
                                                <div key={r.id}>
                                                    {ResidentCard({ resident: r, title: relationLabel(r.relation_with_head), icon: Users, colorClass: "border-slate-200 bg-slate-50/50" })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ai' && AIAssistantView()}

                    {activeTab === 'services' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div id="service-form-top" className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-lg font-black text-slate-800 sm:text-xl">সেবা আবেদনসমূহ</h3>
                                <button onClick={() => setShowServiceForm(!showServiceForm)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-teal-600 sm:w-auto sm:px-6"><Plus size={16} /> নতুন আবেদন</button>
                            </div>
                            {showServiceForm && (
                                <form onSubmit={handleServiceSubmit} className="relative space-y-5 overflow-hidden rounded-3xl border-2 border-teal-100 bg-white p-4 shadow-2xl sm:space-y-6 sm:p-8 sm:rounded-[32px] sm:border-4">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Sparkles size={100} /></div>
                                    {!isPreviewMode ? (
                                        <>
                                            <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
                                                <div><label className={labelStyles}>সেবার ধরণ</label><select value={serviceForm.request_type} onChange={e => setServiceForm({...serviceForm, request_type: e.target.value})} className={inputStyles}>{Object.entries(SERVICE_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                                                <div><label className={labelStyles}>আবেদনকারী</label><select value={serviceForm.applicant_name} onChange={e => handleApplicantChange(e.target.value)} className={inputStyles}><option value="">সদস্য নির্বাচন করুন</option>{residents.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</select></div>
                                                {selectedApplicant && (
                                                    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs font-black text-slate-800">তথ্য প্রস্তুতি</p>
                                                                <p className="mt-1 text-[11px] font-bold text-slate-500">
                                                                    {selectedApplicantMissingFields.length === 0
                                                                        ? 'প্রয়োজনীয় মূল তথ্য সম্পূর্ণ আছে।'
                                                                        : `বাকি আছে: ${selectedApplicantMissingFields.join(', ')}`}
                                                                </p>
                                                            </div>
                                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                                                                selectedApplicantMissingFields.length === 0
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {selectedApplicantMissingFields.length === 0 ? 'রেডি' : 'অসম্পূর্ণ'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div><label className={labelStyles}>আবেদনকারীর NID</label><input value={serviceForm.applicant_nid || ''} onChange={e => setServiceForm({...serviceForm, applicant_nid: e.target.value})} className={inputStyles} placeholder="NID নম্বর" /></div>
                                                <div><label className={labelStyles}>জন্ম নিবন্ধন নম্বর</label><input value={serviceForm.applicant_birth_reg || ''} onChange={e => setServiceForm({...serviceForm, applicant_birth_reg: e.target.value})} className={inputStyles} placeholder="১৭ ডিজিট" /></div>
                                                
                                                <div><label className={labelStyles}>জন্ম তারিখ</label><input type="date" value={serviceForm.applicant_dob || ''} onChange={e => setServiceForm({...serviceForm, applicant_dob: e.target.value})} className={inputStyles} /></div>
                                                <div><label className={labelStyles}>লিঙ্গ</label><select value={serviceForm.applicant_gender || 'Male'} onChange={e => setServiceForm({...serviceForm, applicant_gender: e.target.value})} className={inputStyles}><option value="Male">পুরুষ</option><option value="Female">নারী</option></select></div>

                                                <div><label className={labelStyles}>পিতার নাম</label><input value={serviceForm.father_name || ''} readOnly className={inputStyles + " bg-slate-100 cursor-not-allowed"} /></div>
                                                <div><label className={labelStyles}>পিতার NID</label><input value={serviceForm.father_nid || ''} onChange={e => setServiceForm({...serviceForm, father_nid: e.target.value})} className={inputStyles} placeholder="পিতার NID" /></div>
                                                
                                                <div><label className={labelStyles}>মাতার নাম</label><input value={serviceForm.mother_name || ''} readOnly className={inputStyles + " bg-slate-100 cursor-not-allowed"} /></div>
                                                <div><label className={labelStyles}>মাতার NID</label><input value={serviceForm.mother_nid || ''} onChange={e => setServiceForm({...serviceForm, mother_nid: e.target.value})} className={inputStyles} placeholder="মাতার NID" /></div>
                                                
                                                <div><label className={labelStyles}>রক্তের গ্রুপ</label><select value={serviceForm.blood_group || ''} onChange={e => setServiceForm({...serviceForm, blood_group: e.target.value})} className={inputStyles}><option value="">নির্বাচন করুন</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></div>
                                                <div><label className={labelStyles}>মোবাইল নম্বর</label><input value={serviceForm.contact_phone || ''} onChange={e => setServiceForm({...serviceForm, contact_phone: e.target.value})} className={inputStyles} placeholder="017XXXXXXXX" /></div>
                                                <div className="md:col-span-2"><label className={labelStyles}>ঠিকানা</label><input value={serviceForm.applicant_address || ''} onChange={e => setServiceForm({...serviceForm, applicant_address: e.target.value})} className={inputStyles} placeholder="ঠিকানা" /></div>
                                                {serviceForm.request_type === 'death_certificate' && (
                                                    <>
                                                        <div><label className={labelStyles}>মৃত্যুর তারিখ</label><input type="date" value={serviceForm.death_date || ''} onChange={e => setServiceForm({...serviceForm, death_date: e.target.value})} className={inputStyles} /></div>
                                                        <div><label className={labelStyles}>মৃত্যুর স্থান</label><input value={serviceForm.place_of_death || ''} onChange={e => setServiceForm({...serviceForm, place_of_death: e.target.value})} className={inputStyles} placeholder="উদা: নিজ বাড়ি / হাসপাতাল" /></div>
                                                    </>
                                                )}
                                                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                    <p className="text-xs font-black text-slate-800">প্রয়োজনীয় চেকলিস্ট</p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {(SERVICE_CHECKLISTS[serviceForm.request_type] || ['আবেদনকারীর তথ্য']).map((item) => (
                                                            <span key={item} className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative z-10"><label className={labelStyles}>বিস্তারিত (যদি থাকে)</label><textarea value={serviceForm.details || ''} onChange={e => setServiceForm({...serviceForm, details: e.target.value})} className={inputStyles + " h-32 pt-4 resize-none"} placeholder="আপনার আবেদনের বিস্তারিত তথ্য এখানে লিখুন..."></textarea></div>
                                            <button disabled={savingService} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 shadow-xl disabled:opacity-50 relative z-10">আবেদন প্রিভিউ দেখুন</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="relative z-10 mb-6">
                                                {ApplicationPreview({
                                                    serviceForm,
                                                    applicant: residents.find(r => r.name === serviceForm.applicant_name),
                                                    household
                                                })}
                                            </div>
                                            <div className="flex gap-4 relative z-10">
                                                <button type="button" onClick={() => setIsPreviewMode(false)} disabled={savingService} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">সম্পাদনা করুন</button>
                                                <button type="button" onClick={confirmAndSubmitApplication} disabled={savingService} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl disabled:opacity-50 transition-all">{savingService ? <Loader2 className="animate-spin mx-auto" /> : 'চূড়ান্তভাবে জমা দিন'}</button>
                                            </div>
                                        </>
                                    )}
                                </form>
                            )}

                            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                                <h4 className="text-sm font-black text-slate-800">আবেদন টাইমলাইন</h4>
                                <div className="mt-4 space-y-3">
                                    {serviceRequests.length > 0 ? serviceRequests.map((request) => (
                                        <div key={request.id} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{request.applicant_name}</p>
                                                <p className="mt-1 text-xs font-bold text-slate-500">{SERVICE_TYPES[request.request_type] || request.request_type}</p>
                                                <p className="mt-1 text-[10px] font-bold text-slate-400">
                                                    আবেদন: {toBnDigits(new Date(request.created_at).toLocaleDateString('bn-BD'))}
                                                </p>
                                                {request.certificate_no && (
                                                    <p className="mt-1 text-[10px] font-black text-teal-600">
                                                        সনদ নং: {request.certificate_no}
                                                    </p>
                                                )}
                                                {request.certificate_no && ['ready', 'completed'].includes(request.status) && (
                                                    <a
                                                        href={`/certificate/${request.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black text-white"
                                                    >
                                                        সনদ দেখুন
                                                    </a>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black ${STATUS_CONFIG[request.status]?.color || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    {STATUS_CONFIG[request.status]?.label || request.status}
                                                </span>
                                                {request.collection_date && (
                                                    <p className="mt-2 text-[10px] font-bold text-emerald-600">
                                                        সংগ্রহ: {toBnDigits(new Date(request.collection_date).toLocaleDateString('bn-BD'))}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs font-bold text-slate-400">এখনও কোনো আবেদন নেই।</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {serviceRequests.map(sr => (
                                    <div key={sr.id} className="flex min-w-0 flex-col gap-4 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-teal-100 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><ClipboardList size={24} /></div>
                                            <div className="min-w-0">
                                                <h5 className="break-words font-black text-slate-800">{SERVICE_TYPES[sr.request_type] || sr.request_type}</h5>
                                                <p className="mt-1 break-words text-[10px] font-bold uppercase tracking-widest text-slate-400">আবেদনকারী: {sr.applicant_name} • {toBnDigits(new Date(sr.created_at).toLocaleDateString())}</p>
                                            </div>
                                        </div>
                                        <div className={`self-start rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest sm:self-auto ${STATUS_CONFIG[sr.status]?.color}`}>{STATUS_CONFIG[sr.status]?.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'documents' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
                            {!isLockerUnlocked ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-inner"><Lock size={40} /></div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">লকার সুরক্ষিত</h3>
                                    <p className="text-sm font-bold text-slate-400 mb-8 max-w-xs">এই ফোল্ডারের ফাইলগুলো দেখতে সঠিক পিন প্রদান করুন।</p>
                                    <form onSubmit={handleUnlock} className="flex flex-col gap-4 w-full max-w-[240px]">
                                        <input type="password" maxLength={4} value={enteredPin} onChange={e => setEnteredPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 text-3xl font-black text-center tracking-[0.6em] outline-none focus:bg-white focus:border-teal-500 transition-all" placeholder="****" />
                                        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-teal-600 transition-all">আনলক লকার</button>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h3 className="text-lg font-black text-slate-800 sm:text-xl">ডিজিটাল ডকুমেন্ট লকার</h3>
                                        <button onClick={() => setShowUploadForm(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg sm:w-auto sm:py-2.5"><Plus size={16} /> আপলোড</button>
                                    </div>
                                    {showUploadForm && (
                                        <form onSubmit={handleFileUpload} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className={labelStyles}>ফাইলের নাম</label><input required value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} className={inputStyles} /></div>
                                                <div><label className={labelStyles}>ধরণ</label><select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})} className={inputStyles}><option value="nid">NID</option><option value="birth_cert">জন্ম সনদ</option><option value="trade">ট্রেড লাইসেন্স</option></select></div>
                                            </div>
                                            <input type="file" onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                                            <button disabled={uploading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">{uploading ? <Loader2 className="animate-spin mx-auto" /> : 'আপলোড শুরু করুন'}</button>
                                        </form>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {documents.map(doc => (
                                            <div key={doc.id} className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-teal-200">
                                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-teal-600"><FileText size={24} /></div>
                                                    <div className="min-w-0"><p className="truncate text-xs font-black text-slate-800">{doc.title}</p><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{doc.type}</p></div>
                                                </div>
                                                <div className="flex shrink-0 gap-1 opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                                                    {doc.file_url ? (
                                                        <a href={doc.file_url} target="_blank" className="p-2 text-slate-400 hover:text-teal-600"><Eye size={18} /></a>
                                                    ) : (
                                                        <span title="এই নথিটি এখনও private locker-এ migrate হয়নি" className="p-2 text-slate-300"><Eye size={18} /></span>
                                                    )}
                                                    <button className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'timeline' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">Family Timeline</p>
                                        <h3 className="mt-1 text-xl font-black text-slate-900">এই পরিবারের সব activity এক জায়গায়</h3>
                                        <p className="mt-2 max-w-2xl text-xs font-bold leading-5 text-slate-500">
                                            Household update, member, application, document locker এবং tax history chronological ভাবে দেখা যাবে।
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {[
                                            ['Members', timelineSummary.resident || 0],
                                            ['Requests', timelineSummary.request || 0],
                                            ['Docs', timelineSummary.document || 0],
                                            ['Tax', timelineSummary.tax || 0]
                                        ].map(([label, value]) => (
                                            <div key={label} className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                                <p className="mt-1 text-xl font-black text-slate-900">{toBnDigits(value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="relative space-y-4">
                                <div className="absolute bottom-0 left-5 top-0 hidden w-px bg-slate-200 sm:block" />
                                {timelineEvents.map((event) => (
                                    <div key={event.id} className="relative flex gap-4 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm sm:ml-10 sm:p-5">
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${event.tone}`}>
                                            <event.icon size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <h4 className="break-words text-sm font-black text-slate-900">{event.title}</h4>
                                                    <p className="mt-1 break-words text-xs font-bold leading-5 text-slate-500">{event.description}</p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-500">
                                                    {event.date ? toBnDigits(new Date(event.date).toLocaleDateString('bn-BD')) : 'No date'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {timelineEvents.length === 0 && (
                                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                                        Timeline activity এখনো নেই।
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'tax' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-lg font-black text-slate-800 sm:text-xl">ট্যাক্স হিসেব ও পেমেন্ট</h3>
                                {canManage && (
                                    <button 
                                        onClick={() => setShowTaxForm(!showTaxForm)} 
                                        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all sm:w-auto sm:px-6 ${showTaxForm ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white hover:bg-teal-600'}`}
                                    >
                                        {showTaxForm ? <><X size={16} /> বন্ধ করুন</> : <><Plus size={16} /> নতুন রেকর্ড</>}
                                    </button>
                                )}
                            </div>

                            {showTaxForm && (
                                <form onSubmit={handleAddTax} className="space-y-5 rounded-3xl border-2 border-amber-100 bg-white p-4 shadow-2xl sm:space-y-6 sm:p-8 sm:rounded-[32px]">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
                                        <div>
                                            <label className={labelStyles}>অর্থ বছর</label>
                                            <input type="number" required value={taxForm.year} onChange={e => setTaxForm({...taxForm, year: e.target.value})} className={inputStyles} placeholder="২০২৪" />
                                        </div>
                                        <div>
                                            <label className={labelStyles}>অর্থবছরের লেবেল</label>
                                            <input value={taxForm.fiscal_year_label} onChange={e => setTaxForm({...taxForm, fiscal_year_label: e.target.value})} className={inputStyles} placeholder="২০২৫-২০২৬" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
                                        <div><label className={labelStyles}>ওয়ার্ড নং</label><input value={taxForm.ward_no} onChange={e => setTaxForm({...taxForm, ward_no: e.target.value})} className={inputStyles} placeholder="০৩" /></div>
                                        <div><label className={labelStyles}>হোল্ডিং নং</label><input value={taxForm.holding_no} onChange={e => setTaxForm({...taxForm, holding_no: e.target.value})} className={inputStyles} placeholder="হোল্ডিং নম্বর" /></div>
                                        <div><label className={labelStyles}>করদাতার নাম</label><input value={taxForm.taxpayer_name} onChange={e => setTaxForm({...taxForm, taxpayer_name: e.target.value})} className={inputStyles} /></div>
                                        <div><label className={labelStyles}>পিতা/স্বামীর নাম</label><input value={taxForm.guardian_name} onChange={e => setTaxForm({...taxForm, guardian_name: e.target.value})} className={inputStyles} /></div>
                                    </div>
                                    <div><label className={labelStyles}>বিলের ঠিকানা</label><input value={taxForm.address} onChange={e => setTaxForm({...taxForm, address: e.target.value})} className={inputStyles} /></div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6">
                                        <div><label className={labelStyles}>পূর্বের বকেয়া</label><input type="number" value={taxForm.previous_due} onChange={e => setTaxForm({...taxForm, previous_due: e.target.value})} className={inputStyles} /></div>
                                        <div><label className={labelStyles}>১ম কিস্তি</label><input type="number" value={taxForm.quarter_1} onChange={e => setTaxForm({...taxForm, quarter_1: e.target.value})} className={inputStyles} /></div>
                                        <div><label className={labelStyles}>২য় কিস্তি</label><input type="number" value={taxForm.quarter_2} onChange={e => setTaxForm({...taxForm, quarter_2: e.target.value})} className={inputStyles} /></div>
                                        <div><label className={labelStyles}>৩য় কিস্তি</label><input type="number" value={taxForm.quarter_3} onChange={e => setTaxForm({...taxForm, quarter_3: e.target.value})} className={inputStyles} /></div>
                                        <div><label className={labelStyles}>৪র্থ কিস্তি</label><input type="number" value={taxForm.quarter_4} onChange={e => setTaxForm({...taxForm, quarter_4: e.target.value})} className={inputStyles} /></div>
                                        <div><label className={labelStyles}>মোট ট্যাক্স</label><input type="number" value={taxForm.amount_due} onChange={e => setTaxForm({...taxForm, amount_due: e.target.value})} className={inputStyles} placeholder="ফাঁকা রাখলে auto" /></div>
                                    </div>
                                    <div><label className={labelStyles}>জমাদানের শেষ তারিখ</label><input type="date" value={taxForm.due_date} onChange={e => setTaxForm({...taxForm, due_date: e.target.value})} className={inputStyles} /></div>
                                    <div>
                                        <label className={labelStyles}>নোট (ঐচ্ছিক)</label>
                                        <input type="text" value={taxForm.notes} onChange={e => setTaxForm({...taxForm, notes: e.target.value})} className={inputStyles} placeholder="বকেয়া ট্যাক্স বা বিশেষ তথ্য..." />
                                    </div>
                                    <button disabled={savingTax} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 shadow-xl disabled:opacity-50">
                                        {savingTax ? <Loader2 className="animate-spin mx-auto" /> : 'ট্যাক্স রেকর্ড তৈরি করুন'}
                                    </button>
                                </form>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {taxes.map(t => (
                                    <div key={t.id} className="group space-y-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-amber-200 sm:space-y-6 sm:p-6 sm:rounded-[32px]">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner"><Receipt size={24} /></div>
                                                <div className="min-w-0"><h5 className="break-words font-black text-slate-800">অর্থ বছর: {toBnDigits(t.year.toString())}</h5><p className="break-words text-[10px] font-bold uppercase tracking-widest text-slate-400">ট্যাক্স আইডি: #{t.id.substring(0,8)}</p></div>
                                            </div>
                                            <div className={`self-start rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest sm:self-auto ${t.status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>{t.status === 'paid' ? 'পরিশোধিত' : 'বকেয়া'}</div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center sm:grid-cols-3 sm:gap-4">
                                            <div><p className={labelStyles}>মোট ট্যাক্স</p><p className="break-words text-sm font-black text-slate-800">৳{toBnDigits(t.amount_due.toString())}</p></div>
                                            <div className="border-y border-slate-200 py-3 sm:border-x sm:border-y-0 sm:py-0"><p className={labelStyles}>পরিশোধিত</p><p className="break-words text-sm font-black text-emerald-600">৳{toBnDigits(t.amount_paid.toString())}</p></div>
                                            <div><p className={labelStyles}>বকেয়া</p><p className="break-words text-sm font-black text-rose-600">৳{toBnDigits((t.amount_due - t.amount_paid).toString())}</p></div>
                                        </div>
                                        {t.payments?.length > 0 && (
                                            <div className="space-y-2">
                                                {t.payments.map((payment) => (
                                                    <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold">
                                                        <span>রসিদ: {toBnDigits(payment.receipt_no)}</span>
                                                        <span>৳{toBnDigits(payment.amount)}</span>
                                                        <Link href={`/tax-receipt/${payment.id}`} target="_blank" className="text-teal-600 hover:text-teal-700">
                                                            রসিদ দেখুন
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {canManage && t.status !== 'paid' && (
                                            <button onClick={() => setShowPaymentModal(t)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200">পেমেন্ট রেকর্ড করুন</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {/* Resident Detail Modal - Now with ModalPortal */}
            {/* Resident Detail Modal - Now fixed and wrapped in ModalPortal */}
            {selectedResident && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] flex items-stretch justify-center overflow-hidden p-0 sm:items-center sm:p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedResident(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden rounded-none border border-slate-100 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[40px]"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:items-center sm:p-8 sm:pb-4">
                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200 sm:h-12 sm:w-12">
                                        <User size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="break-words text-xl font-black text-slate-800 sm:text-2xl">{selectedResident.name}</h2>
                                        <p className="mt-1 break-words text-xs font-bold text-slate-400">সদস্যের বিস্তারিত তথ্য ও সেবাসমূহ</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedResident(null)} className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:text-rose-500">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 sm:pt-4">
                                {/* Application Progress Tracking */}
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                            <ClipboardList size={18} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">আবেদনের বর্তমান অবস্থা</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {serviceRequests.filter(sr => sr.applicant_name === selectedResident.name).length > 0 ? (
                                            serviceRequests.filter(sr => sr.applicant_name === selectedResident.name).map(sr => (
                                                <div key={sr.id} className="flex min-w-0 flex-col gap-4 rounded-[28px] border border-slate-100 bg-slate-50 p-4 transition-all hover:border-teal-200 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400">
                                                            <div className={`${STATUS_CONFIG[sr.status]?.color} bg-opacity-10 p-2 rounded-xl`}>
                                                                <Clock size={20} />
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="break-words text-sm font-black text-slate-800">{SERVICE_TYPES[sr.request_type] || sr.request_type}</p>
                                                            <p className="mt-0.5 break-words text-[10px] font-bold uppercase tracking-widest text-slate-400">ID: #{sr.id.substring(0,8)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-start gap-1 sm:items-end">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${STATUS_CONFIG[sr.status]?.color}`}>
                                                            {STATUS_CONFIG[sr.status]?.label}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 italic">পোর্টালে আপডেট দেখুন</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-400 md:col-span-2 sm:p-8">
                                                <p className="text-xs font-bold italic">অন্য কোনো আবেদন নেই</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">ব্যক্তিগত তথ্য</h4>
                                            <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6 sm:rounded-[32px]">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">লিঙ্গ</p>
                                                    <p className="font-bold text-slate-700">{selectedResident.gender === 'Male' ? 'পুরুষ' : 'নারী'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">সম্পর্ক</p>
                                                    <p className="font-bold text-slate-700">{selectedResident.relation_with_head}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">জন্ম তারিখ</p>
                                                    <p className="font-bold text-slate-700">{selectedResident.dob ? toBnDigits(new Date(selectedResident.dob).toLocaleDateString()) : 'নেই'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">রক্তের গ্রুপ</p>
                                                    <p className="font-bold text-rose-600">{selectedResident.blood_group || 'অজানা'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">পরিচয়পত্র ও অন্যান্য</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="flex min-w-0 flex-col gap-3 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Shield className="text-slate-300" size={20} />
                                                        <span className="text-xs font-black text-slate-500 uppercase">National ID</span>
                                                    </div>
                                                    <p className="break-words font-black text-slate-800">{selectedResident.nid ? toBnDigits(selectedResident.nid) : 'নেই'}</p>
                                                </div>
                                                <div className="flex min-w-0 flex-col gap-3 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <FileText className="text-slate-300" size={20} />
                                                        <span className="text-xs font-black text-slate-500 uppercase">জন্ম নিবন্ধন</span>
                                                    </div>
                                                    <p className="break-words font-black text-slate-800">{selectedResident.birth_reg_no ? toBnDigits(selectedResident.birth_reg_no) : 'নেই'}</p>
                                                </div>
                                                <div className="flex min-w-0 flex-col gap-3 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Zap className="text-slate-300" size={20} />
                                                        <span className="text-xs font-black text-slate-500 uppercase">পেশা</span>
                                                    </div>
                                                    <p className="break-words font-black text-slate-800">{selectedResident.occupation || 'দেওয়া হয়নি'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}
                {showPaymentModal && (
                    <div className="fixed inset-0 z-[1000] flex items-stretch justify-center p-0 sm:items-center sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPaymentModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onSubmit={handleRecordPayment} className="relative h-[100dvh] w-full space-y-5 overflow-y-auto bg-white p-5 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:space-y-6 sm:rounded-[40px] sm:p-10">
                            <div className="mb-6 text-center sm:mb-8"><h4 className="text-xl font-black text-slate-800 sm:text-2xl">ট্যাক্স পেমেন্ট</h4><p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">বছর: {toBnDigits(showPaymentModal.year.toString())}</p></div>
                            <div><label className={labelStyles}>পরিমাণ (৳)</label><input type="number" required value={paymentForm.amount_paid} onChange={e => setPaymentForm({...paymentForm, amount_paid: e.target.value})} className={inputStyles} placeholder="0.00" /></div>
                            <div><label className={labelStyles}>রসিদ নম্বর</label><input type="text" required value={paymentForm.receipt_no} onChange={e => setPaymentForm({...paymentForm, receipt_no: e.target.value})} className={inputStyles} placeholder="রসিদ বইয়ের নম্বর" /></div>
                            <div><label className={labelStyles}>আদায়ের তারিখ</label><input type="date" required value={paymentForm.paid_date} onChange={e => setPaymentForm({...paymentForm, paid_date: e.target.value})} className={inputStyles} /></div>
                            <div><label className={labelStyles}>আদায়কারীর নাম</label><input value={paymentForm.collected_by} onChange={e => setPaymentForm({...paymentForm, collected_by: e.target.value})} className={inputStyles} placeholder="চেয়ারম্যান/আদায়কারী" /></div>
                            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4"><button type="button" onClick={() => setShowPaymentModal(null)} className="flex-1 rounded-2xl bg-slate-100 py-4 text-xs font-black uppercase tracking-widest text-slate-500">বাতিল</button><button disabled={savingTax} className="flex-1 rounded-2xl bg-teal-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg">{savingTax ? <Loader2 className="animate-spin mx-auto" /> : 'নিশ্চিত করুন'}</button></div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
