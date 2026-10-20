import { Router, Request, Response } from 'express';
import { DataStore } from '../models/store.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

// GET /api/reviews - List reviews
router.get('/', async (req: Request, res: Response) => {
  try {
    const { lawyerId } = req.query;
    const reviews = await DataStore.getReviews(lawyerId as string);
    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching reviews.' });
  }
});

// POST /api/reviews - Client submits review for a completed consultation
router.post('/', requireAuth, requireRole('client'), async (req: Request, res: Response) => {
  try {
    const { consultationId, rating, title, comment } = req.body;

    if (!consultationId || !rating || !comment) {
      res.status(400).json({
        error: 'Consultation ID, rating (1-5), and review comments are required.',
      });
      return;
    }

    const reviewTitle = (title && typeof title === 'string' && title.trim())
      ? title.trim()
      : 'Client Legal Consultation Review';

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    const consultation = await DataStore.findAppointmentById(consultationId);
    if (!consultation) {
      res.status(404).json({ error: 'Consultation not found.' });
      return;
    }

    if (consultation.clientId !== req.user!.userId) {
      res.status(403).json({ error: 'You can only review consultations you attended.' });
      return;
    }

    if (consultation.status !== 'completed' && consultation.status !== 'confirmed') {
      res.status(400).json({
        error: 'Only confirmed or completed consultations can be reviewed.',
      });
      return;
    }

    // Check if already reviewed
    const existing = await DataStore.getReviews(consultation.lawyerId);
    if (existing.some((r) => r.consultationId === consultationId)) {
      res.status(409).json({ error: 'This consultation has already been reviewed.' });
      return;
    }

    const review = await DataStore.createReview({
      consultationId,
      lawyerId: consultation.lawyerId,
      clientId: req.user!.userId,
      clientName: req.user!.name,
      rating: numRating,
      title: reviewTitle,
      comment: comment.trim(),
      isVerifiedConsultation: true,
    });

    await DataStore.updateAppointment(consultationId, { reviewedByClient: true });

    // Notify lawyer
    const lawyer = await DataStore.findLawyerById(consultation.lawyerId);
    if (lawyer) {
      await DataStore.createNotification({
        recipientId: lawyer.userId,
        title: 'New Client Review Received',
        message: `${req.user!.name} rated your consultation ${numRating}/5: "${title}"`,
        type: 'review_received',
        link: '/reviews',
      });
    }

    // Audit log
    await DataStore.createAuditLog({
      action: 'REVIEW_SUBMITTED',
      actorId: req.user!.userId,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      targetResource: 'review',
      targetId: review._id,
      ipAddress: req.ip,
      details: { lawyerId: consultation.lawyerId, rating: numRating },
    });

    res.status(201).json({
      review,
      message: 'Thank you for your feedback! Your verified review has been published.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error submitting review.' });
  }
});

// POST /api/reviews/:id/reply - Lawyer replies to a review
router.post('/:id/reply', requireAuth, requireRole('lawyer'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      res.status(400).json({ error: 'Reply text cannot be empty.' });
      return;
    }

    const reviews = await DataStore.getReviews();
    const review = reviews.find((r) => r._id === id);
    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    const lawyer = await DataStore.findLawyerByUserId(req.user!.userId);
    if (!lawyer || lawyer._id !== review.lawyerId) {
      res.status(403).json({ error: 'You can only reply to reviews on your own profile.' });
      return;
    }

    review.lawyerReply = reply.trim();
    review.lawyerRepliedAt = new Date();

    res.json({
      review,
      message: 'Reply posted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error posting review reply.' });
  }
});

export default router;
