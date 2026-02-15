import { useNavigate } from 'react-router-dom'
import './BottomMenu.css'

interface BottomMenuProps {
  currentPath: string
}

function BottomMenu({ currentPath }: BottomMenuProps) {
  const navigate = useNavigate()

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Главная' },
    { path: '/habits', icon: '✅', label: 'Привычки' },
    { path: '/friends', icon: '👥', label: 'Друзья' },
    { path: '/profile', icon: '👤', label: 'Профиль' },
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

