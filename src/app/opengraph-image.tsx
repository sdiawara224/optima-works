import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
export const alt = 'OptimaWorks — Vos idées prennent forme.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default async function Image() {
  const font = await readFile(join(process.cwd(), 'public/fonts/manrope-og.woff'));
  const logo = await readFile(join(process.cwd(), 'public/brand/optimaworks-logo-clair.png'));
  return new ImageResponse(
    <div
      style={{
        background: '#f6f8f0',
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '70px',
        flexDirection: 'column',
        color: '#151713',
        fontFamily: 'Manrope',
      }}
    >
      <img
        src={`data:image/png;base64,${logo.toString('base64')}`}
        alt="OptimaWorks"
        width={244}
        height={73}
      />
      <div
        style={{
          display: 'flex',
          marginTop: 75,
          fontSize: 82,
          letterSpacing: -5,
          lineHeight: 1.08,
          flexDirection: 'column',
        }}
      >
        <span>Donnons vie à vos idées.</span>
        <span>Créons l’impact.</span>
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 'auto',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 21 }}>Créativité. Structure. Impact.</span>
        <span
          style={{ background: '#9dde4d', padding: '17px 28px', borderRadius: 5, fontSize: 20 }}
        >
          Conakry, Guinée
        </span>
      </div>
    </div>,
    { ...size, fonts: [{ name: 'Manrope', data: font, style: 'normal', weight: 500 }] },
  );
}
