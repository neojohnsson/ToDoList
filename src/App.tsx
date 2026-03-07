import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import supabase from './utils/supabase'
import SignIn from './component/SignIn'
import Instruments from './component/Instruments'
import { AuthContext } from './context/AuthContext'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('user');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase.from('profiles').select('role').eq('id', session.user.id).single()
          .then(({ data }) => { if (data) setRole(data.role); });
      }
      setLoading(false);
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })

    return () => subscription.unsubscribe();
  }, [])

  // Wait until we know if the user is logged in before rendering routes
  if (loading) return null

  return (
    <AuthContext.Provider value={{ role, userId: session?.user.id ?? '', onRoleChange: setRole }}>
      <Routes>
        <Route
          path="/"
          // "?" Works as a if/else. If SESSION == logged in, NAVIGATE else SIGNIN
          element={session ? <Navigate to="/instruments" replace /> : <SignIn />}
        />
        <Route
          path="/instruments"
          element={session ? <Instruments /> : <Navigate to="/" replace />}
        />
      </Routes>
    </ AuthContext.Provider>
  )
}

export default App
