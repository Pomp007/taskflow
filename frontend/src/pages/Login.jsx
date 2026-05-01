import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div className="card" style={{ width: '360px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>TaskFlow</h1>
        <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>Sign in to your account</p>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="••••••" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="error-msg" style={{ marginBottom: '10px' }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-muted" style={{ marginTop: '16px', textAlign: 'center' }}>
          No account? <Link to="/signup" style={{ color: '#2563eb' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
