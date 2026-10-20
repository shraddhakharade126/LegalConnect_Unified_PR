import { Router, Request, Response } from 'express';
import { DataStore } from '../models/store.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

// GET /api/documents - List permitted documents
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role, lawyerId } = req.user!;
    let lId = lawyerId;
    if (role === 'lawyer' && !lId) {
      const l = await DataStore.findLawyerByUserId(userId);
      lId = l?._id;
    }

    const docs = await DataStore.getDocumentsForUser(userId, role, lId);
    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching documents.' });
  }
});

// POST /api/documents or /api/documents/upload - Upload new document
router.post(['/', '/upload'], requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      documentType = 'case_file',
      fileType = 'application/pdf',
      fileSize = 102400,
      fileData,
      confidentialityLevel = 'lawyer_client_only',
      relatedAppointmentId,
      relatedLawyerId,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Document title is required.' });
      return;
    }

    const { userId, name, role } = req.user!;

    // If relatedAppointmentId is supplied, verify relation
    let relLawyerId = relatedLawyerId;
    let relClientId = userId;

    if (relatedAppointmentId) {
      const apt = await DataStore.findAppointmentById(relatedAppointmentId);
      if (apt) {
        relLawyerId = apt.lawyerId;
        relClientId = apt.clientId;
      }
    }

    const newDoc = await DataStore.createDocument({
      title: title.trim(),
      description: description?.trim(),
      documentType,
      fileType,
      fileSize: Number(fileSize) || 150000,
      fileData:
        fileData ||
        'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1OSAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJwrSi0uVkjLz0stUrC1VTA0tTAyUDA0NFAwsVAIzy/KSVEoSi3NyVHQ5VKw1dPVVVBwtgUAq/QMNwplbmRzdHJlYW0KZW5kb2Jq',
      confidentialityLevel,
      uploadedBy: userId,
      uploadedByName: name,
      uploadedByRole: role,
      relatedAppointmentId,
      relatedLawyerId: relLawyerId,
      relatedClientId: relClientId,
    });

    // Audit log
    await DataStore.createAuditLog({
      action: 'DOCUMENT_UPLOADED',
      actorId: userId,
      actorName: name,
      actorRole: role,
      targetResource: 'document',
      targetId: newDoc._id,
      ipAddress: req.ip,
      details: { title: newDoc.title, documentType: newDoc.documentType },
    });

    res.status(201).json({
      document: newDoc,
      message: 'Legal document uploaded securely.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error uploading document.' });
  }
});

// GET /api/documents/:id - Get specific document
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await DataStore.findDocumentById(id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    const { userId, role } = req.user!;

    // Check ownership & role permission
    let hasAccess = false;
    if (role === 'admin') {
      hasAccess = true;
    } else if (doc.uploadedBy === userId) {
      hasAccess = true;
    } else if (doc.confidentialityLevel === 'lawyer_client_only') {
      if (role === 'lawyer') {
        const l = await DataStore.findLawyerByUserId(userId);
        if (l && doc.relatedLawyerId === l._id) hasAccess = true;
      } else if (role === 'client' && doc.relatedClientId === userId) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this confidential document.' });
      return;
    }

    res.json({ document: doc });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error retrieving document.' });
  }
});

export default router;
