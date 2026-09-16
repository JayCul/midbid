import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMidbid } from './useMidbid';
import { useTheme } from './useTheme';
import { useHashRoute } from './hooks';
import { Footer, Header, LogDrawer } from './components/Shell';
import Landing from './pages/Landing';
import Browse from './pages/Browse';
import Create from './pages/Create';
import AuctionDetail from './pages/AuctionDetail';
import MyActivity from './pages/MyActivity';
import Setup from './pages/Setup';

export default function App() {
  const api = useMidbid();
  const { theme, toggle } = useTheme();
  const { route } = useHashRoute();
  const [logOpen, setLogOpen] = useState(false);

  const key = route.page === 'auction' ? `auction-${route.address}` : route.page;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <Header
        api={api}
        page={route.page}
        theme={theme}
        onToggleTheme={toggle}
        onOpenLog={() => setLogOpen(true)}
      />
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {route.page === 'home' && <Landing api={api} />}
            {route.page === 'browse' && <Browse api={api} />}
            {route.page === 'create' && <Create api={api} />}
            {route.page === 'me' && <MyActivity api={api} />}
            {route.page === 'setup' && <Setup api={api} />}
            {route.page === 'auction' && <AuctionDetail api={api} address={route.address} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <LogDrawer api={api} open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}
