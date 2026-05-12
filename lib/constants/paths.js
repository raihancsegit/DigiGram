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
    /** ওয়ার্ড পোর্টাল — শর্ট রাউট */
    wardPortal: (unionSlug, wardIdOrSlug) => `/w/${wardIdOrSlug}`,
    /** গ্রাম পোর্টাল — শর্ট রাউট */
    villagePortal: (unionSlug, wardIdOrSlug, villageIdOrSlug) => `/g/${villageIdOrSlug}`,
};
