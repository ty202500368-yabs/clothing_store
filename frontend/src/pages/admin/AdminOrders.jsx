import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import api, { apiErrorMessage } from '../../api/client'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate, ORDER_STATUS } from '../../utils/format'

export default function AdminOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/orders', { params: { page, status: status || undefined, search: query || undefined } })
      .then(({ data }) => {
        setOrders(data.data)
        setMeta(data.meta)
      })
      .catch((err) => toast(apiErrorMessage(err, 'Unable to load orders.'), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, query])

  const submitSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  const replaceOrder = (updated) => {
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)))
  }

  const updateStatus = async (order, nextStatus) => {
    setBusyId(order.id)

    try {
      const { data } = await api.patch(`/admin/orders/${order.id}/status`, { status: nextStatus })
      replaceOrder(data.data)
      toast(`${order.order_number} marked ${nextStatus.replaceAll('_', ' ')}.`)
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to update order.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const updatePayment = async (order, nextStatus) => {
    setBusyId(order.id)

    try {
      const { data } = await api.patch(`/admin/orders/${order.id}/payment`, { status: nextStatus })
      replaceOrder(data.data)
      toast(`Payment for ${order.order_number} marked ${nextStatus}.`)
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to update payment.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__heading">
        <div>
          <span className="eyebrow">Orders &amp; payments</span>
          <h1>Order management</h1>
          <p>Fulfil orders, verify GCash payments, and keep customers updated.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <form className="search-box search-box--admin" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder="Search order number, customer…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="button button--dark">
            <Search size={15} /> Search
          </button>
        </form>

        <label className="sort-select">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value)
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(ORDER_STATUS).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : (
        <section className="admin-panel">
          <div className="table-wrap">
            <table className="admin-table admin-table--orders">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Order status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const payment = order.payments?.[0]
                  const busy = busyId === order.id

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.order_number}</strong>
                        <small>{formatDate(order.created_at)}</small>
                        <small>
                          {order.delivery_method === 'pickup' ? 'Store pickup' : 'Delivery'} ·{' '}
                          {order.payment_method === 'gcash' ? 'GCash' : 'COD'}
                        </small>
                      </td>
                      <td>
                        {order.user?.name || 'Guest'}
                        <small>{order.user?.email}</small>
                      </td>
                      <td>
                        {order.items.length} item{order.items.length === 1 ? '' : 's'}
                        <small>{order.items.map((item) => item.product_name).join(', ')}</small>
                      </td>
                      <td>
                        <strong>{formatCurrency(order.total)}</strong>
                      </td>
                      <td>
                        <StatusBadge status={payment?.status} type="payment" />
                        {payment?.reference_number && (
                          <small>Ref: {payment.reference_number}</small>
                        )}
                        <div className="row-actions">
                          {payment?.status !== 'paid' && (
                            <button
                              type="button"
                              className="mini-button"
                              disabled={busy}
                              onClick={() => updatePayment(order, 'paid')}
                            >
                              Mark paid
                            </button>
                          )}
                          {payment?.status !== 'failed' && (
                            <button
                              type="button"
                              className="mini-button mini-button--danger"
                              disabled={busy}
                              onClick={() => updatePayment(order, 'failed')}
                            >
                              Failed
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                        <select
                          className="status-select"
                          value={order.status}
                          disabled={busy || order.status === 'cancelled'}
                          onChange={(event) => updateStatus(order, event.target.value)}
                        >
                          {Object.entries(ORDER_STATUS).map(([value, meta]) => (
                            <option key={value} value={value}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && <p className="muted admin-empty">No orders match these filters.</p>}

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
        </section>
      )}
    </div>
  )
}
