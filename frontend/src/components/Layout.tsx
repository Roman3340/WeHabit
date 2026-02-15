import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { authApi } from '../services/api'
import BottomMenu from './BottomMenu'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const loadUser = async () => {
      try {
        await authApi.getMe()
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="layout">
      <main className="main-content">
        {children}
      </main>
      <BottomMenu currentPath={location.pathname} />
    </div>
  )
}

export default Layout

