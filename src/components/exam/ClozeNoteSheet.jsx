import { Bookmark } from 'lucide-react';
import { extractBlankNumbers, parseClozeLines, resolveQuestionForBlank } from '../../utils/clozeHelpers';

export default function ClozeNoteSheet({
  activeBlankNum = null,
  answers = {},
  bookmarkedQuestions = {},
  clozeText = '',
  fontSizeClass = 'text-[15px]',
  inputRefs = null,
  onAnswerChange,
  onBlankFocus,
  onPassageTextSelect,
  onToggleBookmark,
  questions = [],
  readOnlyPreview = false,
  scopeField = 'trackIdx',
  scopeIdx = 0
}) {
  const parsedLines = parseClozeLines(clozeText);
  if (parsedLines.length === 0) return null;

  const blankNumbers = extractBlankNumbers(clozeText);

  // Split optional preamble lines ("Questions 1-10", "Complete the notes...", "Write ONE WORD...")
  // from the main boxed note content so it mirrors the Computer-Delivered IELTS UI cleanly.
  const firstBoxLineIdx = parsedLines.findIndex(
    l => l.kind === 'heading' || l.kind === 'bullet'
  );
  const preambleLines = firstBoxLineIdx > 0 ? parsedLines.slice(0, firstBoxLineIdx) : [];
  const boxLines = firstBoxLineIdx > 0 ? parsedLines.slice(firstBoxLineIdx) : parsedLines;

  const renderSegments = (segments) =>
    segments.map((seg, idx) => {
      if (seg.type === 'text') {
        return <span key={idx}>{seg.value}</span>;
      }

      const linkedQ = resolveQuestionForBlank(questions, seg.blankNum, scopeField, scopeIdx);
      const qId = linkedQ?.id;
      const value = qId ? (answers?.[qId] || '') : '';
      const isActive = Number(activeBlankNum) === Number(seg.blankNum);

      return (
        <span key={`blank-${seg.blankNum}-${idx}`} className="inline-flex items-center align-baseline mx-1.5 my-0.5">
          <input
            ref={el => {
              if (inputRefs?.current && el) {
                inputRefs.current[seg.blankNum] = el;
              }
            }}
            type="text"
            readOnly={readOnlyPreview}
            value={readOnlyPreview ? (linkedQ?.correctAnswer || '') : value}
            placeholder={String(seg.blankNum)}
            aria-label={`Câu ${seg.blankNum}`}
            onFocus={() => onBlankFocus?.(seg.blankNum, qId)}
            onChange={e => {
              if (readOnlyPreview || !qId) return;
              onAnswerChange?.(qId, e.target.value);
            }}
            className={`w-28 sm:w-36 h-8 px-3 rounded-[5px] text-center text-xs sm:text-sm font-bold transition-all outline-none border ${
              isActive
                ? 'bg-white dark:bg-[#242833] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#3B82F6] ring-2 ring-[#2563EB]/35 shadow-xs'
                : value
                ? 'bg-[#EEF2FF] dark:bg-[#2A2F3D] text-[#111827] dark:text-white border-[#2563EB]/60 dark:border-[#60A5FA]/60'
                : 'bg-[#F1F3F5] dark:bg-[#4B4C52] text-[#111827] dark:text-white border-[#B8BFC9] dark:border-[#5D5F66] hover:border-[#2563EB] dark:hover:border-[#93C5FD]'
            } placeholder:text-[#4B5563] dark:placeholder:text-[#E5E7EB] placeholder:font-extrabold`}
          />
        </span>
      );
    });

  const renderLine = (line) => {
    if (line.kind === 'spacer') {
      return <div key={line.id} className="h-2" />;
    }
    if (line.kind === 'heading') {
      return (
        <h4
          key={line.id}
          className="text-[15px] sm:text-base font-extrabold text-center tracking-wide text-[#111827] dark:text-white pt-1 pb-1"
        >
          {renderSegments(line.segments)}
        </h4>
      );
    }
    if (line.kind === 'subheading') {
      return (
        <h5 key={line.id} className="text-xs sm:text-sm font-bold text-[#1D4ED8] dark:text-[#60A5FA] pt-1">
          {renderSegments(line.segments)}
        </h5>
      );
    }
    if (line.kind === 'bullet') {
      return (
        <div
          key={line.id}
          className={`flex items-start gap-2.5 ${fontSizeClass} text-[#1F2937] dark:text-[#E5E7EB] leading-[2.3] pl-1`}
        >
          <span className="mt-3 w-1.5 h-1.5 rounded-full bg-[#4B5563] dark:bg-[#9CA3AF] shrink-0" />
          <div className="flex-1 leading-[2.3]">{renderSegments(line.segments)}</div>
        </div>
      );
    }
    return (
      <p key={line.id} className={`${fontSizeClass} text-[#1F2937] dark:text-[#E5E7EB] leading-[2.35]`}>
        {renderSegments(line.segments)}
      </p>
    );
  };

  return (
    <div onMouseUp={onPassageTextSelect} className="font-exam space-y-3.5 select-text">
      {preambleLines.length > 0 && (
        <div className="space-y-1">
          {preambleLines.map(line =>
            line.kind === 'spacer' ? (
              <div key={line.id} className="h-1" />
            ) : (
              <p
                key={line.id}
                className={
                  /^Questions?\s+\d+/i.test(line.segments.map(s => s.value || '').join(''))
                    ? 'font-extrabold text-[#111827] dark:text-white text-[15px] sm:text-base'
                    : 'text-xs sm:text-[13px] font-medium text-[#374151] dark:text-[#D1D5DB]'
                }
              >
                {renderSegments(line.segments)}
              </p>
            )
          )}
        </div>
      )}

      <div className="rounded-lg border border-rose-200/90 dark:border-[#343434] bg-[#FFF9FB] dark:bg-[#191919] p-4 sm:p-6 space-y-2 shadow-xs">
        {!readOnlyPreview && onToggleBookmark && blankNumbers.length > 0 && (
          <div className="flex items-center justify-end gap-1 flex-wrap pb-1">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 mr-1">Đánh dấu câu:</span>
            {blankNumbers.map(num => {
              const linkedQ = resolveQuestionForBlank(questions, num, scopeField, scopeIdx);
              if (!linkedQ?.id) return null;
              const isFlagged = Boolean(bookmarkedQuestions?.[linkedQ.id]);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onToggleBookmark(linkedQ.id)}
                  title={`Đánh dấu xem lại câu ${num}`}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                    isFlagged
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/50'
                      : 'bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-[#383838] hover:text-amber-500'
                  }`}
                >
                  <Bookmark className={`w-2.5 h-2.5 ${isFlagged ? 'fill-current' : ''}`} />
                  <span>{num}</span>
                </button>
              );
            })}
          </div>
        )}
        {boxLines.map(renderLine)}
      </div>
    </div>
  );
}
