import { useEffect, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import { goTo, useCurrentRoute } from './navigation.js'
import AssistantScreen from './screens/AssistantScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import IdentifyScreen from './screens/IdentifyScreen.jsx'
import TripPlannerScreen from './screens/TripPlannerScreen.jsx'

// The navigation shell: header, nav bar, the current screen, and footer.
// State that more than one screen needs (like the selected species) lives here.
export default function App() {
  const route = useCurrentRoute()

  // The species the user picked on one screen, so another screen
  // (e.g. the assistant) can use it. null means nothing selected.
  const [selectedSpecies, setSelectedSpecies] = useState(null)

  // Keep the browser tab title in sync with the screen.
  useEffect(() => {
    document.title = route.id === 'home' ? 'BirdQuest' : `${route.label} · BirdQuest`
  }, [route])

  function handleAskAboutSpecies(species) {
    setSelectedSpecies(species)
    goTo('assistant')
  }

  let screen
  switch (route.id) {
    case 'plan':
      screen = <TripPlannerScreen />
      break
    case 'identify':
      screen = <IdentifyScreen onAskAboutSpecies={handleAskAboutSpecies} />
      break
    case 'assistant':
      screen = (
        <AssistantScreen
          selectedSpecies={selectedSpecies}
          onClearSpecies={() => setSelectedSpecies(null)}
        />
      )
      break
    default:
      screen = <HomeScreen onAskAboutSpecies={handleAskAboutSpecies} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <a className="brand" href="#/">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            <span>BirdQuest</span>
          </a>
          <NavBar currentRouteId={route.id} />
        </div>
      </header>

      {/* key makes React treat each screen as new when the route changes */}
      <main className="app-main" key={route.id}>
        {screen}
      </main>

      <footer className="app-footer">
        BirdQuest · University project prototype · Sample data only, no real predictions
      </footer>
    </div>
  )
}
