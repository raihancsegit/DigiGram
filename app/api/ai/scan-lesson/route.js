import { GoogleGenerativeAI } from '@google/generative-ai';

function fallbackLessonDraft(subjectName = '') {
    const subject = subjectName || 'পাঠ';
    return {
        title: `${subject} - আজকের পাঠ`,
        description: `ছবিটি থেকে স্বয়ংক্রিয় AI বিশ্লেষণ এখন চালু হয়নি, তাই একটি সাধারণ lesson draft তৈরি করা হলো। শিক্ষক ছবির বিষয় দেখে title, summary এবং homework প্রয়োজনমতো edit করে publish করতে পারবেন। এই topic student portal-এ class-wise দেখাবে।`,
        homework: 'বইয়ের সংশ্লিষ্ট অংশ পড়ে ৫টি গুরুত্বপূর্ণ পয়েন্ট খাতায় লিখবে এবং ৩টি অনুশীলনী সমাধান করবে।',
        resource_hint: `${subject} বাংলা ব্যাখ্যা lesson video`,
        quiz_questions: [
            {
                question_text: 'আজকের পাঠের মূল বিষয় কী?',
                option_a: 'শিক্ষকের দেওয়া topic',
                option_b: 'খেলার নিয়ম',
                option_c: 'ছুটির তালিকা',
                option_d: 'পরীক্ষার রুটিন',
                correct_option: 'a',
                explanation: 'এই quiz আজকের topic বুঝেছে কিনা যাচাই করার জন্য।'
            }
        ],
        fallback: true
    };
}

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { images, mimeType, subjectName = '' } = body;
    if (!images || !Array.isArray(images) || images.length === 0 || !mimeType) {
        return Response.json({ error: 'images and mimeType are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return Response.json(fallbackLessonDraft(subjectName));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
            const prompt = `
You are helping a Bangladeshi school teacher turn a textbook/page photo into a lesson draft.
Subject: ${subjectName || 'unknown'}

Read the image and return only valid JSON in this exact shape:
{
  "title": "short lesson title in Bengali",
  "description": "3-5 sentence student-friendly Bengali summary",
  "homework": "short practice/homework instruction in Bengali",
  "resource_hint": "short phrase a teacher can use to find a helpful video",
  "quiz_questions": [
    {
      "question_text": "question in Bengali",
      "option_a": "option",
      "option_b": "option",
      "option_c": "option",
      "option_d": "option",
      "correct_option": "a",
      "explanation": "short Bengali explanation"
    }
  ]
}

Rules:
- Create at most 3 short MCQ questions.
- If the image is unclear, still return the best draft but keep the wording conservative.
- Keep language suitable for school students.
`;

            const imageParts = images.map((img) => ({
                inlineData: { data: img, mimeType }
            }));
            const result = await model.generateContent([prompt, ...imageParts]);
            const rawText = result.response.text();
            const cleaned = rawText.replace(/```json|```/g, '').trim();
            try {
                return Response.json(JSON.parse(cleaned));
            } catch {
                return Response.json(fallbackLessonDraft(subjectName));
            }
        } catch (error) {
            lastError = error;
            if (error.message?.includes('503') || error.message?.includes('404')) continue;
            return Response.json(fallbackLessonDraft(subjectName));
        }
    }

    return Response.json(fallbackLessonDraft(subjectName || lastError?.message));
}
