// Server-side delivery only. Never import this module into a client component.
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { type ContactData, emailText } from './contact';
import { OFFICIAL_CONTACT_EMAIL } from './site-config';

export type MailConfiguration =
  | { provider: 'gmail'; user: string; password: string; to: string }
  | { provider: 'resend'; apiKey: string; from: string; to: string };

export function getMailConfiguration(
  env: Readonly<Record<string, string | undefined>> = process.env,
): MailConfiguration | null {
  const provider =
    env.EMAIL_PROVIDER?.trim() ||
    (env.SMTP_PASSWORD || env.GMAIL_APP_PASSWORD
      ? 'gmail'
      : env.RESEND_API_KEY
        ? 'resend'
        : 'gmail');
  const to = (env.CONTACT_EMAIL ?? env.CONTACT_TO)?.trim() || OFFICIAL_CONTACT_EMAIL;
  if (!z.email().safeParse(to).success) return null;
  if (provider === 'gmail') {
    // This integration deliberately only supports authenticated Gmail over TLS.
    // Do not turn environment mistakes into arbitrary SMTP destinations.
    if (env.SMTP_HOST && env.SMTP_HOST.trim() !== 'smtp.gmail.com') return null;
    if (env.SMTP_PORT && env.SMTP_PORT.trim() !== '465') return null;
    const user = (env.SMTP_USER ?? env.GMAIL_USER)?.trim() || OFFICIAL_CONTACT_EMAIL;
    const password = (env.SMTP_PASSWORD ?? env.GMAIL_APP_PASSWORD)?.replace(/\s/g, '');
    if (!password || !z.email().safeParse(user).success) return null;
    return { provider, user, password, to };
  }
  if (provider === 'resend' && env.RESEND_API_KEY && env.CONTACT_FROM?.trim()) {
    return { provider, apiKey: env.RESEND_API_KEY, from: env.CONTACT_FROM.trim(), to };
  }
  return null;
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  );
}

function emailLayout(title: string, content: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#FCFCFC;color:#000000;font-family:Arial,sans-serif;line-height:1.6"><main style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dddddd;border-top:6px solid #9DDE4D;padding:24px;overflow-wrap:anywhere"><p style="font-size:14px;font-weight:bold">OptimaWorks</p><h1 style="font-size:24px;line-height:1.3">${title}</h1>${content}<p style="margin-top:24px;font-size:12px;color:#555555">Message automatique du site OptimaWorks.</p></main></body></html>`;
}

export function contactEmailHtml(data: ContactData): string {
  const fields = [
    ['Nom complet', data.name],
    ['Entreprise', data.company || 'Non renseignée'],
    ['E-mail', data.email],
    ['Téléphone', data.phone || 'Non renseigné'],
    ['Service', data.service],
    ['Objet de la demande', data.subject],
  ];
  return emailLayout(
    'Nouvelle demande de contact',
    fields
      .map(
        ([label, value]) =>
          `<p style="margin:0 0 12px"><strong>${label}</strong><br>${escapeHtml(value)}</p>`,
      )
      .join('') +
      `<h2 style="font-size:18px">Message</h2><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p><p>Information de confidentialité acceptée.<br>Page d’origine : /#contact</p>`,
  );
}

const acknowledgementText = `Bonjour,

Nous avons bien reçu votre message et vous remercions d'avoir contacté OptimaWorks.

Notre équipe prendra connaissance de votre demande et reviendra vers vous dans les meilleurs délais.

Merci pour votre confiance.

L'équipe OptimaWorks`;

type Message = { to: string; replyTo: string; subject: string; text: string; html: string };

async function deliver(config: MailConfiguration, message: Message): Promise<void> {
  if (config.provider === 'gmail') {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      auth: { user: config.user, pass: config.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      disableFileAccess: true,
      disableUrlAccess: true,
      logger: false,
      debug: false,
    });
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        transport.sendMail({
          from: { name: 'OptimaWorks Website', address: config.user },
          ...message,
        }),
        new Promise<never>((_, reject) => {
          deadline = setTimeout(() => reject(new Error('SMTP deadline exceeded')), 20_000);
        }),
      ]);
      const accepted = result.accepted?.some(
        (address) => address.toLowerCase() === message.to.toLowerCase(),
      );
      if (!accepted || result.rejected?.length || !/^250\b/.test(result.response ?? '')) {
        throw new Error('SMTP delivery was not accepted');
      }
    } finally {
      clearTimeout(deadline);
      transport.close();
    }
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(12_000),
    body: JSON.stringify({
      from: config.from,
      to: [message.to],
      reply_to: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });
  if (!response.ok) throw new Error('Delivery provider rejected request');
  const confirmation = await response.json();
  if (!confirmation.id) throw new Error('Missing delivery confirmation');
}

export async function sendContactEmail(
  data: ContactData,
  config: MailConfiguration,
): Promise<void> {
  await deliver(config, {
    to: config.to,
    replyTo: data.email,
    subject: 'Nouvelle demande de contact – OptimaWorks',
    text: emailText(data),
    html: contactEmailHtml(data),
  });
}

export async function sendContactAcknowledgement(
  data: ContactData,
  config: MailConfiguration,
): Promise<void> {
  // Fixed content: do not reflect user-controlled messages/links into an autoresponder.
  await deliver(config, {
    to: data.email,
    replyTo: config.to,
    subject: 'Nous avons reçu votre message – OptimaWorks',
    text: acknowledgementText,
    html: emailLayout(
      'Nous avons reçu votre message',
      acknowledgementText
        .split('\n\n')
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join(''),
    ),
  });
}
