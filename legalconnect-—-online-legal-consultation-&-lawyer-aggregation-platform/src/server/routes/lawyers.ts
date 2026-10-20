import { Router, Request, Response } from 'express';
import { DataStore } from '../models/store.ts';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.ts';

const router = Router();

// GET /api/lawyers/categories/list - Get all legal practice categories
router.get('/categories/list', async (_req: Request, res: Response) => {
  try {
    const domains = await DataStore.getAllDomains();
    res.json({ domains });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching categories.' });
  }
});

// GET /api/lawyers - Directory with search, filters, and sorting
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      domain,
      city,
      minExp,
      maxFee,
      minRating,
      search,
      sort,
      status,
    } = req.query;

    // By default, public directory only shows 'approved' verified lawyers
    let filterStatus = 'approved';
    if (status && req.user && req.user.role === 'admin') {
      filterStatus = status === 'all' ? '' : (status as string);
    }

    const lawyers = await DataStore.getLawyers({
      status: filterStatus,
      domain: domain as string,
      city: city as string,
      minExp: minExp ? Number(minExp) : undefined,
      maxFee: maxFee ? Number(maxFee) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      search: search as string,
      sort: sort as string,
    });

    res.json({
      lawyers,
      total: lawyers.length,
    });
  } catch (err: any) {
    console.error('Directory fetch error:', err);
    res.status(500).json({ error: err.message || 'Error fetching lawyer directory.' });
  }
});

// GET /api/lawyers/:id - Lawyer Profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lawyer = await DataStore.findLawyerById(id);
    if (!lawyer) {
      res.status(404).json({ error: 'Lawyer profile not found.' });
      return;
    }

    const user = await DataStore.findUserById(lawyer.userId);
    const availability = await DataStore.getAvailability(lawyer._id);
    const reviews = await DataStore.getReviews(lawyer._id);

    res.json({
      lawyer: {
        ...lawyer,
        name: user?.name || 'Verified Advocate',
        avatar: user?.avatar,
        email: user?.email,
        phone: user?.phone,
      },
      availability,
      reviews,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching lawyer details.' });
  }
});

// GET /api/lawyers/:id/availability - Get specific availability
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const availability = await DataStore.getAvailability(id);
    res.json({ availability });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching availability.' });
  }
});

// GET /api/lawyers/:id/booked-slots - Public endpoint for checking taken time slots on a date
router.get('/:id/booked-slots', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) {
      res.json({ bookedSlots: [] });
      return;
    }
    const appointments = await DataStore.getAppointments({
      lawyerId: id,
      date: date as string,
    });
    const taken = appointments
      .filter((a) => ['requested', 'confirmed', 'in_progress'].includes(a.status))
      .map((a) => a.startTime);
    res.json({ bookedSlots: taken });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching booked slots.' });
  }
});

// PUT /api/lawyers/profile - Update lawyer's own profile
router.put('/profile', requireAuth, requireRole('lawyer'), async (req: Request, res: Response) => {
  try {
    const lawyer = await DataStore.findLawyerByUserId(req.user!.userId);
    if (!lawyer) {
      res.status(404).json({ error: 'Lawyer record not found for this account.' });
      return;
    }

    const {
      bio,
      consultationFee,
      consultationDurationMinutes,
      practiceAreas,
      primaryDomain,
      city,
      state,
      officeAddress,
      languages,
      courtAdmissions,
      isAcceptingNewClients,
    } = req.body;

    const updates: any = {};
    if (bio !== undefined) updates.bio = bio.trim();
    if (consultationFee !== undefined) updates.consultationFee = Number(consultationFee);
    if (consultationDurationMinutes !== undefined)
      updates.consultationDurationMinutes = Number(consultationDurationMinutes);
    if (practiceAreas !== undefined) updates.practiceAreas = practiceAreas;
    if (primaryDomain !== undefined) updates.primaryDomain = primaryDomain.trim();
    if (city !== undefined) updates.city = city.trim();
    if (state !== undefined) updates.state = state.trim();
    if (officeAddress !== undefined) updates.officeAddress = officeAddress.trim();
    if (languages !== undefined) updates.languages = languages;
    if (courtAdmissions !== undefined) updates.courtAdmissions = courtAdmissions;
    if (isAcceptingNewClients !== undefined) updates.isAcceptingNewClients = Boolean(isAcceptingNewClients);

    const updatedLawyer = await DataStore.updateLawyer(lawyer._id, updates);

    await DataStore.createAuditLog({
      action: 'LAWYER_PROFILE_UPDATED',
      actorId: req.user!.userId,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      targetResource: 'lawyer',
      targetId: lawyer._id,
      ipAddress: req.ip,
    });

    res.json({
      lawyer: updatedLawyer,
      message: 'Lawyer profile updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating profile.' });
  }
});

// PUT /api/lawyers/availability - Update lawyer's availability schedule
router.put('/availability', requireAuth, requireRole('lawyer'), async (req: Request, res: Response) => {
  try {
    const lawyer = await DataStore.findLawyerByUserId(req.user!.userId);
    if (!lawyer) {
      res.status(404).json({ error: 'Lawyer profile not found.' });
      return;
    }

    const { slots } = req.body;
    if (!Array.isArray(slots)) {
      res.status(400).json({ error: 'Availability slots array is required.' });
      return;
    }

    const updatedSlots = await DataStore.setAvailability(lawyer._id, slots);

    await DataStore.createAuditLog({
      action: 'LAWYER_AVAILABILITY_UPDATED',
      actorId: req.user!.userId,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      targetResource: 'availability',
      targetId: lawyer._id,
      ipAddress: req.ip,
    });

    res.json({
      availability: updatedSlots,
      message: 'Weekly availability updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating availability.' });
  }
});

export default router;
