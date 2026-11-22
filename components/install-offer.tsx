'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { INSTALL_DISMISS_KEY, INSTALL_EVENT } from '@/lib/install';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
type InstallWindow = Window & { __timerInstall?: InstallPromptEvent | null };

export function InstallOffer() {
  const [installed, setInstalled] = useState(true);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const w = window as InstallWindow;
    const standalone = matchMedia('(display-mode: standalone)');
    const fullscreen = matchMedia('(display-mode: fullscreen)');
    const check = () => setInstalled(standalone.matches || fullscreen.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const kept = () => setPrompt(w.__timerInstall ?? null);
    const done = () => { setInstalled(true); setPrompt(null); };
    check();
    kept();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    try { setDismissed((Number(localStorage.getItem(INSTALL_DISMISS_KEY)) || 0) > Date.now()); }
    catch { setDismissed(false); }
    window.addEventListener(INSTALL_EVENT, kept);
    window.addEventListener('appinstalled', done);
    standalone.addEventListener('change', check);
    fullscreen.addEventListener('change', check);
    return () => {
      window.removeEventListener(INSTALL_EVENT, kept);
      window.removeEventListener('appinstalled', done);
      standalone.removeEventListener('change', check);
      fullscreen.removeEventListener('change', check);
    };
  }, []);

  useEffect(() => {
    if (!help) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setHelp(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [help]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000)); } catch { /* Hidden until reload. */ }
  }, []);

  const install = useCallback(async () => {
    if (!prompt) { setHelp(true); return; }
    (window as InstallWindow).__timerInstall = null;
    setPrompt(null);
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === 'accepted') setInstalled(true);
      else dismiss();
    } catch { setHelp(true); }
  }, [prompt, dismiss]);

  if (installed) return null;
  const bar = !dismissed && (prompt !== null || ios);
  return <>
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2">
      {!bar && <button type="button" onClick={install} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-zinc-900/90 px-4 py-2 font-mono text-xs text-white/70 hover:text-white"><Download size={15} />Install as an app</button>}
    </div>
    {bar && <aside aria-label="Install the app" className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-zinc-900/95 p-3 text-white shadow-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width="40" height="40" className="h-10 w-10 rounded-xl" />
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Meditation Timer</p><p className="text-xs text-white/60">Open from your home screen</p></div>
      <button type="button" onClick={install} className="shrink-0 rounded-full bg-white px-3 py-2 text-sm font-semibold text-black">{prompt ? 'Install' : 'How to install'}</button>
      <button type="button" onClick={dismiss} aria-label="Hide the offer" className="rounded-full p-1.5 text-white/60 hover:text-white"><X size={18} /></button>
    </aside>}
    {help && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setHelp(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="install-help-title" className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-5 text-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3"><h2 id="install-help-title" className="text-lg font-semibold">Install Meditation Timer</h2><button type="button" onClick={() => setHelp(false)} aria-label="Close" className="p-2 text-white/60 hover:text-white"><X size={20} /></button></div>
        {ios ? <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/85"><li>Open timer.clerk.am in Safari.</li><li>Tap <b>Share</b> <Share className="inline h-4 w-4" /> in the browser menu.</li><li>Choose <b>Add to Home Screen</b> <SquarePlus className="inline h-4 w-4" />. If needed, scroll down and tap Edit Actions.</li><li>Tap <b>Add</b>.</li></ol> : <p className="text-sm leading-relaxed text-white/85">Open the browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>. In Safari on Mac, choose File → Add to Dock.</p>}
      </div>
    </div>}
  </>;
}
