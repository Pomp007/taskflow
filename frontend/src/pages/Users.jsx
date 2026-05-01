import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user: me } = useAuth()

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false))
  }, [])

  const changeRole = async (userId, role) => {
    const r = await api.patch(`/users/${userId}/role`, { role })
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: r.data.user.role } : u))
  }

  if (loading) return <div className="loading">Loading users...</div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <span className="text-muted text-sm">{users.length} total</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <div className="flex-center">
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: u.role === 'admin' ? '#ede9fe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: u.role === 'admin' ? '#6d28d9' : '#374151', flexShrink: 0 }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                    {u._id === me?.id && <span className="text-muted text-sm">(you)</span>}
                  </div>
                </td>
                <td className="text-muted text-sm">{u.email}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {u._id !== me?.id && (
                    <select
                      value={u.role}
                      onChange={e => changeRole(u._id, e.target.value)}
                      className="input"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '13px' }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
