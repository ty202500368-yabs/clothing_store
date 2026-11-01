import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Banknote, Check, Circle, MapPin, PackageCheck, Smartphone, Store } from 'lucide-react'
import api, { apiErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { formatCurrency, formatDate, imageUrl, primaryImage } from '../utils/format'

const stepLabels = {
  delivery: ['Order placed', 'Processing', 'Shipped', 'Delivered'],
  pickup: ['Order placed', 'Processing', 'Ready for pickup', 'Picked up'],
}

function statusStep(order) {
  if (order.status === 'pending') return 0
  if (order.status === 'processing') return 1
  if (order.status === 'ready_for_pickup' || order.status === 'shipped') return 2
  if (order.status === 'completed') return 3
  return -1
}

export default function OrderDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    api
      .get(`/orders/${id}`)
      .then(({ data }) => {
        if (active) setOrder(data.data)
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Unable to load this order.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="container page-pad">
        <Spinner label="Loading order…" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container page-pad">
        <EmptyState
          title="Order not found"
          text={error || 'This order does not exist or belongs to another account.'}
          action={
            <Link to="/orders" className="button button--dark">
              Back to orders
            </Link>
          }
        />
      </div>
    )
  }

  const payment = order.payments?.[0]
  const labels = stepLabels[order.delivery_method] || stepLabels.delivery
  const currentStep = statusStep(order)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="container page-pad">
      {searchParams.get('success') === '1' && (
        <div className="success-banner">
          <PackageCheck size={22} />
          <div>
            <strong>Thank you — your order is in.</strong>
            <p>We sent a confirmation to your email and will update the status as it moves.</p>
          </div>
        </div>
      )}

      <div className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">Order details</span>
          <h1>{order.order_number}</h1>
          <p>Placed {formatDate(order.placed_at || order.created_at)}</p>
        </div>
        <div className="order-detail-badges">
          <StatusBadge status={order.status} />
          <StatusBadge status={payment?.status} type="payment" />
        </div>
      </div>

      {isCancelled ? (
        <div className="alert alert--error">
          This order was cancelled. If you were charged, a refund will be processed by our
          team.
        </div>
      ) : (
        <div className="status-track">
          {labels.map((label, index) => (
            <div
              key={label}
              className={
                index < currentStep
                  ? 'status-step is-done'
                  : index === currentStep
                    ? 'status-step is-current'
                    : 'status-step'
              }
            >
              <span className="status-step__icon">
                {index < currentStep ? <Check size={14} /> : <Circle size={10} />}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="order-detail-layout">
        <div className="order-detail-main">
          <section className="panel">
            <div className="panel__heading panel__heading--simple">
              <h2>Items</h2>
              <span className="muted">
                {order.items.length} item{order.items.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="order-detail-items">
              {order.items.map((item) => {
                const image = primaryImage(item.product_variant?.product)

                return (
                  <div key={item.id} className="order-detail-item">
                    <div className="order-detail-item__media">
                      {image ? (
                        <img src={imageUrl(image)} alt={item.product_name} />
                      ) : (
                        <span>TC</span>
                      )}
                    </div>
                    <div className="order-detail-item__body">
                      <strong>{item.product_name}</strong>
                      <span>
                        {item.color_name} / {item.size_name} · {item.sku}
                      </span>
                      <span className="muted">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </span>
                    </div>
                    <strong>{formatCurrency(item.line_total)}</strong>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel__heading panel__heading--simple">
              <h2>Delivery</h2>
            </div>

            {order.delivery_method === 'pickup' ? (
              <div className="pickup-note">
                <Store size={18} />
                <div>
                  <strong>Store pickup</strong>
                  <p>Unit 4, 21 Industria Street, Pasig City · Mon–Sat, 9am–6pm</p>
                </div>
              </div>
            ) : (
              <div className="address-card address-card--static">
                <span className="address-card__top">
                  <strong>
                    <MapPin size={15} /> {order.delivery_recipient_name}
                  </strong>
                </span>
                <span>{order.delivery_phone}</span>
                <span>
                  {order.delivery_address_line}, {order.delivery_city},{' '}
                  {order.delivery_province} {order.delivery_postal_code}
                </span>
              </div>
            )}

            {order.notes && (
              <div className="order-note">
                <strong>Order note</strong>
                <p>{order.notes}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="summary-card">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>{order.delivery_method === 'pickup' ? 'Pickup' : 'Shipping'}</span>
            <span>
              {order.shipping_fee === 0 ? 'Free' : formatCurrency(order.shipping_fee)}
            </span>
          </div>
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>

          <div className="payment-summary">
            <div>
              {payment?.method === 'gcash' ? <Smartphone size={16} /> : <Banknote size={16} />}
              <strong>{payment?.method === 'gcash' ? 'GCash' : 'Cash on delivery'}</strong>
            </div>
            {payment?.reference_number && (
              <p>
                Reference: <strong>{payment.reference_number}</strong>
              </p>
            )}
            {payment?.paid_at && <p>Paid {formatDate(payment.paid_at)}</p>}
          </div>

          <Link to="/orders" className="button button--outline button--wide">
            Back to orders
          </Link>
          <Link to="/shop" className="button button--dark button--wide">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}
