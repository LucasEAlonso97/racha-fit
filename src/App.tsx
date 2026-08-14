import {
  useEffect,
  useState,
} from 'react'

import type {
  Session,
} from '@supabase/supabase-js'

import { supabase } from './lib/supabase'

import Auth from './pages/Auth'
import RachaApp from './RachaApp'

function App() {
  const [
    session,
    setSession,
  ] = useState<Session | null>(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: {
          session: currentSession,
        },
      } =
        await supabase.auth.getSession()

      setSession(currentSession)
      setLoading(false)
    }

    void loadSession()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession)
        },
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">
            🔥
          </div>

          <p className="mt-3 font-bold text-violet-500">
            Cargando Racha...
          </p>
        </div>
      </main>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <RachaApp
      session={session}
    />
  )
}

export default App