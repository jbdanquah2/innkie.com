'use client';
import { useState, type ReactNode } from 'react';

interface Props {
  onFiles: (files: FileList) => void;
  accept: string;
  multiple?: boolean;
  compact: boolean; // true once files are loaded
  icon: string;
  title: string;
  titleCompact: string;
  subtitle: string;
  subtitleCompact: string;
  children?: ReactNode;
}

/** Drag-and-drop / click-to-browse surface shared by the image and PDF tools. */
export function Dropzone({ onFiles, accept, multiple = true, compact, icon, title, titleCompact, subtitle, subtitleCompact }: Props) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
      className={`relative overflow-hidden group bg-white border-4 border-dashed rounded-[3rem] text-center transition-all duration-300 hover:border-primary-400 ${compact ? 'p-8' : 'p-20'} ${dragging ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}
    >
      <input
        type="file"
        aria-label={title}
        accept={accept}
        multiple={multiple}
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="relative z-0">
        <div className={`bg-primary-50 text-primary-600 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm ${compact ? 'w-12 h-12' : 'w-24 h-24'}`}>
          <i className={`fas ${icon} ${compact ? 'text-xl' : 'text-4xl'}`} />
        </div>
        <div className={compact ? 'mt-4' : 'mt-8'}>
          <p className={`font-black text-slate-900 mb-2 ${compact ? 'text-sm' : 'text-2xl'}`}>{compact ? titleCompact : title}</p>
          <p className={`text-slate-500 font-medium italic ${compact ? 'text-xs' : ''}`}>{compact ? subtitleCompact : subtitle}</p>
        </div>
      </div>
    </div>
  );
}
