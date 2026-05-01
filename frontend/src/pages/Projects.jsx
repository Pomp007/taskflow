import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

function ProjectModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: '', description: '', status: 'active' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{initial ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {error && <div className="error-msg mb-2">{error}</div>}
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = () => api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const create = async form => {
    const r = await api.post('/projects', form)
    setProjects(prev => [r.data.project, ...prev])
  }

  const remove = async id => {
    if (!confirm('Delete this project and all its tasks?')) return
    await api.delete(`/projects/${id}`)
    setProjects(prev => prev.filter(p => p._id !== id))
  }

  if (loading) return <div className="loading">Loading projects...</div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-muted">No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {projects.map(p => (
            <div key={p._id} className="card flex-between">
              <div>
                <div className="flex-center mb-2">
                  <Link to={`/projects/${p._id}`} style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '15px' }}>{p.name}</Link>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
                {p.description && <p className="text-sm text-muted">{p.description}</p>}
                <p className="text-sm text-muted mt-1">Owner: {p.owner?.name} · {p.members?.length || 0} member(s)</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/projects/${p._id}`} className="btn btn-sm">View</Link>
                <button className="btn btn-sm btn-danger" onClick={() => remove(p._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={create} />}
    </div>
  )
}
