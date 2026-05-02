import { useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { fr } from './i18n/fr';
import { ar } from './i18n/ar';
import { Home } from './pages/Home';
import { Setup } from './pages/Setup';
import { Products } from './pages/Products';
import { Alerts } from './pages/Alerts';
import { Sync } from './pages/Sync';

type Lang = 'fr' | 'ar';

export function App() {
  const [lang, setLang] = useState<Lang>('fr');
  const t = useMemo(() => (lang === 'fr' ? fr : ar), [lang]);

  const linkBase = 'rounded-md px-2 py-1 text-sm transition';
  const linkIdle = `${linkBase} text-noir-200 hover:text-white`;
  const linkActive = `${linkBase} text-rouge-300`;

  return (
    <BrowserRouter>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-noir-900/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-rouge-500/20 ring-1 ring-rouge-500/40">
                <span className="font-display text-lg tracking-wide text-rouge-300">DS</span>
              </span>
              <span className="font-display text-xl tracking-[0.18em] text-white">{t.app_title}</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink to="/" end className={({ isActive }) => (isActive ? linkActive : linkIdle)}>
                {t.home}
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => (isActive ? linkActive : linkIdle)}>
                {t.products}
              </NavLink>
              <NavLink to="/alerts" className={({ isActive }) => (isActive ? linkActive : linkIdle)}>
                {t.alerts}
              </NavLink>
              <NavLink to="/sync" className={({ isActive }) => (isActive ? linkActive : linkIdle)}>
                {t.sync}
              </NavLink>
              <NavLink to="/setup" className={({ isActive }) => (isActive ? linkActive : linkIdle)}>
                {t.setup}
              </NavLink>
              <div className="ml-3 flex gap-1 border-l border-white/10 pl-3">
                <button
                  type="button"
                  className={`rounded px-2 py-0.5 text-xs ${
                    lang === 'fr' ? 'bg-rouge-500/20 text-rouge-200' : 'text-noir-200 hover:text-white'
                  }`}
                  onClick={() => setLang('fr')}
                >
                  {t.lang_fr}
                </button>
                <button
                  type="button"
                  className={`rounded px-2 py-0.5 text-xs ${
                    lang === 'ar' ? 'bg-rouge-500/20 text-rouge-200' : 'text-noir-200 hover:text-white'
                  }`}
                  onClick={() => setLang('ar')}
                >
                  {t.lang_ar}
                </button>
              </div>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/products" element={<Products />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/sync" element={<Sync />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
