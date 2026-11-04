import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/*
  `beforeinstallprompt` se dispara una sola vez y suele llegar antes de que
  React monte el componente que lo necesita. Se captura a nivel de módulo para
  no perderlo, y los componentes se suscriben al resultado.
*/
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    // Safari iOS no soporta display-mode en versiones viejas.
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIos = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  // Chrome y Firefox en iOS tampoco pueden instalar: solo Safari.
  !/crios|fxios|edgios/i.test(navigator.userAgent);

export interface PwaInstall {
  /** Hay algo que ofrecer: el navegador permite instalar, o es iOS y toca explicar. */
  canInstall: boolean;
  /** iOS Safari no tiene diálogo de instalación; hay que mostrar los pasos. */
  needsManualSteps: boolean;
  /** Lanza el diálogo nativo. Devuelve si el usuario aceptó. */
  install: () => Promise<boolean>;
}

export function usePwaInstall(): PwaInstall {
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const standalone = isStandalone();
  const needsManualSteps = !standalone && !deferred && isIos();
  const canInstall = !standalone && (deferred !== null || needsManualSteps);

  const install = useCallback(async () => {
    if (!deferred) return false;
    const ev = deferred;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    // El evento solo sirve una vez.
    deferred = null;
    notify();
    return outcome === 'accepted';
  }, []);

  return { canInstall, needsManualSteps, install };
}
