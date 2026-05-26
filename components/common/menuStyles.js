export const menuStyles = {
    navItem(active, tone = 'teal') {
        const activeByTone = {
            teal: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200 shadow-sm',
            dark: 'bg-slate-950 text-white shadow-lg shadow-slate-200/70',
            blue: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200 shadow-sm',
            orange: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200 shadow-sm',
            white: 'bg-white text-slate-950 shadow-xl shadow-slate-950/10'
        };
        const inactiveByTone = {
            teal: 'text-slate-600 hover:bg-teal-50 hover:text-teal-800 hover:ring-1 hover:ring-teal-100',
            dark: 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
            blue: 'text-slate-600 hover:bg-blue-50 hover:text-blue-800 hover:ring-1 hover:ring-blue-100',
            orange: 'text-slate-600 hover:bg-orange-50 hover:text-orange-800 hover:ring-1 hover:ring-orange-100',
            white: 'text-white/75 hover:bg-white/10 hover:text-white'
        };
        return active ? (activeByTone[tone] || activeByTone.teal) : (inactiveByTone[tone] || inactiveByTone.teal);
    },

    tab(active, tone = 'teal') {
        const activeByTone = {
            teal: 'bg-teal-600 text-white shadow-lg shadow-teal-500/20',
            dark: 'bg-slate-950 text-white shadow-lg shadow-slate-300/60',
            blue: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
            orange: 'bg-orange-600 text-white shadow-lg shadow-orange-500/20',
            rose: 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
        };
        const inactiveByTone = {
            teal: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-teal-50 hover:text-teal-800 hover:ring-teal-200',
            dark: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-950',
            blue: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:ring-blue-200',
            orange: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-orange-50 hover:text-orange-800 hover:ring-orange-200',
            rose: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-800 hover:ring-rose-200'
        };
        return active ? (activeByTone[tone] || activeByTone.teal) : (inactiveByTone[tone] || inactiveByTone.teal);
    },

    ghostButton(active = false) {
        return active
            ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-200 shadow-sm'
            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-teal-50 hover:text-teal-800 hover:ring-teal-200';
    }
};
