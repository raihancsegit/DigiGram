import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: 'GEMINI_API_KEY is not set. Please add it to your .env.local file.' },
            { status: 500 }
        );
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { images, mimeType } = body;

    if (!images || !Array.isArray(images) || images.length === 0 || !mimeType) {
        return Response.json(
            { error: 'images (array) and mimeType are required.' },
            { status: 400 }
        );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Attempt with primary model, then fallback
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro-vision"];
    let lastError = null;

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1beta" });

            const prompt = `তুমি একজন বাংলাদেশি ডিজিটাল ভলান্টিয়ার এবং ডাটা এন্ট্রি বিশেষজ্ঞ।
            
            এই ছবিগুলোতে একটি বাংলাদেশের জাতীয় পরিচয়পত্র (NID) এর সামনের ও পিছনের অংশ অথবা জন্ম নিবন্ধন আছে।
            
            সবগুলো ছবি বিশ্লেষণ করে নিচের তথ্যগুলো বের করে JSON ফরম্যাটে দাও। বিশেষ করে NID-র পিছনের অংশ থেকে ঠিকানা (Address), থানা এবং অন্যান্য তথ্য নিখুঁতভাবে সংগ্রহ করো।
            
            {
              "name": "পুরো নাম (বাংলা)",
              "name_en": "Full Name (English)",
              "nid": "NID নম্বর",
              "birth_reg_no": "জন্ম নিবন্ধন নম্বর",
              "dob": "জন্ম তারিখ (YYYY-MM-DD ফরম্যাটে)",
              "gender": "লিঙ্গ (শুধুমাত্র 'Male' অথবা 'Female' লিখবে)",
              "father_name": "পিতার নাম",
              "mother_name": "মাতার নাম",
              "blood_group": "রক্তের গ্রুপ (যেমন: A+, A-, B+, B-, AB+, AB-, O+, O-)",
              "address": "বিস্তারিত ঠিকানা (পিছনের অংশ থেকে)",
              "isNID": true,
              "isBirthCertificate": true
            }
            
            শুধু JSON অবজেক্ট রিটার্ন করো।`;

            const imageParts = images.map(img => ({
                inlineData: {
                    data: img,
                    mimeType: mimeType
                }
            }));

            const result = await model.generateContent([
                prompt,
                ...imageParts
            ]);

            const response = await result.response;
            const rawText = response.text();
            const cleaned = rawText.replace(/```json|```/g, '').trim();

            return Response.json(JSON.parse(cleaned));
        } catch (err) {
            console.warn(`Model ${modelName} failed:`, err.message);
            lastError = err;
            // Continue to next model if 503 (high demand) or 404 (not found)
            if (err.message.includes("503") || err.message.includes("404")) {
                continue;
            } else {
                break; // Stop for other fatal errors
            }
        }
    }

    return Response.json(
        { error: 'AI Error: All models failed. Last error: ' + lastError.message },
        { status: 500 }
    );
}
