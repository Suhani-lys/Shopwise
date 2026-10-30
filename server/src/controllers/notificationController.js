/**
 * ShopWise In-App Notifications Controller
 * Manages user notification feed, unread counters, and dismissal.
 */

const { NotificationDAL } = require('../models/schema');

// GET /api/notifications
async function getNotifications(req, res) {
  try {
    const userEmail = req.user?.email || req.query.userEmail;
    const userId = req.user?.id || req.query.userId;

    if (!userEmail && !userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to view notifications' });
    }

    const query = {};
    if (userEmail) query.userEmail = userEmail.trim().toLowerCase();
    if (userId) query.userId = userId;

    const notifications = await NotificationDAL.find(query);
    const unreadCount = await NotificationDAL.countUnread(userEmail);

    res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('[Notification Controller Error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications', error: error.message });
  }
}

// PATCH /api/notifications/:id/read
async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email || req.body.userEmail;

    const updated = await NotificationDAL.markAsRead(id, userEmail);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updated
    });
  } catch (error) {
    console.error('[Notification Read Error]', error);
    res.status(500).json({ success: false, message: 'Server error updating notification', error: error.message });
  }
}

// PATCH /api/notifications/read-all
async function markAllNotificationsAsRead(req, res) {
  try {
    const userEmail = req.user?.email || req.body.userEmail;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'User email required' });
    }

    const result = await NotificationDAL.markAllAsRead(userEmail);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount || 0
    });
  } catch (error) {
    console.error('[Notification Read All Error]', error);
    res.status(500).json({ success: false, message: 'Server error updating notifications', error: error.message });
  }
}

// DELETE /api/notifications/:id
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email || req.query.userEmail;

    const deleted = await NotificationDAL.delete(id, userEmail);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification dismissed',
      data: deleted
    });
  } catch (error) {
    console.error('[Notification Delete Error]', error);
    res.status(500).json({ success: false, message: 'Server error dismissing notification', error: error.message });
  }
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};
