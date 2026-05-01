import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

function TaskModal({ onClose, onSave, initial, members }) {
  const [form, setForm] = useState(initial || { title: '', description: '', status: 'todo', priority: 'medium', assignee: '', dueDate: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{initial ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="input" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="input" type="date" value={form.dueDate ? form.dueDate.slice(0, 10) : ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
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

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [taskModal, setTaskModal] = useState(null) // null | 'new' | task object
  const [addMemberEmail, setAddMemberEmail] = useState('')
  const [memberError, setMemberError] = useState('')
  const [filter, setFilter] = useState({ status: '', priority: '' })

  const load = async () => {
    const [proj, t] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/tasks`)
    ])
    setProject(proj.data.project)
    setTasks(t.data.tasks)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const createTask = async form => {
    const r = await api.post(`/projects/${id}/tasks`, form)
    setTasks(prev => [r.data.task, ...prev])
  }

  const updateTask = async form => {
    const r = await api.patch(`/tasks/${taskModal._id}`, form)
    setTasks(prev => prev.map(t => t._id === r.data.task._id ? r.data.task : t))
  }

  const deleteTask = async taskId => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${taskId}`)
    setTasks(prev => prev.filter(t => t._id !== taskId))
  }

  const quickStatus = async (task, status) => {
    const r = await api.patch(`/tasks/${task._id}`, { status })
    setTasks(prev => prev.map(t => t._id === r.data.task._id ? r.data.task : t))
  }

  const addMember = async e => {
    e.preventDefault()
    setMemberError('')
    try {
      const r = await api.post(`/projects/${id}/members`, { email: addMemberEmail })
      setProject(r.data.project)
      setAddMemberEmail('')
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Error')
    }
  }

  const isOverdue = task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  const isOwner = project && (user?.role === 'admin' || project.owner?._id === user?.id || project.owner?._id?.toString() === user?.id)

  const filtered = tasks.filter(t => {
    if (filter.status && t.status !== filter.status) return false
    if (filter.priority && t.priority !== filter.priority) return false
    return true
  })

  if (loading) return <div className="loading">Loading project...</div>
  if (!project) return <div className="loading">Project not found.</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <div className="flex-center mt-1">
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            {project.description && <span className="text-sm text-muted">{project.description}</span>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setTaskModal('new')}>+ Add Task</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '20px' }}>
        {/* Tasks */}
        <div>
          {/* Filters */}
          <div className="flex gap-2 mb-2">
            <select className="input" style={{ width: 'auto' }} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select className="input" style={{ width: 'auto' }} value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <p className="text-muted text-sm" style={{ padding: '24px', textAlign: 'center' }}>No tasks found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        {task.description && <div className="text-sm text-muted">{task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                      </td>
                      <td>
                        <select
                          value={task.status}
                          onChange={e => quickStatus(task, e.target.value)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                        >
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td className="text-sm">{task.assignee?.name || '—'}</td>
                      <td className={`text-sm ${isOverdue(task) ? 'overdue' : 'text-muted'}`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                        {isOverdue(task) && ' ⚠'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm" onClick={() => setTaskModal(task)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteTask(task._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>Members</h3>
            {project.members?.map(m => (
              <div key={m._id} className="flex-center" style={{ marginBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#3730a3' }}>
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{m.email}</div>
                </div>
              </div>
            ))}

            {isOwner && (
              <form onSubmit={addMember} style={{ marginTop: '12px' }}>
                <input className="input" type="email" placeholder="Add by email" value={addMemberEmail} onChange={e => setAddMemberEmail(e.target.value)} style={{ marginBottom: '6px' }} />
                {memberError && <div className="error-msg mb-2">{memberError}</div>}
                <button type="submit" className="btn btn-sm" style={{ width: '100%' }}>Add Member</button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>Progress</h3>
            {['todo', 'in-progress', 'done'].map(s => {
              const count = tasks.filter(t => t.status === s).length
              const pct = tasks.length ? Math.round(count / tasks.length * 100) : 0
              return (
                <div key={s} style={{ marginBottom: '10px' }}>
                  <div className="flex-between text-sm" style={{ marginBottom: '3px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{s.replace('-', ' ')}</span>
                    <span className="text-muted">{count}</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '3px', height: '5px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: s === 'done' ? '#16a34a' : s === 'in-progress' ? '#2563eb' : '#9ca3af', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {taskModal === 'new' && (
        <TaskModal members={project.members || []} onClose={() => setTaskModal(null)} onSave={createTask} />
      )}
      {taskModal && taskModal !== 'new' && (
        <TaskModal members={project.members || []} onClose={() => setTaskModal(null)} onSave={updateTask} initial={taskModal} />
      )}
    </div>
  )
}
