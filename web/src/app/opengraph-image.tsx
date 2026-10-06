import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same mark/colors as icon.tsx and apple-icon.tsx, laid out as a social
// share card. Applies to every page by default (Next inherits a root
// opengraph-image across child routes unless a route defines its own).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          background: '#0A0A0A',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 28,
            background: '#6366F1',
          }}
        >
          <svg
            width="68"
            height="68"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
            <path d="M22 10v6" />
            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
          </svg>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            color: '#FAFAFA',
            letterSpacing: -1,
          }}
        >
          NEDHub
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#A1A1AA' }}>
          Teacher Reviews · Past Papers · FAQ
        </div>
      </div>
    ),
    { ...size },
  );
}
