# LegalConnect — Online Legal Consultation & Lawyer Aggregation Platform

> **Deliverable Status:** Complete & Verified for Submission.  
> Detailed Requirements Traceability Matrix & Evaluation Guide available in [`PROJECT_REPORT.md`](./PROJECT_REPORT.md).

LegalConnect is a full-stack legal consultation marketplace connecting clients with verified advocates and licensed attorneys. It features real-time conflict-free appointment booking, privileged document repositories, case management timelines, verified client reviews, compliance administration, and AI-powered pre-consultation intake briefings.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend**: Node.js, Express.js with RESTful APIs.
- **Database & ODM**: MongoDB Atlas with Mongoose models, indexes, and a dual-backed fallback data store for instant offline/dev execution.
- **Authentication & Security**: JSON Web Tokens (JWT) signed with HMAC-SHA256, password hashing using `bcryptjs`, and role-based access control (RBAC).
- **AI Consultation Organizer**: Google Gemini API (`@google/genai` with `gemini-3.8-flash`) for informational pre-consultation intake summarization and question preparation (with explicit client consent).

---

## Role Permissions Overview

1. **Client**:
   - Register, log in, manage personal profile.
   - Search & filter verified advocates by practice area, jurisdiction/city, experience, fee, and rating.
   - Reserve real-time consultation slots with automatic double-booking prevention.
   - Upload and access privileged case documents in the Document Centre.
   - Access meeting rooms, track consultation milestones, and post verified reviews.
   - Use the optional Gemini AI pre-consultation matter organizer.

2. **Lawyer / Advocate**:
   - Register with State Bar Council enrollment credentials and verification documents.
   - Status defaults to `pending` until audited and approved by Compliance Admin.
   - Manage practice rates ($ per session) and duration (30/45/60 min).
   - Configure weekly availability windows and blocked dates.
   - Accept or decline incoming booking requests.
   - Conduct consultations, manage confidential lawyer notes, and assign client action items.

3. **Admin (Compliance Officer)**:
   - Audit advocate applications in the Lawyer Verification Queue; approve or reject with audit notes.
   - Manage all platform accounts (activate/suspend).
   - Manage practice areas and legal categories.
   - Inspect live security & action audit logs.
   - Monitor aggregate platform metrics and consultation volume.

---

## Quick Start & Setup

### 1. Prerequisites
- Node.js 18+ and npm installed.
- (Optional) MongoDB Atlas free cluster connection string. If not configured, the app operates with its built-in persistent in-memory Mongoose store.

### 2. Environment Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the following variables in `.env`:
```env
# MongoDB Atlas Connection String
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/legalconnect?retryWrites=true&w=majority"

# JWT Secret (Generate a secure secret: openssl rand -base64 32)
JWT_SECRET="your_secure_256_bit_secret_key_here"

# (Optional) Gemini API Key for client intake prep
GEMINI_API_KEY="your_gemini_api_key"

# Port (defaults to 3000)
PORT=3000
NODE_ENV="development"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Initial Demo Data
Populate demo users, verified advocates, categories, and test consultations:
```bash
npm run seed
```

### 5. Run Automated Tests
Execute unit and integration tests for authentication, role permissions, and double-booking conflict prevention:
```bash
npm test
```

### 6. Start the Application
Run the full-stack server (Express + Vite on Port 3000):
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Pre-Configured Demo Accounts

For immediate evaluation, you can switch roles with 1 click using the sticky **Demo Sandbox Bar** at the top of the screen, or log in with these credentials:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@legalconnect.com` | `AdminPass123!` | Chief Compliance Officer (Full admin access) |
| **Lawyer (Corporate)** | `rajesh.lawyer@example.com` | `LawyerPass123!` | Adv. Rajesh Sharma, 16 yrs exp, NY Bar (Verified) |
| **Lawyer (IP & Tech)** | `elena.lawyer@example.com` | `LawyerPass123!` | Adv. Elena Rostova, 12 yrs exp, CA Bar (Verified) |
| **Lawyer (Pending)** | `fatima.lawyer@example.com` | `LawyerPass123!` | Adv. Fatima Zahra (Pending audit queue demo) |
| **Client** | `client.sarah@example.com` | `ClientPass123!` | Sarah Jenkins (Upcoming & completed sessions) |
| **Client** | `client.michael@example.com` | `ClientPass123!` | Michael Torres |

---

## Database Models & Indexes

- **User**: Name, email (unique), passwordHash, role (`client` | `lawyer` | `admin`), phone, city, isActive.
- **Lawyer**: `userId` (unique), barRegistrationNumber (indexed), barCouncilState, yearOfAdmission, verificationStatus (`pending` | `approved` | `rejected`), practiceAreas, primaryDomain, consultationFee, rating.
- **LegalDomain**: Practice areas with unique slug and active status.
- **Availability**: Weekly schedule per lawyer (`dayOfWeek`, `startTime`, `endTime`, `slotDurationMinutes`, `blockedDates`).
- **Appointment / Consultation**: Compound index on `(lawyerId, appointmentDate, startTime)` to prevent scheduling conflicts and double-booking.
- **LegalDocument**: Title, documentType, confidentialityLevel (`lawyer_client_only`, `confidential`, `admin_only`), ownership checks.
- **Review**: `consultationId` (unique), `lawyerId`, client rating, comments, verified status, lawyer reply.
- **Notification**: User alert inbox with read/unread flags.
- **AuditLog**: Platform security audit trail.

---

## Security & Compliance Safeguards

- Passwords are encrypted using salted `bcryptjs` hashes. Plaintext passwords are never stored or logged.
- All consultation endpoints enforce role and ownership checks (clients and lawyers can only access sessions they participate in).
- Video and payment interfaces provide clear integration boundaries and do not pretend external third-party services are active if unconfigured.
- AI intake briefing explicitly states it is an informational preparation tool and not qualified legal advice.
