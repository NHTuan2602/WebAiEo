import { ExternalLink, Globe, GraduationCap, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BRAND_INFO } from '../../constants/brandInfo';

/**
 * Shared branded footer displaying center identity and Ms. Như contact channels.
 */
export default function BrandContactFooter({ variant = 'full' }) {
  const isCard = variant === 'card';
  const shellClass = isCard
    ? 'bg-[#0F172B] text-slate-300 rounded-2xl px-6 py-6 border border-slate-800 space-y-5'
    : 'max-w-7xl mx-auto space-y-5';

  return (
    <div className={shellClass}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Column 1: Brand Identity */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#007A7A] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <p className="font-extrabold text-sm text-white leading-tight">{BRAND_INFO.siteName}</p>
              <p className="text-[11px] font-semibold text-[#1EE1D6]">{BRAND_INFO.englishSubName}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {BRAND_INFO.established}. &ldquo;{BRAND_INFO.slogan}&rdquo;
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            🌐 {BRAND_INFO.domainHost}
          </p>
        </div>

        {/* Column 2: Direct Teacher Contact */}
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Thông Tin Liên Hệ • {BRAND_INFO.teacherName}
          </p>
          <div className="space-y-1.5 text-slate-300">
            <a
              href={BRAND_INFO.phoneHref}
              className="flex items-center gap-2 hover:text-[#1EE1D6] transition font-semibold"
            >
              <Phone className="w-3.5 h-3.5 text-[#1EE1D6] shrink-0" />
              <span>Điện thoại / Zalo: <strong className="text-white">{BRAND_INFO.phoneDisplay}</strong> ({BRAND_INFO.teacherName})</span>
            </a>
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#1EE1D6] shrink-0 mt-0.5" />
              <span>Địa chỉ: {BRAND_INFO.address}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Official Social & Blog Links */}
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Kết Nối &amp; Tài Liệu Chính Thức
          </p>
          <div className="flex flex-col gap-1.5">
            <a
              href={BRAND_INFO.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-200 hover:text-[#1EE1D6] transition font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Facebook: {BRAND_INFO.facebookHandle}</span>
              <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
            </a>
            <a
              href={BRAND_INFO.blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-200 hover:text-[#1EE1D6] transition font-semibold"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Blog: {BRAND_INFO.blogHost}</span>
              <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
            </a>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>Listening • Reading • Writing • Vocabulary Arena</span>
        <span>© 2026 {BRAND_INFO.siteName} — {BRAND_INFO.englishSubName}</span>
      </div>
    </div>
  );
}
