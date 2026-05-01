import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signup(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div className="card" style={{ width: '360px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Create account</h1>
        <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>First user becomes admin automatically</p>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="input" type="text" placeholder="John Doe" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="Min 6 characters" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="error-msg" style={{ marginBottom: '10px' }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-muted" style={{ marginTop: '16px', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: '#2563eb' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
