import { useLanguage } from '../store/useLanguage';
import { tr } from '../i18n';

export function AboutPage() {
  const language = useLanguage((state) => state.language);
  return (
    <section className="page about">
      <p className="eyebrow">{tr(language, 'The house')}</p>
      <h1>{tr(language, 'Fast. Fresh. Premium. Delicious.')}</h1>
      <p className="lede">{tr(language, 'STOP&GO is a pizza and doner kitchen for people who want the meal to feel considered and the handoff to feel quick. The spit turns. The oven stays hot. You decide the rest.')}</p>
      <div className="about-grid">
        <img src="/food/06-kitchen.jpg" alt={tr(language, 'Chef slicing doner beside the ingredient line')} />
        <img src="/food/08-service.jpg" alt={tr(language, 'The STOP&GO service counter')} />
        <img src="/food/01-poster.jpg" alt={tr(language, 'STOP&GO doner campaign still')} />
        <img src="/food/11-hero.jpg" alt={tr(language, 'Wrapped doner with the STOP&GO mark')} />
      </div>
      <div className="about-points">
        <article><h2>{tr(language, 'Pizza')}</h2><p>{tr(language, 'Classic, thin, cheese burst, or stuffed. Size it, then stack the extras. The price moves with you.')}</p></article>
        <article><h2>{tr(language, 'Doner')}</h2><p>{tr(language, 'Chicken, beef, or mixed. Pita, Turkish bread, or wrap. One sauce is included. Meat and heat are optional.')}</p></article>
        <article><h2>{tr(language, 'The stop')}</h2><p>{tr(language, 'Order, track, and pick it up in the same calm interface. The kitchen sees every customization.')}</p></article>
      </div>
    </section>
  );
}
