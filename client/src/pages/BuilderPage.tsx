import { useMemo, useState } from 'react';
import { PizzaScene } from '../components/PizzaScene';
import { BUILD_TOPPINGS, money } from '../data/options';
import { emptySelection } from '../lib/pricing';
import { useCart } from '../store/useCart';
import { useCatalog } from '../store/useCatalog';
import { useLanguage } from '../store/useLanguage';
import { tr } from '../i18n';

export function BuilderPage() {
  const [active, setActive] = useState<string[]>(['pepperoni']);
  const product = useCatalog((state) => state.products.find((item) => item.builder));
  const ingredients = useCatalog((state) => state.ingredients);
  const add = useCart((state) => state.add);
  const language = useLanguage((state) => state.language);
  const extras = useMemo(() => BUILD_TOPPINGS.filter((topping) => active.includes(topping.id)), [active]);
  const extraTotal = extras.reduce((sum, topping) => sum + topping.price, 0);
  const base = product?.basePrice ?? 12;

  function toggle(id: string) {
    setActive((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function addBuilt(source: HTMLElement) {
    if (!product) return;
    const selection = emptySelection(product);
    selection.extraIds = ingredients
      .filter((ingredient) => extras.some((topping) => topping.ingredientName === ingredient.name))
      .map((ingredient) => ingredient.id);
    add(product, selection, ingredients, 1, source);
  }

  return (
    <section className="page builder-page">
      <div className="builder-stage">
        <PizzaScene variant="builder" toppings={active} />
      </div>
      <div className="builder-panel">
        <p className="eyebrow">{tr(language, 'Build your pizza')}</p>
        <h1>{tr(language, 'See it before you order it.')}</h1>
        <p>{tr(language, 'Choose a topping and it appears on the pie. Prices update with every addition.')}</p>
        <div className="choice-row">
          {BUILD_TOPPINGS.map((topping) => (
            <button type="button" key={topping.id} className={active.includes(topping.id) ? 'choice on' : 'choice'} onClick={() => toggle(topping.id)}>
              <span>{tr(language, topping.name)}</span>
              <span>+{money(topping.price)}</span>
            </button>
          ))}
        </div>
        <dl className="builder-totals">
          <div><dt>{tr(language, 'Base price')}</dt><dd>{money(base)}</dd></div>
          <div><dt>{tr(language, 'Extras')}</dt><dd>{money(extraTotal)}</dd></div>
          <div><dt>{tr(language, 'Total')}</dt><dd>{money(base + extraTotal)}</dd></div>
        </dl>
        <div className="hero-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setActive([])}>{tr(language, 'Reset')}</button>
          <button type="button" className="btn btn-primary" disabled={!product} onClick={(event) => addBuilt(event.currentTarget)}>{tr(language, 'Add to Cart')}</button>
        </div>
      </div>
    </section>
  );
}
