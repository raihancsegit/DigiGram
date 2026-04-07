"use client";

import { useState } from 'react';
import { MOCK_REVIEWS } from '@/lib/constants/marketData';
import { Star, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function MarketReviewSection({ unionSlug, marketName }) {
    // Simulated auth state - in a real app this comes from Redux/NextAuth
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [reviews, setReviews] = useState(MOCK_REVIEWS);
    const [newReview, setNewReview] = useState('');
    const [rating, setRating] = useState(5);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newReview.trim()) return;

        const reviewObj = {
            id: Date.now(),
            user: 'নিজস্ব ইউজার',
            rating: rating,
            comment: newReview,
            date: new Date().toISOString().split('T')[0]
        };

        setReviews([reviewObj, ...reviews]);
        setNewReview('');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <MessageSquare size={18} className="text-green-600" /> হাটের পরিস্থিতি ও মতামত
                </h3>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-gray-800">{review.user}</span>
                            <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"} />
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                ))}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50">
                {isLoggedIn ? (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">আপনার রেটিং</label>
                            <div className="flex gap-1 cursor-pointer">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={20} 
                                        onClick={() => setRating(star)}
                                        className={star <= rating ? "fill-yellow-400 text-yellow-400 hover:scale-110 transition-transform" : "fill-gray-200 text-gray-300 hover:scale-110 transition-transform"} 
                                    />
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={newReview}
                            onChange={(e) => setNewReview(e.target.value)}
                            placeholder={`${marketName} এর আজকের অবস্থা কেমন?`}
                            className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            rows={3}
                        />
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors text-sm">
                            মতামত পোস্ট করুন
                        </button>
                    </form>
                ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center bg-white border border-dashed border-gray-300 rounded-lg">
                        <AlertCircle size={24} className="text-orange-500 mb-2" />
                        <p className="text-sm text-gray-600 mb-3">হাটের অবস্থা সম্পর্কে রিভিউ বা মতামত জানাতে অনুগ্রহ করে লগইন করুন।</p>
                        <div className="flex gap-3 w-full">
                            {/* Auth toggler button for demo via state, usually Links to /login */}
                            <button 
                                onClick={() => setIsLoggedIn(true)} 
                                className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-medium py-2 rounded-lg transition-colors text-sm border border-green-200"
                            >
                                ডেমো লগইন করুন
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
