import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand brand--footer">
            <span className="brand__mark">T&amp;C</span>
            <span className="brand__wordmark">Thread &amp; Co.</span>
          </Link>
          <p>
            Everyday essentials cut from premium cotton. Designed in Manila, made for the
            long haul.
          </p>
        </div>

        <div>
          <h4>Shop</h4>
          <Link to="/shop">All tees</Link>
          <Link to="/shop?category=classic-tees">Classic</Link>
          <Link to="/shop?category=oversized">Oversized</Link>
          <Link to="/shop?category=premium-basics">Premium basics</Link>
        </div>

        <div>
          <h4>Help</h4>
          <Link to="/orders">Order tracking</Link>
          <Link to="/account">My account</Link>
          <Link to="/cart">Shopping bag</Link>
          <span>Mon–Sat, 9am–6pm</span>
        </div>

        <div className="footer-note">
          <h4>The studio</h4>
          <p>Unit 4, 21 Industria Street</p>
          <p>Pasig City, Metro Manila</p>
          <p>hello@threadandco.test</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {currentYear} Thread &amp; Co. All rights reserved.</span>
        <span>Cash on delivery · GCash · Store pickup</span>
      </div>
    </footer>
  )
}
