'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function ContactChallenge({
  siteKey,
  resetKey,
  onToken,
}: {
  siteKey: string;
  resetKey: number;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    const api = window.turnstile;
    let id: string;
    try {
      id = api.render(container.current, {
        sitekey: siteKey,
        action: 'contact',
        theme: 'light',
        size: 'flexible',
        callback: (token: string) => {
          setFailed(false);
          onToken(token);
        },
        'expired-callback': () => onToken(''),
        'error-callback': () => {
          onToken('');
          setFailed(true);
        },
      });
    } catch {
      setFailed(true);
      return;
    }
    return () => {
      api.remove(id);
      onToken('');
    };
  }, [ready, siteKey, resetKey, onToken]);
  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={container} aria-label="Vérification anti-spam" />
      {failed && (
        <p role="alert">
          La vérification anti-spam n’a pas pu être chargée. Rechargez la page ou contactez-nous par
          e-mail.
        </p>
      )}
    </div>
  );
}
