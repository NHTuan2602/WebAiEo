import { useRef, useState } from 'react';
import {
  BookOpen,
  Clock,
  Download,
  FileAudio,
  Pause,
  Play,
  Sparkles,
  Volume2
} from 'lucide-react';
import {
  analyzeTranscriptFluency,
  buildFluencyHighlightSegments,
  buildTranscriptCorrectionSegments
} from '../../utils/speakingAiEngine';

export default function SpeakingQuestionLuyennoiCard({
  rec,
  idx = 0,
  totalCount = 1,
  attemptCriteria = {},
  canShowApprovedScores = true
}) {
  const [activeTab, setActiveTab] = useState('fixes'); // 'fixes' | 'fluency'
  const [showUpgradeDrawer, setShowUpgradeDrawer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  if (!rec) return null;

  const qBandNum = Number(rec.band ?? 0);
  const qBandLabel = Number.isFinite(qBandNum) ? qBandNum.toFixed(1) : '0.0';
  const qCrit = rec.criteria || {};
  const fcVal = qCrit.fc ?? (qBandNum > 0 ? attemptCriteria?.fc ?? qBandNum : 0);
  const lrVal = qCrit.lr ?? (qBandNum > 0 ? attemptCriteria?.lr ?? qBandNum : 0);
  const graVal = qCrit.gra ?? (qBandNum > 0 ? attemptCriteria?.gra ?? qBandNum : 0);
  const prVal = qCrit.pr ?? (qBandNum > 0 ? attemptCriteria?.pr ?? qBandNum : 0);

  const txSegments = buildTranscriptCorrectionSegments(rec.transcript || '', rec.grammarVocabularyFixes || []);
  const fluencySegments = buildFluencyHighlightSegments(rec.transcript || '');
  const computedFluency = analyzeTranscriptFluency(rec.transcript || '', rec.durationSec || 0);
  const fm = rec.fluencyMetrics || computedFluency;
  const upgrades = Array.isArray(rec.vocabularyUpgrades) ? rec.vocabularyUpgrades : [];

  const togglePlayAudio = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
      {/* Prompt & Action Header */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#475569] dark:text-slate-400">
            <span className="px-2 py-0.5 rounded-full bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] text-xs font-black uppercase">
              Part {rec.part || 1} · Câu {idx + 1}/{totalCount}
            </span>
            {rec.topic && <span className="truncate">{rec.topic}</span>}
            <span>· {rec.durationSec || 0}s</span>
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
            {rec.prompt}
          </h3>
        </div>

        {canShowApprovedScores && (
          <button
            type="button"
            onClick={() => setShowUpgradeDrawer(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6] hover:underline underline-offset-4 shrink-0 py-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showUpgradeDrawer ? 'Ẩn gợi ý cải thiện' : 'Cải thiện câu này'}</span>
          </button>
        )}
      </div>

      {/* Main Luyennoi Feedback Card */}
      <div className="rounded-2xl bg-[#EEF2FF]/75 dark:bg-[#1B1D2B] border border-indigo-200/75 dark:border-indigo-500/25 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            {rec.audioUrl ? (
              <>
                <audio
                  ref={audioRef}
                  src={rec.audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  aria-label={isPlaying ? 'Tạm dừng bản ghi âm' : 'Nghe lại bản ghi âm'}
                  className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-teal-400 dark:border-teal-500/60 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center shadow-xs hover:scale-105 transition"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <a
                  href={rec.audioUrl}
                  download={`speaking-part${rec.part || 1}-q${idx + 1}.webm`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 transition"
                >
                  <Download className="w-3 h-3" /> Tải Ghi Âm
                </a>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 text-xs font-bold">
                <FileAudio className="w-3.5 h-3.5" />
                {rec.durationSec > 0 ? 'Audio đang đồng bộ' : 'Chưa thu âm câu này'}
              </span>
            )}
          </div>

          {canShowApprovedScores ? (
            <div
              className="w-12 h-12 rounded-full bg-emerald-500 text-white font-black text-base flex items-center justify-center shadow-md ring-4 ring-emerald-500/20 tabular-nums shrink-0"
              title="Band câu này"
            >
              {qBandLabel}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/35 text-xs font-bold shrink-0">
              <Clock className="w-3.5 h-3.5" /> Ms. Như đang check
            </span>
          )}
        </div>

        {!canShowApprovedScores ? (
          <div className="space-y-2">
            {rec.transcript ? (
              <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium bg-white/80 dark:bg-slate-900/75 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Nội dung ghi âm đã nộp:
                </span>
                {rec.transcript}
              </div>
            ) : null}
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              File ghi âm đã lưu an toàn. Điểm số, sửa lỗi chi tiết và gợi ý nâng Band sẽ hiển thị sau khi Ms. Như duyệt bài!
            </p>
          </div>
        ) : (
        <>
        {/* Luyennoi Tabs: Sửa lỗi | Trôi chảy */}
        <div className="flex items-center gap-5 border-b border-indigo-200/80 dark:border-slate-700">
          {[
            { id: 'fixes', label: `Sửa lỗi${(rec.grammarVocabularyFixes || []).length > 0 ? ` (${rec.grammarVocabularyFixes.length})` : ''}` },
            { id: 'fluency', label: 'Trôi chảy' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-xs sm:text-sm font-extrabold border-b-2 transition -mb-px ${
                activeTab === tab.id
                  ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                  : 'border-transparent text-[#475569] dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Sửa lỗi (Inline red strikethrough + green correction chips) */}
        {activeTab === 'fixes' && (
          <div className="space-y-3">
            {rec.transcript ? (
              <div className="text-sm sm:text-[15px] text-slate-800 dark:text-slate-100 leading-8 font-medium bg-white/75 dark:bg-slate-900/70 rounded-xl p-3.5 sm:p-4 border border-indigo-100 dark:border-slate-800">
                {txSegments.segments.map((seg, sIdx) => {
                  if (seg.type !== 'correction') {
                    return <span key={sIdx}>{seg.text}</span>;
                  }
                  return (
                    <span key={sIdx} className="inline-flex flex-wrap items-center gap-1 mx-0.5 align-baseline">
                      <del
                        className="px-1.5 py-0.5 rounded bg-rose-200/85 dark:bg-rose-500/30 text-rose-900 dark:text-rose-100 line-through decoration-rose-600 font-semibold"
                        title={seg.reason || 'Cần sửa lại'}
                      >
                        {seg.matchedText}
                      </del>
                      <span
                        className="px-1.5 py-0.5 rounded bg-emerald-200/90 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-100 font-bold"
                        title={seg.reason || 'Gợi ý chuẩn xác hơn'}
                      >
                        {seg.corrected}
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#475569] dark:text-slate-400 italic">
                Chưa có bản chép lời cho câu trả lời này.
              </p>
            )}

            {Array.isArray(rec.grammarVocabularyFixes) && rec.grammarVocabularyFixes.length > 0 && (
              <div className="space-y-1.5">
                {rec.grammarVocabularyFixes.map((fix, fIdx) => (
                  <div
                    key={fIdx}
                    className="text-xs bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 flex flex-wrap items-baseline gap-1.5"
                  >
                    <del className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 font-semibold">
                      {fix.original}
                    </del>
                    <span className="text-slate-400 font-bold">→</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold">
                      {fix.corrected}
                    </span>
                    {fix.reason && (
                      <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        - {fix.reason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {rec.feedback && (
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-200/60 dark:border-slate-700">
                <strong className="text-[#0F766E] dark:text-[#1EE1D6]">Nhận xét AI: </strong>
                {rec.feedback}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Trôi chảy (Fluency, pace, filler/pause analysis) */}
        {activeTab === 'fluency' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="bg-white/90 dark:bg-slate-900/80 rounded-xl p-2.5 border border-indigo-100 dark:border-slate-700">
                <span className="text-xs font-bold uppercase text-slate-400 block">Tốc độ nói</span>
                <strong className="text-sm font-black text-slate-900 dark:text-white">
                  {fm.wpm > 0 ? `~${fm.wpm} từ/phút` : `${rec.durationSec || 0}s`}
                </strong>
              </div>
              <div className="bg-white/90 dark:bg-slate-900/80 rounded-xl p-2.5 border border-indigo-100 dark:border-slate-700">
                <span className="text-xs font-bold uppercase text-slate-400 block">Từ đệm / Ngập ngừng</span>
                <strong className="text-sm font-black text-slate-900 dark:text-white">
                  {fm.fillerCount || 0} từ · {fm.pauseCount || 0} điểm ngừng
                </strong>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/90 dark:bg-slate-900/80 rounded-xl p-2.5 border border-indigo-100 dark:border-slate-700">
                <span className="text-xs font-bold uppercase text-slate-400 block">Đánh giá nhịp độ</span>
                <strong className="text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6]">
                  {fm.paceNote || fm.paceLabel || 'Nhịp nói tự nhiên'}
                </strong>
              </div>
            </div>

            {rec.transcript && (
              <div className="text-sm text-slate-800 dark:text-slate-100 leading-8 bg-white/75 dark:bg-slate-900/70 rounded-xl p-3.5 border border-indigo-100 dark:border-slate-800">
                {fluencySegments.map((seg, fIdx) =>
                  seg.type === 'text' ? (
                    <span key={fIdx}>{seg.text}</span>
                  ) : (
                    <span
                      key={fIdx}
                      className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-xs font-bold ${
                        seg.type === 'pause'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-200'
                          : 'bg-purple-100 text-purple-900 dark:bg-purple-500/25 dark:text-purple-200'
                      }`}
                    >
                      {seg.text}
                    </span>
                  )
                )}
              </div>
            )}

            {(fm.comment || rec.feedback) && (
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-200/60 dark:border-slate-700 flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6] shrink-0 mt-0.5" />
                <span>{fm.comment || rec.feedback}</span>
              </div>
            )}
          </div>
        )}

        {/* Per-question 4-criteria badges matching Luyennoi */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { label: 'Trôi chảy', val: fcVal },
            { label: 'Từ vựng', val: lrVal },
            { label: 'Ngữ pháp', val: graVal },
            { label: 'Phát âm', val: prVal }
          ].map(crit => (
            <span
              key={crit.label}
              className="px-3 py-1 rounded-full bg-teal-500 text-white text-xs font-extrabold shadow-xs tabular-nums"
            >
              {crit.label}: {crit.val ?? '-'}
            </span>
          ))}
        </div>
        </>
        )}
      </div>

      {/* Collapsible Band 8.0+ Recommendation & Lexical Upgrade Drawer ("Cải thiện câu này") */}
      {canShowApprovedScores && showUpgradeDrawer && (
        <div className="rounded-2xl bg-emerald-50/85 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/35 p-4 space-y-3">
          {rec.upgradedSample ? (
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Phiên Bản Đề Xuất Nâng Lên Band 8.0+:
              </span>
              <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium bg-white/85 dark:bg-slate-900/75 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-500/25">
                {rec.upgradedSample}
              </p>
            </div>
          ) : upgrades.length === 0 ? (
            <p className="text-xs text-emerald-800 dark:text-emerald-200 italic">
              Chưa có bài mẫu nâng Band cho câu này. Cấu hình Google Gemini API Key trong tài khoản Giáo viên để AI nghe file ghi âm và đề xuất bài mẫu Band 8.0+.
            </p>
          ) : null}

          {upgrades.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Từ Vựng &amp; Collocations Đề Xuất Thay Thế:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {upgrades.map((up, uIdx) => (
                  <div
                    key={uIdx}
                    className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-700 text-xs space-y-0.5"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      {up.basic && <span className="text-slate-500 line-through">{up.basic}</span>}
                      {up.basic && <span className="text-slate-400">→</span>}
                      <strong className="text-[#007A7A] dark:text-[#1EE1D6]">{up.upgraded}</strong>
                      {up.ipa && <span className="text-xs font-mono text-slate-400">{up.ipa}</span>}
                    </div>
                    {up.meaning && <p className="text-xs text-slate-600 dark:text-slate-300">{up.meaning}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
