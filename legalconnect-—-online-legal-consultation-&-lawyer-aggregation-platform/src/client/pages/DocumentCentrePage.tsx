import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { LegalDocument, DocumentType } from '../types/index.ts';
import { DocumentUploadModal } from '../components/DocumentUploadModal.tsx';
import {
  FileText,
  UploadCloud,
  Lock,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle,
} from 'lucide-react';

import { useToast } from '../context/ToastContext.tsx';

interface DocumentCentrePageProps {
  navigate: (path: string) => void;
}

export const DocumentCentrePage: React.FC<DocumentCentrePageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === 'all' || doc.documentType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Privileged Records
            </span>
            <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded-full font-mono">
              256-bit Encrypted
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Confidential Document Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Securely store, organize, and share legal contracts, notices, evidence, and consultation
            briefings.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
        >
          <UploadCloud className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document title or notes..."
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-xl outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs font-medium p-2 border border-slate-300 rounded-xl bg-white text-slate-800 outline-none w-full sm:w-auto"
          >
            <option value="all">All Documents</option>
            <option value="case_file">Case Files</option>
            <option value="agreement">Contracts & Agreements</option>
            <option value="notice">Legal Notices</option>
            <option value="evidence">Evidence & Exhibits</option>
            <option value="client_brief">Client Briefs</option>
            <option value="bar_license">Bar Credentials</option>
          </select>
        </div>
      </div>

      {/* Document Grid / Table */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
          <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Decrypting case repository...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any documents matching this criteria. Upload agreements or case briefs to
            share them with your advocate.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
                    {doc.documentType.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{doc.title}</h3>
                {doc.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span className="capitalize">{doc.confidentialityLevel.replace(/_/g, ' ')}</span>
                  </span>
                  <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Uploaded by: {doc.uploadedByName}</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (doc.fileData && doc.fileData.startsWith('data:')) {
                      const a = document.createElement('a');
                      a.href = doc.fileData;
                      const ext = doc.fileType === 'application/pdf' ? 'pdf' : (doc.title.includes('.') ? '' : 'pdf');
                      a.download = doc.title.includes('.') ? doc.title : `${doc.title.replace(/\s+/g, '_')}.${ext || 'pdf'}`;
                      a.click();
                    } else {
                      const blob = new Blob([`LegalConnect Document Archive\nTitle: ${doc.title}\nCategory: ${doc.documentType}\nConfidentiality: ${doc.confidentialityLevel}\nUploaded by: ${doc.uploadedByName}\nTimestamp: ${doc.createdAt}\nAccess granted under attorney-client privilege.`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${doc.title.replace(/\s+/g, '_')}_verified.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                    showToast(`Decrypted copy of "${doc.title}" downloaded.`, 'success');
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Encrypted Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadDocs}
      />
    </div>
  );
};
