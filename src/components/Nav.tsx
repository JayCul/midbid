import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useScrolled } from '../hooks/useTime';
import { useMarket } from '../hooks/useMarket';
import { EASE, Logo } from './primitives';

const LINKS = [
  { to: '/explore', label: 'Explore' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/create', label: 'Create' },
  { to: '/start', label: 'Get ready' },
  { to: '/join', label: 'Pilot' },
];

export function Nav() {
  const scrolled = useScrolled(24);
  const market = useMarket();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const connected = market.wallet.status === 'connected';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-expo ${
        scrolled || open
          ? 'border-b border-white/8 bg-void/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="shell flex h-[72px] items-center" aria-label="Main">
        <Link to="/" aria-label="MidBid home" className="shrink-0">
          <Logo />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 whitespace-nowrap md:flex lg:gap-9">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `relative text-[14px] transition-colors duration-300 ${
                    isActive && !l.to.includes('#')
                      ? 'text-white'
                      : 'text-white/48 hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={market.openWallet}
            className={`hidden h-10 items-center gap-2.5 rounded-full px-5 text-[14px] font-medium transition-colors duration-300 sm:inline-flex ${
              connected
                ? 'border border-white/16 text-white hover:border-white/48'
                : 'bg-white text-void hover:bg-ember'
            }`}
          >
            {connected ? (
              <>
                <span className="pulse-dot" aria-hidden />
                <span className="num font-mono text-[13px]">{market.wallet.maskedAddress}</span>
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/16 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden md:hidden"
          >
            <ul className="shell flex flex-col pb-8 pt-2">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease: EASE }}
                >
                  <Link
                    to={l.to}
                    className="block border-b border-white/8 py-5 text-2xl tracking-[-0.03em]"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <li className="pt-6">
                <button onClick={market.openWallet} className="btn-primary w-full">
                  {connected ? market.wallet.maskedAddress : 'Connect Wallet'}
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
