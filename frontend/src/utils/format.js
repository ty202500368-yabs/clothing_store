const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8000'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

export function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function imageUrl(path) {
  if (!path) return ''

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }

  return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`
}

export const ORDER_STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  ready_for_pickup: { label: 'Ready for pickup', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const PAYMENT_STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

export function statusMeta(status, type = 'order') {
  const map = type === 'payment' ? PAYMENT_STATUS : ORDER_STATUS
  return map[status] || { label: status || 'Unknown', tone: 'neutral' }
}

export function variantPrice(product) {
  if (product?.min_price == null) return 0

  return product.min_price === product.max_price
    ? formatCurrency(product.min_price)
    : `${formatCurrency(product.min_price)} – ${formatCurrency(product.max_price)}`
}

export function primaryImage(product) {
  const images = product?.images || []
  return images.find((image) => image.is_primary)?.image_path || images[0]?.image_path || ''
}

export function variantLabel(variant) {
  if (!variant) return ''

  return [variant.color?.name, variant.size?.name].filter(Boolean).join(' / ')
}
