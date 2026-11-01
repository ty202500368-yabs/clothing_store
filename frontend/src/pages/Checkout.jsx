import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banknote, Check, MapPin, Smartphone, Store, Truck } from 'lucide-react'
import api, { apiErrorMessage } from '../api/client'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency } from '../utils/format'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const EMPTY_ADDRESS = {
  label: 'Home',
  recipient_name: '',
  phone: '',
  address_line: '',
  city: '',
  province: '',
  postal_code: '',
}

export default function Checkout() {
  const { cart, loading, refresh } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS)
  const [savingAddress, setSavingAddress] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState('delivery')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [gcashReference, setGcashReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadAddresses = async () => {
    const { data } = await api.get('/addresses')
    const list = data.data
    setAddresses(list)
    setSelectedAddressId((current) => {
      if (current && list.some((address) => address.id === current)) return current
      return list.find((address) => address.is_default)?.id || list[0]?.id || null
    })
    setShowAddressForm(list.length === 0)
    return list
  }

  useEffect(() => {
    loadAddresses()
      .catch(() => {})
      .finally(() => setAddressesLoading(false))
  }, [])

  const updateAddressField = (field, value) => {
    setAddressForm((current) => ({ ...current, [field]: value }))
  }

  const saveAddress = async (event) => {
    event.preventDefault()
    setSavingAddress(true)
    setError('')

    try {
      const { data } = await api.post('/addresses', {
        ...addressForm,
        is_default: addresses.length === 0,
      })
      await loadAddresses()
      setSelectedAddressId(data.data.id)
      setAddressForm(EMPTY_ADDRESS)
      setShowAddressForm(false)
      toast('Address saved.')
    } catch (err) {
      const message = apiErrorMessage(err, 'Unable to save address.')
      setError(message)
      toast(message, 'error')
    } finally {
      setSavingAddress(false)
    }
  }

  const placeOrder = async (event) => {
    event.preventDefault()
    setError('')

    if (deliveryMethod === 'delivery' && !selectedAddressId) {
      setError('Please select a delivery address.')
      return
    }

    if (paymentMethod === 'gcash' && !gcashReference.trim()) {
      setError('Please enter your GCash reference number.')
      return
    }

    setSubmitting(true)

    try {
      const { data } = await api.post('/orders', {
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        address_id: deliveryMethod === 'delivery' ? selectedAddressId : null,
        gcash_reference: paymentMethod === 'gcash' ? gcashReference.trim() : null,
        notes: notes.trim() || null,
      })

      await refresh()
      toast('Order placed successfully.')
      navigate(`/orders/${data.data.id}?success=1`)
    } catch (err) {
      const message = apiErrorMessage(err, 'Unable to place your order.')
      setError(message)
      toast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || addressesLoading) {
    return (
      <div className="container page-pad">
        <Spinner label="Preparing checkout…" />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="container page-pad">
        <EmptyState
          title="Your bag is empty"
          text="Add a tee or two before heading to checkout."
          action={
            <Link to="/shop" className="button button--dark">
              Shop all tees
            </Link>
          }
        />
      </div>
    )
  }

  const shippingFee = deliveryMethod === 'delivery' ? 50 : 0
  const total = Number(cart.subtotal) + shippingFee

  return (
    <div className="container page-pad">
      <div className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">Checkout</span>
          <h1>Almost yours.</h1>
        </div>
        <Link to="/cart" className="text-link">
          Back to bag
        </Link>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-main">
          <section className="panel">
            <div className="panel__heading">
              <span className="step-number">01</span>
              <div>
                <h2>How would you like to get it?</h2>
                <p>Pick it up at the studio or have it delivered.</p>
              </div>
            </div>

            <div className="choice-grid">
              <button
                type="button"
                className={deliveryMethod === 'delivery' ? 'choice-card is-active' : 'choice-card'}
                onClick={() => setDeliveryMethod('delivery')}
              >
                <Truck size={21} />
                <span>
                  <strong>Delivery</strong>
                  Flat ₱50 · 2–5 business days
                </span>
                {deliveryMethod === 'delivery' && <Check size={16} />}
              </button>
              <button
                type="button"
                className={deliveryMethod === 'pickup' ? 'choice-card is-active' : 'choice-card'}
                onClick={() => setDeliveryMethod('pickup')}
              >
                <Store size={21} />
                <span>
                  <strong>Store pickup</strong>
                  Free · ready in 24 hours
                </span>
                {deliveryMethod === 'pickup' && <Check size={16} />}
              </button>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="address-block">
                <div className="address-block__header">
                  <h3>
                    <MapPin size={16} /> Delivery address
                  </h3>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setShowAddressForm((open) => !open)}
                  >
                    {showAddressForm ? 'Cancel' : '+ Add new address'}
                  </button>
                </div>

                {addresses.length > 0 && (
                  <div className="address-grid">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        className={
                          selectedAddressId === address.id
                            ? 'address-card is-active'
                            : 'address-card'
                        }
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <span className="address-card__top">
                          <strong>{address.label || 'Address'}</strong>
                          {address.is_default && <span className="pill pill--soft">Default</span>}
                        </span>
                        <span>{address.recipient_name} · {address.phone}</span>
                        <span>
                          {address.address_line}, {address.city}, {address.province}{' '}
                          {address.postal_code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <div className="address-form">
                    <div className="form-grid">
                      <label>
                        Label
                        <input
                          value={addressForm.label}
                          onChange={(event) => updateAddressField('label', event.target.value)}
                          placeholder="Home"
                        />
                      </label>
                      <label>
                        Recipient name
                        <input
                          required
                          value={addressForm.recipient_name}
                          onChange={(event) =>
                            updateAddressField('recipient_name', event.target.value)
                          }
                          placeholder="Full name"
                        />
                      </label>
                      <label>
                        Phone
                        <input
                          required
                          value={addressForm.phone}
                          onChange={(event) => updateAddressField('phone', event.target.value)}
                          placeholder="0917 123 4567"
                        />
                      </label>
                      <label>
                        Postal code
                        <input
                          value={addressForm.postal_code}
                          onChange={(event) =>
                            updateAddressField('postal_code', event.target.value)
                          }
                          placeholder="1600"
                        />
                      </label>
                      <label className="form-grid__full">
                        Street address
                        <input
                          required
                          value={addressForm.address_line}
                          onChange={(event) =>
                            updateAddressField('address_line', event.target.value)
                          }
                          placeholder="House number, street, barangay"
                        />
                      </label>
                      <label>
                        City
                        <input
                          required
                          value={addressForm.city}
                          onChange={(event) => updateAddressField('city', event.target.value)}
                          placeholder="Pasig City"
                        />
                      </label>
                      <label>
                        Province
                        <input
                          required
                          value={addressForm.province}
                          onChange={(event) => updateAddressField('province', event.target.value)}
                          placeholder="Metro Manila"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="button button--outline"
                      onClick={saveAddress}
                      disabled={savingAddress}
                    >
                      {savingAddress ? 'Saving…' : 'Save address'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {deliveryMethod === 'pickup' && (
              <div className="pickup-note">
                <Store size={18} />
                <div>
                  <strong>Thread &amp; Co. studio</strong>
                  <p>Unit 4, 21 Industria Street, Pasig City · Mon–Sat, 9am–6pm</p>
                </div>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel__heading">
              <span className="step-number">02</span>
              <div>
                <h2>Payment</h2>
                <p>Pay online with GCash or settle up on delivery.</p>
              </div>
            </div>

            <div className="choice-grid">
              <button
                type="button"
                className={paymentMethod === 'cod' ? 'choice-card is-active' : 'choice-card'}
                onClick={() => setPaymentMethod('cod')}
              >
                <Banknote size={21} />
                <span>
                  <strong>Cash on delivery</strong>
                  Pay when your order arrives
                </span>
                {paymentMethod === 'cod' && <Check size={16} />}
              </button>
              <button
                type="button"
                className={paymentMethod === 'gcash' ? 'choice-card is-active' : 'choice-card'}
                onClick={() => setPaymentMethod('gcash')}
              >
                <Smartphone size={21} />
                <span>
                  <strong>GCash</strong>
                  Send payment and enter your reference
                </span>
                {paymentMethod === 'gcash' && <Check size={16} />}
              </button>
            </div>

            {paymentMethod === 'gcash' && (
              <div className="gcash-box">
                <p>
                  Send <strong>{formatCurrency(total)}</strong> to{' '}
                  <strong>0917 123 4567</strong> (Thread &amp; Co.), then enter the GCash
                  reference number below.
                </p>
                <label>
                  GCash reference number
                  <input
                    required
                    value={gcashReference}
                    onChange={(event) => setGcashReference(event.target.value)}
                    placeholder="e.g. 1234567890"
                  />
                </label>
                <p className="muted">
                  Your payment will be marked as pending until our team verifies it.
                </p>
              </div>
            )}

            <label className="field">
              Order notes <span className="muted">(optional)</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Delivery instructions, preferred pickup time, etc."
              />
            </label>
          </section>
        </div>

        <aside className="summary-card summary-card--sticky">
          <h2>Your order</h2>

          <div className="checkout-items">
            {cart.items.map((item) => (
              <div key={item.id} className="checkout-item">
                <span>
                  {item.product_variant?.product?.name}
                  <small>
                    {item.product_variant?.color?.name} / {item.product_variant?.size?.name} ×{' '}
                    {item.quantity}
                  </small>
                </span>
                <strong>{formatCurrency(item.line_total)}</strong>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>{deliveryMethod === 'delivery' ? 'Shipping' : 'Store pickup'}</span>
            <span>{shippingFee === 0 ? 'Free' : formatCurrency(shippingFee)}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <button
            type="submit"
            className="button button--dark button--wide"
            disabled={submitting}
          >
            {submitting ? 'Placing order…' : `Place order · ${formatCurrency(total)}`}
          </button>
          <p className="summary-note">
            By placing this order you agree to our exchange policy. Payment status is
            verified by our team.
          </p>
        </aside>
      </form>
    </div>
  )
}
