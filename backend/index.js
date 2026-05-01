require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ─── DB Connection ────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error(err); process.exit(1); });

// ─── Models ───────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'member'], default: 'member' }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', UserSchema);

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' }
}, { timestamps: true });

const Project = mongoose.model('Project', ProjectSchema);

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);

// ─── Middleware ────────────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password min 6 chars' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    // First user is admin
    const count = await User.countDocuments();
    const user = await User.create({ name, email, password, role: count === 0 ? 'admin' : 'member' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

// ─── User Routes ──────────────────────────────────────────────────────────────
app.get('/api/users', auth, async (req, res) => {
  const users = await User.find({}, 'name email role createdAt');
  res.json({ users });
});

app.patch('/api/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Project Routes ───────────────────────────────────────────────────────────
app.get('/api/projects', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects', auth, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const project = await Project.create({
      name, description, status,
      owner: req.user._id,
      members: [req.user._id]
    });
    await project.populate('owner', 'name email');
    res.status(201).json({ project });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ error: 'Not found' });

    const canAccess = req.user.role === 'admin' ||
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some(m => m._id.toString() === req.user._id.toString());
    if (!canAccess) return res.status(403).json({ error: 'Access denied' });

    res.json({ project });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    await project.save();
    await project.populate(['owner', 'members']);
    res.json({ project });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects/:id/members', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    if (project.members.includes(userToAdd._id)) return res.status(409).json({ error: 'Already a member' });

    project.members.push(userToAdd._id);
    await project.save();
    await project.populate('members', 'name email');
    res.json({ project });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Task Routes ──────────────────────────────────────────────────────────────
app.get('/api/projects/:id/tasks', auth, async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = { project: req.params.id };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects/:id/tasks', auth, async (req, res) => {
  try {
    const { title, description, status, priority, assignee, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const task = await Task.create({
      title, description, status, priority, dueDate,
      assignee: assignee || null,
      project: req.params.id,
      createdBy: req.user._id
    });
    await task.populate(['assignee', 'createdBy']);
    res.status(201).json({ task });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });

    const fields = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate'];
    fields.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });
    await task.save();
    await task.populate(['assignee', 'createdBy']);
    res.json({ task });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    await task.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const projectQuery = req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(projectQuery, '_id');
    const projectIds = projects.map(p => p._id);

    const taskQuery = req.user.role === 'admin'
      ? {}
      : { $or: [{ project: { $in: projectIds } }, { assignee: req.user._id }] };

    const [totalProjects, allTasks] = await Promise.all([
      Project.countDocuments(projectQuery),
      Task.find(taskQuery).populate('project', 'name')
    ]);

    const now = new Date();
    const stats = {
      totalProjects,
      totalTasks: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      done: allTasks.filter(t => t.status === 'done').length,
      overdue: allTasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done').length
    };

    const recentTasks = await Task.find(taskQuery)
      .populate('assignee', 'name')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({ stats, recentTasks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
