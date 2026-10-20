import { Router, Request, Response } from 'express';
import { getDbStatus } from '../config/db.ts';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  const db = getDbStatus();
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim() !== ''
  );

  res.json({
    status: 'healthy',
    version: '1.0.0',
    platform: 'LegalConnect — Online Legal Consultation & Lawyer Aggregation Platform',
    database: {
      connected: db.connected,
      mode: db.type,
      databaseName: db.databaseName,
      error: db.error,
    },
    aiIntegration: {
      geminiConfigured: hasGeminiKey,
      model: 'gemini-3.8-flash',
    },
    demoAccounts: [
      { role: 'Admin', email: 'admin@legalconnect.com', password: 'AdminPass123!' },
      { role: 'Client', email: 'client@legalconnect.com', password: 'ClientPass123!' },
      { role: 'Client (Sarah)', email: 'client.sarah@example.com', password: 'ClientPass123!' },
      { role: 'Lawyer (Corporate)', email: 'rajesh.lawyer@example.com', password: 'LawyerPass123!' },
      { role: 'Lawyer (IP & Tech)', email: 'elena.lawyer@example.com', password: 'LawyerPass123!' },
      { role: 'Lawyer (Criminal)', email: 'marcus.lawyer@example.com', password: 'LawyerPass123!' },
      { role: 'Lawyer (Family)', email: 'maya.lawyer@example.com', password: 'LawyerPass123!' },
      { role: 'Lawyer (Real Estate)', email: 'david.lawyer@example.com', password: 'LawyerPass123!' },
      { role: 'Lawyer (Cyber Law)', email: 'priya.lawyer@example.com', password: 'LawyerPass123!' },
    ],
  });
});

export default router;
