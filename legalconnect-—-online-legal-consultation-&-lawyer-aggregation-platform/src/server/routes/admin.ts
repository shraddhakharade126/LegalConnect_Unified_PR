import { Router, Request, Response } from 'express';
import { DataStore } from '../models/store.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

// All admin routes require 'admin' role
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/metrics - Platform Analytics
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await DataStore.getPlatformMetrics();
    res.json({ metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching metrics.' });
  }
});

// GET /api/admin/lawyers/pending - Verification Queue
router.get('/lawyers/pending', async (_req: Request, res: Response) => {
  try {
    const lawyers = await DataStore.getLawyers({ status: 'pending' });
    res.json({ pendingLawyers: lawyers });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching pending verifications.' });
  }
});

// PUT /api/admin/lawyers/:id/verify - Approve or Reject verification
router.put('/lawyers/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body; // decision: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      res.status(400).json({ error: "Decision must be 'approved' or 'rejected'." });
      return;
    }

    const lawyer = await DataStore.findLawyerById(id);
    if (!lawyer) {
      res.status(404).json({ error: 'Lawyer record not found.' });
      return;
    }

    const updated = await DataStore.updateLawyer(id, {
      verificationStatus: decision,
      verificationNotes: notes || (decision === 'approved' ? 'Verified by Admin Compliance Team.' : 'Application rejected.'),
    });

    // Notify lawyer
    await DataStore.createNotification({
      recipientId: lawyer.userId,
      title: decision === 'approved' ? 'Verification Approved!' : 'Verification Application Update',
      message:
        decision === 'approved'
          ? 'Congratulations! Your Bar council credentials have been approved. Your profile is now publicly visible in the directory.'
          : `Your verification application was rejected: ${notes || 'Please review your bar registration details.'}`,
      type: 'verification_update',
      link: '/profile-settings',
    });

    // Audit log
    await DataStore.createAuditLog({
      action: decision === 'approved' ? 'LAWYER_VERIFICATION_APPROVED' : 'LAWYER_VERIFICATION_REJECTED',
      actorId: req.user!.userId,
      actorName: req.user!.name,
      actorRole: 'admin',
      targetResource: 'lawyer',
      targetId: id,
      ipAddress: req.ip,
      details: {
        lawyerName: lawyer.barRegistrationNumber,
        decision,
        notes,
      },
    });

    res.json({
      lawyer: updated,
      message: `Lawyer status successfully updated to ${decision}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing verification.' });
  }
});

// GET /api/admin/users - User Management
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await DataStore.getAllUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching users.' });
  }
});

// PUT /api/admin/users/:id/status - Toggle User Active Status
router.put('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      res.status(400).json({ error: 'isActive boolean flag is required.' });
      return;
    }

    const targetUser = await DataStore.findUserById(id);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (targetUser.role === 'admin' && !isActive) {
      res.status(400).json({ error: 'Cannot deactivate an administrator account.' });
      return;
    }

    const updated = await DataStore.updateUser(id, { isActive });

    await DataStore.createAuditLog({
      action: isActive ? 'USER_ACCOUNT_REACTIVATED' : 'USER_ACCOUNT_SUSPENDED',
      actorId: req.user!.userId,
      actorName: req.user!.name,
      actorRole: 'admin',
      targetResource: 'user',
      targetId: id,
      ipAddress: req.ip,
      details: { targetEmail: targetUser.email, isActive },
    });

    res.json({
      user: updated,
      message: `User account has been ${isActive ? 'reactivated' : 'suspended'}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating user status.' });
  }
});

// GET /api/admin/audit-logs - Platform Audit Trail
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await DataStore.getAuditLogs(limit);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching audit logs.' });
  }
});

// POST /api/admin/categories - Create Category
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, description, icon = 'Scale', isPopular = false } = req.body;

    if (!name || !description) {
      res.status(400).json({ error: 'Category name and description are required.' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const domain = await DataStore.createDomain({
      name: name.trim(),
      slug,
      description: description.trim(),
      icon,
      isPopular: Boolean(isPopular),
      isActive: true,
    });

    await DataStore.createAuditLog({
      action: 'LEGAL_CATEGORY_CREATED',
      actorId: req.user!.userId,
      actorName: req.user!.name,
      actorRole: 'admin',
      targetResource: 'category',
      targetId: domain._id,
      ipAddress: req.ip,
      details: { name, slug },
    });

    res.status(201).json({
      domain,
      message: 'New legal category created successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating category.' });
  }
});

// PUT /api/admin/categories/:id - Update Category
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isPopular, isActive } = req.body;

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (description) updates.description = description.trim();
    if (icon) updates.icon = icon;
    if (isPopular !== undefined) updates.isPopular = Boolean(isPopular);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updated = await DataStore.updateDomain(id, updates);

    res.json({
      domain: updated,
      message: 'Category updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating category.' });
  }
});

export default router;
