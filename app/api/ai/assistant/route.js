import { GoogleGenerativeAI } from '@google/generative-ai';
import { readJsonObject, validateTextFields } from '@/lib/utils/request-validation';
import { consumeRateLimit, rateLimitHeaders } from '@/lib/utils/rate-limit';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const MAX_HISTORY = 6;

export async function POST(request) {
    const rateLimit = await consumeRateLimit({
        request,
        scope: 'ai-assistant',
        limit: 12,
        windowSeconds: 60,
        client: supabaseAdmin,
    });
    if (!rateLimit.allowed) {
        return Response.json(
            { error: 'অনেক প্রশ্ন করা হয়েছে। এক মিনিট পরে আবার চেষ্টা করুন।' },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    const parsed = await readJsonObject(request, { maxBytes: 12 * 1024 });
    if (parsed.error) return Response.json({ error: parsed.error }, { status: parsed.status });

    const validation = validateTextFields(parsed.data, {
        question: { label: 'Question', required: true, maxLength: 1000 },
    });
    if (!validation.valid) return Response.json({ error: 'একটি সংক্ষিপ্ত প্রশ্ন লিখুন।' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'AI service is not configured.' }, { status: 503 });

    const history = Array.isArray(parsed.data.messages)
        ? parsed.data.messages.slice(-MAX_HISTORY).map((message) => ({
            role: message?.role === 'assistant' ? 'assistant' : 'user',
            content: String(message?.content || '').slice(0, 1000),
        })).filter((message) => message.content)
        : [];

    const prompt = `
You are DigiGram Assistant, a friendly public-service helper for people in Bangladesh.
Answer the user's latest question accurately in clear, simple Bengali unless they ask in another language.

What you can help with:
- DigiGram navigation, citizen applications, certificates, complaints, appointments, tracking, payments, schools, local markets, blood requests and benefit application preparation.
- General knowledge questions, explaining concepts, and practical step-by-step guidance.

Important rules:
- Never claim that DigiGram itself approves a government benefit or application. It prepares information; the relevant authority decides.
- Never invent live prices, application status, people, phone numbers or government rules. If current/local data is needed, say what must be checked and where.
- For medical, legal, financial or emergency matters, give cautious general guidance and recommend the proper professional or official service. For immediate danger in Bangladesh mention 999.
- Do not request passwords, OTPs, full bank credentials or other secrets.
- Keep the answer concise but complete. Use short numbered steps when useful.
- Return plain text only, without markdown tables.

Recent conversation:
${history.map((message) => `${message.role}: ${message.content}`).join('\n')}

Latest question: ${validation.values.question}
`;

    try {
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' });
        const result = await model.generateContent(prompt);
        const answer = result.response.text().trim();
        if (!answer) throw new Error('Empty AI response');
        return Response.json({ answer });
    } catch (error) {
        console.error('AI assistant response failed:', error instanceof Error ? error.message : 'unknown error');
        return Response.json({ error: 'AI response failed.' }, { status: 502 });
    }
}
