import { ImageResponse } from 'next/og';
import { getCarrier } from '@/lib/carrier';

const carrier = getCarrier();

export const runtime = 'edge';

export const alt = carrier.metaTitle;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
              fontSize: '48px',
            }}
          >
            📱
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {carrier.ogImage.brand}
          </div>
        </div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          {carrier.ogImage.subtitle}
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#a0aec0',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.5,
          }}
        >
          {carrier.ogImage.tagline}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          {['AABB', 'ABAB', 'AAA', '连号', '尾号过滤'].map((tag) => (
            <div
              key={tag}
              style={{
                background: 'rgba(102, 126, 234, 0.2)',
                border: '1px solid rgba(102, 126, 234, 0.5)',
                borderRadius: '20px',
                padding: '12px 24px',
                fontSize: '20px',
                color: '#667eea',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
