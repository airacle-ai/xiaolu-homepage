import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

const tabs = [
  { to: '/chat', label: '对话', icon: ChatIcon },
  { to: '/map', label: '自我地图', icon: MapIcon },
  { to: '/collision', label: '碰撞', icon: CollisionIcon },
  { to: '/timeline', label: '时间轴', icon: TimelineIcon },
]

export default function MainLayout() {
  const { user } = useUser()

  if (!user) return <Navigate to="/" replace />

  return (
    <div className="flex flex-col h-svh">
      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 border-t border-text-muted/15 bg-bg-primary/90 backdrop-blur-md safe-bottom">
        <div className="flex">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 pt-2.5 gap-0.5 transition-colors ${
                  isActive
                    ? 'text-accent-gold'
                    : 'text-text-muted active:text-text-secondary'
                }`
              }
            >
              <tab.icon />
              <span className="text-xs">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

function CollisionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function TimelineIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
