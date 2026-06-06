"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, Settings, Bell,
    LogOut, Menu, X, Shield, Globe,
    CreditCard, Zap, School, Activity, MapPin, ShoppingBag, Database, MessageSquareText,
    ScanSearch, FileClock, GitBranch
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { performLogout } from '@/lib/store/features/authSlice';
import NotificationBell from '@/components/ui/NotificationBell';
import { menuStyles } from '@/components/common/menuStyles';

export default function AdminShell({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px)');
        const syncSidebar = () => setSidebarOpen(media.matches);
        syncSidebar();
        media.addEventListener('change', syncSidebar);
        return () => media.removeEventListener('change', syncSidebar);
    }, []);

    const handleLogout = async () => {
        await dispatch(performLogout());
        router.push('/login');
    };

    const menuItems = [
        { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, path: '/admin' },
        { name: 'প্রশাসনিক এলাকা', icon: Globe, path: '/admin/union', permission: 'can_manage_locations' },
        { name: 'সকল এলাকা', icon: MapPin, path: '/admin/locations', permission: 'can_manage_locations' },
        { name: 'ডাটা সিঙ্ক', icon: Activity, path: '/admin/data-sync', permission: 'can_manage_locations' },
        { name: 'সেবা ব্যবস্থাপনা', icon: Zap, path: '/admin/services', permission: 'can_manage_services' },
        { name: 'হাট বাজার', icon: ShoppingBag, path: '/admin/market' },
        { name: 'শিক্ষা প্রতিষ্ঠান', icon: School, path: '/admin/institutions', permission: 'can_manage_institutions' },
        { name: 'ইউজার ম্যানেজমেন্ট', icon: Users, path: '/admin/members', permission: 'can_manage_users' },
        { name: 'নোটিশবোর্ড', icon: Bell, path: '/admin/notices', permission: 'can_manage_news' },
        { name: 'ডাটা কোয়ালিটি', icon: ScanSearch, path: '/admin/data-quality', permission: 'can_manage_system' },
        { name: 'SMS', icon: MessageSquareText, path: '/admin/sms', permission: 'can_manage_system' },
        { name: 'SLA / Operations', icon: FileClock, path: '/admin/operations', permission: 'can_manage_system' },
        { name: 'SQL Migrations', icon: GitBranch, path: '/admin/migrations', permission: 'can_manage_system' },
        { name: 'বিলিং / ক্রেডিট', icon: CreditCard, path: '/admin/billing' },
        { name: 'সিস্টেম মেনটেন্যান্স', icon: Database, path: '/admin/maintenance', permission: 'can_manage_system' },
        { name: 'সেটিংস', icon: Settings, path: '/admin/settings' },
    ];

    // Filter items based on user role and permissions
    const filteredMenu = menuItems.filter(item => {
        // Super admin has full access
        if (user?.role === 'super_admin') return true;
        
        // If it's a general item with no permission key, allow it for all admins
        if (!item.permission) return true;

        // Check for specific permission
        return user?.permissions?.[item.permission] === true;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close admin menu"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm md:hidden"
                />
            )}
            {/* Sidebar */}
            <aside
                style={{ width: isSidebarOpen ? 280 : 80 }}
                className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white transition-transform duration-300 md:transition-[width] ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-200">
                        <Shield className="text-white" size={20} />
                    </div>
                    {isSidebarOpen && (
                        <span className="font-black text-slate-800 text-lg tracking-tight animate-in fade-in duration-300">
                            DG-ADMIN
                        </span>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                    {filteredMenu.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(`${item.path}/`));
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group relative font-bold ${menuStyles.navItem(isActive, 'teal')}`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-teal-700'} />
                                {isSidebarOpen && (
                                    <span className="text-sm font-bold whitespace-nowrap animate-in fade-in duration-300">
                                        {item.name}
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-teal-600 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        {isSidebarOpen && <span className="text-sm font-black">লগআউট করুন</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${
                    isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-20'
                }`}
            >
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 md:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div>
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'chairman' ? 'Union Management' : 'Portal Admin'}
                            </h2>
                            <p className="text-lg font-black text-slate-800 leading-none">
                                {user?.first_name || 'সালাম'}, আপনাকে স্বাগতম!
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        
                        <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group">
                            <div className="flex flex-col text-right hidden sm:flex">
                                <span className="text-sm font-black text-slate-800 leading-none group-hover:text-teal-600 transition-colors">
                                    {user?.first_name} {user?.last_name}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">সুপার অ্যাডমিন</span>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden ring-2 ring-transparent group-hover:ring-teal-500/20 transition-all">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-black text-slate-400">SA</span>
                                )}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
