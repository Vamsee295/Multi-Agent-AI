"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

interface KBFile {
  filename: string;
  size_bytes: number;
  modified_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [files, setFiles] = useState<KBFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/kb/files");
      setFiles(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load files.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setError(null);
      setUploadSuccess(null);
      const res = await api.post("/api/kb/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadSuccess(`Successfully uploaded and indexed ${res.data.chunks_indexed} chunks.`);
      fetchFiles();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/chat")}
            className="p-2 bg-white border border-border rounded-md hover:bg-muted transition-colors text-text-muted"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Knowledge Base Admin</h1>
            <p className="text-[14px] text-text-secondary">Manage documents for Retrieval Augmented Generation (RAG).</p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-[16px] font-semibold text-text-primary mb-4">Upload Document</h2>
          
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-[13px]">
              {error}
            </div>
          )}
          {uploadSuccess && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[13px] flex items-center gap-2">
              <CheckCircle2 size={16} />
              {uploadSuccess}
            </div>
          )}

          <div 
            onClick={handleUploadClick}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isUploading ? 'border-border bg-muted pointer-events-none' : 'border-brand/40 bg-brand-subtle hover:bg-brand-subtle/80'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.txt" 
              className="hidden" 
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-[14px] font-medium text-text-primary">Uploading & Indexing...</p>
                <p className="text-[13px] text-text-muted">This may take a moment depending on file size.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-brand">
                  <Upload size={24} />
                </div>
                <p className="text-[15px] font-medium text-text-primary mb-1">Click to upload document</p>
                <p className="text-[13px] text-text-muted">Supported formats: PDF, TXT</p>
              </div>
            )}
          </div>
        </div>
        {/* Summary Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-border rounded-lg p-3 flex flex-col gap-1">
            <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Embedding Model</span>
            <span className="text-[13px] font-medium text-text-primary">all-MiniLM-L6-v2</span>
          </div>
          <div className="bg-white border border-border rounded-lg p-3 flex flex-col gap-1">
            <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Vector Store</span>
            <span className="text-[13px] font-medium text-brand">FAISS</span>
          </div>
          <div className="bg-white border border-border rounded-lg p-3 flex flex-col gap-1">
            <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Total Documents</span>
            <span className="text-[13px] font-medium text-text-primary">{files.length}</span>
          </div>
          <div className="bg-white border border-border rounded-lg p-3 flex flex-col gap-1">
            <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Total Chunks</span>
            <span className="text-[13px] font-medium text-text-primary">
              {files.reduce((acc, f) => acc + Math.max(1, Math.floor(f.size_bytes / 400)), 0)}
            </span>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-[16px] font-semibold text-text-primary">Indexed Documents</h2>
          </div>
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-[14px]">
              No documents in the knowledge base yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border text-[12px] text-text-muted uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Document Name</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Chunks</th>
                    <th className="px-5 py-3 font-medium">Last Indexed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {files.map((file) => {
                    const estimatedChunks = Math.max(1, Math.floor(file.size_bytes / 400));
                    return (
                      <tr key={file.filename} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <FileText size={16} className="text-brand opacity-80" />
                          <span className="text-[14px] font-medium text-text-primary">{file.filename}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100">
                            <CheckCircle2 size={12} /> Indexed
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-text-secondary font-medium">
                          {estimatedChunks}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-text-muted">
                          {new Date(file.modified_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
