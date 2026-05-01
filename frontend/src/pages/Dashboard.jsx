import { useState, useEffect } from 'react'
import api from '../api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (!data) return null

  const { stats, recentTasks } = data

  const isOverdue = task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{stats.totalProjects}</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#2563eb' }}>{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#16a34a' }}>{stats.done}</div>
          <div className="stat-label">Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: stats.overdue > 0 ? '#dc2626' : '#1a1a1a' }}>{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="text-muted text-sm">No tasks yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map(task => (
                <tr key={task._id}>
                  <td style={{ fontWeight: 500 }}>{task.title}</td>
                  <td className="text-muted text-sm">{task.project?.name || '—'}</td>
                  <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                  <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                  <td className="text-sm">{task.assignee?.name || '—'}</td>
                  <td className={`text-sm ${isOverdue(task) ? 'overdue' : 'text-muted'}`}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    {isOverdue(task) && ' ⚠'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
