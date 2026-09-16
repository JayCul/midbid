// Generated lot artwork. Every auction without an image gets a sculptural object
// lit by the MidBid ember, chosen by seed, so the marketplace has one visual
// language and never depends on stock imagery.
import { useId } from 'react';

type Props = { seed: number; imageUrl?: string; title: string; className?: string };

export function LotVisual({ seed, imageUrl, title, className = '' }: Props) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-abyss ${className}`}>
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="lot-media h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-abyss ${className}`} role="img" aria-label={title}>
      <Art variant={Math.abs(seed) % 7} />
    </div>
  );
}

function Art({ variant }: { variant: number }) {
  const uid = useId().replace(/:/g, '');
  const g = (name: string) => `${name}-${uid}`;
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className="lot-media absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient id={g('glow')} cx="50%" cy="46%" r="46%">
          <stop offset="0" stopColor="#FF8A00" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#E86F00" stopOpacity="0.06" />
          <stop offset="1" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('metal')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="0.45" stopColor="#161616" />
          <stop offset="1" stopColor="#0b0b0b" />
        </linearGradient>
        <linearGradient id={g('edge')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB347" />
          <stop offset="1" stopColor="#E86F00" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={g('core')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFB347" />
          <stop offset="0.4" stopColor="#FF8A00" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FF8A00" stopOpacity="0" />
        </radialGradient>
        <pattern id={g('grid')} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#fff" strokeOpacity="0.035" />
        </pattern>
      </defs>
      <rect width="400" height="500" fill="#0a0a0a" />
      <rect width="400" height="500" fill={`url(#${g('grid')})`} />
      <rect width="400" height="500" fill={`url(#${g('glow')})`} />
      <ellipse cx="200" cy="420" rx="130" ry="10" fill="#FF8A00" opacity="0.08" />
      <line x1="40" y1="420" x2="360" y2="420" stroke="#fff" strokeOpacity="0.06" />
      {variant === 0 && <Artifact g={g} />}
      {variant === 1 && <Rings g={g} />}
      {variant === 2 && <Monolith g={g} />}
      {variant === 3 && <Sphere g={g} />}
      {variant === 4 && <Shards g={g} />}
      {variant === 5 && <Dial g={g} />}
      {variant === 6 && <Plates g={g} />}
    </svg>
  );
}

type G = { g: (n: string) => string };

function Artifact({ g }: G) {
  const pts = [
    [200, 90],
    [310, 160],
    [310, 300],
    [200, 370],
    [90, 300],
    [90, 160],
  ];
  const inner = [
    [200, 170],
    [260, 270],
    [140, 270],
  ];
  return (
    <g>
      <polygon
        points={pts.map((p) => p.join(',')).join(' ')}
        fill={`url(#${g('metal')})`}
        stroke="#fff"
        strokeOpacity="0.14"
      />
      {pts.map((p, i) =>
        inner.map((q, j) => (
          <line
            key={`${i}-${j}`}
            x1={p[0]}
            y1={p[1]}
            x2={q[0]}
            y2={q[1]}
            stroke="#fff"
            strokeOpacity="0.07"
          />
        )),
      )}
      <polygon
        points={inner.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="#FF8A00"
        strokeOpacity="0.7"
      />
      <circle cx="200" cy="237" r="46" fill={`url(#${g('core')})`} />
      <circle cx="200" cy="237" r="4" fill="#FFB347" />
    </g>
  );
}

function Rings({ g }: G) {
  return (
    <g fill="none">
      {[150, 120, 92, 66].map((r, i) => (
        <ellipse
          key={r}
          cx="200"
          cy="240"
          rx={r}
          ry={r * 0.36}
          stroke="#fff"
          strokeOpacity={0.1 + i * 0.04}
          transform={`rotate(${-18 + i * 9} 200 240)`}
        />
      ))}
      <ellipse
        cx="200"
        cy="240"
        rx="150"
        ry="54"
        stroke={`url(#${g('edge')})`}
        strokeWidth="2"
        strokeDasharray="120 820"
        transform="rotate(-18 200 240)"
      />
      <circle cx="200" cy="240" r="30" fill={`url(#${g('core')})`} />
      <circle
        cx="200"
        cy="240"
        r="22"
        fill={`url(#${g('metal')})`}
        stroke="#fff"
        strokeOpacity="0.2"
      />
    </g>
  );
}

function Monolith({ g }: G) {
  return (
    <g>
      <polygon points="160,90 250,110 250,410 160,420" fill={`url(#${g('metal')})`} />
      <polygon points="250,110 280,98 280,398 250,410" fill="#070707" />
      <polygon points="160,90 190,78 280,98 250,110" fill="#2a2a2a" />
      <line x1="250" y1="112" x2="250" y2="408" stroke={`url(#${g('edge')})`} strokeWidth="2" />
      <polygon points="160,420 250,410 280,420 190,432" fill="#FF8A00" opacity="0.12" />
    </g>
  );
}

function Sphere({ g }: G) {
  return (
    <g fill="none">
      <circle
        cx="200"
        cy="240"
        r="130"
        fill={`url(#${g('metal')})`}
        stroke="#fff"
        strokeOpacity="0.16"
      />
      {[-80, -40, 0, 40, 80].map((dy) => {
        const rx = Math.sqrt(130 * 130 - dy * dy);
        return (
          <ellipse
            key={dy}
            cx="200"
            cy={240 + dy}
            rx={rx}
            ry={rx * 0.18}
            stroke="#fff"
            strokeOpacity="0.08"
          />
        );
      })}
      {[30, 70, 110].map((rx) => (
        <ellipse key={rx} cx="200" cy="240" rx={rx} ry="130" stroke="#fff" strokeOpacity="0.07" />
      ))}
      <path d="M92 190 A130 130 0 0 1 250 118" stroke={`url(#${g('edge')})`} strokeWidth="2.5" />
      <circle cx="250" cy="118" r="5" fill="#FFB347" />
      <circle cx="250" cy="118" r="26" fill={`url(#${g('core')})`} opacity="0.7" />
    </g>
  );
}

function Shards({ g }: G) {
  return (
    <g>
      <polygon
        points="130,150 200,110 230,210 160,250"
        fill={`url(#${g('metal')})`}
        stroke="#fff"
        strokeOpacity="0.14"
      />
      <polygon
        points="220,230 300,190 290,320 240,330"
        fill={`url(#${g('metal')})`}
        stroke="#fff"
        strokeOpacity="0.1"
      />
      <polygon
        points="120,290 190,270 200,370 140,380"
        fill={`url(#${g('metal')})`}
        stroke="#FF8A00"
        strokeOpacity="0.8"
      />
      <polygon points="250,120 280,105 290,150" fill="#1f1f1f" stroke="#fff" strokeOpacity="0.12" />
      <circle cx="170" cy="325" r="40" fill={`url(#${g('core')})`} opacity="0.55" />
    </g>
  );
}

function Dial({ g }: G) {
  return (
    <g fill="none">
      <circle
        cx="200"
        cy="240"
        r="140"
        fill={`url(#${g('metal')})`}
        stroke="#fff"
        strokeOpacity="0.16"
      />
      <circle cx="200" cy="240" r="118" stroke="#fff" strokeOpacity="0.06" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const long = i % 5 === 0;
        const r1 = long ? 104 : 110;
        return (
          <line
            key={i}
            x1={200 + Math.cos(a) * r1}
            y1={240 + Math.sin(a) * r1}
            x2={200 + Math.cos(a) * 116}
            y2={240 + Math.sin(a) * 116}
            stroke="#fff"
            strokeOpacity={long ? 0.4 : 0.14}
          />
        );
      })}
      <path d="M200 124 A116 116 0 0 1 300 298" stroke="#FF8A00" strokeWidth="2.5" />
      <line x1="200" y1="240" x2="266" y2="176" stroke="#FFB347" strokeWidth="2" />
      <circle cx="200" cy="240" r="6" fill="#FF8A00" />
    </g>
  );
}

function Plates({ g }: G) {
  const plate = (y: number, top = false) => (
    <g key={y}>
      <polygon
        points={`200,${y - 40} 310,${y} 200,${y + 40} 90,${y}`}
        fill={top ? '#1d1d1d' : `url(#${g('metal')})`}
        stroke={top ? '#FF8A00' : '#fff'}
        strokeOpacity={top ? 0.8 : 0.1}
      />
      <polygon points={`90,${y} 200,${y + 40} 200,${y + 52} 90,${y + 12}`} fill="#0c0c0c" />
      <polygon points={`310,${y} 200,${y + 40} 200,${y + 52} 310,${y + 12}`} fill="#141414" />
    </g>
  );
  return (
    <g>
      {plate(340)}
      {plate(280)}
      {plate(220)}
      {plate(160, true)}
      <ellipse cx="200" cy="160" rx="60" ry="22" fill={`url(#${g('core')})`} opacity="0.5" />
    </g>
  );
}
