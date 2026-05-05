/**
 * অ্যাপ রাউট — পরে DB/API যুক্ত করলে এখান থেকেই লিঙ্ক সিঙ্ক রাখুন।
 */
export const paths = {
    home: '/',
    login: '/login',
    area: '/area',
    voiceGuide: '/voice-guide',
    admin: '/admin',
    campus: '/campus',
    campusProgress: '/campus/progress',
    futureAi: '/future-ai',
    roadmap: '/roadmap',
    business: '/business',
    service: (slug) => `/services/${slug}`,
    /** ইউনিয়ন পোর্টাল — সব সেবা এই ইউনিয়ন কনটেক্সটে */
    unionPortal: (unionSlug) => `/u/${unionSlug}`,
    /** ওয়ার্ড পোর্টাল — ইউনিয়ন হয়ে নির্দিষ্ট ওয়ার্ড */
    wardPortal: (unionSlug, wardId) => `/u/${unionSlug}/w/${wardId}`,
};
