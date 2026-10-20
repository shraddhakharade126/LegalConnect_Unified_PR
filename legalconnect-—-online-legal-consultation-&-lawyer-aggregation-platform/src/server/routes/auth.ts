import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { DataStore } from '../models/store.ts';
import { generateToken, requireAuth } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role = 'client',
      phone,
      city,
      // Lawyer specific fields
      barRegistrationNumber,
      barCouncilState,
      yearOfAdmission,
      primaryDomain,
      practiceAreas,
      bio,
      education,
      experienceYears,
      consultationFee,
      consultationDurationMinutes,
      languages,
      courtAdmissions,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required fields.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existingUser = await DataStore.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Role validation
    const validRole = role === 'lawyer' ? 'lawyer' : 'client';

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user record
    const user = await DataStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: validRole,
      phone: phone?.trim(),
      city: city?.trim(),
    });

    let lawyer: any = null;
    if (validRole === 'lawyer') {
      if (!barRegistrationNumber || !barCouncilState || !primaryDomain) {
        res.status(400).json({
          error:
            'Bar registration number, bar council state, and primary practice domain are required for lawyer registration.',
        });
        return;
      }

      lawyer = await DataStore.createLawyer({
        userId: user._id,
        barRegistrationNumber: barRegistrationNumber.trim(),
        barCouncilState: barCouncilState.trim(),
        yearOfAdmission: Number(yearOfAdmission) || new Date().getFullYear() - 1,
        verificationStatus: 'pending',
        verificationNotes: 'Application submitted. Under review by LegalConnect Compliance Team.',
        verificationDocuments: [
          {
            title: 'Bar Council Enrollment Certificate',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          },
        ],
        practiceAreas: Array.isArray(practiceAreas)
          ? practiceAreas
          : [primaryDomain, 'General Legal Consultation'],
        primaryDomain: primaryDomain.trim(),
        bio:
          bio?.trim() ||
          `Dedicated advocate practicing in ${barCouncilState}. Committed to providing clear, actionable counsel.`,
        education: education?.trim() || 'LL.B. (Honours)',
        experienceYears: Number(experienceYears) || 3,
        consultationFee: Number(consultationFee) || 100,
        consultationDurationMinutes: Number(consultationDurationMinutes) || 45,
        city: city?.trim() || 'New York',
        state: barCouncilState.trim(),
        languages: Array.isArray(languages) ? languages : ['English'],
        courtAdmissions: Array.isArray(courtAdmissions) ? courtAdmissions : ['District Court'],
        rating: 5.0,
        reviewCount: 0,
        isAcceptingNewClients: true,
        isDemo: false,
      });

      // Default availability setup for Monday - Friday (09:00 - 17:00)
      const defaultSlots = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: lawyer.consultationDurationMinutes || 45,
        isAvailable: true,
      }));
      await DataStore.setAvailability(lawyer._id, defaultSlots);

      // Notify admin
      await DataStore.createNotification({
        recipientId: 'admin_user_seed',
        title: 'New Lawyer Verification Request',
        message: `${name} has applied with Bar Reg: ${barRegistrationNumber} (${barCouncilState}). Verification pending.`,
        type: 'verification_update',
        link: '/admin',
      });
    }

    // Create welcome notification
    await DataStore.createNotification({
      recipientId: user._id,
      title: 'Welcome to LegalConnect!',
      message:
        validRole === 'lawyer'
          ? 'Your lawyer account has been created. Our compliance team is verifying your Bar credentials.'
          : 'Your client account is ready. Browse verified legal practitioners and schedule your first consultation.',
      type: 'system',
      link: validRole === 'lawyer' ? '/lawyer-dashboard' : '/lawyers',
    });

    // Audit log
    await DataStore.createAuditLog({
      action: 'USER_REGISTERED',
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      targetResource: 'user',
      targetId: user._id,
      ipAddress: req.ip,
      details: { role: user.role, email: user.email },
    });

    const token = generateToken({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      lawyerId: lawyer?._id,
    });

    const { passwordHash: _, ...userSafe } = user;
    res.status(201).json({
      token,
      user: userSafe,
      lawyer,
      message: 'Account successfully registered.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await DataStore.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'This account has been deactivated. Please contact platform administration.',
      });
      return;
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Update last login
    await DataStore.updateUser(user._id, { lastLogin: new Date() });

    let lawyer = null;
    if (user.role === 'lawyer') {
      lawyer = await DataStore.findLawyerByUserId(user._id);
    }

    // Audit log
    await DataStore.createAuditLog({
      action: 'USER_LOGIN',
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      targetResource: 'auth',
      ipAddress: req.ip,
    });

    const token = generateToken({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      lawyerId: lawyer?._id,
    });

    const { passwordHash: _, ...userSafe } = user;
    res.json({
      token,
      user: userSafe,
      lawyer,
      message: 'Login successful.',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await DataStore.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    let lawyer = null;
    if (user.role === 'lawyer') {
      lawyer = await DataStore.findLawyerByUserId(user._id);
    }

    const { passwordHash: _, ...userSafe } = user;
    res.json({
      user: userSafe,
      lawyer,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching user profile.' });
  }
});

// POST /api/auth/demo-login - Quick Switcher for seamless demonstration
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const { role } = req.body; // 'client' | 'lawyer' | 'admin'

    let user = null;
    if (role === 'admin') {
      user = await DataStore.findUserByEmail('admin@legalconnect.com');
    } else if (role === 'lawyer') {
      user = await DataStore.findUserByEmail('rajesh.lawyer@example.com');
      if (!user) {
        const allUsers = await DataStore.getAllUsers();
        user = allUsers.find((u) => u.role === 'lawyer') || null;
      }
    } else {
      user =
        (await DataStore.findUserByEmail('client@legalconnect.com')) ||
        (await DataStore.findUserByEmail('client.sarah@example.com'));
      if (!user) {
        const allUsers = await DataStore.getAllUsers();
        user = allUsers.find((u) => u.role === 'client') || null;
      }
    }

    // If still no user exists for this role, auto-generate a valid user
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('ClientPass123!', salt);
      user = await DataStore.createUser({
        name: role === 'lawyer' ? 'Adv. Default Legal Counsel' : 'Verified Client',
        email: `${role}@legalconnect.com`,
        passwordHash,
        role,
        phone: '+1 (555) 019-2834',
        city: 'New York',
      });
      if (role === 'lawyer') {
        await DataStore.createLawyer({
          userId: user._id,
          barRegistrationNumber: 'NY-BAR-2016-99211',
          barCouncilState: 'New York',
          yearOfAdmission: 2016,
          verificationStatus: 'approved',
          primaryDomain: 'Corporate & Commercial',
          practiceAreas: ['Corporate & Commercial'],
          consultationFee: 150,
          consultationDurationMinutes: 45,
          rating: 5.0,
          reviewCount: 1,
        });
      }
    }

    let lawyer = null;
    if (user.role === 'lawyer') {
      lawyer = await DataStore.findLawyerByUserId(user._id);
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      lawyerId: lawyer?._id,
    });

    const { passwordHash: _, ...userSafe } = user;
    res.json({
      token,
      user: userSafe,
      lawyer,
      message: `Switched to demo ${role} profile: ${user.name}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing demo login.' });
  }
});

export default router;
