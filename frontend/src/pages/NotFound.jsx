import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container page-pad">
      <div className="empty-state">
        <span className="eyebrow">404</span>
        <h1>This page went out of stock.</h1>
        <p>The link may be broken, or the page may have moved.</p>
        <Link to="/" className="button button--dark">
          Back to home
        </Link>
      </div>
    </div>
  )
}
