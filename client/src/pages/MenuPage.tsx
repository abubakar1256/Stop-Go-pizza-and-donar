import { useMemo } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../store/useCatalog';
import { useLanguage } from '../store/useLanguage';
import { t, tr } from '../i18n';

export function MenuPage() {
  const { category: slug } = useParams();
  const products = useCatalog((state) => state.products);
  const categories = useCatalog((state) => state.categories);
  const status = useCatalog((state) => state.status);
  const language = useLanguage((state) => state.language);
  const active = categories.find((category) => category.slug === slug);
  const list = useMemo(() => products.filter((product) => !active || product.categoryId === active.id), [products, active]);

  return (
    <section className="page">
      <div className="page-intro">
        <p className="eyebrow">{t(language, 'menuEyebrow')}</p>
        <h1>{active ? tr(language, active.name) : t(language, 'menuDefaultTitle')}</h1>
        <p>{active ? tr(language, active.description) : t(language, 'menuDefaultDescription')}</p>
      </div>
      <nav className="filter-row category-nav" aria-label={t(language, 'menu')}>
        <NavLink to="/menu" end>{t(language, 'all')}</NavLink>
        {categories.map((category) => (
          <NavLink key={category.id} to={`/menu/${category.slug}`}>{tr(language, category.name)}</NavLink>
        ))}
      </nav>
      {status === 'loading' && <div className="skeleton-grid">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton" />)}</div>}
      {status === 'error' && <p className="empty-state">{t(language, 'menuLoadingError')}</p>}
      {status === 'ready' && list.length === 0 && <p className="empty-state">{t(language, 'menuEmpty')}</p>}
      <div className="product-grid">
        {list.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
