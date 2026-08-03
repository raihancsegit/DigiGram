'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageSquare, Send, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { aiService } from '@/lib/services/aiService';

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: 'আসসালামু আলাইকুম! আমি ডিজিগ্রাম সহকারী। নাগরিক সেবা, ভাতা আবেদন, বাজারদর, শিক্ষা, স্বাস্থ্য বা সাধারণ যেকোনো প্রশ্ন করুন।',
};

export default function AiAssistant() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (!isOpen) return undefined;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
        const closeOnEscape = (event) => { if (event.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [messages, isOpen]);

    async function handleSendMessage(text) {
        const query = String(text || inputValue).trim();
        if (!query || isLoading) return;

        const nextMessages = [...messages, { role: 'user', content: query }];
        setMessages(nextMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await aiService.getAssistantResponse(query, {
                messages: nextMessages.slice(-6),
            });
            setMessages((current) => [...current, { role: 'assistant', content: response }]);
        } catch {
            setMessages((current) => [...current, {
                role: 'assistant',
                content: 'দুঃখিত, উত্তরটি এখন তৈরি করা যাচ্ছে না। প্রশ্নটি একটু অন্যভাবে লিখে আবার চেষ্টা করুন।',
            }]);
        } finally {
            setIsLoading(false);
        }
    }

    function submitMessage(event) {
        event.preventDefault();
        handleSendMessage();
    }

    if (!mounted) return null;
    const quickQuestions = aiService.getQuickQuestions();

    return (
        <div className="dg-ai-assistant-root relative z-[9999]">
            {!isOpen && (
                <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-[9999] sm:bottom-6 sm:right-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        aria-label="ডিজিগ্রাম সহকারী খুলুন"
                        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-2xl sm:h-16 sm:w-16"
                    >
                        <MessageSquare size={26} />
                        <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
                    </motion.button>
                </div>
            )}

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] top-[calc(4.75rem+env(safe-area-inset-top))] z-[10000] sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto">
                        <motion.section
                            role="dialog"
                            aria-modal="true"
                            aria-label="ডিজিগ্রাম সহকারী"
                            initial={{ opacity: 0, scale: 0.96, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 24 }}
                            className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/98 shadow-2xl backdrop-blur-2xl sm:h-[min(560px,calc(100dvh-8rem))] sm:w-[390px] sm:rounded-[32px]"
                        >
                            <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-br from-teal-600/20 to-sky-600/20 px-4 py-3.5 sm:px-5 sm:py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 shadow-lg shadow-teal-500/20"><Bot size={20} className="text-white" /></div>
                                    <div>
                                        <h2 className="flex items-center gap-2 font-black text-white">ডিজিগ্রাম সহকারী <span className="h-2 w-2 rounded-full bg-emerald-400" /></h2>
                                        <p className="text-[10px] font-bold text-slate-400">প্রশ্ন করুন—সহজ বাংলায় উত্তর পান</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} aria-label="সহকারী বন্ধ করুন" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"><X size={20} /></button>
                            </header>

                            <div aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 custom-scrollbar sm:px-5">
                                {messages.map((message, index) => (
                                    <motion.div initial={{ opacity: 0, x: message.role === 'user' ? 12 : -12 }} animate={{ opacity: 1, x: 0 }} key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex max-w-[92%] gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${message.role === 'user' ? 'bg-sky-500' : 'bg-teal-500/20'}`}>
                                                {message.role === 'user' ? <User size={15} className="text-white" /> : <Bot size={15} className="text-teal-300" />}
                                            </span>
                                            <p className={`whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm font-medium leading-6 shadow-sm ${message.role === 'user' ? 'rounded-tr-md bg-sky-500 text-white' : 'rounded-tl-md border border-white/5 bg-white/[0.06] text-slate-200'}`}>
                                                {message.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Loader2 size={16} className="animate-spin text-teal-400" /> উত্তর তৈরি হচ্ছে...</div>}
                                <div ref={messagesEndRef} />
                            </div>

                            <footer className="shrink-0 border-t border-white/10 bg-slate-800/95 p-3 sm:p-4">
                                {messages.length === 1 && (
                                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                        {quickQuestions.map((question) => (
                                            <button key={question} onClick={() => handleSendMessage(question)} className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:border-teal-400 hover:text-white">{question}</button>
                                        ))}
                                    </div>
                                )}
                                <form onSubmit={submitMessage} className="flex items-end gap-2">
                                    <textarea
                                        ref={inputRef}
                                        rows={1}
                                        maxLength={1000}
                                        value={inputValue}
                                        onChange={(event) => setInputValue(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault();
                                                submitMessage(event);
                                            }
                                        }}
                                        placeholder="আপনার প্রশ্ন লিখুন..."
                                        className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-teal-500/60"
                                    />
                                    <button type="submit" disabled={!inputValue.trim() || isLoading} aria-label="প্রশ্ন পাঠান" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"><Send size={19} /></button>
                                </form>
                                <p className="mt-2 text-center text-[9px] font-bold text-slate-500">গুরুত্বপূর্ণ সিদ্ধান্তে সরকারি/বিশেষজ্ঞ তথ্য যাচাই করুন</p>
                            </footer>
                        </motion.section>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
