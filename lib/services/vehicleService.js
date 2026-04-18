/**
 * Vehicle Guard Service (Digi-Bahan)
 * Integrating Gemini AI for OCR and Vehicle Policy Management
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../utils/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI: Analyze Vehicle Document Image (Tax Token / Bluebook)
 * Using direct REST API for maximum compatibility
 */
export const analyzeVehicleDocument = async (base64Image, mimeType) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY পাওয়া যায়নি।");

    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
        You are a car registration expert in Bangladesh. 
        Analyze the provided image of a BRTA Tax Token.
        Extract details and return ONLY a valid JSON object:
        {
            "bike_number": "registration number (e.g. DHAKA METRO-HA-11-2030)",
            "owner_name": "owner name",
            "expiry_date": "YYYY-MM-DD",
            "is_valid": true
        }
    `;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Google API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("এআই কোনো তথ্য প্রদান করেনি।");

        // Clean JSON
        let jsonStr = text;
        if (text.includes('```')) {
            jsonStr = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] || text;
        }

        return JSON.parse(jsonStr.trim());
    } catch (error) {
        console.error("Gemini Analysis Detailed Error:", error);
        throw new Error(`স্ক্যান ত্রুটি: ${error.message}`);
    }
};

/**
 * Business Logic: Get Vehicle Security Status
 */
export const getVehicleSecurityStatus = async (bikeNumber) => {
    // 1. Fetch vehicle and docs from Supabase
    const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .select('*, vehicle_docs(*)')
        .eq('bike_number', bikeNumber)
        .single();

    if (vError || !vehicle) {
        return { status: 'unverified', message: 'বাহনটি এখনও ডিজি-বাহনে নথিভুক্ত নয়।', is_valid: true };
    }

    const docs = vehicle.vehicle_docs || [];
    const taxToken = docs.find(d => d.doc_type === 'tax_token');
    
    if (!taxToken) {
        return { status: 'unverified', message: 'ট্যাক্স টোকেনের তথ্য পাওয়া যায়নি।', is_valid: true };
    }

    const expiryDate = new Date(taxToken.expiry_date);
    const today = new Date();
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { 
            status: 'expired', 
            message: `সতর্কবার্তা: আপনার ট্যাক্স টোকেনের মেয়াদ ${Math.abs(diffDays)} দিন আগে শেষ হয়েছে!`, 
            is_valid: false,
            expiry_date: taxToken.expiry_date
        };
    }

    return { 
        status: 'valid', 
        message: `আপনার বাহনের কাগজপত্র সচল আছে। (মেয়াদ বাকি: ${diffDays} দিন)`, 
        is_valid: true,
        expiry_date: taxToken.expiry_date
    };
};

/**
 * Action: Register or Update Vehicle from AI Result
 */
export const syncVehicleData = async (aiData) => {
    const { bike_number, owner_name, expiry_date } = aiData;

    // 1. Check/Insert Vehicle
    const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .upsert({ bike_number, owner_name }, { onConflict: 'bike_number' })
        .select()
        .single();

    if (vError) throw new Error("বাহন রেজিস্ট্রি করতে সমস্যা হয়েছে।");

    // 2. Insert/Update Document Expiry
    const { error: dError } = await supabase
        .from('vehicle_docs')
        .upsert({ 
            bike_number, 
            doc_type: 'tax_token', 
            expiry_date,
            last_scanned_at: new Date().toISOString()
        }, { onConflict: 'bike_number,doc_type' });

    if (dError) throw new Error("ডকুমেন্টের তথ্য সেভ করা যায়নি।");

    return { success: true, bike_number };
};
