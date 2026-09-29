import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { money } from '../data/options';
import { useCatalog } from '../store/useCatalog';
import type { Category, Ingredient, Order, Product, Review, Stats, User } from '../types';
import { useLanguage } from '../store/useLanguage';
import { tr } from '../i18n';

const tabs = ['overview', 'products', 'deals', 'categories', 'ingredients', 'orders', 'customers', 'reviews', 'messages'] as const;
const statuses = ['received', 'preparing', 'cooking', 'out_for_delivery', 'delivered', 'cancelled'];

const blankProduct = {
  categoryId: '',
  name: '',
  description: '',
  basePrice: 12,
  compareAt: null as number | null,
  image: '/food/03-wrap-fire.jpg',
  rating: 4.8,
  preparationTime: 15,
  calories: 600,
  isAvailable: true,
  isVegetarian: false,
  isSpicy: false,
  discountPercent: 0,
  customizer: 'simple' as Product['customizer'],
  allergens: '',
  featured: false,
};

export function AdminPage() {
  const reloadCatalog = useCatalog((state) => state.load);
  const [tab, setTab] = useState<(typeof tabs)[number]>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<{ id: string; name: string; email: string; message: string }[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<typeof blankProduct | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>();
  const language = useLanguage((state) => state.language);

  async function refresh() {
    setError('');
    try {
      const [nextStats, menu, orderData, people, reviewData, messageData] = await Promise.all([
        api.admin.stats(),
        api.admin.products(),
        api.admin.orders(),
        api.admin.customers(),
        api.admin.reviews(),
        api.admin.messages(),
      ]);
      setStats(nextStats);
      setProducts(menu.products);
      setCategories(menu.categories);
      setIngredients(menu.ingredients);
      setOrders(orderData.orders);
      setCustomers(people.customers);
      setReviews(reviewData.reviews);
      setMessages(messageData.messages);
      reloadCatalog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr(language, 'Dashboard unavailable'));
    }
  }

  useEffect(() => { refresh(); }, []);

  const visibleProducts = products.filter((product) => tab !== 'deals' || product.category === 'Deals');

  function startProduct(product?: Product) {
    setEditingId(product?.id);
    setDraft(product ? {
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      compareAt: product.compareAt,
      image: product.image,
      rating: product.rating,
      preparationTime: product.preparationTime,
      calories: product.calories,
      isAvailable: product.isAvailable,
      isVegetarian: product.isVegetarian,
      isSpicy: product.isSpicy,
      discountPercent: product.discountPercent,
      customizer: product.customizer,
      allergens: product.allergens.join(', '),
      featured: product.featured,
    } : { ...blankProduct, categoryId: categories[0]?.id || '' });
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    await api.admin.saveProduct({
      ...draft,
      compareAt: draft.compareAt || null,
      allergens: draft.allergens.split(',').map((item) => item.trim()).filter(Boolean),
      ingredientIds: [],
      defaults: {},
    }, editingId);
    setDraft(null);
    await refresh();
  }

  return (
    <section className="admin">
      <aside>
        <p className="eyebrow">{tr(language, 'Kitchen')}</p>
        <h1>{tr(language, 'Dashboard')}</h1>
        {tabs.map((item) => <button type="button" key={item} className={tab === item ? 'on' : ''} onClick={() => setTab(item)}>{tr(language, item)}</button>)}
      </aside>
      <div className="admin-main">
        {error && <p className="form-error">{error}</p>}
        {tab === 'overview' && stats && (
          <>
            <div className="stat-grid">
              <article><span>{tr(language, "Today's orders")}</span><strong>{stats.todayOrders}</strong></article>
              <article><span>{tr(language, "Today's revenue")}</span><strong>{money(stats.todayRevenue)}</strong></article>
              <article><span>{tr(language, 'Customers')}</span><strong>{stats.totalCustomers}</strong></article>
              <article><span>{tr(language, 'Best seller')}</span><strong>{stats.bestSellers[0]?.name ? tr(language, stats.bestSellers[0].name) : '—'}</strong></article>
            </div>
            <div className="chart-grid">
              <Chart language={language} title="Daily sales" rows={stats.dailySales.map((row) => ({ label: row.date, value: row.total }))} />
              <Chart language={language} title="Monthly revenue" rows={stats.monthlyRevenue.map((row) => ({ label: row.month, value: row.total }))} />
              <Chart language={language} title="Orders by category" rows={stats.ordersByCategory.map((row) => ({ label: row.name, value: row.count }))} />
              <Chart language={language} title="Popular products" rows={stats.popularProducts.map((row) => ({ label: row.name, value: row.qty }))} />
            </div>
          </>
        )}

        {(tab === 'products' || tab === 'deals') && (
          <>
            <button type="button" className="btn btn-primary" onClick={() => startProduct()}>{tr(language, tab === 'deals' ? 'Add deal' : 'Add product')}</button>
            <div className="table-wrap">
              <table>
                <thead><tr><th>{tr(language, 'Name')}</th><th>{tr(language, 'Price')}</th><th>{tr(language, 'Status')}</th><th></th></tr></thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{tr(language, product.name)}<small>{tr(language, product.category)}</small></td>
                      <td>{money(product.basePrice)}</td>
                      <td>{product.isAvailable ? tr(language, 'Live') : tr(language, 'Hidden')}</td>
                      <td>
                        <button type="button" onClick={() => startProduct(product)}>{tr(language, 'Edit')}</button>
                        <button type="button" onClick={async () => { await api.admin.deleteProduct(product.id); refresh(); }}>{tr(language, 'Delete')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {draft && (
          <form className="admin-form" onSubmit={saveProduct}>
            <h2>{tr(language, editingId ? 'Edit item' : 'New item')}</h2>
            <label>{tr(language, 'Name')}<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
            <label>{tr(language, 'Description')}<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required /></label>
            <label>{tr(language, 'Category')}
              <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
                {categories.map((category) => <option key={category.id} value={category.id}>{tr(language, category.name)}</option>)}
              </select>
            </label>
            <label>{tr(language, 'Price')}<input type="number" step="0.01" value={draft.basePrice} onChange={(event) => setDraft({ ...draft, basePrice: Number(event.target.value) })} /></label>
            <label>{tr(language, 'Compare at')}<input type="number" step="0.01" value={draft.compareAt ?? ''} onChange={(event) => setDraft({ ...draft, compareAt: event.target.value ? Number(event.target.value) : null })} /></label>
            <label>{tr(language, 'Image')}<input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></label>
            <label>{tr(language, 'Prep minutes')}<input type="number" value={draft.preparationTime} onChange={(event) => setDraft({ ...draft, preparationTime: Number(event.target.value) })} /></label>
            <label>{tr(language, 'Calories')}<input type="number" value={draft.calories} onChange={(event) => setDraft({ ...draft, calories: Number(event.target.value) })} /></label>
            <label>{tr(language, 'Discount %')}<input type="number" value={draft.discountPercent} onChange={(event) => setDraft({ ...draft, discountPercent: Number(event.target.value) })} /></label>
            <label>{tr(language, 'Customizer')}
              <select value={draft.customizer} onChange={(event) => setDraft({ ...draft, customizer: event.target.value as Product['customizer'] })}>
                <option value="simple">{tr(language, 'Simple')}</option>
                <option value="pizza">{tr(language, 'Pizza')}</option>
                <option value="doner">{tr(language, 'Doner')}</option>
              </select>
            </label>
            <label>{tr(language, 'Allergens')}<input value={draft.allergens} onChange={(event) => setDraft({ ...draft, allergens: event.target.value })} placeholder="Gluten, Dairy" /></label>
            <label className="check"><input type="checkbox" checked={draft.isAvailable} onChange={(event) => setDraft({ ...draft, isAvailable: event.target.checked })} /> {tr(language, 'Available')}</label>
            <label className="check"><input type="checkbox" checked={draft.isVegetarian} onChange={(event) => setDraft({ ...draft, isVegetarian: event.target.checked })} /> {tr(language, 'Vegetarian')}</label>
            <label className="check"><input type="checkbox" checked={draft.isSpicy} onChange={(event) => setDraft({ ...draft, isSpicy: event.target.checked })} /> {tr(language, 'Spicy')}</label>
            <label className="check"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /> {tr(language, 'Signature')}</label>
            <div className="hero-actions">
              <button className="btn btn-primary" type="submit">{tr(language, 'Save')}</button>
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>{tr(language, 'Cancel')}</button>
            </div>
          </form>
        )}

        {tab === 'categories' && <CategoryManager categories={categories} onChange={refresh} />}
        {tab === 'ingredients' && <IngredientManager ingredients={ingredients} onChange={refresh} />}
        {tab === 'orders' && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{tr(language, 'Guest')}</th><th>{tr(language, 'Total')}</th><th>{tr(language, 'Status')}</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.customerName}<small>{order.items.map((item) => tr(language, item.productName)).join(', ')}</small></td>
                    <td>{money(order.total)}</td>
                    <td>
                      <select value={order.status} onChange={async (event) => { await api.admin.status(order.id, event.target.value); refresh(); }}>
                        {statuses.map((status) => <option key={status} value={status}>{tr(language, status.replaceAll('_', ' '))}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'customers' && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{tr(language, 'Name')}</th><th>{tr(language, 'Email')}</th><th>{tr(language, 'Role')}</th></tr></thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>
                      <select value={customer.role} onChange={async (event) => { await api.admin.updateCustomer(customer.id, { name: customer.name, phone: customer.phone || '', role: event.target.value }); refresh(); }}>
                        <option value="customer">{tr(language, 'customer')}</option>
                        <option value="admin">{tr(language, 'admin')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'reviews' && (
          <ul className="admin-list">
            {reviews.map((review) => (
              <li key={review.id}>
                <p><strong>{review.authorName}</strong> · {review.rating}/5</p>
                <p>{tr(language, review.comment)}</p>
                <button type="button" onClick={async () => { await api.admin.deleteReview(review.id); refresh(); }}>{tr(language, 'Remove')}</button>
              </li>
            ))}
          </ul>
        )}
        {tab === 'messages' && (
          <ul className="admin-list">
            {messages.map((message) => (
              <li key={message.id}><strong>{message.name}</strong> · {message.email}<p>{message.message}</p></li>
            ))}
            {messages.length === 0 && <li>{tr(language, 'No messages yet.')}</li>}
          </ul>
        )}
      </div>
    </section>
  );
}

function Chart({ language, title, rows }: { language: 'en' | 'nl'; title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <article className="chart-card">
      <h3>{tr(language, title)}</h3>
      <div className="chart">
        {rows.map((row) => (
          <div key={row.label}>
            <span style={{ height: `${Math.max(8, (row.value / max) * 100)}%` }} title={`${row.value}`} />
            <em>{tr(language, row.label)}</em>
          </div>
        ))}
        {rows.length === 0 && <p>{tr(language, 'No data yet.')}</p>}
      </div>
    </article>
  );
}

function CategoryManager({ categories, onChange }: { categories: Category[]; onChange: () => Promise<void> }) {
  const language = useLanguage((state) => state.language);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image: '' });
  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.admin.saveCategory(form);
    setForm({ name: '', slug: '', description: '', image: '' });
    await onChange();
  }
  return (
    <>
      <form className="inline-form" onSubmit={submit}>
        <input placeholder={tr(language, 'Name')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} required />
        <input placeholder="slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
        <input placeholder={tr(language, 'Description')} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <button className="btn btn-primary" type="submit">{tr(language, 'Add category')}</button>
      </form>
      <ul className="admin-list">
        {categories.map((category) => (
          <li key={category.id}>{tr(language, category.name)} <button type="button" onClick={async () => { await api.admin.deleteCategory(category.id); onChange(); }}>{tr(language, 'Delete')}</button></li>
        ))}
      </ul>
    </>
  );
}

function IngredientManager({ ingredients, onChange }: { ingredients: Ingredient[]; onChange: () => Promise<void> }) {
  const language = useLanguage((state) => state.language);
  const [form, setForm] = useState({ name: '', price: 1, category: 'pizza' });
  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.admin.saveIngredient(form);
    setForm({ name: '', price: 1, category: 'pizza' });
    await onChange();
  }
  return (
    <>
      <form className="inline-form" onSubmit={submit}>
        <input placeholder={tr(language, 'Ingredient')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input type="number" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
        <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
          <option value="pizza">{tr(language, 'Pizza')}</option>
          <option value="doner">{tr(language, 'Doner')}</option>
          <option value="both">{tr(language, 'both')}</option>
          <option value="base">{tr(language, 'base')}</option>
        </select>
        <button className="btn btn-primary" type="submit">{tr(language, 'Add ingredient')}</button>
      </form>
      <ul className="admin-list">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            {tr(language, ingredient.name)} · {money(ingredient.price)} · {tr(language, ingredient.category)}
            <button type="button" onClick={async () => { await api.admin.deleteIngredient(ingredient.id); onChange(); }}>{tr(language, 'Delete')}</button>
          </li>
        ))}
      </ul>
    </>
  );
}
