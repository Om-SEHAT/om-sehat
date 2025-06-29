import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import SplashScreen from './components/SplashScreen'
import ScrollToTop from './components/ScrollToTop'
import PageTransition from './components/PageTransition'
import SkipLink from './components/SkipLink'
import NotificationContainer from './components/NotificationSystem'
import Home from './pages/Home'
import OmSapa from './pages/OmSapa'
import OmPantau from './pages/OmPantau'
import NotFound from './pages/NotFound'
import { useNotifications } from './hooks/useNotifications'
import './styles/z-index-fix.css'
import './styles/animations.css'
import './styles/patterns.css'
import './styles/doctor-modal.css'
// import { om_sehat_backend } from 'declarations/om-sehat-backend';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { notifications, dismissNotification } = useNotifications();

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // TODO: undo on push
  // if (showSplash) {
  //   return <SplashScreen onComplete={handleSplashComplete} />;
  // }

  return (
    <div className="app-container">
      {/* <SkipLink /> */}
      <Header />
      <main id="main-content" className="main-content">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/om-sapa/*" element={<OmSapa />} />
            <Route path="/om-pantau/*" element={<OmPantau />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
      <ScrollToTop />
      {/* Notification container is placed at the end of the DOM to ensure it's on top */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
      />
      {/* Add a modal portal div to ensure modals appear above everything */}
      <div id="modal-portal" style={{ position: 'fixed', zIndex: 9999999 }}></div>
    </div>
  )
}

export default App
