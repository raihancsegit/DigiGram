"use server";

import { 
    issueFuelToken, registerRefill, getPumpsWithStats, 
    verifyBikeEligibility, getPumpQueue,
    verifyOperatorPassword, updateOperatorPassword, fetchFuelLogs,
    getFuelPassData, updateUnionFuelSettings, getUnionFuelSettings
} from '@/lib/services/fuelService';
import { revalidatePath } from 'next/cache';

/**
 * Action: Request a new Fuel Token.
 * Handles validation and security checks on the server.
 */
export async function requestFuelTokenAction(formData) {
    const bikeNumber = formData.get('bikeNumber');
    const phone = formData.get('phone');
    const unionSlug = formData.get('unionSlug');

    try {
        const token = await issueFuelToken(bikeNumber, phone, unionSlug);
        
        // In a real app, this might revalidate the user's dashboard
        revalidatePath('/services/fuel'); 
        
        return { 
            success: true, 
            data: token 
        };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Action: Admin/Volunteer Refill Logic (Simulated scanner callback)
 */
export async function authorizeRefillAction(bikeNumber, amount, unionSlug) {
    try {
        const result = await registerRefill(bikeNumber, amount, unionSlug);
        revalidatePath('/services/fuel');
        return { success: true, message: result.message };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Action: Batch fetch pumps (Demonstrates N+1 prevention)
 */
export async function getLivePumpsAction(unionSlug) {
    try {
        const pumps = await getPumpsWithStats(unionSlug);
        return { success: true, data: pumps };
    } catch (error) {
        return { success: false, error: 'ডাটা লোড করতে সমস্যা হয়েছে।' };
    }
}

/**
 * Action: Verify Bike Eligibility (Operator Mode)
 */
export async function verifyBikeAction(bikeNumber) {
    try {
        const result = await verifyBikeEligibility(bikeNumber);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: 'যাচাই করা সম্ভব হয়নি।' };
    }
}

/**
 * Action: Get Live Queue for specific pump
 */
export async function getLiveQueueAction(unionSlug) {
    try {
        const queue = await getPumpQueue(unionSlug);
        return { success: true, data: queue };
    } catch (error) {
        return { success: false, error: 'সিরিয়াল লিস্ট পাওয়া যায়নি।' };
    }
}

/**
 * Action: Operator Authentication
 */
export async function verifyOperatorLoginAction(unionSlug, password) {
    try {
        const isValid = await verifyOperatorPassword(unionSlug, password);
        return { success: isValid };
    } catch (error) {
        return { success: false, error: 'লগইন করতে সমস্যা হয়েছে।' };
    }
}

/**
 * Action: Update Operator Password
 */
export async function updateOperatorPasswordAction(unionSlug, newPassword) {
    try {
        await updateOperatorPassword(unionSlug, newPassword);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Action: Get Activity Logs
 */
export async function getFuelLogsAction(unionSlug) {
    try {
        const logs = await fetchFuelLogs(unionSlug);
        return { success: true, data: logs };
    } catch (error) {
        return { success: false, error: 'লগ ডাটা পাওয়া যায়নি।' };
    }
}

/**
 * Action: Get Fuel Pass Status (Citizen Mode)
 */
export async function getFuelPassAction(bikeNumber, unionSlug) {
    try {
        const data = await getFuelPassData(bikeNumber, unionSlug);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'পাস ডাটা পাওয়া যায়নি।' };
    }
}

/**
 * Action: Update Union Fuel Settings
 */
export async function updateUnionFuelSettingsAction(unionSlug, settings) {
    try {
        await updateUnionFuelSettings(unionSlug, settings);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Action: Get Union Fuel Settings
 */
export async function getUnionFuelSettingsAction(unionSlug) {
    try {
        const settings = await getUnionFuelSettings(unionSlug);
        return { success: true, data: settings };
    } catch (error) {
        return { success: false, error: 'সেটিংস লোড করা যায়নি।' };
    }
}
