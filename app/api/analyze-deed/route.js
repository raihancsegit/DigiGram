/**
 * POST /api/analyze-deed
 * Body (JSON): { imageBase64: string, mimeType: string }
 * Calls Gemini 1.5 Flash Vision API to extract Bengali deed information.
 */
export async function POST(request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: 'GEMINI_API_KEY environment variable is not set.' },
            { status: 500 }
        );
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
        return Response.json(
            { error: 'imageBase64 and mimeType are required.' },
            { status: 400 }
        );
    }

    const prompt = `তুমি একজন বাংলাদেশি ভূমি রেকর্ড বিশেষজ্ঞ এবং আইনি দলিল বিশ্লেষক।

এই ছবিতে একটি জমির দলিল, খতিয়ান, বা ভূমি সংক্রান্ত সরকারি কাগজ আছে।

নিচের তথ্যগুলো বের করে JSON ফরম্যাটে দাও। যদি কোনো তথ্য ছবিতে না থাকে বা পড়া না যায়, তাহলে সেই ফিল্ডে "পাওয়া যায়নি" লেখো।

{
  "donor": "দাতা / বিক্রেতার পুরো নাম ও পিতার নাম",
  "recipient": "গ্রহীতা / ক্রেতার পুরো নাম ও পিতার নাম",
  "plot": "দাগ নম্বর",
  "khatian": "খতিয়ান নম্বর",
  "mouza": "মৌজার নাম",
  "area": "জমির পরিমাণ (শতাংশ বা কাঠায়)",
  "year": "দলিলের সন বা তারিখ",
  "docType": "দলিলের ধরন (যেমন: ক্রয় দলিল, হেবা দলিল, বায়া দলিল ইত্যাদি)",
  "warnings": ["সন্দেহজনক বা অস্পষ্ট অংশের তালিকা — প্রতিটি আলাদা স্ট্রিং হিসেবে দাও"],
  "summary": "দলিলের সামগ্রিক সারমর্ম সহজ বাংলায় ২-৩ বাক্যে"
}

শুধু JSON অবজেক্ট রিটার্ন করো, অন্য কিছু লিখবে না।`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiBody = {
        contents: [
            {
                parts: [
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: imageBase64,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
        },
    };

    try {
        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            return Response.json(
                { error: `Gemini API error: ${geminiRes.status}`, detail: errText },
                { status: 502 }
            );
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Strip markdown code fences if present
        const cleaned = rawText.replace(/```json|```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            // Return raw text if JSON parse fails
            return Response.json({ raw: rawText, parseError: true });
        }

        return Response.json(parsed);
    } catch (err) {
        return Response.json(
            { error: 'Failed to reach Gemini API.', detail: err.message },
            { status: 500 }
        );
    }
}
