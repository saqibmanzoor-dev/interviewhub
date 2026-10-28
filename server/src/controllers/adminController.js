import User from '../models/User.js';
import Interview from '../models/Interview.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

export async function getAdminOverview(req, res, next) {
  try {
    const [totalUsers, totalInterviews, totalAuditLogs, pendingNotifications] = await Promise.all([
      User.countDocuments(),
      Interview.countDocuments(),
      AuditLog.countDocuments(),
      Notification.countDocuments({ isRead: false })
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const recentAudits = await AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          totalInterviews,
          totalAuditLogs,
          pendingNotifications
        },
        usersByRole,
        recentAudits,
        systemHealth: {
          database: 'healthy',
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          uptimeSeconds: Math.round(process.uptime()),
          nodeVersion: process.version
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUsers(req, res, next) {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role, title } = req.body;

    const validRoles = ['candidate', 'interviewer', 'recruiter', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) user.role = role;
    if (title !== undefined) user.title = title;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'admin.role_changed',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: { updatedRole: role }
    });

    res.json({ success: true, message: 'User role updated successfully.', data: user });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
}
