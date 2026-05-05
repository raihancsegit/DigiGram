'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function GlobalLoading({ isVisible }) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center"
                >
                    <div className="relative">
                        {/* Rotating Outer Ring */}
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-teal-500 shadow-xl"
                        />
                        
                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ShieldCheck className="text-teal-600" size={32} />
                            </motion.div>
                        </div>
                    </div>
                    
                    <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mt-8 text-center"
                    >
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">লোড হচ্ছে...</h2>
                        <div className="flex items-center gap-1 mt-2">
                            <motion.span 
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                className="w-1.5 h-1.5 rounded-full bg-teal-500" 
                            />
                            <motion.span 
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                className="w-1.5 h-1.5 rounded-full bg-teal-500" 
                            />
                            <motion.span 
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                                className="w-1.5 h-1.5 rounded-full bg-teal-500" 
                            />
                        </div>
                    </motion.div>

                    {/* Top Progress Bar */}
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 15, ease: "easeOut" }}
                        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-teal-400 to-indigo-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
