'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Listen for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      // New content is available, force reload
                      console.log('New content available, reloading...');
                      window.location.reload();
                    }
                  }
                };
              }
            };
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return null;
}
