import { Minus, Plus } from 'lucide-react'

export default function QuantityControl({ value, onChange, min = 1, max = 99, disabled = false }) {
  return (
    <div className="quantity-control">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={15} />
      </button>
      <span>{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={15} />
      </button>
    </div>
  )
}
