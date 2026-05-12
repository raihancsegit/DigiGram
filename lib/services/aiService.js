/**
 * Service to handle AI Assistant logic.
 * This can be connected to Google Gemini or OpenAI in the future.
 */
export const aiService = {
    // 1. Get AI Response
    getAssistantResponse: async (query, context = {}) => {
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const queryLower = query.toLowerCase();

        // 1. Basic Routing / Rule-based fallback for platform specific info
        if (queryLower.includes('ব্লাড') || queryLower.includes('রক্ত')) {
            return "আপনি 'ব্লাড ব্যাংক' সেকশনে গিয়ে রক্তদাতাদের তালিকা এবং ফোন নম্বর খুঁজে পাবেন। প্রতিটি ইউনিয়নের পোর্টালে স্থানীয় রক্তদাতাদের তালিকা রয়েছে।";
        }
        
        if (queryLower.includes('বাজার') || queryLower.includes('দাম')) {
            return "ডিজি-বাজার সেকশনে আপনি নিত্যপণ্যের বর্তমান বাজারদর দেখতে পারবেন। আপনি বিভিন্ন বাজারের দাম তুলনাও করতে পারেন।";
        }

        if (queryLower.includes('ইউনিয়ন') || queryLower.includes('চেয়ারম্যান')) {
            return "ইউনিয়ন পোর্টালে আপনার ইউনিয়নের যাবতীয় ডিজিটাল সেবা, সনদ এবং জনপ্রতিনিধিদের তথ্য পাওয়া যাবে।";
        }

        if (queryLower.includes('ভলান্টিয়ার') || queryLower.includes('হিসাব')) {
            return "ভলান্টিয়াররা গ্রাম পর্যায়ে তথ্য সংগ্রহ করে থাকেন। আপনি যদি ভলান্টিয়ার হতে চান, তবে আপনার ইউনিয়ন পরিষদে যোগাযোগ করুন।";
        }

        // 2. Mock AI Generative Response
        return `আপনার প্রশ্ন: "${query}" এর জন্য ধন্যবাদ। আমি ডিজিগ্রাম স্মার্ট অ্যাসিস্ট্যান্ট। আমি আপনাকে ইউনিয়ন সেবা, বাজারদর, জরুরি নম্বর এবং অন্যান্য ডিজিটাল সেবা খুঁজে পেতে সাহায্য করতে পারি। আপনি কি নির্দিষ্ট কোনো ইউনিয়নের তথ্য জানতে চাচ্ছেন?`;
    },

    // 2. Predefined Quick Questions
    getQuickQuestions: () => [
        "কিভাবে রক্তদাতা খুঁজে পাব?",
        "আজকের বাজারদর কত?",
        "ইউনিয়ন সেবাসমূহ কি কি?",
        "ভলান্টিয়ারদের কাজ কি?",
        "জরুরি নম্বর কোথায় পাব?"
    ]
};
