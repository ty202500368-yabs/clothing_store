import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import api, { apiErrorMessage } from '../api/client'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [catalog, setCatalog] = useState({ categories: [], colors: [], sizes: [] })
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const queryString = searchParams.toString()

  useEffect(() => {
    api.get('/catalog').then(({ data }) => setCatalog(data)).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/products', { params: Object.fromEntries(new URLSearchParams(queryString)) })
      .then(({ data }) => {
        if (!active) return
        setProducts(data.data)
        setMeta(data.meta)
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Unable to load products.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [queryString])

  useEffect(() => {
    setSearch(new URLSearchParams(queryString).get('search') || '')
  }, [queryString])

  const activeFilterCount = useMemo(
    () =>
      ['category', 'color_id', 'size_id', 'featured', 'search'].filter((key) =>
        searchParams.get(key),
      ).length,
    [searchParams],
  )

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)

    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }

    next.delete('page')
    setSearchParams(next)
  }

  const submitSearch = (event) => {
    event.preventDefault()
    setParam('search', search.trim())
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    setSearch('')
  }

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', page)
    setSearchParams(next)
  }

  return (
    <div className="shop-page container page-pad">
      <div className="page-heading">
        <div>
          <span className="eyebrow">The collection</span>
          <h1>Everyday tees, refined.</h1>
          <p>Choose your fit, find your color, and stock up on the ones you love.</p>
        </div>

        <form className="search-box" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder="Search tees…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
          />
          <button type="submit" className="button button--dark">
            Search
          </button>
        </form>
      </div>

      <div className="shop-toolbar">
        <button
          type="button"
          className="button button--outline filter-toggle"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={16} />
          Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </button>

        <span className="shop-toolbar__count">
          {meta ? `${meta.total} styles` : 'Loading styles…'}
        </span>

        <label className="sort-select">
          <span>Sort</span>
          <select
            value={searchParams.get('sort') || 'featured'}
            onChange={(event) =>
              setParam('sort', event.target.value === 'featured' ? '' : event.target.value)
            }
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="shop-layout">
        <aside className={`filters-panel ${filtersOpen ? 'is-open' : ''}`}>
          <div className="filters-panel__header">
            <h2>Filters</h2>
            <button
              type="button"
              className="icon-button"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>

          <div className="filter-group">
            <h3>Category</h3>
            <button
              type="button"
              className={!searchParams.get('category') ? 'filter-link is-active' : 'filter-link'}
              onClick={() => setParam('category', '')}
            >
              All categories
            </button>
            {catalog.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={
                  searchParams.get('category') === category.slug
                    ? 'filter-link is-active'
                    : 'filter-link'
                }
                onClick={() => setParam('category', category.slug)}
              >
                {category.name}
                <span>{category.products_count}</span>
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h3>Color</h3>
            <div className="color-filter-grid">
              {catalog.colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={
                    searchParams.get('color_id') === String(color.id)
                      ? 'color-filter is-active'
                      : 'color-filter'
                  }
                  onClick={() =>
                    setParam(
                      'color_id',
                      searchParams.get('color_id') === String(color.id) ? '' : color.id,
                    )
                  }
                  title={color.name}
                >
                  <span style={{ backgroundColor: color.hex_code || '#d6d0c7' }} />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3>Size</h3>
            <div className="size-filter-grid">
              {catalog.sizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  className={
                    searchParams.get('size_id') === String(size.id)
                      ? 'size-chip is-active'
                      : 'size-chip'
                  }
                  onClick={() =>
                    setParam(
                      'size_id',
                      searchParams.get('size_id') === String(size.id) ? '' : size.id,
                    )
                  }
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={searchParams.get('featured') === '1'}
                onChange={(event) => setParam('featured', event.target.checked ? '1' : '')}
              />
              Featured pieces only
            </label>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" className="button button--outline" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </aside>

        <div className="shop-results">
          {loading ? (
            <Spinner label="Loading products…" />
          ) : error ? (
            <EmptyState title="Couldn't load products" text={error} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No tees match those filters"
              text="Try removing a filter or searching for something else."
              action={
                <button type="button" className="button button--dark" onClick={clearFilters}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <div className="product-grid product-grid--shop">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {meta && meta.last_page > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="button button--outline"
                    disabled={meta.current_page <= 1}
                    onClick={() => goToPage(meta.current_page - 1)}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span>
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <button
                    type="button"
                    className="button button--outline"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => goToPage(meta.current_page + 1)}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
