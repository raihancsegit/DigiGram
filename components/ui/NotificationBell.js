'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '@/lib/services/notificationService';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
    const { user } = useSelector(s => s.auth);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        
        async function fetchNotifications() {
            const data = await notificationService.getUnreadNotifications(user.id);
            setNotifications(data);
        }
        
        fetchNotifications();
        
        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const handleMarkAsRead = async (id) => {
        await notificationService.markAsRead(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-colors relative"
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                    >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h4 className="text-sm font-black text-slate-800">নোটিফিকেশন</h4>
                            <span className="text-[10px] font-black text-white bg-rose-500 px-2 py-0.5 rounded-full">
                                {notifications.length}
                            </span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-xs font-bold">
                                    কোনো নতুন নোটিফিকেশন নেই
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => handleMarkAsRead(notif.id)}
                                        className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <p className="text-xs font-black text-slate-800 mb-1">{notif.title}</p>
                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{notif.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
