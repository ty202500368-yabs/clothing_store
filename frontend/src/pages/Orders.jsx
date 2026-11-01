import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import api, { apiErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { formatCurrency, formatDate, imageUrl, primaryImage } from '../utils/format'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)

    api
      .get('/orders', { params: { page } })
      .then(({ data }) => {
        if (!active) return
        setOrders(data.data)
        setMeta(data.meta)
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Unable to load orders.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page])

  if (loading) {
    return (
      <div className="container page-pad">
        <Spinner label="Loading your orders…" />
      </div>
    )
  }

  return (
    <div className="container page-pad">
      <div className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">Order history</span>
          <h1>Your orders</h1>
          <p>Track deliveries, review payments, and reorder the pieces you love.</p>
        </div>
        <Link to="/shop" className="text-link">
          Shop again
        </Link>
      </div>

      {error ? (
        <EmptyState title="Couldn't load orders" text={error} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          text="When you place an order, it will show up here with delivery and payment details."
          action={
            <Link to="/shop" className="button button--dark">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const payment = order.payments?.[0]

            return (
              <article key={order.id} className="order-card">
                <div className="order-card__header">
                  <div>
                    <span className="eyebrow">Order</span>
                    <h2>{order.order_number}</h2>
                    <span className="muted">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="order-card__badges">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={payment?.status} type="payment" />
                  </div>
                </div>

                <div className="order-card__items">
                  {order.items.slice(0, 3).map((item) => {
                    const image = primaryImage(item.product_variant?.product)

                    return (
                      <div key={item.id} className="order-thumb">
                        {image ? (
                          <img src={imageUrl(image)} alt={item.product_name} />
                        ) : (
                          <span>TC</span>
                        )}
                        <small>
                          {item.color_name} / {item.size_name} × {item.quantity}
                        </small>
                      </div>
                    )
                  })}
                  {order.items.length > 3 && (
                    <span className="muted">+{order.items.length - 3} more</span>
                  )}
                </div>

                <div className="order-card__footer">
                  <span>
                    {order.delivery_method === 'pickup' ? 'Store pickup' : 'Delivery'} ·{' '}
                    {payment?.method === 'gcash' ? 'GCash' : 'Cash on delivery'}
                  </span>
                  <div>
                    <strong>{formatCurrency(order.total)}</strong>
                    <Link to={`/orders/${order.id}`} className="button button--outline">
                      View order
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}

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
      )}
    </div>
  )
}
