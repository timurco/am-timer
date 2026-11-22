'use client';

import { useEffect } from 'react';

export function Offline() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then(registration => {
      if (registration.active) registration.active.postMessage('UPDATE_OFFLINE_COPY');
    }).catch(error => console.warn('Offline setup failed:', error));
  }, []);
  return null;
}
