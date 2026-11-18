import { Bookmark } from 'lucide-react';
import { parseClozeLines, resolveQuestionForBlank } from '../../utils/clozeHelpers';

export default function ClozeNoteSheet({
  activeBlankNum = null,
  answers = {},
  bookmarkedQuestions = {},
  clozeText = '',
  fontSizeClass = 'text-[16px] leading-[1.6]',
  inputRefs = null,
  onAnswerChange,
  onBlankFocus,
  onPassageTextSelect,
  onToggleBookmark,
  questions = [],
  readOnlyPreview = false,
  renderText = null,
  scopeField = 'trackIdx',
  scopeIdx = 0
}) {
  const parsedLines = parseClozeLines(clozeText);
  if (parsedLines.length === 0) return null;

  // Split optional preamble lines ("Questions 1-10", "Complete the notes...", "Write ONE WORD...")
  // from the main note body cleanly so it mirrors real Computer-Delivered IELTS UI.
  const firstBoxLineIdx = parsedLines.findIndex(
    l => l.kind === 'heading' || l.kind === 'bullet'
  );
  const preambleLines = firstBoxLineIdx > 0 ? parsedLines.slice(0, firstBoxLineIdx) : [];
  const boxLines = firstBoxLineIdx > 0 ? parsedLines.slice(firstBoxLineIdx) : parsedLines;

  const renderSegments = (segments) =>
    segments.map((seg, idx) => {
      if (seg.type === 'text') {
        return <span key={idx}>{typeof renderText === 'function' ? renderText(seg.value) : seg.value}</span>;
      }

      const linkedQ = resolveQuestionForBlank(questions, seg.blankNum, scopeField, scopeIdx);
      const qId = linkedQ?.id;
      const value = qId ? (answers?.[qId] || '') : '';
      const isActive = Number(activeBlankNum) === Number(seg.blankNum);
      const isFlagged = Boolean(qId && bookmarkedQuestions?.[qId]);

      return (
        <span key={`blank-${seg.blankNum}-${idx}`} className="inline-flex items-center align-baseline mx-1.5 my-1 gap-1">
          <input
            ref={el => {
              if (inputRefs?.current && el) {
                inputRefs.current[seg.blankNum] = el;
              }
            }}
            type="text"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            readOnly={readOnlyPreview}
            value={readOnlyPreview ? (linkedQ?.correctAnswer || '') : value}
            placeholder={String(seg.blankNum)}
            aria-label={`Câu ${seg.blankNum}`}
            onFocus={() => onBlankFocus?.(seg.blankNum, qId)}
            onChange={e => {
              if (readOnlyPreview || !qId) return;
              onAnswerChange?.(qId, e.target.value);
            }}
            className={`w-40 sm:w-52 h-[34px] px-3 rounded-[3px] text-center text-[15px] font-bold transition-all outline-none border ${
              isActive
                ? 'bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white border-[#A16207] dark:border-[#EAB308] ring-1 ring-[#CA8A04]/45'
                : value
                ? 'bg-white dark:bg-[#2A2F3D] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#60A5FA]'
                : 'bg-white dark:bg-[#3A3B40] text-[#111827] dark:text-white border-[#767676] dark:border-[#5D5F66] hover:border-[#111827] dark:hover:border-[#9CA3AF]'
            } placeholder:text-[#111827] dark:placeholder:text-[#E5E7EB] placeholder:font-bold`}
          />
          {!readOnlyPreview && onToggleBookmark && qId && (
            <button
              type="button"
              onClick={() => onToggleBookmark(qId)}
              title={isFlagged ? `Bỏ đánh dấu câu ${seg.blankNum}` : `Đánh dấu xem lại câu ${seg.blankNum}`}
              className={`p-0.5 rounded transition ${
                isFlagged
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
            </button>
          )}
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
          className="text-[16px] font-bold text-center text-[#111827] dark:text-white pt-2 pb-1"
        >
          {renderSegments(line.segments)}
        </h4>
      );
    }
    if (line.kind === 'subheading') {
      return (
        <h5 key={line.id} className="text-[16px] font-bold text-[#111827] dark:text-white pt-1.5">
          {renderSegments(line.segments)}
        </h5>
      );
    }
    if (line.kind === 'bullet') {
      return (
        <div
          key={line.id}
          className={`flex items-start gap-2.5 ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[2.1] pl-0.5`}
        >
          <span className="mt-2.5 text-[14px] leading-none text-[#111827] dark:text-[#D1D5DB] shrink-0">•</span>
          <div className="flex-1 leading-[2.1]">{renderSegments(line.segments)}</div>
        </div>
      );
    }
    return (
      <p key={line.id} className={`${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[2.1]`}>
        {renderSegments(line.segments)}
      </p>
    );
  };

  return (
    <div
      onMouseUp={onPassageTextSelect}
      data-exam-copy-source={readOnlyPreview ? undefined : 'true'}
      className="font-exam space-y-3 select-text text-left"
    >
      {preambleLines.length > 0 && (
        <div className="space-y-1.5">
          {preambleLines.map(line =>
            line.kind === 'spacer' ? (
              <div key={line.id} className="h-1" />
            ) : (
              <p
                key={line.id}
                className={
                  /^Questions?\s+\d+/i.test(line.segments.map(s => s.value || '').join(''))
                    ? 'font-bold text-[#111827] dark:text-white text-[18px] pb-1'
                    : 'text-[15px] font-normal text-[#111827] dark:text-[#E5E7EB] leading-[1.6]'
                }
              >
                {renderSegments(line.segments)}
              </p>
            )
          )}
        </div>
      )}

      <div
        className={
          readOnlyPreview
            ? 'rounded-lg border border-slate-200 dark:border-[#343434] bg-white dark:bg-[#191919] p-4 sm:p-6 space-y-2'
            : 'space-y-1.5'
        }
      >
        {boxLines.map(renderLine)}
      </div>
    </div>
  );
}
