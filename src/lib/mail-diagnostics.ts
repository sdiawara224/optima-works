// Operational categories only: never return/log SMTP messages, responses, credentials or stack traces.
export type MailFailureCategory =
  | 'SMTP_AUTH_REJECTED'
  | 'SMTP_CONNECTION_FAILED'
  | 'SMTP_TLS_FAILED'
  | 'SMTP_TIMEOUT'
  | 'SMTP_ENVELOPE_REJECTED'
  | 'SMTP_ACCEPTANCE_UNCONFIRMED'
  | 'MAIL_CONTENT_FAILED'
  | 'DELIVERY_FAILED';

export function mailFailureCategory(error: unknown): MailFailureCategory {
  if (!error || typeof error !== 'object') return 'DELIVERY_FAILED';
  const { code, responseCode } = error as { code?: unknown; responseCode?: unknown };
  if (code === 'EAUTH' || responseCode === 535) return 'SMTP_AUTH_REJECTED';
  switch (code) {
    case 'ETIMEDOUT':
    case 'SMTP_DEADLINE':
      return 'SMTP_TIMEOUT';
    case 'EDNS':
    case 'ECONNECTION':
    case 'ECONNREFUSED':
    case 'ECONNRESET':
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
    case 'ENETUNREACH':
    case 'EHOSTUNREACH':
    case 'ESOCKET':
      return 'SMTP_CONNECTION_FAILED';
    case 'ETLS':
    case 'CERT_HAS_EXPIRED':
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'ERR_TLS_CERT_ALTNAME_INVALID':
    case 'ERR_SSL_WRONG_VERSION_NUMBER':
      return 'SMTP_TLS_FAILED';
    case 'EENVELOPE':
      return 'SMTP_ENVELOPE_REJECTED';
    case 'SMTP_NOT_ACCEPTED':
      return 'SMTP_ACCEPTANCE_UNCONFIRMED';
    case 'EMESSAGE':
    case 'ESTREAM':
      return 'MAIL_CONTENT_FAILED';
    default:
      return 'DELIVERY_FAILED';
  }
}
