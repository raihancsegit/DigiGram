'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ModalPortal({ children, isOpen = true, onClose }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            <div className="relative min-h-full flex items-stretch justify-center pointer-events-none p-0 sm:items-center sm:py-10 sm:px-4">
                <div className="relative pointer-events-auto w-full min-w-0 flex justify-center">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
