import Link from 'next/link';

export function Logo({ size = '40px', showText = false, className = '' }: { size?: string; showText?: boolean; className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 group decoration-transparent ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo-mark-hop.svg"
        alt="iNNkie Logo"
        style={{ width: size, height: size }}
        className="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 object-contain"
      />
      {showText && (
        <span className="text-xl font-black tracking-tight text-slate-900 italic group-hover:text-primary-600 transition-colors">
          iNNkie
        </span>
      )}
    </Link>
  );
}
