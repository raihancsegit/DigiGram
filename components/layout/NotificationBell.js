'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '@/lib/services/notificationService';
import Link from 'next/link';

export default function NotificationBell({ role, scopeId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!role) return;

        // Fetch initial notifications
        const fetchNotifications = async () => {
            const data = await notificationService.getNotifications(role, scopeId);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        };

        fetchNotifications();

        // Subscribe to real-time updates
        const subscription = notificationService.subscribeToNotifications(role, scopeId, (newNotif) => {
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
            
            // Optional: Play a subtle sound or show a toast
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [role, scopeId]);

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

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-swing origin-top' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[100] overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Bell size={16} className="text-teal-400" />
                                নোটিফিকেশন
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[11px] font-black uppercase tracking-wider text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                    সবগুলো পড়ুন
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 transition-colors relative group ${!n.is_read ? 'bg-teal-500/5' : 'hover:bg-white/5'}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getTypeIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-[10px] text-slate-600 font-medium">
                                                            {new Date(n.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {!n.is_read && (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(n.id)}
                                                                    className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                                                                    title="পড়া হয়েছে"
                                                                >
                                                                    <Check size={12} />
                                                                </button>
                                                            )}
                                                            {n.link && (
                                                                <Link
                                                                    href={n.link}
                                                                    className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                                                                >
                                                                    <ExternalLink size={12} />
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
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                        <Bell size={24} className="text-slate-700" />
                                    </div>
                                    <p className="text-slate-500 text-sm font-bold">কোনো নোটিফিকেশন নেই</p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-white/5 text-center bg-white/5">
                            <button className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                                আগের নোটিফিকেশন দেখুন
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
