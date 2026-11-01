import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { formatCurrency, imageUrl, primaryImage } from '../utils/format'

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = primaryImage(product)
  const colors = [
    ...new Map(
      (product.variants || [])
        .filter((variant) => variant.color)
        .map((variant) => [variant.color.id, variant.color]),
    ).values(),
  ]

  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card__media">
        {image && !imageFailed ? (
          <img
            src={imageUrl(image)}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="product-card__fallback">
            <span>Thread &amp; Co.</span>
          </div>
        )}
        <span className="product-card__view">
          View product <ArrowUpRight size={15} />
        </span>
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.category?.name || 'Tees'}</span>
          {product.is_featured && <span className="pill pill--soft">Featured</span>}
        </div>

        <Link to={`/product/${product.slug}`} className="product-card__title">
          {product.name}
        </Link>

        <div className="product-card__footer">
          <span>
            {product.min_price === product.max_price
              ? formatCurrency(product.min_price)
              : `From ${formatCurrency(product.min_price)}`}
          </span>
          <span className="swatch-row" aria-label="Available colors">
            {colors.slice(0, 4).map((color) => (
              <span
                key={color.id}
                className="swatch"
                style={{ backgroundColor: color.hex_code || '#d6d0c7' }}
                title={color.name}
              />
            ))}
          </span>
        </div>
      </div>
    </article>
  )
}
