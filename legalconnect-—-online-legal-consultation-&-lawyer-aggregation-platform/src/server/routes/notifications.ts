import { Router, Request, Response } from 'express';
import { DataStore } from '../models/store.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

// GET /api/notifications - Get all user's notifications
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const notifications = await DataStore.getNotifications(req.user!.userId);
    res.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await DataStore.markNotificationAsRead(id, req.user!.userId);
    if (!success) {
      res.status(404).json({ error: 'Notification not found or already read.' });
      return;
    }
    res.json({ message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating notification.' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const count = await DataStore.markAllNotificationsRead(req.user!.userId);
    res.json({ message: `${count} notifications marked as read.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error marking all notifications.' });
  }
});

export default router;
