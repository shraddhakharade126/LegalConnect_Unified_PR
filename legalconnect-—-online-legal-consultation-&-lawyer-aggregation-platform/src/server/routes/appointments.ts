import { Router, Request, Response } from 'express';
import { DataStore } from '../models/store.ts';
import { requireAuth, optionalAuth } from '../middleware/auth.ts';

const router = Router();

// GET /api/appointments or /api/appointments/client - List appointments
router.get(['/', '/client'], optionalAuth, async (req: Request, res: Response) => {
  try {
    const { status, date, lawyerId: queryLawyerId } = req.query;

    // If caller is not authenticated, only allow querying public booked slots for a specific lawyer
    if (!req.user) {
      if (queryLawyerId) {
        const publicAppointments = await DataStore.getAppointments({
          lawyerId: queryLawyerId as string,
          status: status as string,
          date: date as string,
        });
        // Sanitize to only return public scheduling attributes
        const sanitized = publicAppointments.map((a) => ({
          _id: a._id,
          lawyerId: a.lawyerId,
          appointmentDate: a.appointmentDate,
          startTime: a.startTime,
          endTime: a.endTime,
          status: a.status,
          consultationType: a.consultationType,
        }));
        res.json({ appointments: sanitized });
        return;
      }

      res.status(401).json({
        error: 'Authentication required. Please log in to access your consultations.',
      });
      return;
    }

    const { userId, role, lawyerId } = req.user;

    let appointments = [];
    if (role === 'admin') {
      appointments = await DataStore.getAppointments({
        status: status as string,
        date: date as string,
      });
    } else if (role === 'lawyer') {
      if (!lawyerId) {
        const l = await DataStore.findLawyerByUserId(userId);
        if (!l) {
          res.json({ appointments: [] });
          return;
        }
        appointments = await DataStore.getAppointments({
          lawyerId: l._id,
          status: status as string,
          date: date as string,
        });
      } else {
        appointments = await DataStore.getAppointments({
          lawyerId,
          status: status as string,
          date: date as string,
        });
      }
    } else {
      // client
      appointments = await DataStore.getAppointments({
        clientId: userId,
        status: status as string,
        date: date as string,
      });
    }

    res.json({ appointments });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching appointments.' });
  }
});

// GET /api/appointments/booked-slots - Public slot conflict inspection
router.get('/booked-slots', async (req: Request, res: Response) => {
  try {
    const { lawyerId, date } = req.query;
    if (!lawyerId || !date) {
      res.json({ bookedSlots: [] });
      return;
    }
    const appointments = await DataStore.getAppointments({
      lawyerId: lawyerId as string,
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

// GET /api/appointments/:id - Single consultation detail
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const appointment = await DataStore.findAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    // Role ownership check
    if (role !== 'admin' && appointment.clientId !== userId) {
      const lawyer = await DataStore.findLawyerByUserId(userId);
      if (!lawyer || lawyer._id !== appointment.lawyerId) {
        res.status(403).json({ error: 'Access denied. You are not a participant in this consultation.' });
        return;
      }
    }

    // Also fetch associated review if completed
    const reviews = await DataStore.getReviews(appointment.lawyerId);
    const existingReview = reviews.find((r) => r.consultationId === appointment._id);

    res.json({
      appointment,
      review: existingReview || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error retrieving appointment.' });
  }
});

// POST /api/appointments or /api/appointments/book - Client books appointment
router.post(['/', '/book'], requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      lawyerId,
      appointmentDate,
      startTime,
      consultationType = 'video',
      legalDomainId,
      legalDomainName,
      issueSummary,
      clientQuestions,
      aiBrief,
    } = req.body;

    const summary = (issueSummary || req.body.notes || req.body.reason || 'Legal consultation request').trim();

    if (!lawyerId || !appointmentDate || !startTime) {
      res.status(400).json({
        error: 'Lawyer ID, appointment date, and start time are required.',
      });
      return;
    }

    // Fetch lawyer
    const lawyer = await DataStore.findLawyerById(lawyerId);
    if (!lawyer) {
      res.status(404).json({ error: 'Selected lawyer was not found.' });
      return;
    }

    if (lawyer.verificationStatus !== 'approved') {
      res.status(400).json({
        error: 'This advocate is currently pending verification and cannot accept bookings yet.',
      });
      return;
    }

    if (!lawyer.isAcceptingNewClients) {
      res.status(400).json({
        error: 'This advocate is currently not accepting new consultations.',
      });
      return;
    }

    // Verify date is in the future or today
    const selectedDate = new Date(`${appointmentDate}T${startTime}`);
    if (isNaN(selectedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date or time format.' });
      return;
    }

    // Calculate endTime based on consultationDurationMinutes
    const durationMins = lawyer.consultationDurationMinutes || 45;
    const [hStr, mStr] = startTime.split(':');
    const startHour = parseInt(hStr, 10);
    const startMinute = parseInt(mStr, 10);
    const totalMinutes = startHour * 60 + startMinute + durationMins;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Conflict & Double-Booking Prevention Check
    const hasConflict = await DataStore.checkBookingConflict(lawyerId, appointmentDate, startTime);
    if (hasConflict) {
      res.status(409).json({
        error: `The slot at ${startTime} on ${appointmentDate} is already booked or requested. Please choose another time slot.`,
      });
      return;
    }

    const clientUser = await DataStore.findUserById(req.user!.userId);
    const lawyerUser = await DataStore.findUserById(lawyer.userId);

    const newAppointment = await DataStore.createAppointment({
      lawyerId,
      clientId: req.user!.userId,
      clientName: clientUser?.name || req.user!.name,
      clientEmail: clientUser?.email || req.user!.email,
      lawyerName: lawyerUser?.name || 'Verified Advocate',
      lawyerEmail: lawyerUser?.email || '',
      legalDomainId: legalDomainId || lawyer.primaryDomain,
      legalDomainName: legalDomainName || lawyer.primaryDomain,
      appointmentDate,
      startTime,
      endTime,
      status: 'confirmed', // Auto-confirmed or requested based on preference
      consultationType,
      fee: lawyer.consultationFee,
      paymentStatus: 'paid', // Demo flow processes consultation payment immediately
      issueSummary: summary,
      clientQuestions: Array.isArray(clientQuestions) ? clientQuestions : [],
      aiBrief: aiBrief || undefined,
      meetingLink:
        consultationType === 'video'
          ? `https://meet.legalconnect.org/room/lc-${Math.random().toString(36).substring(2, 9)}`
          : undefined,
    });

    // Notify lawyer
    await DataStore.createNotification({
      recipientId: lawyer.userId,
      title: 'New Consultation Booked',
      message: `${clientUser?.name} has booked a ${consultationType} session on ${appointmentDate} at ${startTime}.`,
      type: 'booking_request',
      link: `/consultations/${newAppointment._id}`,
    });

    // Notify client
    await DataStore.createNotification({
      recipientId: req.user!.userId,
      title: 'Consultation Confirmed',
      message: `Your appointment with ${lawyerUser?.name} is confirmed for ${appointmentDate} at ${startTime}.`,
      type: 'booking_confirmed',
      link: `/consultations/${newAppointment._id}`,
    });

    // Audit log
    await DataStore.createAuditLog({
      action: 'APPOINTMENT_BOOKED',
      actorId: req.user!.userId,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      targetResource: 'appointment',
      targetId: newAppointment._id,
      ipAddress: req.ip,
      details: {
        lawyerId,
        appointmentDate,
        startTime,
        fee: lawyer.consultationFee,
      },
    });

    res.status(201).json({
      appointment: newAppointment,
      message: 'Consultation appointment scheduled successfully.',
    });
  } catch (err: any) {
    console.error('Booking error:', err);
    res.status(500).json({ error: err.message || 'Error booking appointment.' });
  }
});

// PUT /api/appointments/:id/status - Update consultation status
router.put('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, lawyerNotes, actionItems } = req.body;
    const { userId, role } = req.user!;

    const appointment = await DataStore.findAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const lawyer = await DataStore.findLawyerByUserId(userId);
    const isOwnerLawyer = lawyer && lawyer._id === appointment.lawyerId;
    const isClient = appointment.clientId === userId;
    const isAdmin = role === 'admin';

    // Authorization checks
    if (!isOwnerLawyer && !isClient && !isAdmin) {
      res.status(403).json({ error: 'Unauthorized to update this consultation.' });
      return;
    }

    const updates: any = {};

    if (status) {
      // Clients can only cancel
      if (isClient && !isOwnerLawyer && !isAdmin) {
        if (status !== 'cancelled') {
          res.status(403).json({ error: 'Clients can only cancel their appointments.' });
          return;
        }
      }

      updates.status = status;
      if (status === 'cancelled' || status === 'rejected') {
        updates.cancellationReason = reason || 'Cancelled by participant.';
        updates.cancelledBy = req.user!.name;
        if (appointment.paymentStatus === 'paid') {
          updates.paymentStatus = 'refunded';
        }
      }
    }

    if (lawyerNotes !== undefined && (isOwnerLawyer || isAdmin)) {
      updates.lawyerNotes = lawyerNotes;
    }

    if (actionItems !== undefined && (isOwnerLawyer || isAdmin)) {
      updates.actionItems = Array.isArray(actionItems) ? actionItems : [];
    }

    const updated = await DataStore.updateAppointment(id, updates);

    // Notify counterpart
    const targetUserId = isClient ? (lawyer ? lawyer.userId : null) : appointment.clientId;
    if (targetUserId) {
      await DataStore.createNotification({
        recipientId: targetUserId,
        title: `Consultation ${status.toUpperCase()}`,
        message: `Your consultation on ${appointment.appointmentDate} at ${appointment.startTime} has been marked as ${status}.`,
        type: status === 'cancelled' ? 'booking_cancelled' : 'booking_confirmed',
        link: `/consultations/${id}`,
      });
    }

    // Audit log
    await DataStore.createAuditLog({
      action: `APPOINTMENT_${(status || 'UPDATED').toUpperCase()}`,
      actorId: userId,
      actorName: req.user!.name,
      actorRole: role,
      targetResource: 'appointment',
      targetId: id,
      ipAddress: req.ip,
      details: { previousStatus: appointment.status, newStatus: status, reason },
    });

    res.json({
      appointment: updated,
      message: `Consultation status updated to '${status}'.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating status.' });
  }
});

// GET /api/appointments/:id/messages - Fetch messages for consultation room
router.get('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const appointment = await DataStore.findAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const lawyer = await DataStore.findLawyerByUserId(userId);
    const isOwnerLawyer = lawyer && lawyer._id === appointment.lawyerId;
    const isClient = appointment.clientId === userId;
    const isAdmin = role === 'admin';

    if (!isOwnerLawyer && !isClient && !isAdmin) {
      res.status(403).json({ error: 'Unauthorized to view messages for this consultation.' });
      return;
    }

    const messages = await DataStore.getAppointmentMessages(id);
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching messages.' });
  }
});

// POST /api/appointments/:id/messages - Post secure consultation message
router.post('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, clientMessageId } = req.body;
    const { userId, role, name } = req.user!;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty.' });
      return;
    }

    const appointment = await DataStore.findAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const lawyer = await DataStore.findLawyerByUserId(userId);
    const isOwnerLawyer = lawyer && lawyer._id === appointment.lawyerId;
    const isClient = appointment.clientId === userId;
    const isAdmin = role === 'admin';

    if (!isOwnerLawyer && !isClient && !isAdmin) {
      res.status(403).json({ error: 'Unauthorized to send messages in this consultation.' });
      return;
    }

    const message = await DataStore.createAppointmentMessage({
      id: clientMessageId,
      consultationId: id,
      senderId: userId,
      senderName: name,
      senderRole: role,
      content: content.trim(),
      timestamp: Date.now(),
      read: false,
    });

    res.status(201).json({ message });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error sending message.' });
  }
});

export default router;
