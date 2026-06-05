'use server';

import { supabaseAdmin } from '@/lib/utils/supabase-admin';

/**
 * Server Action to handle dynamic newsletter and notice email subscription.
 * Safely inserts subscriber emails into Supabase and returns structured responses.
 *
 * @param {string} email - The email to subscribe
 * @returns {Promise<{success: boolean, errorType?: string, message: string}>}
 */
export async function subscribeToNewsletter(email) {
    try {
        // 1. Basic Validation
        if (!email || typeof email !== 'string') {
            return {
                success: false,
                errorType: 'validation',
                message: 'অনুগ্রহ করে একটি সঠিক ইমেইল প্রদান করুন।'
            };
        }

        const trimmedEmail = email.trim().toLowerCase();

        // Simple client/server matching email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return {
                success: false,
                errorType: 'validation',
                message: 'ইমেইল এড্রেসটির ফরম্যাট সঠিক নয়।'
            };
        }

        // 2. Insert into Supabase table
        const { data, error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .insert([{ email: trimmedEmail }])
            .select()
            .single();

        if (error) {
            // Postgres error code '23505' represents unique key violation (duplicate)
            if (error.code === '23505') {
                return {
                    success: false,
                    errorType: 'duplicate',
                    message: 'এই ইমেইলটি ইতোমধ্যে সাবস্ক্রাইব করা হয়েছে!'
                };
            }

            console.error("Supabase error during subscription:", error);
            throw new Error(error.message);
        }

        return {
            success: true,
            message: 'ধন্যবাদ! আপনি সফলভাবে যুক্ত হয়েছেন।'
        };

    } catch (err) {
        console.error("Exception inside subscribeToNewsletter server action:", err);
        return {
            success: false,
            errorType: 'exception',
            message: 'সাবস্ক্রাইব করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
        };
    }
}
