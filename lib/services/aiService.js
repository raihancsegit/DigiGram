function getLocalAssistantAnswer(query) {
    const text = String(query || '').toLowerCase();

    if (text.includes('রক্ত') || text.includes('ব্লাড')) {
        return 'রক্তের সহায়তা চাইতে Citizen Center-এর “রক্ত জরুরি” সেবায় যান। রোগীর রক্তের গ্রুপ, হাসপাতাল, প্রয়োজনের সময় ও যোগাযোগ নম্বর দিন। জীবনসংকট হলে সঙ্গে সঙ্গে ৯৯৯ বা নিকটস্থ হাসপাতালে যোগাযোগ করুন।';
    }
    if (text.includes('বাজার') || text.includes('দাম')) {
        return 'বর্তমান বাজারদর দেখতে “বাজার দর” সেবায় যান। বাজার ও পণ্য বাছাই করে সর্বশেষ প্রকাশিত দাম তুলনা করুন। কোনো live দাম না দেখালে স্থানীয় বাজারে যাচাই করুন—আমি অনুমান করে দাম বলব না।';
    }
    if (text.includes('ভাতা') || text.includes('বয়স্ক') || text.includes('মাতৃত্ব') || text.includes('বিধবা') || text.includes('প্রতিবন্ধ')) {
        return 'হোম পেজের “সহজ আবেদন প্রস্তুতি” অংশ থেকে প্রয়োজনীয় ভাতা বাছাই করুন। যোগ্যতা ও কাগজপত্রের checklist পূরণ করে আবেদন সারাংশ Print/PDF করুন। চূড়ান্ত আবেদন সংশ্লিষ্ট ইউনিয়ন ডিজিটাল সেন্টার বা সরকারি অফিসে জমা দিতে হবে।';
    }
    if (text.includes('সনদ') || text.includes('আবেদন')) {
        return 'Citizen Center থেকে সেবা নির্বাচন করে প্রয়োজনীয় তথ্য দিন। আবেদন পাঠানোর পর পাওয়া tracking ID সংরক্ষণ করুন এবং “Status দেখুন” থেকে অগ্রগতি যাচাই করুন। OTP, password বা গোপন আর্থিক তথ্য কাউকে দেবেন না।';
    }
    if (text.includes('অভিযোগ')) {
        return 'Citizen Center-এর অভিযোগ সেবা খুলে বিষয়, স্থান, সংক্ষিপ্ত বিবরণ ও যোগাযোগ নম্বর দিন। জরুরি বিপদ বা অপরাধের ক্ষেত্রে online অভিযোগের অপেক্ষা না করে ৯৯৯-এ কল করুন।';
    }
    if (text.includes('স্কুল') || text.includes('পড়াশোনা') || text.includes('রেজাল্ট')) {
        return 'School সেবা থেকে প্রতিষ্ঠান খুঁজে তার portal খুলুন। সেখানে ভর্তি, উপস্থিতি, homework ও result-এর উপলভ্য তথ্য দেখা যাবে। ব্যক্তিগত student তথ্য দেখতে অনুমোদিত login লাগতে পারে।';
    }
    if (text.includes('ইউনিয়ন') || text.includes('চেয়ারম্যান')) {
        return '“নিজ এলাকা” থেকে ইউনিয়ন, ওয়ার্ড ও গ্রাম নির্বাচন করুন। ইউনিয়ন portal-এ স্থানীয় সেবা, প্রতিনিধি, জরুরি যোগাযোগ ও প্রকাশিত নোটিশ পাওয়া যাবে।';
    }

    return 'AI সেবা সাময়িকভাবে পাওয়া যাচ্ছে না, তাই এই প্রশ্নের নির্ভরযোগ্য পূর্ণ উত্তর এখন দিতে পারছি না। DigiGram-এর নাগরিক সেবা, ভাতা, বাজার, রক্ত, অভিযোগ, স্কুল বা আবেদন status নিয়ে প্রশ্নটি আরও নির্দিষ্ট করে লিখুন।';
}

/**
 * Service to handle AI Assistant logic.
 * This can be connected to Google Gemini or OpenAI in the future.
 */
export const aiService = {
    // 1. Get AI Response
    getAssistantResponse: async (query, context = {}) => {
        try {
            const response = await fetch('/api/ai/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: String(query || '').slice(0, 1000),
                    messages: Array.isArray(context.messages) ? context.messages.slice(-6) : [],
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.answer) throw new Error(result.error || 'AI response failed');
            return result.answer;
        } catch {
            return getLocalAssistantAnswer(query);
        }
    },

    // 2. Predefined Quick Questions
    getQuickQuestions: () => [
        "কিভাবে রক্তদাতা খুঁজে পাব?",
        "আজকের বাজারদর কত?",
        "ইউনিয়ন সেবাসমূহ কি কি?",
        "ভলান্টিয়ারদের কাজ কি?",
        "জরুরি নম্বর কোথায় পাব?"
    ],

    // 3. Scan Resident Document (NID/Birth Reg)
    scanResidentDocument: async (files) => {
        const fileList = Array.isArray(files) ? files : [files];
        
        const convertToBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });

        try {
            const base64Images = await Promise.all(fileList.map(convertToBase64));
            const mimeType = fileList[0].type;

            const response = await fetch('/api/ai/scan-resident', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: base64Images, mimeType })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.detail || 'API request failed');
            }
            
            const data = await response.json();
            return data;
        } catch (err) {
            throw err.message || err;
        }
    },

    scanLessonImage: async (files, subjectName = '') => {
        const fileList = Array.from(files || []).filter((file) => file instanceof Blob);
        if (!fileList.length) throw new Error('Please select an image file');
        const convertToBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
        });

        const base64Images = await Promise.all(fileList.map(convertToBase64));
        const mimeType = fileList[0].type;
        const response = await fetch('/api/ai/scan-lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: base64Images, mimeType, subjectName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Lesson scan failed');
        return result;
    },

    getLessonHelp: async ({ lesson, subjectName = '', question = '', mode = 'explain' }) => {
        const response = await fetch('/api/ai/lesson-help', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson, subjectName, question, mode })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Lesson help failed');
        return result;
    }
};
