import { LoaderCircle } from 'lucide-react'

export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner" role="status">
      <LoaderCircle size={26} className="spinner__icon" />
      <span>{label}</span>
    </div>
  )
}
