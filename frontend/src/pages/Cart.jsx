import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { apiErrorMessage } from '../api/client'
import { formatCurrency, imageUrl, primaryImage } from '../utils/format'
import QuantityControl from '../components/QuantityControl'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'

export default function Cart() {
  const { isAuthenticated } = useAuth()
  const { cart, loading, updateItem, removeItem } = useCart()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState(null)

  const changeQuantity = async (item, quantity) => {
    setBusyId(item.id)

    try {
      await updateItem(item.id, quantity)
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to update quantity.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (item) => {
    setBusyId(item.id)

    try {
      await removeItem(item.id)
      toast('Item removed from your bag.', 'info')
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to remove item.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to see your bag"
          text="Your bag is saved to your account so you can pick up where you left off."
          action={
            <Link to="/login?redirect=/cart" className="button button--dark">
              Sign in
            </Link>
          }
        />
      </div>
    )
  }

  if (loading && cart.items.length === 0) {
    return (
      <div className="container page-pad">
        <Spinner label="Loading your bag…" />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          text="Start with a classic crew neck or go oversized. Either way, you can't go wrong."
          action={
            <Link to="/shop" className="button button--dark">
              Shop all tees
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container page-pad">
      <div className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">Your bag</span>
          <h1>{cart.total_items} item{cart.total_items === 1 ? '' : 's'}</h1>
        </div>
        <Link to="/shop" className="text-link">
          Continue shopping <ArrowRight size={15} />
        </Link>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item) => {
            const variant = item.product_variant
            const product = variant?.product
            const image = primaryImage(product)

            return (
              <article key={item.id} className="cart-item">
                <Link to={product ? `/product/${product.slug}` : '/shop'} className="cart-item__media">
                  {image ? (
                    <img src={imageUrl(image)} alt={product?.name || 'Tee'} />
                  ) : (
                    <span>C&amp;Y clothing Apparel</span>
                  )}
                </Link>

                <div className="cart-item__body">
                  <div className="cart-item__top">
                    <div>
                      <Link
                        to={product ? `/product/${product.slug}` : '/shop'}
                        className="cart-item__title"
                      >
                        {product?.name || 'Product unavailable'}
                      </Link>
                      <p className="cart-item__variant">
                        {variant?.color?.name} / {variant?.size?.name}
                        {variant?.sku ? ` · ${variant.sku}` : ''}
                      </p>
                    </div>
                    <strong>{formatCurrency(item.line_total)}</strong>
                  </div>

                  <div className="cart-item__bottom">
                    <QuantityControl
                      value={item.quantity}
                      onChange={(quantity) => changeQuantity(item, quantity)}
                      max={Math.max(variant?.stock_quantity || item.quantity, 1)}
                      disabled={busyId === item.id}
                    />
                    <span className="cart-item__unit">
                      {formatCurrency(variant?.price)} each
                    </span>
                    <button
                      type="button"
                      className="text-button text-button--danger"
                      onClick={() => remove(item)}
                      disabled={busyId === item.id}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <aside className="summary-card">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(cart.subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <strong>{formatCurrency(cart.subtotal)}</strong>
          </div>
          <Link to="/checkout" className="button button--dark button--wide">
            Checkout <ArrowRight size={16} />
          </Link>
          <p className="summary-note">
            Shipping is ₱50 for delivery, or free when you pick up at our Pasig studio.
          </p>
        </aside>
      </div>
    </div>
  )
}
