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
