import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import api, { apiErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import QuantityControl from '../components/QuantityControl'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency, imageUrl, primaryImage } from '../utils/format'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        if (!active) return
        const item = data.data
        setProduct(item)
        setActiveImage(primaryImage(item))
        const firstAvailable =
          item.variants.find((variant) => variant.stock_quantity > 0) || item.variants[0]
        setSelectedVariantId(firstAvailable?.id || null)
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Product not found.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  const colors = useMemo(() => {
    if (!product) return []

    return [
      ...new Map(
        product.variants
          .filter((variant) => variant.color)
          .map((variant) => [variant.color.id, variant.color]),
      ).values(),
    ]
  }, [product])

  const selectedVariant = product?.variants.find(
    (variant) => variant.id === selectedVariantId,
  )
  const selectedColor = selectedVariant?.color
  const sizesForColor = product?.variants.filter(
    (variant) => variant.color?.id === selectedColor?.id,
  ) || []

  const selectColor = (color) => {
    const options = product.variants.filter((variant) => variant.color?.id === color.id)
    const next = options.find((variant) => variant.stock_quantity > 0) || options[0]
    setSelectedVariantId(next?.id || null)
    setQuantity(1)
  }

  const addToCart = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${slug}`)}`)
      return
    }

    if (!selectedVariant || selectedVariant.stock_quantity < 1) {
      toast('This variant is out of stock.', 'error')
      return
    }

    setAdding(true)

    try {
      await addItem(selectedVariant.id, quantity)
      toast(`${product.name} added to your bag.`)
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to add this item.'), 'error')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="container page-pad">
        <Spinner label="Loading product…" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container page-pad">
        <EmptyState
          title="Product not found"
          text={error || 'This product may have been removed.'}
          action={
            <Link to="/shop" className="button button--dark">
              Back to shop
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="product-page container page-pad">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category?.slug || ''}`}>
          {product.category?.name}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-layout">
        <div className="product-gallery">
          <div className="product-gallery__main">
            {activeImage ? (
              <img src={imageUrl(activeImage)} alt={product.name} />
            ) : (
              <div className="product-gallery__fallback">C&amp;Y clothing Apparel</div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="product-gallery__thumbs">
              {product.images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  className={activeImage === image.image_path ? 'is-active' : ''}
                  onClick={() => setActiveImage(image.image_path)}
                >
                  <img src={imageUrl(image.image_path)} alt={image.alt_text || product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-info__top">
            <span className="eyebrow">{product.category?.name}</span>
            <h1>{product.name}</h1>
            <div className="product-info__price">
              {formatCurrency(selectedVariant?.price ?? product.min_price)}
              {selectedVariant && (
                <span className={selectedVariant.stock_quantity > 0 ? 'stock in' : 'stock out'}>
                  {selectedVariant.stock_quantity > 0
                    ? `${selectedVariant.stock_quantity} in stock`
                    : 'Out of stock'}
                </span>
              )}
            </div>
            <p className="product-info__description">{product.description}</p>
          </div>

          <div className="option-group">
            <div className="option-group__label">
              <span>Color</span>
              <strong>{selectedColor?.name}</strong>
            </div>
            <div className="color-options">
              {colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={selectedColor?.id === color.id ? 'color-option is-active' : 'color-option'}
                  onClick={() => selectColor(color)}
                  title={color.name}
                >
                  <span style={{ backgroundColor: color.hex_code || '#d6d0c7' }} />
                  {selectedColor?.id === color.id && <Check size={13} />}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <div className="option-group__label">
              <span>Size</span>
              <span className="muted">
                {selectedVariant?.size?.name || 'Select a size'}
              </span>
            </div>
            <div className="size-options">
              {sizesForColor.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  disabled={variant.stock_quantity < 1}
                  className={selectedVariantId === variant.id ? 'size-option is-active' : 'size-option'}
                  onClick={() => {
                    setSelectedVariantId(variant.id)
                    setQuantity(1)
                  }}
                >
                  {variant.size?.name}
                </button>
              ))}
            </div>
          </div>

          <div className="purchase-row">
            <QuantityControl
              value={quantity}
              onChange={setQuantity}
              max={Math.max(selectedVariant?.stock_quantity || 1, 1)}
              disabled={!selectedVariant || selectedVariant.stock_quantity < 1}
            />
            <button
              type="button"
              className="button button--dark button--wide"
              onClick={addToCart}
              disabled={adding || !selectedVariant || selectedVariant.stock_quantity < 1}
            >
              <ShoppingBag size={17} />
              {adding ? 'Adding…' : 'Add to bag'}
            </button>
          </div>

          <div className="product-perks">
            <div>
              <Truck size={17} />
              <span>Flat ₱50 shipping · free pickup</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>7-day size exchanges</span>
            </div>
          </div>

          <details className="product-details" open>
            <summary>Fit &amp; fabric</summary>
            <p>
              Relaxed unisex fit with a straight hem. Made from 240 GSM combed cotton,
              pre-shrunk and garment washed for softness. Model is 5'11" wearing size M.
            </p>
          </details>
          <details className="product-details">
            <summary>Care</summary>
            <p>
              Machine wash cold with like colors. Tumble dry low or hang dry. Do not
              bleach. Warm iron if needed.
            </p>
          </details>
          <details className="product-details">
            <summary>Shipping &amp; returns</summary>
            <p>
              Orders are packed within 24 hours, Monday to Saturday. Delivery takes 2–5
              business days. Store pickup is free and usually ready the same day.
            </p>
          </details>
        </div>
      </div>

      <div className="product-back">
        <Link to="/shop" className="text-link">
          <ArrowLeft size={15} /> Back to all tees
        </Link>
      </div>
    </div>
  )
}
