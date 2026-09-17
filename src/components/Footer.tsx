import { Link } from 'react-router-dom';
import { Logo } from './primitives';

const REPO = 'https://github.com/JayCul/midbid';
const X_PROFILE: string = import.meta.env.VITE_X_PROFILE_URL || 'https://x.com/midnight_bid';

const LINKS: { label: string; to: string; external?: boolean }[] = [
  { label: 'Explore', to: '/explore' },
  { label: 'Create', to: '/create' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Privacy', to: `${REPO}/blob/main/docs/PRIVACY.md`, external: true },
  { label: 'Docs', to: `${REPO}#readme`, external: true },
  { label: 'GitHub', to: REPO, external: true },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/8">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <Logo size={22} />
          <p className="mt-4 text-[15px] text-white/48">See the price. Not the bidder.</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-12 gap-y-3 text-[14px] sm:grid-cols-3">
          {LINKS.map((l) => (
            <li key={l.label}>
              {l.external ? (
                <a
                  href={l.to}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/48 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ) : (
                <Link to={l.to} className="text-white/48 transition-colors hover:text-white">
                  {l.label}
                </Link>
              )}
            </li>
          ))}
          {X_PROFILE && (
            <li>
              <a
                href={X_PROFILE}
                target="_blank"
                rel="noreferrer"
                className="text-white/48 transition-colors hover:text-white"
              >
                X
              </a>
            </li>
          )}
        </ul>
      </div>
      <div className="shell flex flex-col gap-2 border-t border-white/8 py-6 sm:flex-row sm:justify-between">
        <span className="label">Built with Midnight</span>
        <span className="label">© 2026 MidBid</span>
      </div>
    </footer>
  );
}
