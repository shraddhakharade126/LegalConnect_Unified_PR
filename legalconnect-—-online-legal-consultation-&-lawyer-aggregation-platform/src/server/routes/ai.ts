import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

// POST /api/ai/legal-brief - Client legal issue summarizer & question organizer
router.post('/legal-brief', requireAuth, async (req: Request, res: Response) => {
  try {
    const { situationDescription, practiceArea, clientConsentAccepted } = req.body;

    if (!situationDescription || !situationDescription.trim()) {
      res.status(400).json({ error: 'Please provide a description of your situation or legal question.' });
      return;
    }

    if (!clientConsentAccepted) {
      res.status(400).json({
        error:
          'Consent required: You must acknowledge that this AI assistant provides pre-consultation organizational summaries only, not qualified legal advice.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API key is configured, call Gemini
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `You are an expert legal consultation intake assistant. Your role is strictly to help a client organize their thoughts and prepare questions before they meet with their qualified lawyer.

Client's Practice Area: ${practiceArea || 'General Legal Inquiry'}
Client's Situation Description:
"${situationDescription}"

CRITICAL MANDATORY INSTRUCTIONS:
1. DO NOT provide definitive legal advice, predictions of trial outcomes, or conclusions of guilt/liability.
2. Structure your response into clean, practical sections:
   - Brief Issue Summary (2-3 sentences framing the situation for the lawyer)
   - Key Facts & Timelines to Clarify (bullet points of crucial missing facts the lawyer will ask about)
   - 5 Essential Questions for the Lawyer (sharp, well-crafted questions the client should ask)
   - Recommended Documents to Bring (contracts, notices, emails, payment slips, records)
3. Keep the tone calm, objective, empathetic, and professional.
4. Conclude with the mandatory disclaimer: "This summary is an organizational aid for your consultation and does not constitute formal legal counsel. Only an admitted advocate can provide legal advice for your jurisdiction."`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const text = response.text || '';

        res.json({
          brief: text,
          isAiGenerated: true,
          disclaimer:
            'Informational consultation preparation aid only. Not formal legal advice or an attorney-client relationship.',
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to rule-based briefing:', geminiError.message);
      }
    }

    // Graceful fallback when Gemini API key is not present or rate limited
    const sanitizedTopic = practiceArea || 'General Law';
    const fallbackBrief = `### Consultation Issue Outline (${sanitizedTopic})

**Summary of Matter:**
Based on your inquiry, this matter concerns ${sanitizedTopic.toLowerCase()} considerations. To make your consultation as productive as possible, your lawyer will need an objective chronology of events and all relevant communications.

**Key Facts & Timeline to Clarify:**
• Precise dates and key timeline of events relating to this issue
• Names, titles, and legal capacities of all parties involved
• Any written agreements, notices, or digital communications exchanged
• Any financial damages, pending deadlines, or active court notices

**Recommended Questions for Your Advocate:**
1. What are the applicable statutory provisions and procedural requirements in my jurisdiction?
2. What are the immediate risks, statute of limitations, or deadlines I must observe?
3. What documents or evidentiary proof do you recommend I compile next?
4. What are the realistic options (negotiation, formal legal notice, mediation, or court litigation)?
5. What is the estimated timeline and fee structure for ongoing representation?

**Essential Documents to Bring to Your Session:**
• Government-issued identification
• Any relevant contracts, agreements, letters, or formal notices
• Email/messaging transcripts and timestamps
• Proof of payments, invoices, or financial transaction logs

---
*Notice: This summary is an informational preparation guide for your consultation and does not constitute formal legal counsel.*`;

    res.json({
      brief: fallbackBrief,
      isAiGenerated: false,
      disclaimer:
        'Informational consultation preparation aid only. Not formal legal advice or an attorney-client relationship.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing legal briefing.' });
  }
});

export default router;
