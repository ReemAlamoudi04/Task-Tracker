import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--muted)', fontSize:14, fontWeight:600 }}>
        Loading…
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  if (role && profile && profile.role !== role) {
    return <Navigate to={profile.role === 'manager' ? '/manager' : '/dashboard'} replace />
  }

  return children
}
