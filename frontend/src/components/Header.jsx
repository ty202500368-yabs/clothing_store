import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const navLinks = [
  { label: 'Shop all', to: '/shop' },
  { label: 'New arrivals', to: '/shop?sort=newest' },
  { label: 'Oversized', to: '/shop?category=oversized' },
  { label: 'Graphic tees', to: '/shop?category=graphic-tees' },
]

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [location.pathname, location.search])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isNavActive = (to) => {
    const [path, query = ''] = to.split('?')
    const currentQuery = location.search.replace(/^\?/, '')

    return location.pathname === path && currentQuery === query
  }

  return (
    <header className="site-header">
      <div className="announcement">
        <span>Free pickup at our Pasig studio</span>
        <span className="announcement__dot" />
        <span>Nationwide shipping ₱50</span>
      </div>

      <div className="header-main container">
        <button
          type="button"
          className="icon-button mobile-only"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="brand" aria-label="C&amp;Y clothing Apparel home">
          <span className="brand__mark">C&amp;Y</span>
          <span className="brand__wordmark">C&amp;Y clothing Apparel</span>
        </Link>

        <nav className="main-nav desktop-only" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={isNavActive(link.to) ? 'nav-link is-active' : 'nav-link'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link to="/shop" className="icon-button" aria-label="Search products">
            <Search size={20} />
          </Link>

          <div className="account-menu">
            <button
              type="button"
              className="icon-button"
              onClick={() => setAccountOpen((open) => !open)}
              aria-label="Account menu"
              aria-expanded={accountOpen}
            >
              <UserRound size={20} />
            </button>

            {accountOpen && (
              <div className="account-dropdown">
                {isAuthenticated ? (
                  <>
                    <div className="account-dropdown__header">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <Link to="/account">My account</Link>
                    <Link to="/orders">My orders</Link>
                    {isAdmin && (
                      <Link to="/admin">
                        <LayoutDashboard size={15} /> Admin dashboard
                      </Link>
                    )}
                    <button type="button" onClick={handleLogout}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">Sign in</Link>
                    <Link to="/register">Create an account</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/cart" className="icon-button cart-button" aria-label="Shopping bag">
            <ShoppingBag size={20} />
            {cart.total_items > 0 && <span className="cart-count">{cart.total_items}</span>}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/account">My account</Link>
              <Link to="/orders">My orders</Link>
              {isAdmin && <Link to="/admin">Admin dashboard</Link>}
              <button type="button" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register">Create an account</Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
