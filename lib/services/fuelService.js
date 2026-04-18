/**
 * Digi-Fuel Service Layer (DATABASE INTEGRATED)
 * This file handles DB logic using Supabase, validation, and security sanitization.
 */

import { supabase } from '../utils/supabase';
import { FUEL_PUMPS, FUEL_RETAILERS } from '../constants/fuelData';
import { getVehicleSecurityStatus } from './vehicleService';

/**
 * Configuration: Rationing Limits
 */
const DEFAULT_LIMIT_TAKA = 500;
const RATIONING_WINDOW_HOURS = 72;

/**
 * Security: Sanitize user input to prevent common injection/XSS patterns.
 */
export const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[^\w\s\u0980-\u09FF-]/gi, '').trim(); 
};

/**
 * Validation: Validate Bike Number format
 */
export const validateBikeNumber = (bikeNumber) => {
    if (!bikeNumber || bikeNumber.length < 5) return false;
    return true; 
};

/**
 * Performance: Batch Fetching (Prevention of N+1)
 * Fetches pumps and potentially merges real-time status from a DB table.
 */
export const getPumpsWithStats = async (unionSlug) => {
    // 1. Fetch static pump data
    const localPumps = FUEL_PUMPS.filter(p => p.unionSlug === unionSlug);
    
    // 2. Demonstration of real-time DB override (N+1 Prevention)
    try {
        const { data: dbStatuses, error } = await supabase
            .from('fuel_pump_status')
            .select('*')
            .eq('union_slug', unionSlug);
        
        if (error || !dbStatuses) return localPumps;

        // Efficiently merge DB data into local constants in ONE loop
        return localPumps.map(pump => {
            const status = dbStatuses.find(s => s.pump_id === pump.id);
            return status ? { ...pump, ...status } : pump;
        });
    } catch (e) {
        return localPumps;
    }
};

/**
 * Fetch dynamic rationing settings for a union
 */
export const getUnionFuelSettings = async (unionSlug) => {
    try {
        const { data, error } = await supabase
            .from('fuel_pump_settings')
            .select('rationing_limit, rationing_days')
            .eq('union_slug', unionSlug)
            .single();

        if (error || !data) {
            return { limit: 500, days: 3 }; // Fallback defaults
        }

        return { 
            limit: data.rationing_limit || 500, 
            days: data.rationing_days || 3 
        };
    } catch (e) {
        return { limit: 500, days: 3 };
    }
};

/**
 * Business Logic: Dynamic Rationing Check Rule
 */
export const checkRefillEligibility = async (bikeNumber, unionSlug = 'south-union') => {
    const settings = await getUnionFuelSettings(unionSlug);
    const rationingHours = settings.days * 24;

    const { data, error } = await supabase
        .from('fuel_refill_logs')
        .select('*')
        .eq('bike_number', bikeNumber)
        .single();

    if (error && error.code !== 'PGRST116') { 
        console.error('DB Error checking eligibility:', error);
        return { eligible: true }; 
    }

    if (!data) return { eligible: true };

    const diffHours = (new Date() - new Date(data.last_refill_time)) / (1000 * 60 * 60);
    
    if (diffHours < rationingHours) {
        const remainingHours = rationingHours - diffHours;
        const remainingDays = Math.ceil(remainingHours / 24);
        return { 
            eligible: false, 
            remainingDays: remainingDays,
            message: `আপনার রেশনিং পিরিয়ড শেষ হতে আরও প্রায় ${toBnDigits(remainingDays)} দিন বাকি। ৳${toBnDigits(settings.limit)} টাকার তেল আপনি ${toBnDigits(settings.days)} দিনে একবার নিতে পারবেন।`
        };
    }

    return { eligible: true };
};

/**
 * Logic: Generate Sequential Serial Token with Time Slots
 */
const generateTimeSlot = (serialNumber) => {
    // Starts at 7:00 AM
    const totalMinutes = (serialNumber - 1) * 5;
    const date = new Date();
    date.setHours(7, 0, 0, 0);
    date.setMinutes(date.getMinutes() + totalMinutes);
    return date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const issueFuelToken = async (bikeNumber, phone, unionSlug) => {
    const cleanBike = sanitizeInput(bikeNumber);
    const cleanPhone = sanitizeInput(phone || '');
    
    if (!validateBikeNumber(cleanBike)) {
        throw new Error('অকার্যকর বাইক নম্বর। সঠিক ফরম্যাটে লিখুন।');
    }

    // NEW: Check Vehicle Security Status (ডিজি-বাহন Integration)
    const vehicleStatus = await getVehicleSecurityStatus(cleanBike);

    // Check Eligibility in DB (3 day rule)
    const eligibility = await checkRefillEligibility(cleanBike);
    if (!eligibility.eligible) {
        throw new Error(eligibility.message);
    }

    const { data: existingToken } = await supabase
        .from('fuel_tokens')
        .select('*')
        .eq('bike_number', cleanBike)
        .gte('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()) 
        .single();

    if (existingToken) {
        throw new Error('আপনার জন্য ইতিমধ্যে একটি টোকেন ইস্যু করা আছে।');
    }

    // NEW: Save missing details into `vehicles` table
    if (cleanPhone) {
        await supabase.from('vehicles').upsert({
            bike_number: cleanBike,
            phone_number: cleanPhone
        }, { onConflict: 'bike_number' });
    }

    // Determine sequential serial
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: maxToken } = await supabase
        .from('fuel_tokens')
        .select('serial_number')
        .eq('union_slug', unionSlug)
        .gte('created_at', todayStart.toISOString())
        .order('serial_number', { ascending: false })
        .limit(1)
        .single();

    const serialNumber = maxToken && maxToken.serial_number ? maxToken.serial_number + 1 : 1;
    const timeSlot = generateTimeSlot(serialNumber);
    const currentDate = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const { data, error } = await supabase
        .from('fuel_tokens')
        .insert([{
            bike_number: cleanBike,
            serial_number: serialNumber,
            slot_time: timeSlot,
            union_slug: unionSlug
        }])
        .select()
        .single();

    if (error) {
        throw new Error('টোকেন জেনারেশন ব্যর্থ হয়েছে।');
    }

    // Log Activity
    await logFuelActivity(unionSlug, 'TOKEN_ISSUED', { 
        bike: cleanBike, 
        serial: serialNumber 
    });

    return {
        id: data.id.toString().slice(0, 5).toUpperCase(),
        bikeNumber: data.bike_number,
        serial: data.serial_number,
        slot: data.slot_time,
        date: currentDate,
        createdAt: data.created_at,
        warning: !vehicleStatus.is_valid ? vehicleStatus.message : null
    };
};

/**
 * Volunteer: Register Refill (500 TK Logic)
 */
export const registerRefill = async (bikeNumber, amount, unionSlugParam) => {
    const cleanBike = sanitizeInput(bikeNumber);
    const unionSlug = unionSlugParam || 'south-union'; // Use provided or fallback

    // 1. Calculate the start of "rationing window"
    const settings = await getUnionFuelSettings(unionSlug);
    
    const { error: logError } = await supabase
        .from('fuel_refill_logs')
        .upsert({ 
            bike_number: cleanBike, 
            last_refill_time: new Date().toISOString(),
            amount_liters: amount // We keep amount as Taka in this column for now
        }, { onConflict: 'bike_number' });

    if (logError) {
        throw new Error('রিফিল নথিভুক্ত করা যায়নি।');
    }

    // Log Activity
    await logFuelActivity(unionSlug, 'REFILL_CONFIRMED', { 
        bike: cleanBike, 
        amount: amount 
    });

    await supabase
        .from('fuel_tokens')
        .delete()
        .eq('bike_number', cleanBike);

    return { 
        success: true, 
        message: '৳৫০০ টাকার তেল বরাদ্দ সফলভাবে নথিভুক্ত করা হয়েছে।',
        nextEligible: new Date(Date.now() + 72 * 60 * 60 * 1000)
    };
};

/**
 * Security: Operator Password Management
 */
export const verifyOperatorPassword = async (unionSlug, password) => {
    const { data, error } = await supabase
        .from('fuel_pump_settings')
        .select('access_password')
        .eq('union_slug', unionSlug)
        .single();

    // Default password '1234' for new/demo unions if not set
    if (error || !data) {
        return password === '1234';
    }

    return data.access_password === password;
};

export const updateOperatorPassword = async (unionSlug, newPassword) => {
    const { error } = await supabase
         .from('fuel_pump_settings')
        .upsert({ 
            union_slug: unionSlug, 
            access_password: newPassword,
            updated_at: new Date().toISOString()
        }, { onConflict: 'union_slug' });

    if (error) throw new Error('পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
    
    await logFuelActivity(unionSlug, 'PASSWORD_CHANGED', { time: new Date().toISOString() });
    return true;
};

export const updateUnionFuelSettings = async (unionSlug, settings) => {
    const { error } = await supabase
        .from('fuel_pump_settings')
        .upsert({ 
            union_slug: unionSlug, 
            rationing_limit: settings.limit,
            rationing_days: settings.days,
            updated_at: new Date().toISOString()
        }, { onConflict: 'union_slug' });

    if (error) throw new Error('সেটিংস আপডেট করতে সমস্যা হয়েছে।');
    
    await logFuelActivity(unionSlug, 'SETTINGS_UPDATED', { limit: settings.limit, days: settings.days });
    return true;
};

/**
 * Audit: Log Activities
 */
export const logFuelActivity = async (unionSlug, action, details) => {
    try {
        await supabase.from('fuel_activity_logs').insert([{
            union_slug: unionSlug,
            action_type: action,
            details: details
        }]);
    } catch (e) {
        console.error('Log error:', e);
    }
};

export const fetchFuelLogs = async (unionSlug) => {
    const { data, error } = await supabase
        .from('fuel_activity_logs')
        .select('*')
        .eq('union_slug', unionSlug)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) return [];
    return data;
};

/**
 * Public: Get detailed fuel pass data for a vehicle
 */
export const getFuelPassData = async (bikeNumber, unionSlug) => {
    const cleanBike = sanitizeInput(bikeNumber);
    const settings = await getUnionFuelSettings(unionSlug);
    
    const { data: log, error } = await supabase
        .from('fuel_refill_logs')
        .select('*')
        .eq('bike_number', cleanBike)
        .single();

    let usedQuota = 0;
    let lastRefill = null;
    let eligible = true;
    let nextEligible = null;

    if (log) {
        lastRefill = log.last_refill_time;
        const diffHours = (new Date() - new Date(lastRefill)) / (1000 * 60 * 60);
        const rationingHours = settings.days * 24;

        if (diffHours < rationingHours) {
            usedQuota = settings.limit; // Simple logic: if they refilled, they used the quota
            eligible = false;
            nextEligible = new Date(new Date(lastRefill).getTime() + rationingHours * 60 * 60 * 1000).toISOString();
        }
    }

    return {
        bikeNumber: cleanBike,
        totalQuota: settings.limit,
        usedQuota: usedQuota,
        remainingQuota: settings.limit - usedQuota,
        lastRefill: lastRefill,
        eligible: eligible,
        nextEligible: nextEligible,
        rationingDays: settings.days
    };
};

/**
 * Operator: Verify Bike Eligibility and Token (N+1 Optimized)
 */
export const verifyBikeEligibility = async (bikeNumber) => {
    const cleanBike = sanitizeInput(bikeNumber);
    
    // 1. Fetch token and rationing log in parallel
    const [tokenRes, logRes] = await Promise.all([
        supabase.from('fuel_tokens').select('*').eq('bike_number', cleanBike).single(),
        supabase.from('fuel_refill_logs').select('*').eq('bike_number', cleanBike).single()
    ]);

    const token = tokenRes.data;
    const log = logRes.data;

    let status = 'eligible'; // eligible, already_refilled, no_token
    let message = 'টোকেন পাওয়া গেছে। আপনি ৳৫০০ টাকার তেল বরাদ্দ দিতে পারেন।';
    let remainingLiters = 500;

    if (log) {
        const diffHours = (new Date() - new Date(log.last_refill_time)) / (1000 * 60 * 60);
        if (diffHours < 24) {
            status = 'already_refilled';
            message = `সতর্কবার্তা: এই বাইক আজ তেল নিয়েছে। (${toBnDigits(Math.ceil(24 - diffHours))} ঘণ্টা বাকি)`;
            remainingLiters = 0;
        }
    }

    if (!token && status === 'eligible') {
        status = 'no_token';
        message = 'এই বাইকের কোনো অগ্রিম টোকেন নেই। অনুগ্রহ করে টোকেন চেক করুন।';
    }

    return { status, message, token, bikeNumber: cleanBike, remainingLiters };
};

/**
 * Operator: Get Live Queue for a Pump
 */
export const getPumpQueue = async (unionSlug) => {
    const { data, error } = await supabase
        .from('fuel_tokens')
        .select('*')
        .eq('union_slug', unionSlug)
        .order('serial_number', { ascending: true });

    if (error) return [];
    return data;
};

/** Helper for display */
const toBnDigits = (n) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
