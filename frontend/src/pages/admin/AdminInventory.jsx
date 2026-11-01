import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import api, { apiErrorMessage } from '../../api/client'
import Spinner from '../../components/Spinner'
import { useToast } from '../../contexts/ToastContext'
import { imageUrl, primaryImage } from '../../utils/format'

function VariantRow({ variant, onSaved }) {
  const { toast } = useToast()
  const [price, setPrice] = useState(variant.price)
  const [stock, setStock] = useState(variant.stock_quantity)
  const [active, setActive] = useState(variant.is_active)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)

    try {
      const { data } = await api.patch(`/admin/variants/${variant.id}`, {
        price: Number(price),
        stock_quantity: Number(stock),
        is_active: active,
      })
      onSaved(data.data)
      toast(`${variant.sku} updated.`)
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to update variant.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr>
      <td>
        <strong>
          {variant.color?.name} / {variant.size?.name}
        </strong>
        <small>{variant.sku}</small>
      </td>
      <td>
        <input
          className="table-input"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </td>
      <td>
        <input
          className="table-input"
          type="number"
          min="0"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
        />
      </td>
      <td>
        <label className="checkbox-row checkbox-row--table">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Active
        </label>
      </td>
      <td>
        <button type="button" className="mini-button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

export default function AdminInventory() {
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/products', { params: { page, search: query || undefined } })
      .then(({ data }) => {
        setProducts(data.data)
        setMeta(data.meta)
      })
      .catch((err) => toast(apiErrorMessage(err, 'Unable to load products.'), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query])

  const submitSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  const toggleProduct = async (product, field) => {
    setBusyId(product.id)

    try {
      const { data } = await api.patch(`/admin/products/${product.id}`, {
        [field]: !product[field],
      })
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? data.data : item)),
      )
      toast(`${product.name} updated.`)
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to update product.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleVariantSaved = (updated) => {
    setProducts((current) =>
      current.map((product) => ({
        ...product,
        variants: product.variants.map((variant) =>
          variant.id === updated.id ? { ...variant, ...updated } : variant,
        ),
      })),
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page__heading">
        <div>
          <span className="eyebrow">Inventory</span>
          <h1>Products &amp; stock</h1>
          <p>Update prices, stock levels, and what's visible in the store.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <form className="search-box search-box--admin" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="button button--dark">
            <Search size={15} /> Search
          </button>
        </form>
        <span className="muted">{meta ? `${meta.total} products` : ''}</span>
      </div>

      {loading ? (
        <Spinner label="Loading inventory…" />
      ) : (
        <div className="inventory-list">
          {products.map((product) => {
            const image = primaryImage(product)
            const totalStock = product.variants.reduce(
              (sum, variant) => sum + Number(variant.stock_quantity || 0),
              0,
            )

            return (
              <details key={product.id} className="inventory-card">
                <summary>
                  <div className="inventory-card__media">
                    {image ? <img src={imageUrl(image)} alt={product.name} /> : <span>TC</span>}
                  </div>
                  <div className="inventory-card__title">
                    <strong>{product.name}</strong>
                    <span>
                      {product.category?.name} · {product.variants.length} variants ·{' '}
                      {totalStock} units
                    </span>
                  </div>
                  <div className="inventory-card__flags">
                    <span className={product.is_active ? 'pill pill--success' : 'pill'}>
                      {product.is_active ? 'Active' : 'Hidden'}
                    </span>
                    {product.is_featured && <span className="pill pill--soft">Featured</span>}
                  </div>
                </summary>

                <div className="inventory-card__body">
                  <div className="inventory-actions">
                    <button
                      type="button"
                      className="button button--outline"
                      disabled={busyId === product.id}
                      onClick={() => toggleProduct(product, 'is_active')}
                    >
                      {product.is_active ? 'Hide from store' : 'Make active'}
                    </button>
                    <button
                      type="button"
                      className="button button--outline"
                      disabled={busyId === product.id}
                      onClick={() => toggleProduct(product, 'is_featured')}
                    >
                      {product.is_featured ? 'Remove from featured' : 'Feature product'}
                    </button>
                  </div>

                  <div className="table-wrap">
                    <table className="admin-table admin-table--variants">
                      <thead>
                        <tr>
                          <th>Variant</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((variant) => (
                          <VariantRow
                            key={variant.id}
                            variant={variant}
                            onSaved={handleVariantSaved}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            )
          })}

          {products.length === 0 && <p className="muted admin-empty">No products found.</p>}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="button button--outline"
            disabled={meta.current_page <= 1}
            onClick={() => setPage((current) => current - 1)}
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
            onClick={() => setPage((current) => current + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
