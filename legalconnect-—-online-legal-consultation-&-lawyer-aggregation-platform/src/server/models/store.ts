import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel, IUser, UserRole } from './User.ts';
import { LawyerModel, ILawyer } from './Lawyer.ts';
import { LegalDomainModel, ILegalDomain } from './LegalDomain.ts';
import { AvailabilityModel, IAvailabilitySlot } from './Availability.ts';
import { AppointmentModel, IAppointment, AppointmentStatus } from './Appointment.ts';
import { DocumentModel, ILegalDocument } from './Document.ts';
import { ReviewModel, IReview } from './Review.ts';
import { NotificationModel, INotification } from './Notification.ts';
import { AuditLogModel, IAuditLog } from './AuditLog.ts';

import fs from 'fs';
import path from 'path';

// Local disk-backed file storage path for durability across server reloads
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'local_db.json');

// In-Memory collections fallback storage
const memoryStore = {
  users: new Map<string, any>(),
  lawyers: new Map<string, any>(),
  legalDomains: new Map<string, any>(),
  availability: new Map<string, any>(),
  appointments: new Map<string, any>(),
  documents: new Map<string, any>(),
  reviews: new Map<string, any>(),
  notifications: new Map<string, any>(),
  auditLogs: new Map<string, any>(),
  messages: new Map<string, any>(),
};

// Load saved data from disk on startup
function loadFromDisk(): void {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data) {
        if (Array.isArray(data.users)) data.users.forEach((u: any) => memoryStore.users.set(u._id || u.id, u));
        if (Array.isArray(data.lawyers)) data.lawyers.forEach((l: any) => memoryStore.lawyers.set(l._id || l.id, l));
        if (Array.isArray(data.legalDomains)) data.legalDomains.forEach((d: any) => memoryStore.legalDomains.set(d._id || d.id, d));
        if (Array.isArray(data.availability)) data.availability.forEach((a: any) => memoryStore.availability.set(a.lawyerId, a.slots));
        if (Array.isArray(data.appointments)) data.appointments.forEach((apt: any) => memoryStore.appointments.set(apt._id || apt.id, apt));
        if (Array.isArray(data.documents)) data.documents.forEach((doc: any) => memoryStore.documents.set(doc._id || doc.id, doc));
        if (Array.isArray(data.reviews)) data.reviews.forEach((r: any) => memoryStore.reviews.set(r._id || r.id, r));
        if (Array.isArray(data.notifications)) data.notifications.forEach((n: any) => memoryStore.notifications.set(n._id || n.id, n));
        if (Array.isArray(data.auditLogs)) data.auditLogs.forEach((al: any) => memoryStore.auditLogs.set(al._id || al.id, al));
        if (Array.isArray(data.messages)) data.messages.forEach((m: any) => memoryStore.messages.set(m.id || m._id, m));
      }
    }
  } catch (err) {
    // Graceful startup if file not yet created
  }
}

// Initial load
loadFromDisk();

export function persistToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized = {
      users: Array.from(memoryStore.users.values()),
      lawyers: Array.from(memoryStore.lawyers.values()),
      legalDomains: Array.from(memoryStore.legalDomains.values()),
      availability: Array.from(memoryStore.availability.entries()).map(([lawyerId, slots]) => ({ lawyerId, slots })),
      appointments: Array.from(memoryStore.appointments.values()),
      documents: Array.from(memoryStore.documents.values()),
      reviews: Array.from(memoryStore.reviews.values()),
      notifications: Array.from(memoryStore.notifications.values()),
      auditLogs: Array.from(memoryStore.auditLogs.values()),
      messages: Array.from(memoryStore.messages.values()),
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(serialized, null, 2), 'utf-8');
  } catch (_err) {
    // Graceful disk storage fallback
  }
}

function isMongooseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function generateId(): string {
  return new mongoose.Types.ObjectId().toString();
}

export const DataStore = {
  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  async findUserByEmail(email: string): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongooseConnected()) {
      return await UserModel.findOne({ email: cleanEmail }).lean();
    }
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        return { ...u };
      }
    }
    return null;
  },

  async findUserById(id: string): Promise<any | null> {
    if (isMongooseConnected()) {
      return await UserModel.findById(id).lean();
    }
    const u = memoryStore.users.get(id);
    return u ? { ...u } : null;
  },

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    phone?: string;
    city?: string;
    avatar?: string;
  }): Promise<any> {
    const cleanEmail = data.email.toLowerCase().trim();
    if (isMongooseConnected()) {
      const doc = await UserModel.create({
        ...data,
        email: cleanEmail,
      });
      return doc.toObject();
    }
    // Check uniqueness
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        throw new Error('Email is already registered');
      }
    }
    const id = generateId();
    const now = new Date();
    const newUser = {
      _id: id,
      id,
      name: data.name,
      email: cleanEmail,
      passwordHash: data.passwordHash,
      role: data.role,
      phone: data.phone || '',
      city: data.city || '',
      avatar:
        data.avatar ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.users.set(id, newUser);
    persistToDisk();
    return { ...newUser };
  },

  async updateUser(id: string, updates: Partial<IUser>): Promise<any | null> {
    if (isMongooseConnected()) {
      return await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    }
    const user = memoryStore.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    memoryStore.users.set(id, updated);
    persistToDisk();
    return { ...updated };
  },

  async getAllUsers(): Promise<any[]> {
    if (isMongooseConnected()) {
      return await UserModel.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    }
    return Array.from(memoryStore.users.values())
      .map((u) => {
        const { passwordHash, ...rest } = u;
        return rest;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // -------------------------------------------------------------
  // LAWYERS
  // -------------------------------------------------------------
  async createLawyer(data: any): Promise<any> {
    if (isMongooseConnected()) {
      const doc = await LawyerModel.create(data);
      return doc.toObject();
    }
    const id = generateId();
    const now = new Date();
    const lawyer = {
      _id: id,
      id,
      ...data,
      rating: data.rating !== undefined ? data.rating : 5.0,
      reviewCount: data.reviewCount || 0,
      isAcceptingNewClients: data.isAcceptingNewClients ?? true,
      isDemo: data.isDemo ?? false,
      verificationStatus: data.verificationStatus || 'pending',
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.lawyers.set(id, lawyer);
    persistToDisk();
    return { ...lawyer };
  },

  async findLawyerById(id: string): Promise<any | null> {
    if (isMongooseConnected()) {
      return await LawyerModel.findById(id).lean();
    }
    const l = memoryStore.lawyers.get(id);
    return l ? { ...l } : null;
  },

  async findLawyerByUserId(userId: string): Promise<any | null> {
    if (isMongooseConnected()) {
      return await LawyerModel.findOne({ userId }).lean();
    }
    for (const l of memoryStore.lawyers.values()) {
      if (l.userId === userId) {
        return { ...l };
      }
    }
    return null;
  },

  async getLawyers(filters: {
    status?: string;
    domain?: string;
    city?: string;
    search?: string;
    minExp?: number;
    maxFee?: number;
    minRating?: number;
    sort?: string;
  } = {}): Promise<any[]> {
    const f = filters || {};
    if (isMongooseConnected()) {
      const query: any = {};
      if (f.status) query.verificationStatus = f.status;
      if (f.domain) {
        query.$or = [{ primaryDomain: f.domain }, { practiceAreas: f.domain }];
      }
      if (f.city) {
        query.city = new RegExp(f.city, 'i');
      }
      if (f.minExp) query.experienceYears = { $gte: Number(f.minExp) };
      if (f.maxFee) query.consultationFee = { $lte: Number(f.maxFee) };
      if (f.minRating) query.rating = { $gte: Number(f.minRating) };

      let sortQuery: any = { rating: -1 };
      if (f.sort === 'fee_asc') sortQuery = { consultationFee: 1 };
      if (f.sort === 'fee_desc') sortQuery = { consultationFee: -1 };
      if (f.sort === 'exp_desc') sortQuery = { experienceYears: -1 };
      if (f.sort === 'reviews') sortQuery = { reviewCount: -1 };

      const lawyers = await LawyerModel.find(query).sort(sortQuery).lean();

      // Populate user info (name, avatar, email)
      const populated = await Promise.all(
        lawyers.map(async (l) => {
          const user = await UserModel.findById(l.userId).lean();
          return {
            ...l,
            name: user?.name || 'Verified Advocate',
            avatar: user?.avatar,
            email: user?.email,
          };
        })
      );
      return populated;
    }

    let list = Array.from(memoryStore.lawyers.values());

    if (f.status) {
      list = list.filter((l) => l.verificationStatus === f.status);
    }
    if (f.domain && f.domain !== 'all') {
      const dom = f.domain.toLowerCase();
      list = list.filter(
        (l) =>
          l.primaryDomain?.toLowerCase() === dom ||
          l.practiceAreas?.some((pa: string) => pa.toLowerCase().includes(dom))
      );
    }
    if (f.city && f.city !== 'all') {
      const c = f.city.toLowerCase();
      list = list.filter((l) => l.city?.toLowerCase().includes(c) || l.state?.toLowerCase().includes(c));
    }
    if (f.minExp) {
      list = list.filter((l) => l.experienceYears >= Number(f.minExp));
    }
    if (f.maxFee) {
      list = list.filter((l) => l.consultationFee <= Number(f.maxFee));
    }
    if (f.minRating) {
      list = list.filter((l) => l.rating >= Number(f.minRating));
    }
    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter((l) => {
        const user = memoryStore.users.get(l.userId);
        const nameMatch = user?.name?.toLowerCase().includes(q);
        const bioMatch = l.bio?.toLowerCase().includes(q);
        const areaMatch = l.practiceAreas?.some((pa: string) => pa.toLowerCase().includes(q));
        const barMatch = l.barRegistrationNumber?.toLowerCase().includes(q);
        return nameMatch || bioMatch || areaMatch || barMatch;
      });
    }

    // Sorting
    if (f.sort === 'fee_asc') {
      list.sort((a, b) => a.consultationFee - b.consultationFee);
    } else if (f.sort === 'fee_desc') {
      list.sort((a, b) => b.consultationFee - a.consultationFee);
    } else if (f.sort === 'exp_desc') {
      list.sort((a, b) => b.experienceYears - a.experienceYears);
    } else if (f.sort === 'reviews') {
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    } else {
      // default: highest rating
      list.sort((a, b) => b.rating - a.rating);
    }

    // Attach user profile info
    return list.map((l) => {
      const user = memoryStore.users.get(l.userId);
      return {
        ...l,
        name: user?.name || 'Verified Advocate',
        avatar: user?.avatar,
        email: user?.email,
      };
    });
  },

  async updateLawyer(id: string, updates: Partial<ILawyer>): Promise<any | null> {
    if (isMongooseConnected()) {
      return await LawyerModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    }
    const lawyer = memoryStore.lawyers.get(id);
    if (!lawyer) return null;
    const updated = { ...lawyer, ...updates, updatedAt: new Date() };
    memoryStore.lawyers.set(id, updated);
    persistToDisk();
    return { ...updated };
  },

  // -------------------------------------------------------------
  // LEGAL DOMAINS / CATEGORIES
  // -------------------------------------------------------------
  async getAllDomains(): Promise<any[]> {
    if (isMongooseConnected()) {
      return await LegalDomainModel.find({ isActive: true }).sort({ name: 1 }).lean();
    }
    return Array.from(memoryStore.legalDomains.values()).filter((d) => d.isActive);
  },

  async createDomain(data: any): Promise<any> {
    if (isMongooseConnected()) {
      const doc = await LegalDomainModel.create(data);
      return doc.toObject();
    }
    const id = generateId();
    const item = {
      _id: id,
      id,
      ...data,
      isPopular: data.isPopular || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.legalDomains.set(id, item);
    persistToDisk();
    return { ...item };
  },

  async updateDomain(id: string, updates: any): Promise<any> {
    if (isMongooseConnected()) {
      return await LegalDomainModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    }
    const item = memoryStore.legalDomains.get(id);
    if (!item) return null;
    const updated = { ...item, ...updates, updatedAt: new Date() };
    memoryStore.legalDomains.set(id, updated);
    persistToDisk();
    return { ...updated };
  },

  // -------------------------------------------------------------
  // AVAILABILITY
  // -------------------------------------------------------------
  async getAvailability(lawyerId: string): Promise<any[]> {
    if (isMongooseConnected()) {
      return await AvailabilityModel.find({ lawyerId }).sort({ dayOfWeek: 1 }).lean();
    }
    return Array.from(memoryStore.availability.values())
      .filter((a) => a.lawyerId === lawyerId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  },

  async setAvailability(lawyerId: string, slots: any[]): Promise<any[]> {
    if (isMongooseConnected()) {
      await AvailabilityModel.deleteMany({ lawyerId });
      const created = await AvailabilityModel.insertMany(
        slots.map((s) => ({ ...s, lawyerId }))
      );
      return created.map((c) => c.toObject());
    }

    // Remove existing
    for (const [k, v] of memoryStore.availability.entries()) {
      if (v.lawyerId === lawyerId) {
        memoryStore.availability.delete(k);
      }
    }
    const results: any[] = [];
    for (const s of slots) {
      const id = generateId();
      const obj = {
        _id: id,
        id,
        lawyerId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '17:00',
        slotDurationMinutes: s.slotDurationMinutes || 45,
        breakStartTime: s.breakStartTime || '13:00',
        breakEndTime: s.breakEndTime || '14:00',
        isAvailable: s.isAvailable ?? true,
        blockedDates: s.blockedDates || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.availability.set(id, obj);
      results.push(obj);
    }
    persistToDisk();
    return results;
  },

  // -------------------------------------------------------------
  // APPOINTMENTS & CONSULTATIONS (with Overlap Prevention)
  // -------------------------------------------------------------
  async checkBookingConflict(
    lawyerId: string,
    appointmentDate: string,
    startTime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    // A conflict occurs if there is an active appointment (requested, confirmed, in_progress)
    // for this lawyer on the same date and same start time.
    const activeStatuses: AppointmentStatus[] = ['requested', 'confirmed', 'in_progress'];

    if (isMongooseConnected()) {
      const query: any = {
        lawyerId,
        appointmentDate,
        startTime,
        status: { $in: activeStatuses },
      };
      if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
      }
      const existing = await AppointmentModel.findOne(query).lean();
      return !!existing;
    }

    for (const apt of memoryStore.appointments.values()) {
      if (
        apt.lawyerId === lawyerId &&
        apt.appointmentDate === appointmentDate &&
        apt.startTime === startTime &&
        activeStatuses.includes(apt.status) &&
        apt._id !== excludeAppointmentId
      ) {
        return true;
      }
    }
    return false;
  },

  async createAppointment(data: any): Promise<any> {
    // Check conflicts first
    const hasConflict = await this.checkBookingConflict(
      data.lawyerId,
      data.appointmentDate,
      data.startTime
    );
    if (hasConflict) {
      throw new Error(
        `This time slot (${data.startTime} on ${data.appointmentDate}) is no longer available. Please choose another time.`
      );
    }

    if (isMongooseConnected()) {
      const doc = await AppointmentModel.create(data);
      return doc.toObject();
    }

    const id = generateId();
    const now = new Date();
    const apt = {
      _id: id,
      id,
      ...data,
      status: data.status || 'requested',
      paymentStatus: data.paymentStatus || 'paid',
      meetingLink:
        data.consultationType === 'video'
          ? `https://meet.legalconnect.org/room/${id.substring(0, 8)}`
          : undefined,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.appointments.set(id, apt);
    persistToDisk();
    return { ...apt };
  },

  async findAppointmentById(id: string): Promise<any | null> {
    if (isMongooseConnected()) {
      return await AppointmentModel.findById(id).lean();
    }
    const a = memoryStore.appointments.get(id);
    return a ? { ...a } : null;
  },

  async getAppointments(filters: {
    lawyerId?: string;
    clientId?: string;
    status?: string;
    date?: string;
  }): Promise<any[]> {
    if (isMongooseConnected()) {
      const query: any = {};
      if (filters.lawyerId) query.lawyerId = filters.lawyerId;
      if (filters.clientId) query.clientId = filters.clientId;
      if (filters.status && filters.status !== 'all') query.status = filters.status;
      if (filters.date) query.appointmentDate = filters.date;
      return await AppointmentModel.find(query).sort({ appointmentDate: -1, startTime: 1 }).lean();
    }

    let list = Array.from(memoryStore.appointments.values());
    if (filters.lawyerId) list = list.filter((a) => a.lawyerId === filters.lawyerId);
    if (filters.clientId) list = list.filter((a) => a.clientId === filters.clientId);
    if (filters.status && filters.status !== 'all') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.date) {
      list = list.filter((a) => a.appointmentDate === filters.date);
    }
    return list.sort((a, b) => {
      const dateA = `${a.appointmentDate} ${a.startTime}`;
      const dateB = `${b.appointmentDate} ${b.startTime}`;
      return dateB.localeCompare(dateA);
    });
  },

  async updateAppointment(id: string, updates: Partial<IAppointment>): Promise<any | null> {
    if (isMongooseConnected()) {
      return await AppointmentModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    }
    const apt = memoryStore.appointments.get(id);
    if (!apt) return null;
    const updated = { ...apt, ...updates, updatedAt: new Date() };
    memoryStore.appointments.set(id, updated);
    persistToDisk();
    return { ...updated };
  },

  // -------------------------------------------------------------
  // DOCUMENTS (Confidentiality & Access Control)
  // -------------------------------------------------------------
  async createDocument(data: any): Promise<any> {
    if (isMongooseConnected()) {
      const doc = await DocumentModel.create(data);
      return doc.toObject();
    }
    const id = generateId();
    const doc = {
      _id: id,
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.documents.set(id, doc);
    persistToDisk();
    return { ...doc };
  },

  async getDocumentsForUser(userId: string, role: UserRole = 'client', lawyerId?: string): Promise<any[]> {
    if (isMongooseConnected()) {
      if (role === 'admin') {
        return await DocumentModel.find().sort({ createdAt: -1 }).lean();
      }
      if (role === 'lawyer' && lawyerId) {
        return await DocumentModel.find({
          $or: [{ uploadedBy: userId }, { relatedLawyerId: lawyerId }],
        })
          .sort({ createdAt: -1 })
          .lean();
      }
      return await DocumentModel.find({
        $or: [{ uploadedBy: userId }, { relatedClientId: userId }],
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    const all = Array.from(memoryStore.documents.values());
    if (role === 'admin') return all;

    return all.filter((d) => {
      if (d.uploadedBy === userId) return true;
      if (role === 'lawyer' && lawyerId && d.relatedLawyerId === lawyerId) return true;
      if (role === 'client' && d.relatedClientId === userId) return true;
      return false;
    });
  },

  async findDocumentById(id: string): Promise<any | null> {
    if (isMongooseConnected()) {
      return await DocumentModel.findById(id).lean();
    }
    const d = memoryStore.documents.get(id);
    return d ? { ...d } : null;
  },

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------
  async createReview(data: any): Promise<any> {
    if (isMongooseConnected()) {
      const doc = await ReviewModel.create(data);
      // Recalculate lawyer rating
      const reviews = await ReviewModel.find({ lawyerId: data.lawyerId }).lean();
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await LawyerModel.findByIdAndUpdate(data.lawyerId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: reviews.length,
      });
      return doc.toObject();
    }

    const id = generateId();
    const review = {
      _id: id,
      id,
      ...data,
      isVerifiedConsultation: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.reviews.set(id, review);

    // Update lawyer rating
    const lawyerReviews = Array.from(memoryStore.reviews.values()).filter(
      (r) => r.lawyerId === data.lawyerId
    );
    const avg =
      lawyerReviews.reduce((sum, r) => sum + r.rating, 0) / (lawyerReviews.length || 1);
    const lawyer = memoryStore.lawyers.get(data.lawyerId);
    if (lawyer) {
      lawyer.rating = Math.round(avg * 10) / 10;
      lawyer.reviewCount = lawyerReviews.length;
      memoryStore.lawyers.set(data.lawyerId, lawyer);
    }
    persistToDisk();
    return { ...review };
  },

  async getReviews(lawyerId?: string): Promise<any[]> {
    if (isMongooseConnected()) {
      const q = lawyerId ? { lawyerId } : {};
      return await ReviewModel.find(q).sort({ createdAt: -1 }).lean();
    }
    let list = Array.from(memoryStore.reviews.values());
    if (lawyerId) {
      list = list.filter((r) => r.lawyerId === lawyerId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  async createNotification(data: {
    recipientId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }): Promise<any> {
    if (isMongooseConnected()) {
      const doc = await NotificationModel.create(data);
      return doc.toObject();
    }
    const id = generateId();
    const notif = {
      _id: id,
      id,
      ...data,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.notifications.set(id, notif);
    persistToDisk();
    return { ...notif };
  },

  async getNotifications(userId: string): Promise<any[]> {
    if (isMongooseConnected()) {
      return await NotificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50).lean();
    }
    return Array.from(memoryStore.notifications.values())
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    if (isMongooseConnected()) {
      const res = await NotificationModel.updateOne({ _id: id, recipientId: userId }, { read: true });
      return res.modifiedCount > 0;
    }
    const notif = memoryStore.notifications.get(id);
    if (notif && notif.recipientId === userId) {
      notif.read = true;
      persistToDisk();
      return true;
    }
    return false;
  },

  async markAllNotificationsRead(userId: string): Promise<number> {
    if (isMongooseConnected()) {
      const res = await NotificationModel.updateMany({ recipientId: userId, read: false }, { read: true });
      return res.modifiedCount;
    }
    let count = 0;
    for (const n of memoryStore.notifications.values()) {
      if (n.recipientId === userId && !n.read) {
        n.read = true;
        count++;
      }
    }
    persistToDisk();
    return count;
  },

  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------
  async createAuditLog(data: {
    action: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    targetResource: string;
    targetId?: string;
    ipAddress?: string;
    details?: any;
  }): Promise<any> {
    if (isMongooseConnected()) {
      const doc = await AuditLogModel.create(data);
      return doc.toObject();
    }
    const id = generateId();
    const log = {
      _id: id,
      id,
      ...data,
      createdAt: new Date(),
    };
    memoryStore.auditLogs.set(id, log);
    persistToDisk();
    return { ...log };
  },

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    if (isMongooseConnected()) {
      return await AuditLogModel.find().sort({ createdAt: -1 }).limit(limit).lean();
    }
    return Array.from(memoryStore.auditLogs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  // -------------------------------------------------------------
  // PLATFORM METRICS & ANALYTICS (Real Dynamic Calculations)
  // -------------------------------------------------------------
  async getPlatformMetrics(): Promise<any> {
    const users = await this.getAllUsers();
    const lawyers = Array.from(memoryStore.lawyers.values());
    const appointments = Array.from(memoryStore.appointments.values());
    const reviews = Array.from(memoryStore.reviews.values());

    const totalClients = users.filter((u) => u.role === 'client').length;
    const totalLawyers = lawyers.length;
    const verifiedLawyers = lawyers.filter((l) => l.verificationStatus === 'approved').length;
    const pendingLawyers = lawyers.filter((l) => l.verificationStatus === 'pending').length;

    const totalConsultations = appointments.length;
    const completedConsultations = appointments.filter((a) => a.status === 'completed').length;
    const upcomingConsultations = appointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'requested'
    ).length;

    const totalVolume = appointments
      .filter((a) => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 4.9;

    return {
      totalClients,
      totalLawyers,
      verifiedLawyers,
      pendingLawyers,
      totalConsultations,
      completedConsultations,
      upcomingConsultations,
      totalVolume,
      avgRating,
      totalReviews: reviews.length,
    };
  },

  // -------------------------------------------------------------
  // CONSULTATION MESSAGES
  // -------------------------------------------------------------
  async getAppointmentMessages(appointmentId: string): Promise<any[]> {
    const list: any[] = [];
    for (const m of memoryStore.messages.values()) {
      if (m.consultationId === appointmentId) {
        list.push({ ...m });
      }
    }
    list.sort((a, b) => a.timestamp - b.timestamp);
    return list;
  },

  async createAppointmentMessage(data: {
    id?: string;
    consultationId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    timestamp?: number;
    read?: boolean;
  }): Promise<any> {
    const id = data.id || generateId();
    const message = {
      _id: id,
      id,
      consultationId: data.consultationId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: data.content,
      timestamp: data.timestamp || Date.now(),
      read: !!data.read,
      createdAt: new Date().toISOString(),
    };
    memoryStore.messages.set(id, message);
    persistToDisk();
    return message;
  },
};
