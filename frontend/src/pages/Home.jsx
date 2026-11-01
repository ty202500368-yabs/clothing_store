import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, PackageCheck, RefreshCcw, Truck } from 'lucide-react'
import api from '../api/client'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'

const categoryImages = {
  'classic-tees':
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  oversized:
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80',
  'graphic-tees':
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80',
  'premium-basics':
    'https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=900&q=80',
}

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [newest, setNewest] = useState([])
  const [catalog, setCatalog] = useState({ categories: [], colors: [], sizes: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/products', { params: { featured: 1, per_page: 4 } }),
      api.get('/products', { params: { sort: 'newest', per_page: 4 } }),
      api.get('/catalog'),
    ])
      .then(([featuredResponse, newestResponse, catalogResponse]) => {
        if (!active) return
        setFeatured(featuredResponse.data.data)
        setNewest(newestResponse.data.data)
        setCatalog(catalogResponse.data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__media">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80"
            alt="Model wearing a relaxed white tee"
          />
          <div className="hero__overlay" />
        </div>

        <div className="container hero__content">
          <span className="eyebrow">New season · Essentials</span>
          <h1>Tees that feel like they were made for you.</h1>
          <p>
            Heavyweight cotton, considered fits, and colors that go with everything. Built
            for everyday wear, not just the first wash.
          </p>
          <div className="hero__actions">
            <Link to="/shop" className="button button--light">
              Shop the collection <ArrowRight size={16} />
            </Link>
            <Link to="/shop?category=oversized" className="button button--ghost-light">
              Explore oversized
            </Link>
          </div>
        </div>

        <div className="hero__badge">
          <span>Made in Manila</span>
          <strong>100% combed cotton</strong>
        </div>
      </section>

      <section className="benefits-strip">
        <div className="container benefits-grid">
          <div>
            <Truck size={20} />
            <span>
              <strong>Nationwide shipping</strong>
              Flat ₱50, delivered in 2–5 days
            </span>
          </div>
          <div>
            <PackageCheck size={20} />
            <span>
              <strong>Free store pickup</strong>
              Ready within 24 hours
            </span>
          </div>
          <div>
            <RefreshCcw size={20} />
            <span>
              <strong>7-day exchanges</strong>
              Easy size swaps
            </span>
          </div>
          <div>
            <Leaf size={20} />
            <span>
              <strong>Better cotton</strong>
              Softer on skin and planet
            </span>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Shop by mood</span>
            <h2>Find your everyday uniform.</h2>
          </div>
          <Link to="/shop" className="text-link">
            View all tees <ArrowRight size={15} />
          </Link>
        </div>

        <div className="category-grid">
          {catalog.categories.map((category) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.slug}`}
              className="category-card"
            >
              <img
                src={categoryImages[category.slug]}
                alt={category.name}
                loading="lazy"
              />
              <div className="category-card__content">
                <span>{category.products_count} styles</span>
                <h3>{category.name}</h3>
                <span className="category-card__cta">
                  Shop now <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Fan favorites</span>
              <h2>Featured pieces.</h2>
            </div>
            <Link to="/shop?featured=1" className="text-link">
              Shop featured <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <Spinner label="Loading the collection…" />
          ) : (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Just landed</span>
            <h2>New arrivals.</h2>
          </div>
          <Link to="/shop?sort=newest" className="text-link">
            Shop new <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <Spinner label="Loading new arrivals…" />
        ) : (
          <div className="product-grid">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="story-band">
        <div className="container story-band__inner">
          <div className="story-band__image">
            <img
              src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80"
              alt="Folded cotton tees"
              loading="lazy"
            />
          </div>
          <div className="story-band__copy">
            <span className="eyebrow">Our promise</span>
            <h2>Fewer, better tees.</h2>
            <p>
              We keep our range small on purpose. Every silhouette is fit-tested,
              wash-tested, and made in limited runs so nothing feels disposable.
            </p>
            <ul className="check-list">
              <li>240 GSM heavyweight cotton</li>
              <li>Pre-shrunk and garment washed</li>
              <li>Ethically produced in small batches</li>
            </ul>
            <Link to="/shop" className="button button--dark">
              Shop the essentials
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
