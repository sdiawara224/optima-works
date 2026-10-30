import { defineType, defineField, defineArrayMember } from 'sanity';
const status = defineField({
  name: 'status',
  title: 'Visibilité sur le site',
  type: 'string',
  initialValue: 'draft',
  options: {
    list: [
      { title: 'Brouillon — privé', value: 'draft' },
      { title: 'Publié sur le site', value: 'published' },
    ],
    layout: 'radio',
  },
  validation: (r) => r.required(),
  description:
    'Pour apparaître sur le site : sélectionner « Publié sur le site », puis cliquer sur Publier dans Sanity.',
});
const order = defineField({
  name: 'order',
  title: 'Ordre d’affichage',
  type: 'number',
  initialValue: 0,
  validation: (r) => r.integer().min(0),
});
const slug = defineField({
  name: 'slug',
  title: 'Adresse (slug)',
  type: 'slug',
  options: { source: (doc) => String(doc.title || doc.name || ''), maxLength: 100 },
  validation: (r) => r.required(),
  description:
    'Modifier une adresse existante nécessite une redirection 301 dans la configuration du site.',
});
const seo = defineType({
  name: 'seo',
  title: 'Référencement',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre SEO',
      type: 'string',
      validation: (r) => r.required().max(65),
    }),
    defineField({
      name: 'description',
      title: 'Description SEO',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(170),
    }),
  ],
});
const image = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Texte alternatif',
        type: 'string',
        validation: (r) => r.required(),
        description: 'Décrire ce que l’image apporte, sans commencer par « image de ».',
      }),
    ],
    validation: (r) => (required ? r.required() : r),
  });
const richText = defineType({
  name: 'richText',
  title: 'Contenu',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraphe', value: 'normal' },
        { title: 'Titre de section', value: 'h2' },
        { title: 'Sous-titre', value: 'h3' },
        { title: 'Citation', value: 'blockquote' },
      ],
      lists: [],
      marks: {
        decorators: [
          { title: 'Gras', value: 'strong' },
          { title: 'Italique', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Lien',
            fields: [
              defineField({
                name: 'href',
                type: 'url',
                title: 'Adresse',
                validation: (r) => r.uri({ scheme: ['https', 'mailto', 'tel'] }),
              }),
            ],
          },
        ],
      },
    }),
  ],
});
const service = defineType({
  name: 'service',
  title: 'Services',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: (r) => r.required().max(80),
    }),
    slug,
    defineField({
      name: 'description',
      title: 'Description courte',
      type: 'text',
      rows: 2,
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: 'details',
      title: 'Description détaillée',
      type: 'text',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'offerings',
      title: 'Prestations',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'icon',
      title: 'Icône',
      type: 'string',
      options: {
        list: [
          { title: 'Design', value: 'design' },
          { title: 'Stratégie', value: 'strategy' },
          { title: 'Projets', value: 'projects' },
          { title: 'Formation', value: 'training' },
        ],
      },
      validation: (r) => r.required(),
    }),
    order,
    status,
  ],
  preview: { select: { title: 'name', subtitle: 'status' } },
});
const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Réponse validée',
      type: 'text',
      validation: (r) => r.required(),
    }),
    order,
    status,
  ],
  preview: { select: { title: 'question', subtitle: 'status' } },
});
const project = defineType({
  name: 'project',
  title: 'Réalisations',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Titre', type: 'string', validation: (r) => r.required() }),
    slug,
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Résumé',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(400),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (r) => r.required(),
    }),
    image('image', 'Image principale', true),
    defineField({
      name: 'rightsConfirmed',
      title: 'Droits et autorisation de publication confirmés',
      type: 'boolean',
      validation: (r) =>
        r.required().custom((v) => v === true || 'Confirmez les droits avant de publier.'),
    }),
    defineField({ name: 'seo', title: 'Référencement', type: 'seo' }),
    order,
    status,
  ],
  preview: { select: { title: 'title', subtitle: 'status', media: 'image' } },
});
const article = defineType({
  name: 'article',
  title: 'Articles du journal',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (r) => r.required().max(140),
    }),
    slug,
    defineField({
      name: 'excerpt',
      title: 'Résumé',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(400),
    }),
    defineField({
      name: 'body',
      title: 'Contenu de l’article',
      type: 'richText',
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      validation: (r) => r.required(),
    }),
    image('cover', 'Image de couverture', true),
    defineField({
      name: 'publishedAt',
      title: 'Date de publication',
      type: 'datetime',
      validation: (r) => r.required(),
      description:
        'Une date future masquera l’article jusqu’à cette date (cache du site : 60 secondes).',
    }),
    defineField({
      name: 'seo',
      title: 'Référencement',
      type: 'seo',
      validation: (r) => r.required(),
    }),
    status,
  ],
  preview: { select: { title: 'title', subtitle: 'status', media: 'cover' } },
});
const settings = defineType({
  name: 'settings',
  title: 'Paramètres du site',
  type: 'document',
  validation: (r) =>
    r.custom(async (value, context) => {
      if (!value) return true;
      const id = String(value._id).replace(/^drafts\./, '');
      const count = await context
        .getClient({ apiVersion: '2026-10-01' })
        .fetch('count(*[_type == "settings" && !(_id in path("drafts.**")) && _id != $id])', {
          id,
        });
      return count === 0 || 'Un seul document de paramètres doit être conservé.';
    }),
  fields: [
    defineField({
      name: 'title',
      title: 'Nom interne',
      type: 'string',
      initialValue: 'Paramètres OptimaWorks',
    }),
    defineField({ name: 'homeSeo', title: 'Référencement de l’accueil', type: 'seo' }),
    defineField({ name: 'heroTitle', title: 'Titre d’accueil', type: 'string' }),
    defineField({
      name: 'heroDescription',
      title: 'Présentation d’accueil',
      type: 'text',
      rows: 3,
    }),
    defineField({ name: 'aboutText', title: 'À propos', type: 'text' }),
    defineField({ name: 'address', title: 'Adresse publique confirmée', type: 'string' }),
    defineField({
      name: 'phone',
      title: 'Téléphone public confirmé',
      type: 'string',
      validation: (r) => r.regex(/^\+\d{8,15}$/),
      description: 'Format international sans espaces. Laisser vide tant que non confirmé.',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp public confirmé',
      type: 'string',
      validation: (r) => r.regex(/^\+?\d{8,15}$/),
    }),
    defineField({
      name: 'email',
      title: 'E-mail public confirmé',
      type: 'string',
      validation: (r) => r.email(),
      description:
        'Adresse affichée uniquement. Le destinataire du formulaire est défini côté serveur, dans CONTACT_TO.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Réseaux sociaux officiels',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Réseau',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'url',
              title: 'Lien officiel',
              type: 'url',
              validation: (r) => r.required().uri({ scheme: ['https'] }),
            }),
          ],
        }),
      ],
    }),
    defineField({ name: 'legalText', title: 'Mentions légales validées', type: 'text' }),
    defineField({
      name: 'privacyText',
      title: 'Politique de confidentialité validée',
      type: 'text',
    }),
    status,
  ],
});
export const schemaTypes = [seo, richText, service, faq, project, article, settings];
