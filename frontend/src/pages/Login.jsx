import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiErrorMessage } from '../api/client'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [form, setForm] = useState({ email: '', password: '' })
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
      await login(form)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to sign in.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__media">
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80"
          alt="Clothing rack"
        />
        <div className="auth-page__media-copy">
          <span className="eyebrow">Thread &amp; Co.</span>
          <h2>Good tees. Fewer decisions.</h2>
          <p>Sign in to track orders, save addresses, and keep your bag across visits.</p>
        </div>
      </div>

      <div className="auth-page__form">
        <div className="auth-card">
          <span className="eyebrow">Welcome back</span>
          <h1>Sign in</h1>
          <p className="muted">Pick up right where you left off.</p>

          {error && <div className="alert alert--error">{error}</div>}

          <form onSubmit={submit} className="stack-form">
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
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="••••••••"
              />
            </label>

            <button type="submit" className="button button--dark button--wide" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} />
            </button>
          </form>

          <div className="demo-credentials">
            <span>Demo accounts</span>
            <button
              type="button"
              onClick={() => setForm({ email: 'customer@threadco.test', password: 'password' })}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'admin@threadco.test', password: 'password' })}
            >
              Admin
            </button>
          </div>

          <p className="auth-switch">
            New here? <Link to={`/register?redirect=${encodeURIComponent(redirect)}`}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
