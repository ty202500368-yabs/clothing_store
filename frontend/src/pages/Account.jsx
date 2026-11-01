import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, MapPin, Pencil, Plus, Star, Trash2, UserRound } from 'lucide-react'
import api, { apiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { formatDate } from '../utils/format'
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

export default function Account() {
  const { user, logout, isAdmin } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_ADDRESS)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadAddresses = async () => {
    const { data } = await api.get('/addresses')
    setAddresses(data.data)
  }

  useEffect(() => {
    loadAddresses()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openNew = () => {
    setForm(EMPTY_ADDRESS)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (address) => {
    setForm({
      label: address.label || '',
      recipient_name: address.recipient_name,
      phone: address.phone,
      address_line: address.address_line,
      city: address.city,
      province: address.province,
      postal_code: address.postal_code || '',
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  const saveAddress = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      if (editingId) {
        await api.patch(`/addresses/${editingId}`, form)
        toast('Address updated.')
      } else {
        await api.post('/addresses', {
          ...form,
          is_default: addresses.length === 0,
        })
        toast('Address added.')
      }

      await loadAddresses()
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_ADDRESS)
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to save address.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const makeDefault = async (address) => {
    try {
      await api.patch(`/addresses/${address.id}`, { is_default: true })
      await loadAddresses()
      toast('Default address updated.')
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to update default address.'), 'error')
    }
  }

  const removeAddress = async (address) => {
    if (!window.confirm(`Delete the ${address.label || 'selected'} address?`)) return

    try {
      await api.delete(`/addresses/${address.id}`)
      await loadAddresses()
      toast('Address deleted.', 'info')
    } catch (err) {
      toast(apiErrorMessage(err, 'Unable to delete address.'), 'error')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="container page-pad">
      <div className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">My account</span>
          <h1>Hello, {user?.name?.split(' ')[0]}.</h1>
          <p>Manage your details, saved addresses, and account preferences.</p>
        </div>
        <Link to="/orders" className="text-link">
          View orders
        </Link>
      </div>

      <div className="account-layout">
        <aside className="profile-card">
          <span className="profile-avatar">
            {user?.name
              ?.split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')}
          </span>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <span className="pill pill--soft">
            {user?.is_admin ? 'Administrator' : 'Customer'}
          </span>

          <dl className="profile-meta">
            <div>
              <dt>Member since</dt>
              <dd>{formatDate(user?.created_at)}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>{user?.role}</dd>
            </div>
          </dl>

          <div className="profile-actions">
            <Link to="/orders" className="button button--outline">
              <UserRound size={15} /> My orders
            </Link>
            {isAdmin && (
              <Link to="/admin" className="button button--outline">
                <LayoutDashboard size={15} /> Admin dashboard
              </Link>
            )}
            <button type="button" className="button button--ghost" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </aside>

        <section className="panel">
          <div className="panel__heading panel__heading--simple">
            <div>
              <h2>Saved addresses</h2>
              <p className="muted">Used at checkout for delivery orders.</p>
            </div>
            <button type="button" className="button button--dark" onClick={openNew}>
              <Plus size={16} /> Add address
            </button>
          </div>

          {loading ? (
            <Spinner label="Loading addresses…" />
          ) : addresses.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No saved addresses"
              text="Add a delivery address to speed up checkout."
              action={
                <button type="button" className="button button--dark" onClick={openNew}>
                  Add your first address
                </button>
              }
            />
          ) : (
            <div className="address-grid address-grid--account">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className={address.is_default ? 'address-card is-active' : 'address-card'}
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
                  <div className="address-card__actions">
                    <button type="button" className="text-button" onClick={() => openEdit(address)}>
                      <Pencil size={14} /> Edit
                    </button>
                    {!address.is_default && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => makeDefault(address)}
                      >
                        <Star size={14} /> Set default
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-button text-button--danger"
                      onClick={() => removeAddress(address)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {showForm && (
            <form className="address-form address-form--account" onSubmit={saveAddress}>
              <h3>{editingId ? 'Edit address' : 'New address'}</h3>
              <div className="form-grid">
                <label>
                  Label
                  <input
                    value={form.label}
                    onChange={(event) => updateField('label', event.target.value)}
                    placeholder="Home"
                  />
                </label>
                <label>
                  Recipient name
                  <input
                    required
                    value={form.recipient_name}
                    onChange={(event) => updateField('recipient_name', event.target.value)}
                  />
                </label>
                <label>
                  Phone
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                  />
                </label>
                <label>
                  Postal code
                  <input
                    value={form.postal_code}
                    onChange={(event) => updateField('postal_code', event.target.value)}
                  />
                </label>
                <label className="form-grid__full">
                  Street address
                  <input
                    required
                    value={form.address_line}
                    onChange={(event) => updateField('address_line', event.target.value)}
                  />
                </label>
                <label>
                  City
                  <input
                    required
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                </label>
                <label>
                  Province
                  <input
                    required
                    value={form.province}
                    onChange={(event) => updateField('province', event.target.value)}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="button button--outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="button button--dark" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add address'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
