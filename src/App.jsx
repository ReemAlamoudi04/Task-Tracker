import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthPage from './pages/AuthPage'
import OwnerDashboard from './pages/OwnerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import ProtectedRoute from './components/layout/ProtectedRoute'

function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading || !profile) return null
  return <Navigate to={profile.role === 'manager' ? '/manager' : '/dashboard'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            <Route path="/" element={
              <ProtectedRoute><RoleRedirect /></ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>
            } />

            <Route path="/manager" element={
              <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
