import Image from 'next/image';

export function HeroArt() {
  return (
    <div className="hero-art hero-brand-visual">
      <Image
        src="/images/optimaworks-creativite.webp"
        alt="Visuel créatif OptimaWorks : une femme souriante portant un casque vert lime, sur fond noir et vert."
        fill
        sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1150px) 40vw, 420px"
        preload
      />
    </div>
  );
}
