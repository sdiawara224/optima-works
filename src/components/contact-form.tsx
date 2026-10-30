'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { contactSchema, serviceNames } from '@/lib/contact';

export function ContactForm({
  enabled,
  phone,
  whatsapp,
  email,
}: {
  enabled: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('service');
    if (value && serviceNames.includes(value as (typeof serviceNames)[number])) {
      const select = form.current?.elements.namedItem('service') as HTMLSelectElement;
      if (select) select.value = value;
    }
  }, []);
  const error = (name: string) =>
    errors[name] ? (
      <span className="field-error" id={`error-${name}`}>
        {errors[name]}
      </span>
    ) : null;
  const attrs = (name: string) => ({
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `error-${name}` : undefined,
  });
  return (
    <form
      ref={form}
      className="contact-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (state === 'loading') return;
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const parsed = contactSchema.safeParse({ ...data, consent: data.consent === 'on' });
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          parsed.error.issues.forEach((i) => {
            fieldErrors[String(i.path[0])] ??= i.message;
          });
          setErrors(fieldErrors);
          setState('idle');
          requestAnimationFrame(() =>
            form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
          );
          return;
        }
        setErrors({});
        setState('loading');
        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
          });
          const result = await res.json();
          if (!res.ok) {
            if (result.errors) setErrors(result.errors);
            throw new Error(result.message || 'L’envoi a échoué. Veuillez réessayer.');
          }
          setState('success');
          form.current?.reset();
        } catch (err) {
          setState('error');
          setMessage(
            err instanceof Error
              ? err.message
              : 'La connexion a été interrompue. Veuillez réessayer.',
          );
        }
      }}
    >
      <div className="form-heading">
        <h3>Parlons de votre projet.</h3>
        <span>* Champs obligatoires</span>
      </div>
      {!enabled && (
        <p className="form-notice">
          Le formulaire est en prévisualisation. L’envoi sera activé après configuration du service
          d’envoi.
        </p>
      )}
      <div className="form-row">
        <label>
          Nom et prénom *
          <input
            name="name"
            autoComplete="name"
            placeholder="Votre nom complet"
            required
            minLength={2}
            maxLength={100}
            {...attrs('name')}
          />
          {error('name')}
        </label>
        <label>
          Entreprise
          <input
            name="company"
            autoComplete="organization"
            placeholder="Le nom de votre entreprise"
            maxLength={150}
            {...attrs('company')}
          />
          {error('company')}
        </label>
      </div>
      <div className="form-row">
        <label>
          Adresse e-mail *
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@entreprise.com"
            required
            maxLength={254}
            {...attrs('email')}
          />
          {error('email')}
        </label>
        <label>
          Téléphone
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+224 …"
            maxLength={25}
            {...attrs('phone')}
          />
          {error('phone')}
        </label>
      </div>
      <div className="form-row">
        <label>
          Votre besoin *
          <select name="service" required defaultValue="" {...attrs('service')}>
            <option value="" disabled>
              Sélectionnez un service
            </option>
            {serviceNames.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {error('service')}
        </label>
        <label>
          Objet de la demande *
          <input
            name="subject"
            placeholder="En quelques mots"
            required
            minLength={3}
            maxLength={150}
            {...attrs('subject')}
          />
          {error('subject')}
        </label>
      </div>
      <label>
        Votre projet, vos idées *
        <textarea
          name="message"
          rows={4}
          placeholder="Dites-nous ce que vous avez en tête…"
          required
          minLength={20}
          maxLength={5000}
          {...attrs('message')}
        />
        <span className="field-hint">Entre 20 et 5 000 caractères.</span>
        {error('message')}
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Ne pas remplir
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input type="checkbox" name="consent" required {...attrs('consent')} />
        <span>
          J’ai lu la <Link href="/confidentialite">politique de confidentialité</Link> et je
          comprends que mes informations seront utilisées pour répondre à ma demande. *
        </span>
      </label>
      {error('consent')}
      <button
        className="button form-submit"
        type="submit"
        disabled={state === 'loading' || state === 'success'}
      >
        {state === 'loading' ? (
          <>
            Envoi en cours <LoaderCircle className="spin" size={18} />
          </>
        ) : state === 'success' ? (
          <>
            Message envoyé <CheckCircle2 size={18} />
          </>
        ) : (
          <>
            Envoyer ma demande <ArrowUpRight size={19} />
          </>
        )}
      </button>
      <div aria-live="polite" aria-atomic="true">
        {state === 'success' && (
          <p className="success-message">
            Votre demande a bien été envoyée. Merci de nous avoir présenté votre projet !
          </p>
        )}
        {state === 'error' && (
          <div className="error-message" role="alert">
            <p>{message}</p>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer">
                Contactez-nous sur WhatsApp ↗
              </a>
            ) : phone ? (
              <a href={phone}>Contactez-nous par téléphone ↗</a>
            ) : email ? (
              <a href={email}>Écrivez-nous directement par e-mail ↗</a>
            ) : (
              <p>
                Les coordonnées de contact seront disponibles après leur validation par OptimaWorks.
              </p>
            )}
          </div>
        )}
      </div>
      <p className="form-footnote">
        Vos idées restent entre nous. Aucune inscription à une newsletter.
      </p>
    </form>
  );
}
