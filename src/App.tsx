import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MarketProvider } from './hooks/useMarket';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { WalletModal } from './components/WalletModal';
import { EASE } from './components/primitives';
import Home from './pages/Home';

const Explore = lazy(() => import('./pages/Explore'));
const AuctionPage = lazy(() => import('./pages/AuctionPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const ActivityPage = lazy(() =>
  import('./pages/OtherPages').then((m) => ({ default: m.ActivityPage })),
);
const SetupPage = lazy(() => import('./pages/OtherPages').then((m) => ({ default: m.SetupPage })));
const NotFound = lazy(() => import('./pages/OtherPages').then((m) => ({ default: m.NotFound })));

/** Scrolls to the top on navigation, or to a #section when one is named. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(
        () => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }),
        80,
      );
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function Routed() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        id="main"
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/auction/:id" element={<AuctionPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MarketProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-white focus:px-4 focus:py-2 focus:text-void"
        >
          Skip to content
        </a>
        <ScrollManager />
        <Nav />
        <Routed />
        <Footer />
        <WalletModal />
      </MarketProvider>
    </BrowserRouter>
  );
}
