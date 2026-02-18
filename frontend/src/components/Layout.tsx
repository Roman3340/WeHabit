import { ReactNode, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { authApi } from '../services/api'
import BottomMenu from './BottomMenu'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const [loading, setLoading] = useState(true)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const location = useLocation()
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    const isInput = (el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement

    const handleFocusIn = (e: FocusEvent) => {
      if (!isInput(e.target)) return
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
        blurTimeoutRef.current = null
      }
      setKeyboardOpen(true)
      const el = e.target as HTMLElement
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }

    const handleFocusOut = () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = setTimeout(() => setKeyboardOpen(false), 120)
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className={`layout ${keyboardOpen ? 'keyboard-open' : ''}`}>
      <main className="main-content">
        {children}
      </main>
      <BottomMenu currentPath={location.pathname} />
    </div>
  )
}

export default Layout

