import { statusMeta } from '../utils/format'

export default function StatusBadge({ status, type = 'order' }) {
  const meta = statusMeta(status, type)

  return <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
}
