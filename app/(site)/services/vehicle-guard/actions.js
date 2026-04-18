"use server";

import { analyzeVehicleDocument, syncVehicleData } from '@/lib/services/vehicleService';
import { revalidatePath } from 'next/cache';

/**
 * Action: Analyze Vehicle Doc using Gemini AI
 */
export async function analyzeVehicleDocAction(formData) {
    const file = formData.get('image');
    if (!file) {
        return { success: false, error: 'কোনো ইমেজ পাওয়া যায়নি।' };
    }

    try {
        // 1. Convert File to Base64 for Gemini
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = file.type;

        // 2. AI Analysis
        const result = await analyzeVehicleDocument(base64Image, mimeType);

        // 3. Sync to Supabase
        await syncVehicleData(result);

        revalidatePath('/services/vehicle-guard');
        revalidatePath('/services/fuel');

        return { 
            success: true, 
            data: result 
        };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}
