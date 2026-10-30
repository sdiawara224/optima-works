import { z } from 'zod';

export const serviceNames = [
  'Graphisme & Design',
  'Consulting & Stratégie',
  'Gestion de Projets',
  'Formation & Accompagnement',
  'Autre / conseil général',
] as const;
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Indiquez au moins 2 caractères.')
    .max(100, '100 caractères maximum.')
    .regex(/^[\p{L}\p{M}\s.'’-]+$/u, 'Utilisez des lettres, espaces, apostrophes ou tirets.'),
  company: z.string().trim().max(150, '150 caractères maximum.').optional().default(''),
  email: z.string().trim().max(254).email('Indiquez une adresse e-mail valide.'),
  phone: z
    .string()
    .trim()
    .max(25)
    .refine((v) => !v || /^[+\d\s().-]{6,25}$/.test(v), 'Indiquez un numéro de téléphone valide.')
    .optional()
    .default(''),
  service: z.enum(serviceNames, { error: 'Choisissez un service.' }),
  subject: z
    .string()
    .trim()
    .min(3, 'Précisez un objet (3 caractères minimum).')
    .max(150, '150 caractères maximum.'),
  message: z
    .string()
    .trim()
    .min(20, 'Décrivez votre besoin en au moins 20 caractères.')
    .max(5000, '5 000 caractères maximum.'),
  consent: z.literal(true, {
    error: 'Veuillez prendre connaissance de la politique de confidentialité.',
  }),
  website: z.string().max(200).optional().default(''),
});
export type ContactData = z.infer<typeof contactSchema>;

export function emailText(data: ContactData) {
  return `Demande depuis le site OptimaWorks\n\nNom : ${data.name}\nEntreprise : ${data.company || 'Non renseignée'}\nE-mail : ${data.email}\nTéléphone : ${data.phone || 'Non renseigné'}\nService : ${data.service}\nObjet : ${data.subject}\n\nDescription du besoin :\n${data.message}\n\nInformation de confidentialité acceptée.\nPage d’origine : /#contact`;
}
