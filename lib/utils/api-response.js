import { NextResponse } from 'next/server';
import { reportServerError } from '@/lib/utils/server-monitoring';

export function internalServerError(
    message = 'Something went wrong. Please try again.',
    error = null,
    context = {}
) {
    if (error) {
        void reportServerError(error, context);
    }
    return NextResponse.json({ error: message }, { status: 500 });
}
