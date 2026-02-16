import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FriendsIcon, HabitsIcon, HomeIcon, ProfileIcon } from './Icons'
import './BottomMenu.css'

interface BottomMenuProps {
  currentPath: string
}

interface MenuItem {
  path: string
  label: string
  icon: ReactNode
}

function BottomMenu({ currentPath }: BottomMenuProps) {
  const navigate = useNavigate()

  const menuItems: MenuItem[] = [
    { path: '/', icon: <HomeIcon />, label: 'Главная' },
    { path: '/habits', icon: <HabitsIcon />, label: 'Привычки' },
    { path: '/friends', icon: <FriendsIcon />, label: 'Друзья' },
    { path: '/profile', icon: <ProfileIcon />, label: 'Профиль' },
  ]

  return (
    <nav className="bottom-menu">
      {menuItems.map((item) => (
        <button
          key={item.path}
          className={`menu-item ${currentPath === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="menu-icon">{item.icon}</span>
          <span className="menu-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomMenu

