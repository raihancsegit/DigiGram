'use client';

import { useEffect, useState } from 'react';

export default function PWARegistration() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    const isLocalHost = window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1'
      || window.location.hostname.endsWith('.localhost');

    if ('serviceWorker' in navigator && isLocalHost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    } else if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            setRegistration(registration);
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setUpdateReady(true);
                  }
                };
              }
            };
          })
          .catch((registrationError) => {
            console.warn('SW registration failed: ', registrationError);
          });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const applyUpdate = () => {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  if (online && !updateReady && !installPrompt) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[10000] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white shadow-2xl" role="status" aria-live="polite">
      <p className="text-xs font-bold">
        {!online ? 'আপনি অফলাইনে আছেন—কিছু তথ্য পুরোনো হতে পারে।' : updateReady ? 'DigiGram-এর নতুন সংস্করণ প্রস্তুত।' : 'DigiGram অ্যাপ হিসেবে ইনস্টল করুন।'}
      </p>
      {updateReady && <button type="button" onClick={applyUpdate} className="shrink-0 rounded-xl bg-teal-500 px-3 py-2 text-xs font-black">আপডেট</button>}
      {online && !updateReady && installPrompt && <button type="button" onClick={installApp} className="shrink-0 rounded-xl bg-teal-500 px-3 py-2 text-xs font-black">ইনস্টল</button>}
    </div>
  );
}
