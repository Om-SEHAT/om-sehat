import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner'

interface PageTransitionProps {
  children: React.ReactNode
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsLoading(true)
    
    // Simulate loading time for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  )
}

export default PageTransition
