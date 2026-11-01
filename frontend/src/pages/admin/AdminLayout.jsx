import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowLeft, LayoutDashboard, LogOut, Package, ReceiptText, Store } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="brand brand--admin">
          <span className="brand__mark">C&amp;Y</span>
          <span className="brand__wordmark">C&amp;Y clothing Apparel</span>
        </Link>

        <span className="admin-sidebar__label">Admin</span>

        <nav className="admin-nav">
          <NavLink to="/admin" end>
            <LayoutDashboard size={17} /> Overview
          </NavLink>
          <NavLink to="/admin/orders">
            <ReceiptText size={17} /> Orders &amp; payments
          </NavLink>
          <NavLink to="/admin/inventory">
            <Package size={17} /> Inventory
          </NavLink>
        </nav>

        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-nav__link">
            <Store size={17} /> View storefront
          </Link>
          <button type="button" onClick={handleLogout} className="admin-nav__link">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <Link to="/" className="text-link">
            <ArrowLeft size={15} /> Back to store
          </Link>
          <div className="admin-user">
            <span>{user?.name}</span>
            <small>{user?.email}</small>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
