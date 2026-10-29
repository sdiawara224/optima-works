import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/site-header';
import { Footer } from '@/components/footer';
import './globals.css';

const siteUrl = process.env.SITE_URL;
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: { default: 'OptimaWorks — Des idées à l’impact', template: '%s | OptimaWorks' },
  description:
    'Graphisme & design, consulting & stratégie, gestion de projets et formation. À Conakry, OptimaWorks donne forme à vos idées et accompagne vos projets.',
  openGraph: {
    title: 'OptimaWorks — Des idées à l’impact',
    description: 'Créativité, structure et accompagnement pour donner de l’élan à vos projets.',
    locale: 'fr_GN',
    type: 'website',
    siteName: 'OptimaWorks',
  },
  twitter: { card: 'summary_large_image' },
  robots:
    process.env.SITE_INDEXABLE === 'true'
      ? { index: true, follow: true }
      : { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#fcfcfc' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body id="haut">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
