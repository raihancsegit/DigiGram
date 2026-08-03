'use client';

import { useEffect, useState } from 'react';

const INSTALL_PROMPT_DISMISSED_KEY = 'digigram:pwa-install-dismissed';

function isLocalHost() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1'
    || window.location.hostname.endsWith('.localhost');
}

function getOnlineStatus() {
  return typeof navigator === 'undefined' || isLocalHost() || navigator.onLine;
}

function getInstallDismissedStatus() {
  return typeof localStorage !== 'undefined' && localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === '1';
}

export default function PWARegistration() {
  const [online, setOnline] = useState(getOnlineStatus);
  const [ready, setReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(getInstallDismissedStatus);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const syncOnlineStatus = () => setOnline(getOnlineStatus());
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(isLocalHost());
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    queueMicrotask(() => {
      syncOnlineStatus();
      setReady(true);
    });

    if ('serviceWorker' in navigator && isLocalHost()) {
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
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1');
    setInstallDismissed(true);
  };

  const dismissInstallPrompt = () => {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1');
    setInstallPrompt(null);
    setInstallDismissed(true);
  };

  const applyUpdate = () => {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  const localHost = isLocalHost();
  const showInstallPrompt = online && !localHost && !updateReady && installPrompt && !installDismissed;
  if (!ready) return null;
  if ((online || localHost) && !updateReady && !showInstallPrompt) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[10000] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white shadow-2xl" role="status" aria-live="polite">
      <p className="text-xs font-bold">
        {!online && !localHost ? 'আপনি অফলাইনে আছেন—কিছু তথ্য পুরোনো হতে পারে।' : updateReady ? 'DigiGram-এর নতুন সংস্করণ প্রস্তুত।' : 'DigiGram অ্যাপ হিসেবে ইনস্টল করুন।'}
      </p>
      {updateReady && <button type="button" onClick={applyUpdate} className="shrink-0 rounded-xl bg-teal-500 px-3 py-2 text-xs font-black">আপডেট</button>}
      {showInstallPrompt && (
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={installApp} className="rounded-xl bg-teal-500 px-3 py-2 text-xs font-black">ইনস্টল</button>
          <button type="button" onClick={dismissInstallPrompt} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-white/80">বন্ধ</button>
        </div>
      )}
    </div>
  );
}
