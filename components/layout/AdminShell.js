"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, Settings, Bell,
    LogOut, Menu, X, Shield, Globe,
    CreditCard, Zap, School, Activity, MapPin
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { performLogout } from '@/lib/store/features/authSlice';

export default function AdminShell({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(performLogout());
        router.push('/login');
    };

    const menuItems = [
        { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, path: '/admin' },
        { name: 'প্রশাসনিক এলাকা', icon: Globe, path: '/admin/union', permission: 'can_manage_locations' },
        { name: 'সকল এলাকা', icon: MapPin, path: '/admin/locations', permission: 'can_manage_locations' },
        { name: 'সেবা ব্যবস্থাপনা', icon: Zap, path: '/admin/services', permission: 'can_manage_services' },
        { name: 'শিক্ষা প্রতিষ্ঠান', icon: School, path: '/admin/institutions', permission: 'can_manage_institutions' },
        { name: 'ইউজার ম্যানেজমেন্ট', icon: Users, path: '/admin/members', permission: 'can_manage_users' },
        { name: 'নোটিশবোর্ড', icon: Bell, path: '/admin/notices', permission: 'can_manage_news' },
        { name: 'বিলিং / ক্রেডিট', icon: CreditCard, path: '/admin/billing' },
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
            {/* Sidebar */}
            <aside
                style={{ width: isSidebarOpen ? 280 : 80 }}
                className="fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col transition-all duration-300 overflow-hidden"
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
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group relative ${isActive
                                    ? 'bg-teal-50 text-teal-700 font-bold shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'} />
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
                className="flex-1 transition-all duration-300 min-h-screen flex flex-col"
                style={{ marginLeft: isSidebarOpen ? 280 : 80 }}
            >
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-8">
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
                <div className="p-8 max-w-[1400px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
