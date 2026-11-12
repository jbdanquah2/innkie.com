'use client';
import { useState } from 'react';

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
}

/** Drag-and-drop / click-to-browse surface shared by the image and PDF tools. */
export function Dropzone({ onFiles, accept, multiple = true, compact, icon, title, titleCompact, subtitle, subtitleCompact }: Props) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
      className={`relative rounded-xl border-2 border-dashed text-center transition-colors focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-200 ${compact ? 'p-5' : 'p-10 sm:p-14'} ${dragging ? 'border-primary-600 bg-primary-50' : 'border-slate-300 bg-white hover:border-slate-500'}`}
    >
      <input
        type="file"
        aria-label={title}
        accept={accept}
        multiple={multiple}
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className={`flex ${compact ? 'flex-row items-center justify-center gap-4 text-left' : 'flex-col items-center'}`}>
        <i className={`fas ${icon} text-slate-400 ${compact ? 'text-2xl' : 'text-4xl mb-4'}`} aria-hidden="true" />
        <div>
          <p className={`font-semibold text-slate-900 ${compact ? 'text-base' : 'text-xl'}`}>{compact ? titleCompact : title}</p>
          <p className="mt-1 text-sm text-slate-500">{compact ? subtitleCompact : subtitle}</p>
        </div>
      </div>
    </div>
  );
}
