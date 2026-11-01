import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Banknote, ShoppingBag, Users, Wallet } from 'lucide-react'
import api, { apiErrorMessage } from '../../api/client'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(({ data }) => setData(data))
      .catch((err) => setError(apiErrorMessage(err, 'Unable to load dashboard.')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading dashboard…" />
  if (error) return <div className="alert alert--error">{error}</div>

  const stats = data?.stats

  return (
    <div className="admin-page">
      <div className="admin-page__heading">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Store performance</h1>
          <p>A quick look at sales, orders, and stock health.</p>
        </div>
        <Link to="/admin/orders" className="button button--dark">
          Manage orders <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-card__icon">
            <Wallet size={19} />
          </span>
          <span>Verified revenue</span>
          <strong>{formatCurrency(stats.revenue)}</strong>
          <small>Paid payments only</small>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon">
            <ShoppingBag size={19} />
          </span>
          <span>Total orders</span>
          <strong>{stats.orders}</strong>
          <small>{stats.pending_orders} pending</small>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon">
            <Users size={19} />
          </span>
          <span>Customers</span>
          <strong>{stats.customers}</strong>
          <small>Registered accounts</small>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon">
            <AlertTriangle size={19} />
          </span>
          <span>Low stock variants</span>
          <strong>{stats.low_stock}</strong>
          <small>5 units or fewer</small>
        </article>
      </div>

      {stats.low_stock > 0 && (
        <div className="admin-callout">
          <AlertTriangle size={18} />
          <div>
            <strong>
              {stats.low_stock} {stats.low_stock === 1 ? 'variant needs' : 'variants need'}{' '}
              attention
            </strong>
            <p>Review inventory before these sizes sell out.</p>
          </div>
          <Link to="/admin/inventory" className="text-link">
            Open inventory <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h2>Recent orders</h2>
            <p>The latest activity across your store.</p>
          </div>
          <Link to="/admin/orders" className="text-link">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((order) => {
                const payment = order.payments?.[0]

                return (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/orders/${order.id}`} className="table-link">
                        {order.order_number}
                      </Link>
                    </td>
                    <td>{order.user?.name || 'Guest'}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <StatusBadge status={payment?.status} type="payment" />
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data.recent_orders.length === 0 && (
          <p className="muted admin-empty">No orders yet.</p>
        )}
      </section>

      <section className="admin-panel admin-panel--split">
        <div>
          <Banknote size={20} />
          <h3>Payments</h3>
          <p>
            GCash payments stay pending until you verify the reference number. COD orders are
            settled on delivery.
          </p>
          <Link to="/admin/orders" className="text-link">
            Review payments <ArrowUpRight size={14} />
          </Link>
        </div>
        <div>
          <ShoppingBag size={20} />
          <h3>Fulfilment</h3>
          <p>
            Move orders from pending to processing, then mark them shipped or ready for pickup.
          </p>
          <Link to="/admin/orders" className="text-link">
            Update orders <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
