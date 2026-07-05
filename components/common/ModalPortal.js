'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ModalPortal({ children, isOpen = true, onClose }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="dg-modal-portal fixed inset-0 z-[9999] overflow-y-auto overscroll-contain pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            <div className="relative flex min-h-full items-start justify-center pointer-events-none p-2 sm:items-center sm:px-4 sm:py-6">
                <div className="relative pointer-events-auto w-full min-w-0 flex justify-center">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
