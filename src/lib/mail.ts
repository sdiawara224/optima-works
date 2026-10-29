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
    (env.GMAIL_APP_PASSWORD ? 'gmail' : env.RESEND_API_KEY ? 'resend' : 'gmail');
  const to = env.CONTACT_TO?.trim() || OFFICIAL_CONTACT_EMAIL;
  if (!z.email().safeParse(to).success) return null;
  if (provider === 'gmail') {
    const user = env.GMAIL_USER?.trim() || OFFICIAL_CONTACT_EMAIL;
    // Google displays application passwords in groups separated by spaces.
    const password = env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
    if (!password || !z.email().safeParse(user).success) return null;
    return { provider, user, password, to };
  }
  if (provider === 'resend' && env.RESEND_API_KEY && env.CONTACT_FROM?.trim()) {
    return { provider, apiKey: env.RESEND_API_KEY, from: env.CONTACT_FROM.trim(), to };
  }
  return null;
}

export async function sendContactEmail(
  data: ContactData,
  config: MailConfiguration,
): Promise<void> {
  const subject = `[OptimaWorks] ${data.subject.replace(/[\r\n]/g, ' ')}`;
  const text = emailText(data);
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
    try {
      const result = await transport.sendMail({
        from: { name: 'OptimaWorks — Site web', address: config.user },
        to: config.to,
        replyTo: data.email,
        subject,
        text,
      });
      const accepted = result.accepted?.some(
        (address) => address.toLowerCase() === config.to.toLowerCase(),
      );
      if (!accepted || result.rejected?.length || !/^250\b/.test(result.response ?? '')) {
        throw new Error('SMTP delivery was not accepted');
      }
      return;
    } finally {
      transport.close();
    }
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(12_000),
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      reply_to: data.email,
      subject,
      text,
    }),
  });
  if (!response.ok) throw new Error('Delivery provider rejected request');
  const confirmation = await response.json();
  if (!confirmation.id) throw new Error('Missing delivery confirmation');
}
