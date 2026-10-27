import Notification from '../models/Notification.js';

export async function getMyNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipientId: req.user._id, readAt: null });

    res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ recipientId: req.user._id, readAt: null }, { readAt: new Date() });
    } else {
      await Notification.findByIdAndUpdate(id, { readAt: new Date() });
    }
    res.json({ success: true, message: 'Notifications updated.' });
  } catch (err) {
    next(err);
  }
}
