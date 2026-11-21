import { ROUTES } from '../navigation.js'

// Main navigation. On phones the CSS turns it into a bottom tab bar;
// on wider screens it sits in the header.
export default function NavBar({ currentRouteId }) {
  return (
    <nav className="nav" aria-label="Main">
      <ul className="nav-list">
        {ROUTES.map((route) => (
          <li key={route.id}>
            <a
              className="nav-link"
              href={route.hash}
              aria-current={route.id === currentRouteId ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {route.icon}
              </span>
              <span className="nav-label">{route.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
