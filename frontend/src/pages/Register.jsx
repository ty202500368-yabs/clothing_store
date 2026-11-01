import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiErrorMessage } from '../api/client'

export default function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect, { replace: true })
    }
  }, [isAuthenticated, navigate, redirect])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await register(form)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create your account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__media">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80"
          alt="Clothing store"
        />
        <div className="auth-page__media-copy">
          <span className="eyebrow">Join the studio</span>
          <h2>Your next favorite tee is waiting.</h2>
          <p>Create an account to save addresses, track orders, and check out faster.</p>
        </div>
      </div>

      <div className="auth-page__form">
        <div className="auth-card">
          <span className="eyebrow">Create account</span>
          <h1>Join C&amp;Y clothing Apparel.</h1>
          <p className="muted">It takes less than a minute.</p>

          {error && <div className="alert alert--error">{error}</div>}

          <form onSubmit={submit} className="stack-form">
            <label>
              Full name
              <input
                required
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Jane Customer"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="At least 8 characters"
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={(event) =>
                  setForm({ ...form, password_confirmation: event.target.value })
                }
                placeholder="Repeat your password"
              />
            </label>

            <button type="submit" className="button button--dark button--wide" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
