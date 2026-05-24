import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return Response.json({ error: 'GEMINI_API_KEY is not set.' }, { status: 500 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { lesson, subjectName = '', question = '', mode = 'explain' } = body;
    if (!lesson?.title) {
        return Response.json({ error: 'lesson is required.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' });
    const prompt = `
You are a patient Bangladeshi school tutor helping a student.
Subject: ${subjectName || 'unknown'}
Lesson title: ${lesson.title}
Lesson summary: ${lesson.description || ''}
Homework: ${lesson.homework || ''}
Student question: ${question || 'Explain the topic simply.'}
Mode: ${mode}

Return only valid JSON:
{
  "title": "short Bengali heading",
  "answer": "student-friendly Bengali explanation",
  "steps": ["step 1", "step 2", "step 3"],
  "practice": ["short practice 1", "short practice 2"],
  "encouragement": "short supportive Bengali line"
}

Rules:
- For math, explain step by step.
- For English, explain grammar or vocabulary with examples.
- Keep wording suitable for school students.
- If mode is "revision", focus on what to review after a low quiz score.
`;

    try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        return Response.json(JSON.parse(cleaned));
    } catch (error) {
        return Response.json({ error: `AI lesson help failed: ${error.message}` }, { status: 500 });
    }
}
