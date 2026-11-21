import { useEffect, useState } from 'react'

// Every screen in the app. The order here is the order in the nav bar.
// To add a screen: add an entry here, then add a `case` in App.jsx.
export const ROUTES = [
  { id: 'home', hash: '#/', label: 'Home', icon: '🏠' },
  { id: 'plan', hash: '#/plan', label: 'Plan a trip', icon: '🗺️' },
  { id: 'identify', hash: '#/identify', label: 'Identify', icon: '📷' },
  { id: 'assistant', hash: '#/assistant', label: 'Assistant', icon: '💬' },
]

// Finds the route for an address hash like "#/plan".
// Anything unknown (including an empty hash) falls back to Home.
function findRoute(hash) {
  return ROUTES.find((route) => route.hash === hash) ?? ROUTES[0]
}

// React hook: returns the current route and updates when the address changes
// (clicking a nav link, or the browser's back/forward buttons).
export function useCurrentRoute() {
  const [route, setRoute] = useState(() => findRoute(window.location.hash))

  useEffect(() => {
    function handleHashChange() {
      setRoute(findRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}

// Navigate from code, e.g. goTo('assistant').
export function goTo(routeId) {
  const route = ROUTES.find((r) => r.id === routeId)
  if (route) {
    window.location.hash = route.hash
  }
}
