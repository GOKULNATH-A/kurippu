import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, File, Image, CheckCircle2,
  AlertCircle, Loader2, Sparkles, Filter, Clock
} from 'lucide-react';
import { documentsApi } from '../lib/api';
import { formatFileSize, formatDate } from '../lib/utils';
import { AppLayout } from '../components/AppLayout';
import { DocStatusBadge } from '../components/ui';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
};

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  docId?: string;
  error?: string;
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pdf' | 'doc' | 'image' | 'text'>('all');

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list({ page: 1, page_size: 50 }).then(r => r.data),
    refetchInterval: (data) => {
      const docs = (data as any)?.documents ?? [];
      const hasProcessing = docs.some((d: any) =>
        ['uploading', 'processing', 'analyzing', 'extracting'].includes(d.status)
      );
      return hasProcessing ? 2500 : false;
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        continue;
      }

      const entry: UploadingFile = { file, progress: 0, status: 'uploading' };
      setUploading(prev => [...prev, entry]);

      try {
        const progressInterval = setInterval(() => {
          setUploading(prev =>
            prev.map(u =>
              u.file === file && u.progress < 85
                ? { ...u, progress: u.progress + 15 }
                : u
            )
          );
        }, 250);

        const res = await documentsApi.upload(file);
        clearInterval(progressInterval);

        setUploading(prev =>
          prev.map(u =>
            u.file === file
              ? { ...u, status: 'done', progress: 100, docId: res.data.id }
              : u
          )
        );

        toast.success(`${file.name} uploaded! AI is analyzing…`);
        refetch();

        setTimeout(() => {
          if (res.data.id) navigate(`/documents/${res.data.id}`);
        }, 1200);

      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Upload failed';
        setUploading(prev =>
          prev.map(u =>
            u.file === file ? { ...u, status: 'error', error: msg, progress: 0 } : u
          )
        );
        toast.error(`${file.name}: ${msg}`);
      }
    }
  }, [navigate, refetch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
  } as any);

  const documents = data?.documents ?? [];

  const getDocType = (doc: any) => {
    const mime = doc.mime_type || '';
    const fn = (doc.original_filename || '').toLowerCase();
    if (mime.includes('pdf') || fn.endsWith('.pdf')) return 'pdf';
    if (mime.includes('word') || fn.endsWith('.docx') || fn.endsWith('.doc')) return 'doc';
    if (mime.includes('image') || fn.endsWith('.png') || fn.endsWith('.jpg') || fn.endsWith('.jpeg')) return 'image';
    return 'text';
  };

  const filteredDocs = documents.filter((doc: any) => {
    if (selectedFilter === 'all') return true;
    return getDocType(doc) === selectedFilter;
  });

  const getStyleForDoc = (doc: any) => {
    const type = getDocType(doc);
    switch (type) {
      case 'pdf':
        return {
          icon: FileText,
          bgGradient: 'from-rose-500/10 via-surface-2 to-surface-1',
          border: 'border-rose-500/30 hover:border-rose-400/80',
          iconBox: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(255,45,146,0.3)]',
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
          tag: 'PDF'
        };
      case 'doc':
        return {
          icon: FileText,
          bgGradient: 'from-blue-500/10 via-surface-2 to-surface-1',
          border: 'border-blue-500/30 hover:border-blue-400/80',
          iconBox: 'bg-blue-500/15 border-blue-500/30 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]',
          badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
          tag: 'DOCX'
        };
      case 'image':
        return {
          icon: Image,
          bgGradient: 'from-cyan-500/10 via-surface-2 to-surface-1',
          border: 'border-cyan-500/30 hover:border-cyan-400/80',
          iconBox: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)]',
          badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
          tag: 'IMAGE'
        };
      default:
        return {
          icon: File,
          bgGradient: 'from-purple-500/10 via-surface-2 to-surface-1',
          border: 'border-purple-500/30 hover:border-purple-400/80',
          iconBox: 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_12px_rgba(124,58,255,0.3)]',
          badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
          tag: 'TXT'
        };
    }
  };

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[100px]" />
      </div>

      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <Sparkles className="w-3 h-3 text-neon-amber animate-pulse" /> Document Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Document Repository
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Upload PDFs, Office files, images, or notes. AI extracts tasks, meetings, and deadlines.
          </p>
        </div>
      </div>

      {/* Upload Dropzone with glowing multi-color animated border */}
      <div
        {...getRootProps()}
        className={`
          mb-8 relative rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 overflow-hidden
          ${isDragActive
            ? 'bg-brand-600/20 border-2 border-neon-cyan shadow-[0_0_35px_rgba(0,229,255,0.4)]'
            : 'bg-surface-1/90 border-2 border-dashed border-white/[0.12] hover:border-brand-400 hover:shadow-[0_0_30px_rgba(124,58,255,0.25)]'
          }
        `}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink" />
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { scale: 1.04 } : { scale: 1 }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
            isDragActive
              ? 'bg-gradient-to-tr from-cyan-500 to-brand-500 text-white shadow-[0_0_25px_rgba(0,229,255,0.6)]'
              : 'bg-gradient-to-tr from-brand-600/30 to-pink-500/20 border border-brand-500/40 text-brand-300'
          }`}>
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {isDragActive ? 'Release to start AI analysis!' : 'Drop your documents here or browse'}
            </p>
            <p className="text-xs text-ink-muted mt-1.5 flex items-center justify-center gap-2 flex-wrap">
              <span>Supports</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono text-[11px]">PDF</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-[11px]">DOCX</span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono text-[11px]">PNG/JPG</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono text-[11px]">TXT</span>
              <span>· Up to 50MB</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Uploading Files with Rainbow Progress */}
      <AnimatePresence>
        {uploading.filter(u => u.status === 'uploading').map((u, i) => (
          <motion.div
            key={u.file.name + i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-xl bg-surface-1 border border-brand-500/40 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-neon-cyan animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-white truncate">{u.file.name}</p>
                  <span className="text-xs font-mono font-bold text-neon-cyan">{u.progress}%</span>
                </div>
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink"
                    initial={{ width: 0 }}
                    animate={{ width: `${u.progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Filter Chips & Documents Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-muted" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Filter:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: `All (${documents.length})`, activeColor: 'bg-brand-600 text-white shadow-[0_0_12px_rgba(124,58,255,0.4)]' },
              { id: 'pdf', label: 'PDF', activeColor: 'bg-rose-500 text-white shadow-[0_0_12px_rgba(255,45,146,0.4)]' },
              { id: 'doc', label: 'Word', activeColor: 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]' },
              { id: 'image', label: 'Images', activeColor: 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(0,229,255,0.4)]' },
              { id: 'text', label: 'Text', activeColor: 'bg-purple-600 text-white shadow-[0_0_12px_rgba(124,58,255,0.4)]' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedFilter === f.id
                    ? f.activeColor
                    : 'bg-surface-2 text-ink-muted hover:text-white border border-white/[0.06]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-16 rounded-3xl bg-surface-1 border border-white/[0.08] text-center">
            <FileText className="w-12 h-12 text-ink-subtle mx-auto mb-3" />
            <p className="text-base font-bold text-white mb-1">No documents found</p>
            <p className="text-xs text-ink-muted">
              {selectedFilter === 'all'
                ? 'Upload your first document above to kick off AI action extraction.'
                : `No documents match the "${selectedFilter}" filter.`}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc: any) => {
              const style = getStyleForDoc(doc);
              const Icon = style.icon;
              const isProcessing = ['uploading', 'processing', 'analyzing', 'extracting'].includes(doc.status);

              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, transition: { duration: 0.15 } }}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className={`p-5 rounded-2xl bg-gradient-to-br ${style.bgGradient} border ${style.border} cursor-pointer transition-all duration-300 relative overflow-hidden shadow-lg group`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl border ${style.iconBox} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                      {style.tag}
                    </span>
                  </div>

                  <div className="min-w-0 mb-4">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {doc.original_filename}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-1">
                      <span>{formatFileSize(doc.file_size)}</span>
                      {doc.page_count && <span>· {doc.page_count} pages</span>}
                      {doc.created_at && <span>· {formatDate(doc.created_at)}</span>}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <DocStatusBadge status={doc.status} />
                    {doc.status === 'completed' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}
                    {doc.status === 'failed' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                  </div>

                  {isProcessing && (
                    <div className="mt-3">
                      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-neon-cyan to-brand-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
