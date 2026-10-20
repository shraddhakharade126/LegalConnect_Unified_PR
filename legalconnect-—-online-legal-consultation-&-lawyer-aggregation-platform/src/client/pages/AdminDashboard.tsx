import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { Lawyer, User, LegalDomain, AuditLog, PlatformMetrics } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Briefcase,
  DollarSign,
  Activity,
  Check,
  X,
  Search,
  Plus,
  Lock,
  Clock,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';

import { useToast } from '../context/ToastContext.tsx';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [pendingLawyers, setPendingLawyers] = useState<Lawyer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<LegalDomain[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'verifications' | 'users' | 'categories' | 'audit'>('verifications');
  const [userSearch, setUserSearch] = useState<string>('');

  // Add category state
  const [isAddCatOpen, setIsAddCatOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, uRes, cRes, aRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getPendingLawyers(),
        api.getAdminUsers(),
        api.getCategories(),
        api.getAuditLogs(50),
      ]);
      setMetrics(mRes.metrics || null);
      setPendingLawyers(pRes.pendingLawyers || []);
      setUsers(uRes.users || []);
      setCategories(cRes.domains || []);
      setAuditLogs(aRes.logs || []);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyLawyer = async (id: string, decision: 'approved' | 'rejected') => {
    let notes = '';
    if (decision === 'rejected') {
      const input = prompt('Please specify reason for rejecting this verification application:');
      if (!input) return;
      notes = input;
    } else {
      notes = 'Credentials audited and verified by Chief Compliance Officer.';
    }

    try {
      await api.verifyLawyer(id, decision, notes);
      showToast(`Advocate application ${decision === 'approved' ? 'approved' : 'rejected'}.`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error updating verification.', 'error');
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.toggleUserStatus(id, !currentStatus);
      showToast(`Account status updated to ${!currentStatus ? 'Active' : 'Suspended'}.`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error updating user status.', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatDesc.trim()) return;

    try {
      await api.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      showToast(`Legal domain category "${newCatName.trim()}" created.`, 'success');
      setIsAddCatOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error creating category.', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Portal Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Executive Administration
            </span>
            <span className="text-[10px] bg-purple-900/80 text-purple-200 border border-purple-700/80 px-2 py-0.5 rounded-full font-mono">
              Root Compliance Role
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Platform Compliance & Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Audit Bar Council registrations, manage user permissions, oversee legal categories, and
            inspect security logs.
          </p>
        </div>
      </div>

      {/* High-Level Platform Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pending Audits</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{pendingLawyers.length}</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Lawyers awaiting audit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Verified Advocates</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            {metrics?.verifiedLawyers ?? 0}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">Public in directory</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Consultations</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            {metrics?.totalConsultations ?? 0}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">Platform volume booked</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{users.length}</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Clients & Lawyers</p>
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 pt-4 flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'verifications'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Lawyer Verification Queue
            {pendingLawyers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                {pendingLawyers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            User Management ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Practice Categories ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Security Audit Trail ({auditLogs.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: LAWYER VERIFICATION QUEUE */}
          {activeTab === 'verifications' && (
            <div>
              {pendingLawyers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800 text-sm">Verification Queue Clear</p>
                  <p>All advocate credential applications have been reviewed and audited.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingLawyers.map((lawyer) => (
                    <div
                      key={lawyer._id}
                      className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{lawyer.name}</h4>
                          <span className="text-xs text-slate-500">({lawyer.email})</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                            Pending Audit
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Bar Council State</span>
                            <span className="font-semibold text-slate-800">
                              {lawyer.barCouncilState}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Bar Reg. Number</span>
                            <span className="font-mono font-bold text-slate-900">
                              {lawyer.barRegistrationNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Admitted Year</span>
                            <span className="font-semibold text-slate-800">
                              {lawyer.yearOfAdmission} ({lawyer.experienceYears} yrs practice)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Submitted Verification Proof:</span>
                          <span className="text-amber-700 font-semibold">
                            {lawyer.verificationDocuments[0]?.title || 'Bar_License_Doc.pdf'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleVerifyLawyer(lawyer._id, 'approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Approve & Verify
                        </button>
                        <button
                          onClick={() => handleVerifyLawyer(lawyer._id, 'rejected')}
                          className="px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-xl outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <span className="text-xs text-slate-500">
                  Showing {filteredUsers.length} platform accounts
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Registered</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-slate-500 text-[11px]">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'lawyer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.isActive ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500" /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                                u.isActive
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.isActive ? 'Suspend' : 'Reactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LEGAL CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Legal Practice Domains</h3>
                  <p className="text-xs text-slate-500">
                    Categories available for advocate specialization and client search
                  </p>
                </div>
                <button
                  onClick={() => setIsAddCatOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Domain
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">/{c.slug}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-semibold">Active in Directory</span>
                      {c.isPopular && (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Category Modal */}
              {isAddCatOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <form
                    onSubmit={handleCreateCategory}
                    className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl"
                  >
                    <h3 className="font-bold text-base text-slate-900">
                      Add New Practice Category
                    </h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 uppercase mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="E.g., Immigration & Visa Law"
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 uppercase mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        placeholder="Description of practice area..."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddCatOpen(false)}
                        className="px-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl hover:bg-slate-800"
                      >
                        Create Category
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Action</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Target Resource</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{log.action}</td>
                        <td className="p-3 text-slate-700">
                          {log.actorName} ({log.actorRole})
                        </td>
                        <td className="p-3 text-slate-600">{log.targetResource}</td>
                        <td className="p-3 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
