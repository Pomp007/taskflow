import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const linkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '8px 16px',
    borderRadius: '6px',
    color: isActive ? 'white' : '#94a3b8',
    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    marginBottom: '2px',
    fontSize: '14px'
  })

  return (
    <div>
      <div className="sidebar">
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontWeight: 700, fontSize: '18px', color: 'white' }}>TaskFlow</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{user?.name}</div>
          <span className="badge badge-admin" style={{ marginTop: '6px', fontSize: '10px' }}>{user?.role}</span>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          <NavLink to="/" end style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/projects" style={linkStyle}>Projects</NavLink>
          {user?.role === 'admin' && <NavLink to="/users" style={linkStyle}>Users</NavLink>}
        </nav>

        <div style={{ padding: '16px' }}>
          <button className="btn btn-sm" onClick={handleLogout} style={{ width: '100%', color: '#94a3b8', background: 'transparent', border: '1px solid #334155' }}>
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
