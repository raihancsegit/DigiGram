'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Bot, Sparkles, User, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/lib/services/aiService';

export default function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'আসসালামু আলাইকুম! আমি ডিজিগ্রাম স্মার্ট অ্যাসিস্ট্যান্ট। আমি আপনাকে কিভাবে সাহায্য করতে পারি?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (text) => {
        const query = text || inputValue;
        if (!query.trim() || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', content: query }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await aiService.getAssistantResponse(query);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQuestions = aiService.getQuickQuestions();

    // Use a portal to ensure the chatbot is always on top of everything (z-index 9999)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const chatbotContent = (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* FAB Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                    isOpen ? 'bg-rose-500 rotate-90' : 'bg-gradient-to-br from-teal-500 to-sky-600'
                }`}
            >
                {isOpen ? <X size={28} className="text-white" /> : <MessageSquare size={28} className="text-white" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
                    </span>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 100, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 100 }}
                        className="fixed inset-0 sm:absolute sm:bottom-20 sm:right-0 sm:w-[400px] sm:h-[550px] bg-slate-900/98 sm:bg-slate-900/95 backdrop-blur-2xl sm:border sm:border-white/10 sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden z-[10000]"
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-teal-600/20 to-sky-600/20 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                                        ডিজিগ্রাম সহকারী
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Assistant</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="sm:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                            {messages.map((m, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] sm:max-w-[85%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                            m.role === 'user' ? 'bg-sky-500' : 'bg-teal-500/20'
                                        }`}>
                                            {m.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-teal-400" />}
                                        </div>
                                        <div className={`p-4 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                                            m.role === 'user' 
                                            ? 'bg-sky-500 text-white rounded-tr-none' 
                                            : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                                        }`}>
                                            {m.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-[24px] rounded-tl-none flex items-center gap-3">
                                        <Loader2 size={16} className="animate-spin text-teal-400" />
                                        <span className="text-xs text-slate-400 font-bold">অপেক্ষা করুন...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions & Input */}
                        <div className="p-4 sm:p-6 bg-white/5 border-t border-white/5 mb-safe">
                            {messages.length === 1 && (
                                <div className="mb-4 sm:mb-6 flex flex-nowrap overflow-x-auto gap-2 pb-2 custom-scrollbar">
                                    {quickQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(q)}
                                            className="whitespace-nowrap text-[11px] px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all font-bold"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="আপনার প্রশ্ন লিখুন..."
                                    className="flex-1 bg-slate-950/50 border border-white/10 rounded-2xl sm:rounded-[20px] px-5 py-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-teal-500/50 transition-all font-medium h-12 sm:h-14"
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={isLoading}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-500 flex items-center justify-center text-white hover:bg-teal-400 transition-all active:scale-90 shadow-lg shadow-teal-500/20"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return createPortal(chatbotContent, document.body);
}
