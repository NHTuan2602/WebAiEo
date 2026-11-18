import { ExternalLink, Globe, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BRAND_INFO } from '../../constants/brandInfo';

/**
 * Shared branded footer displaying center identity and Ms. Như contact channels.
 */
export default function BrandContactFooter({ variant = 'full' }) {
  const isCard = variant === 'card';
  const shellClass = isCard
    ? 'bg-white dark:bg-[#18181B] text-[#0F172A] dark:text-zinc-100 rounded-lg px-6 sm:px-8 py-7 sm:py-8 border border-slate-200 dark:border-zinc-800 space-y-6'
    : 'max-w-7xl mx-auto space-y-6 text-[#0F172A] dark:text-zinc-100';

  return (
    <div className={shellClass}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7 sm:gap-8 text-sm">
        {/* Column 1: Brand Identity */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <img
              src={BRAND_INFO.avatarUrl}
              alt={BRAND_INFO.siteName}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-zinc-700 bg-white shrink-0"
            />
            <div>
              <p className="font-extrabold text-base sm:text-lg text-[#0F172A] dark:text-white leading-tight">{BRAND_INFO.siteName}</p>
              <p className="text-xs sm:text-sm font-semibold text-[#0F766E] dark:text-teal-400">{BRAND_INFO.englishSubName}</p>
            </div>
          </div>
          <p className="text-sm text-[#475569] dark:text-zinc-300 leading-relaxed max-w-sm">
            {BRAND_INFO.established}. &ldquo;{BRAND_INFO.slogan}&rdquo;
          </p>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-zinc-400 font-mono">
            {BRAND_INFO.domainHost}
          </p>
        </div>

        {/* Column 2: Direct Teacher Contact */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-zinc-400">
            Thông Tin Liên Hệ • {BRAND_INFO.teacherName}
          </p>
          <div className="space-y-2 text-sm text-[#475569] dark:text-zinc-300">
            <a
              href={BRAND_INFO.phoneHref}
              className="flex items-center gap-2.5 text-[#0F172A] dark:text-zinc-100 hover:text-[#0F766E] dark:hover:text-teal-400 transition font-semibold"
            >
              <Phone className="w-4 h-4 text-[#0F766E] dark:text-teal-400 shrink-0" />
              <span>Điện thoại / Zalo: <strong>{BRAND_INFO.phoneDisplay}</strong> ({BRAND_INFO.teacherName})</span>
            </a>
            <div className="flex items-start gap-2.5 text-[#475569] dark:text-zinc-300 leading-relaxed">
              <MapPin className="w-4 h-4 text-[#334155] dark:text-zinc-400 shrink-0 mt-0.5" />
              <span>Địa chỉ: {BRAND_INFO.address}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Official Social & Blog Links */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-zinc-400">
            Kết Nối &amp; Tài Liệu Chính Thức
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href={BRAND_INFO.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 text-[#0F172A] dark:text-zinc-100 hover:text-[#0F766E] dark:hover:text-teal-400 transition font-semibold"
            >
              <MessageCircle className="w-4 h-4 text-[#0F766E] dark:text-teal-400 shrink-0" />
              <span>Facebook: {BRAND_INFO.facebookHandle}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
            </a>
            <a
              href={BRAND_INFO.blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 text-[#0F172A] dark:text-zinc-100 hover:text-[#0F766E] dark:hover:text-teal-400 transition font-semibold"
            >
              <Globe className="w-4 h-4 text-[#334155] dark:text-zinc-400 shrink-0" />
              <span>Blog: {BRAND_INFO.blogHost}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
            </a>
          </div>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm text-[#475569] dark:text-zinc-400">
        <span>Listening • Reading • Writing • Vocabulary Arena</span>
        <span>© 2026 {BRAND_INFO.siteName} - {BRAND_INFO.englishSubName}</span>
      </div>
    </div>
  );
}
