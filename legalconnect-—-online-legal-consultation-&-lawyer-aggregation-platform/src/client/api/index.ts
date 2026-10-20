const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('legalconnect_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('legalconnect_token', token);
  } else {
    localStorage.removeItem('legalconnect_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<any>('/auth/me'),
  demoLogin: (role: string) => request<any>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),

  // Lawyers & Directory
  getLawyers: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const qs = query.toString();
    return request<any>(`/lawyers${qs ? `?${qs}` : ''}`);
  },
  getLawyerById: (id: string) => request<any>(`/lawyers/${id}`),
  getLawyerAvailability: (id: string) => request<any>(`/lawyers/${id}/availability`),
  getBookedSlots: async (lawyerId: string, date: string) => {
    try {
      if (!lawyerId || !date) return { bookedSlots: [] };
      return await request<any>(`/lawyers/${lawyerId}/booked-slots?date=${encodeURIComponent(date)}`);
    } catch {
      return { bookedSlots: [] };
    }
  },
  updateLawyerProfile: (payload: any) =>
    request<any>('/lawyers/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  updateLawyerAvailability: (slots: any[]) =>
    request<any>('/lawyers/availability', { method: 'PUT', body: JSON.stringify({ slots }) }),
  getCategories: () => request<any>('/lawyers/categories/list'),

  // Appointments & Consultations
  getAppointments: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const qs = query.toString();
    return request<any>(`/appointments${qs ? `?${qs}` : ''}`);
  },
  getAppointmentById: (id: string) => request<any>(`/appointments/${id}`),
  bookAppointment: (payload: any) =>
    request<any>('/appointments/book', { method: 'POST', body: JSON.stringify(payload) }),
  updateAppointmentStatus: (id: string, payload: any) =>
    request<any>(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  getConsultationMessages: (appointmentId: string) =>
    request<{ messages: any[] }>(`/appointments/${appointmentId}/messages`),
  sendConsultationMessage: (appointmentId: string, payload: { content: string; clientMessageId?: string }) =>
    request<{ message: any }>(`/appointments/${appointmentId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Documents
  getDocuments: () => request<any>('/documents'),
  getDocumentById: (id: string) => request<any>(`/documents/${id}`),
  uploadDocument: (payload: any) =>
    request<any>('/documents/upload', { method: 'POST', body: JSON.stringify(payload) }),

  // Reviews
  getReviews: (lawyerId?: string) =>
    request<any>(`/reviews${lawyerId ? `?lawyerId=${lawyerId}` : ''}`),
  createReview: (payload: any) =>
    request<any>('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  replyReview: (id: string, reply: string) =>
    request<any>(`/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Admin
  getAdminMetrics: () => request<any>('/admin/metrics'),
  getPendingLawyers: () => request<any>('/admin/lawyers/pending'),
  verifyLawyer: (id: string, decision: 'approved' | 'rejected', notes?: string) =>
    request<any>(`/admin/lawyers/${id}/verify`, { method: 'PUT', body: JSON.stringify({ decision, notes }) }),
  getAdminUsers: () => request<any>('/admin/users'),
  toggleUserStatus: (id: string, isActive: boolean) =>
    request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
  getAuditLogs: (limit?: number) =>
    request<any>(`/admin/audit-logs${limit ? `?limit=${limit}` : ''}`),
  createCategory: (payload: any) =>
    request<any>('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: any) =>
    request<any>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // AI Assistant
  getAiBrief: (payload: { situationDescription: string; practiceArea?: string; clientConsentAccepted: boolean }) =>
    request<any>('/ai/legal-brief', { method: 'POST', body: JSON.stringify(payload) }),

  // System
  getSystemStatus: () => request<any>('/system/status'),
};
