'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '@/lib/services/notificationService';
import { useSelector } from 'react-redux';
import Link from 'next/link';

export default function NotificationBell() {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const role = user?.role;
    const scopeId = user?.access_scope_id;

    useEffect(() => {
        if (!isAuthenticated || !role) return;

        const fetchNotifications = async () => {
            const data = await notificationService.getNotifications(role, scopeId);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        };

        fetchNotifications();

        const subscription = notificationService.subscribeToNotifications(role, scopeId, (newNotif) => {
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [isAuthenticated, role, scopeId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        const success = await notificationService.markAsRead(id);
        if (success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleMarkAllRead = async () => {
        const success = await notificationService.markAllAsRead(role, scopeId);
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-emerald-500" size={16} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
            case 'danger': return <XCircle className="text-rose-500" size={16} />;
            default: return <Info className="text-blue-500" size={16} />;
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95 shadow-sm"
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-swing origin-top text-teal-600' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-black text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile Overlay */}
                        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] sm:hidden" onClick={() => setIsOpen(false)} />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-4 w-auto sm:w-96 bg-white border border-slate-200 rounded-[32px] shadow-2xl z-[100] overflow-hidden origin-top-right"
                        >
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                                    <Bell size={18} className="text-teal-600" />
                                    নোটিফিকেশন
                                </h3>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-[10px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors"
                                        >
                                            সবগুলো পড়ুন
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="sm:hidden text-slate-400 p-1">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`p-5 transition-colors relative group ${!n.is_read ? 'bg-teal-50/30' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className="mt-1 flex-shrink-0">
                                                        {getTypeIcon(n.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <p className={`text-sm font-black leading-snug truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                {n.title}
                                                            </p>
                                                            <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full shrink-0">
                                                                {new Date(n.created_at).toLocaleDateString('bn-BD', { weekday: 'long' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                                            {n.message}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-teal-500 font-black tracking-tight leading-none">
                                                                    {new Date(n.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <span className="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">
                                                                    {new Date(n.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {!n.is_read && (
                                                                    <button
                                                                        onClick={() => handleMarkAsRead(n.id)}
                                                                        className="p-1.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 shadow-sm transition-all"
                                                                        title="পঠিত হিসেবে চিহ্নিত করুন"
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                )}
                                                                {n.link && (
                                                                    <Link
                                                                        href={n.link}
                                                                        className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                                                                    >
                                                                        <ExternalLink size={14} />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center">
                                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Bell size={32} className="text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 text-sm font-black">কোনো নোটিফিকেশন নেই</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 text-center bg-slate-50/50">
                                <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors">
                                    সকল নোটিফিকেশন দেখুন
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
