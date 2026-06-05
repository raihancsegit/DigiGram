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

    const { prices = [], markets = [], commodities = [] } = body;

    // 1. Prepare a compact, summarized market data payload for Gemini to digest efficiently
    const marketMap = new Map(markets.map(m => [m.id, m.name]));
    const commodityMap = new Map(commodities.map(c => [c.id, c]));

    const condensedPrices = prices.map(p => {
        const commodity = p.commodity || commodityMap.get(p.commodity_id);
        const marketName = marketMap.get(p.market_id) || 'হাট';
        return {
            commodity: commodity?.name || 'পণ্য',
            unit: commodity?.unit || 'কেজি',
            market: marketName,
            price: p.price,
            prevPrice: p.prev_price,
            trend: p.trend, // 'up', 'down', 'stable'
            supply: p.supply // 'High', 'Low', 'Normal'
        };
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' });

    const prompt = `
You are the "Gemini Smart Market Analyst" for DigiGram, a digital government and agriculture planning platform in Bangladesh.
Your task is to analyze today's local agricultural market prices and supply levels to generate high-value, actionable bulletins in Bengali.

Today's Live Market Data:
${JSON.stringify(condensedPrices.slice(0, 40), null, 2)}

Please return a valid JSON object with the following structure:
{
  "summary": "Today's general market review in Bengali. Highlight significant shifts, average price movements, and notable market status (2-3 concise lines).",
  "farmersAdvice": "Highly practical, strategic farming and harvesting advisory for local farmers in Bengali. Tell them which crops are highly profitable to bring to market today, which ones they should store/hold because prices might recover, and what supply shortages they can capitalize on (3 bullet points).",
  "buyersGuide": "Smart shopping/bargain-hunting guide for general citizens in Bengali. Tell them where to find the absolute best deals, which commodities have high supply and low prices today, and how to shop smartly (3 bullet points).",
  "marketPulse": "A short, catchy, inspiring market wrap-up slogan or analytical quote of the day in Bengali (max 15 words)."
}

Rules:
- Keep the tone professional, authoritative, warm, and rural-friendly.
- Speak directly in clear, standard Bengali (e.g., use "চাষী ভাইদের জন্য", "ক্রেতাদের জন্য সাশ্রয়ী পরামর্শ").
- Do not mention technical details like JSON, arrays, API, keys, or Supabase in the Bengali text.
- Do not use markdown inside the JSON string values (keep them plain text).
- Return ONLY valid JSON.
`;

    try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        return Response.json(JSON.parse(cleaned));
    } catch (error) {
        console.error("AI Market Analyst failed:", error);
        return Response.json({ error: `AI Market Analyst failed: ${error.message}` }, { status: 500 });
    }
}
