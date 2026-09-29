import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';
import { IconCart, IconClose, IconHome, IconMenu, IconSearch, IconUser } from './Icons';
import { CustomizeModal } from './CustomizeModal';
import { SearchModal } from './SearchModal';
import { scenePointer } from './PizzaScene';
import { cartCount, useCart } from '../store/useCart';
import { useCatalog } from '../store/useCatalog';
import { useUi } from '../store/useUi';
import { useLanguage } from '../store/useLanguage';
import { languageOptions, t } from '../i18n';
import { tr } from '../i18n';

const navLinks = [
  ['/', 'home'],
  ['/menu', 'menu'],
  ['/about', 'about'],
  ['/contact', 'contact'],
] as const;

function LanguagePicker() {
  const language = useLanguage((state) => state.language);
  const setLanguage = useLanguage((state) => state.setLanguage);

  return (
    <label className="language-picker">
      <span className="sr-only">{t(language, 'language')}</span>
      <select value={language} aria-label={t(language, 'language')} onChange={(event) => setLanguage(event.target.value as 'en' | 'nl')}>
        {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function useCopy() {
  const language = useLanguage((state) => state.language);
  return { language, copy: (key: Parameters<typeof t>[1]) => t(language, key) };
}

export function Layout() {
  const location = useLocation();
  const load = useCatalog((state) => state.load);
  const count = useCart((state) => cartCount(state.lines));
  const searchOpen = useUi((state) => state.searchOpen);
  const menuOpen = useUi((state) => state.menuOpen);
  const openSearch = useUi((state) => state.openSearch);
  const openMenu = useUi((state) => state.openMenu);
  const message = useUi((state) => state.message);
  const { language, copy } = useCopy();
  const [scrolled, setScrolled] = useState(false);
  const [booting, setBooting] = useState(() => !sessionStorage.getItem('sg-booted'));
  const admin = location.pathname.startsWith('/admin');

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const onMove = (event: PointerEvent) => {
      scenePointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      scenePointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
  useEffect(() => {
    if (!booting) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem('sg-booted', '1');
      setBooting(false);
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [booting]);
  useEffect(() => { openMenu(false); }, [location.pathname, openMenu]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  return (
    <div className="app-shell">
      <a className="skip" href="#main">{copy('skipToContent')}</a>
      <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
        <div className="nav-inner">
          <NavLink to="/" className="brand-link" aria-label="STOP&GO home"><Logo /></NavLink>
          <nav className="nav-links" aria-label={copy('primaryNavigation')}>
            {navLinks.map(([to, key]) => (
              <NavLink key={to} to={to} end={to === '/' || to === '/menu'}>{copy(key)}</NavLink>
            ))}
          </nav>
          <div className="nav-tools">
            <LanguagePicker />
            <button className="icon-btn" type="button" aria-label={copy('search')} onClick={() => openSearch(true)}><IconSearch /></button>
            <NavLink className="icon-btn" to="/account" aria-label={copy('account')}><IconUser /></NavLink>
            <NavLink className="icon-btn cart-btn" to="/cart" aria-label={`${copy('cart')}, ${count} ${count === 1 ? copy('item') : copy('items')}`} data-cart-target>
              <IconCart />
              {count > 0 && <span className="cart-count">{count}</span>}
            </NavLink>
            <NavLink className="btn btn-primary nav-order" to="/menu">{copy('orderNow')}</NavLink>
            <button className="icon-btn nav-burger" type="button" aria-label={copy('openMenu')} onClick={() => openMenu(true)}><IconMenu /></button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="drawer" role="dialog" aria-label={copy('menu')}>
          <button className="icon-btn" type="button" aria-label={copy('closeMenu')} onClick={() => openMenu(false)}><IconClose /></button>
          <Logo tone="dark" />
          {navLinks.map(([to, key]) => <NavLink key={to} to={to} onClick={() => openMenu(false)}>{copy(key)}</NavLink>)}
          <LanguagePicker />
          <NavLink className="btn btn-primary" to="/menu">{copy('orderNow')}</NavLink>
        </div>
      )}

      {searchOpen && <SearchModal />}
      <CustomizeModal />
      <AnimatePresence>
        {message && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            ✓ {message}
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main" key={location.pathname} className="page-fade">
        <Outlet />
      </main>

      {!admin && <Footer />}
      {!admin && (
        <nav className="mobile-nav" aria-label={copy('mobileNavigation')}>
          <NavLink to="/" end><IconHome /><span>{copy('home')}</span></NavLink>
          <NavLink to="/menu"><IconMenu /><span>{copy('menu')}</span></NavLink>
          <button type="button" onClick={() => openSearch(true)}><IconSearch /><span>{copy('search')}</span></button>
          <NavLink to="/cart"><IconCart /><span>{copy('cart')}{count ? ` ${count}` : ''}</span></NavLink>
          <NavLink to="/account"><IconUser /><span>{copy('account')}</span></NavLink>
        </nav>
      )}

      {booting && (
        <div className="boot">
          <Logo />
          <p>{copy('freshHot')}</p>
        </div>
      )}
    </div>
  );
}

function Footer() {
  const { language, copy } = useCopy();
  return (
    <footer className="site-footer">
      <div>
        <Logo />
        <p>{copy('footerTagline')}</p>
      </div>
      <div>
        <h3>{copy('visit')}</h3>
        <p>120 Market Street<br />{tr(language, 'Your City')}<br />{tr(language, 'Open daily, 11:00 – 23:00')}</p>
      </div>
      <div>
        <h3>{copy('order')}</h3>
        <NavLink to="/menu">{copy('fullMenu')}</NavLink>
        <NavLink to="/build">{copy('buildPizza')}</NavLink>
        <NavLink to="/menu/snacks">{copy('snacks')}</NavLink>
      </div>
      <div>
        <h3>{copy('kitchen')}</h3>
        <p>hello@stopandgo.restaurant<br />(555) 014-2026</p>
      </div>
    </footer>
  );
}
