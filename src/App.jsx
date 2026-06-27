import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthPage from './pages/AuthPage'
import OwnerDashboard from './pages/OwnerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import InvitePage from './pages/InvitePage'
import ProtectedRoute from './components/layout/ProtectedRoute'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth"            element={<AuthPage />} />
            <Route path="/invite/:token"   element={<InvitePage />} />
            <Route path="/dashboard"       element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/shared"          element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/"               element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
