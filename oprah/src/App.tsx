import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import LoginPage from './pages/LoginPage'
import MainLayout from './components/MainLayout'
import ChatPage from './pages/ChatPage'
import MapPage from './pages/MapPage'
import CollisionPage from './pages/CollisionPage'
import TimelinePage from './pages/TimelinePage'

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route element={<MainLayout />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/collision" element={<CollisionPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}
