import 'server-only';
import { OFFICIAL_CONTACT_EMAIL } from './site-config';

export type Service = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  offerings: string[];
  icon: string;
  order: number;
};
export type Faq = { _id: string; question: string; answer: string };
export type RichBlock = {
  _key: string;
  _type: string;
  style?: string;
  children?: { text: string; marks?: string[] }[];
  markDefs?: { _key: string; href?: string }[];
};
export type Article = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  cover?: string;
  alt?: string;
  body?: RichBlock[];
  seo?: { title?: string; description?: string };
};
export type Project = {
  _id: string;
  title: string;
  category: string;
  summary: string;
  description?: string;
  image?: string;
  alt?: string;
};
export type Settings = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  heroTitle?: string;
  heroDescription?: string;
  aboutText?: string;
  socialLinks?: { label: string; url: string }[];
  legalText?: string;
  privacyText?: string;
  homeSeo?: { title?: string; description?: string };
};
export type Content = {
  services: Service[];
  faqs: Faq[];
  articles: Article[];
  projects: Project[];
  settings: Settings;
};

export const defaultServices: Service[] = [
  {
    _id: 'design',
    name: 'Graphisme & Design',
    slug: 'graphisme-design',
    description: 'Une identité qui vous ressemble. Des visuels qui vous distinguent.',
    details:
      'Nous donnons une expression visuelle à votre marque grâce à des supports professionnels, cohérents et adaptés à vos objectifs.',
    offerings: [
      'Logos & identités visuelles',
      'Chartes graphiques',
      'Supports print & digitaux',
      'Présentations professionnelles',
    ],
    icon: 'design',
    order: 1,
  },
  {
    _id: 'strategy',
    name: 'Consulting & Stratégie',
    slug: 'consulting-strategie',
    description: 'Du recul, une vision claire et une direction pour avancer.',
    details:
      'De l’analyse de vos besoins à la définition de vos priorités, nous vous accompagnons pour structurer une stratégie adaptée à votre activité.',
    offerings: [
      'Audit & analyse des besoins',
      'Conseil personnalisé',
      'Stratégie de marque',
      'Plan d’action',
    ],
    icon: 'strategy',
    order: 2,
  },
  {
    _id: 'projects',
    name: 'Gestion de Projets',
    slug: 'gestion-projets',
    description: 'De la première idée à la livraison, chaque étape compte.',
    details:
      'Nous planifions, organisons et coordonnons vos projets de A à Z, avec une attention portée aux délais, aux ressources et au budget.',
    offerings: [
      'Planification & organisation',
      'Coordination des équipes',
      'Suivi opérationnel',
      'Livraison & suivi',
    ],
    icon: 'projects',
    order: 3,
  },
  {
    _id: 'training',
    name: 'Formation & Accompagnement',
    slug: 'formation-accompagnement',
    description: 'Des compétences qui grandissent. Des équipes qui avancent.',
    details:
      'Des programmes adaptés à vos équipes pour développer les compétences en organisation, en communication et en créativité.',
    offerings: [
      'Ateliers pratiques',
      'Communication & créativité',
      'Organisation des équipes',
      'Accompagnement personnalisé',
    ],
    icon: 'training',
    order: 4,
  },
];

const query = `{
  "services": *[_type == "service" && status == "published" && !(_id in path("drafts.**"))] | order(order asc){_id,name,"slug":slug.current,description,details,offerings,icon,order},
  "faqs": *[_type == "faq" && status == "published" && !(_id in path("drafts.**"))] | order(order asc){_id,question,answer},
  "projects": *[_type == "project" && status == "published" && !(_id in path("drafts.**"))] | order(order asc){_id,title,category,summary,description,"image":image.asset->url,"alt":image.alt},
  "articles": *[_type == "article" && status == "published" && publishedAt <= now() && !(_id in path("drafts.**"))] | order(publishedAt desc){_id,title,"slug":slug.current,excerpt,category,publishedAt,"cover":cover.asset->url,"alt":cover.alt,body,seo},
  "settings": *[_type == "settings" && status == "published" && !(_id in path("drafts.**"))][0]{phone,whatsapp,email,address,heroTitle,heroDescription,aboutText,socialLinks,legalText,privacyText,homeSeo}
}`;

export async function getContent(): Promise<Content> {
  const fallback: Content = {
    services: defaultServices,
    faqs: [],
    articles: [],
    projects: [],
    settings: { email: OFFICIAL_CONTACT_EMAIL },
  };
  const project = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  if (!project || !dataset) return fallback;
  if (!/^[a-z0-9-]+$/.test(project) || !/^[a-z0-9_-]+$/.test(dataset)) return fallback;
  try {
    const response = await fetch(
      `https://${project}.api.sanity.io/v2026-10-01/data/query/${dataset}?perspective=published&query=${encodeURIComponent(query)}`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) },
    );
    if (!response.ok) throw new Error('CMS unavailable');
    const { result } = (await response.json()) as { result: Content };
    return {
      services: result.services ?? [],
      faqs: result.faqs ?? [],
      articles: result.articles ?? [],
      projects: result.projects ?? [],
      settings: {
        ...result.settings,
        email: result.settings?.email?.trim() || OFFICIAL_CONTACT_EMAIL,
      },
    };
  } catch {
    console.error('CMS indisponible : affichage du contenu de secours.');
    return fallback;
  }
}

export function safeUrl(value?: string) {
  return value && /^https:\/\//.test(value) ? value : undefined;
}
export function contactLinks(settings: Settings) {
  const phone = settings.phone?.replace(/[^+\d]/g, '');
  const whatsapp = settings.whatsapp?.replace(/\D/g, '');
  return {
    phone: phone && /^\+\d{8,15}$/.test(phone) ? `tel:${phone}` : undefined,
    whatsapp:
      whatsapp && /^\d{8,15}$/.test(whatsapp)
        ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour OptimaWorks, je souhaite obtenir des informations sur vos services.')}`
        : undefined,
    email:
      settings.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)
        ? `mailto:${settings.email}`
        : undefined,
  };
}
