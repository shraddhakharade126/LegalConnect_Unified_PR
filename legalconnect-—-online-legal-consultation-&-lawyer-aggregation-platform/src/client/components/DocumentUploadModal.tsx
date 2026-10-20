import React, { useState, useRef } from 'react';
import { api } from '../api/index.ts';
import { DocumentType, ConfidentialityLevel } from '../types/index.ts';
import {
  UploadCloud,
  FileText,
  Lock,
  X,
  AlertCircle,
  FolderOpen,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultAppointmentId?: string;
  defaultLawyerId?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAppointmentId,
  defaultLawyerId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('case_file');
  const [confidentialityLevel, setConfidentialityLevel] =
    useState<ConfidentialityLevel>('lawyer_client_only');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [fileData, setFileData] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const processSelectedFile = (selectedFile: File) => {
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB limit. Please select a smaller document.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(selectedFile.size);
    setFileType(selectedFile.type || 'application/pdf');
    setError(null);

    // Auto-populate document title if not already provided
    if (!title.trim()) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Read real file from user's file manager via FileReader
    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read the file from disk. Please try selecting again.');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processSelectedFile(droppedFile);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setFileName('');
    setFileSize(0);
    setFileData('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }

    if (!fileName || !fileData) {
      setError('Please select a file from your file manager to upload.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.uploadDocument({
        title: title.trim(),
        description: description.trim(),
        documentType,
        confidentialityLevel,
        fileType: fileType || 'application/pdf',
        fileSize: fileSize || 102400,
        fileData,
        relatedAppointmentId: defaultAppointmentId,
        relatedLawyerId: defaultLawyerId,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error uploading document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-white">Upload Legal Document</h3>
              <p className="text-[11px] text-amber-300">Confidential Legal Document Centre</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Non-Disclosure Agreement Draft v2"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1">
                Document Classification
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="case_file">Case File</option>
                <option value="agreement">Contract / Agreement</option>
                <option value="notice">Legal Notice</option>
                <option value="evidence">Evidence / Exhibit</option>
                <option value="client_brief">Client Brief</option>
                <option value="bar_license">Bar License / ID</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1">
                Confidentiality
              </label>
              <select
                value={confidentialityLevel}
                onChange={(e) =>
                  setConfidentialityLevel(e.target.value as ConfidentialityLevel)
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="lawyer_client_only">Lawyer & Client Only</option>
                <option value="confidential">Strictly Confidential</option>
                <option value="admin_only">Compliance Admin Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>
                File Attachment <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                Max 15 MB • PDF, Word, Images, TXT
              </span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!file) fileInputRef.current?.click();
              }}
              className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/20'
              } p-4 sm:p-5`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {!file ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center shadow-sm">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                      Choose legal file from your file manager
                    </p>
                    <p className="text-[11px] text-slate-500">
                      or drag & drop your document here
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Browse File Manager
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-900 text-xs truncate max-w-[220px] sm:max-w-[280px]">
                          {fileName}
                        </p>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-emerald-700">{formatFileSize(fileSize)}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {fileName.split('.').pop() || 'FILE'}
                        </span>
                        <span>• Ready to upload</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1.5 text-xs text-amber-800 hover:text-amber-900 hover:bg-amber-100/60 font-semibold rounded-lg transition-colors"
                      title="Choose another file from file manager"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelectedFile();
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1">
              Description or Context Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes for the review advocate..."
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? 'Uploading...' : 'Securely Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
